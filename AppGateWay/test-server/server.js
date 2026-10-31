/**
 * DTFF SHOP - Android Gateway Test Server & Live Simulator
 * Chạy độc lập, không phụ thuộc vào Laravel hay Next.js.
 * Phục vụ test trước khi tích hợp vào hệ thống chính.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = 8888;
const SECRET = 'DTFF_SECRET_TEST_2026';
const DEVICE_UID = 'dev_test_android_01';

// Lưu trữ dữ liệu trong bộ nhớ phục vụ test
let transactions = [];
let gatewayStatus = {
    isOnline: false,
    lastSeen: null,
    battery: null,
    network: null,
    appVersion: null,
    pendingQueue: 0,
    deviceUid: DEVICE_UID,
    secret: SECRET
};
let sseClients = [];

// Helper: Bóc tách thông báo ngân hàng (Chuẩn V2)
function parseNotification(rawContent) {
    if (!rawContent || typeof rawContent !== 'string') {
        return { incoming: false, amount: null, codes: [], bankRef: null };
    }

    // Chuẩn hóa: bỏ dấu tiếng Việt, in hoa
    const normalized = rawContent.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    // 1. Kiểm tra tiền vào: bắt +<số> VND/D/Đ hoặc PS:+<số>
    let amount = null;
    const amountMatch = normalized.match(/(?:\+|PS:\s*\+\s*)([0-9][0-9.,]*)\s*(?:VND|D|Đ)?\b/);
    if (amountMatch) {
        let clean = amountMatch[1].replace(/[.,]$/, '');
        clean = clean.replace(/\D/g, '');
        amount = parseInt(clean, 10);
    }
    const incoming = amount !== null && amount > 0;

    // 2. Tìm mã đơn dạng ACCxxxxxxxx trong toàn bộ thông báo (không cắt ở SD vì TPBank có SD trước ND)
    let codes = [];
    const codeMatches = normalized.match(/ACC-?([A-Z0-9]{6,8})/g);
    if (codeMatches) {
        codes = Array.from(new Set(codeMatches));
    }

    // 3. Mã giao dịch ngân hàng (SO GD, SOGD hoặc FT...)
    const refMatch = normalized.match(/(?:SO GD|SOGD|MAGD|FT)\s*:?\s*([A-Z0-9]{6,25})/i);
    const bankRef = refMatch ? refMatch[1] : (normalized.match(/\bFT\d{8,}\b/) ? normalized.match(/\bFT\d{8,}\b/)[0] : null);

    return { incoming, amount, codes, bankRef };
}

// Helper: Mask số dư & số tài khoản
function maskSensitive(raw) {
    if (!raw) return '';
    let masked = raw.replace(/(số dư|so du|sd)\s*[:：]?\s*[\d.,]+\s*(vnd|vnđ|đ)?/gi, '$1: ***');
    masked = masked.replace(/\d{8,}/g, (m) => '*'.repeat(m.length - 4) + m.slice(-4));
    return masked;
}

// Broadcast SSE to web UI
function broadcastEvent(type, data) {
    const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
        try { client.write(payload); } catch (e) {}
    });
}

// Khởi tạo HTTP Server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Device-Id, X-Timestamp, X-Signature');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // Route: Server-Sent Events (SSE) cho Live Dashboard
    if (url.pathname === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        res.write('\n');
        sseClients.push(res);
        req.on('close', () => {
            sseClients = sseClients.filter(c => c !== res);
        });
        return;
    }

    // Route: Webhook nhận thông báo từ Android / MacroDroid
    if (url.pathname === '/api/v1/payments/device/webhook' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            // Xác thực
            const authHeader = req.headers['authorization'] || '';
            const deviceId = req.headers['x-device-id'] || '';
            const bearerToken = authHeader.replace(/^Bearer\s+/i, '');

            // Kiểm tra token
            const isBasicValid = bearerToken === SECRET;
            // Kiểm tra HMAC signature (Tier 2)
            const timestamp = req.headers['x-timestamp'];
            const signature = req.headers['x-signature'];
            let isSignedValid = false;
            if (timestamp && signature) {
                const payload = `${timestamp}\n${crypto.createHash('sha256').update(body).digest('hex')}`;
                const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
                isSignedValid = (signature === expected);
            }

            if (!isBasicValid && !isSignedValid) {
                console.log(`[AUTH FAILED] IP: ${req.socket.remoteAddress}, Auth: ${authHeader}`);
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'unauthorized', message: 'Sai Secret hoặc Signature' }));
                return;
            }

            try {
                const data = JSON.parse(body || '{}');
                const rawContent = data.raw_content || data.body || '';
                const parsed = parseNotification(rawContent);

                // Cập nhật trạng thái gateway
                gatewayStatus.isOnline = true;
                gatewayStatus.lastSeen = new Date().toISOString();

                // Tạo đối tượng giao dịch
                const tx = {
                    id: transactions.length + 1,
                    receivedAt: new Date().toLocaleTimeString('vi-VN'),
                    rawContent: rawContent,
                    maskedContent: maskSensitive(rawContent),
                    appPackage: data.app_package || 'unknown',
                    title: data.title || '',
                    authMode: isSignedValid ? 'HMAC-SHA256 (Tier 2)' : 'Bearer Token (Tier 1)',
                    parsed: {
                        incoming: parsed.incoming,
                        amount: parsed.amount,
                        codes: parsed.codes,
                        bankRef: parsed.bankRef,
                    },
                    status: parsed.incoming && parsed.codes.length > 0 ? 'KHỚP ĐƠN' : (parsed.incoming ? 'THIẾU/SAI MEMO' : 'BỎ QUA (KHÔNG PHẢI TIỀN VÀO)')
                };

                transactions.unshift(tx);
                if (transactions.length > 50) transactions.pop();

                // Bắn realtime sang Dashboard
                broadcastEvent('new_transaction', tx);
                broadcastEvent('gateway_status', gatewayStatus);

                console.log(`[GIAO DỊCH MỚI] Số tiền: ${parsed.amount}đ | Mã: ${parsed.codes.join(', ')} | Status: ${tx.status}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', parsed_status: tx.status, data: tx }));
            } catch (err) {
                res.writeHead(422, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'invalid_json', message: err.message }));
            }
        });
        return;
    }

    // Route: Heartbeat từ Android
    if (url.pathname === '/api/v1/payments/device/heartbeat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                gatewayStatus.isOnline = true;
                gatewayStatus.lastSeen = new Date().toISOString();
                gatewayStatus.battery = data.battery || null;
                gatewayStatus.network = data.network || 'wifi';
                gatewayStatus.appVersion = data.app_version || '1.0';
                gatewayStatus.pendingQueue = data.pending_queue || 0;

                broadcastEvent('gateway_status', gatewayStatus);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, server_time: Math.floor(Date.now() / 1000) }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'bad_request' }));
            }
        });
        return;
    }

    // Route: API Lấy danh sách giao dịch & trạng thái hiện tại
    if (url.pathname === '/api/v1/data' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: gatewayStatus,
            transactions: transactions,
            serverIp: req.socket.localAddress,
            port: PORT
        }));
        return;
    }

    // Route: API Xóa lịch sử test
    if (url.pathname === '/api/v1/clear' && req.method === 'POST') {
        transactions = [];
        broadcastEvent('cleared', {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
    }

    // Route: Tải file APK trực tiếp về điện thoại qua Wi-Fi
    if (url.pathname === '/download' || url.pathname === '/app.apk') {
        const apkPath = path.join(__dirname, '..', 'apks', 'SmsForwarder_Gateway_v3.5.apk');
        if (fs.existsSync(apkPath)) {
            const stat = fs.statSync(apkPath);
            res.writeHead(200, {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Length': stat.size,
                'Content-Disposition': 'attachment; filename="SmsForwarder_Gateway.apk"'
            });
            fs.createReadStream(apkPath).pipe(res);
            return;
        }
    }

    // Serve HTML Web Dashboard
    if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getDashboardHtml());
        return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// Watchdog định kỳ: nếu quá 180s không thấy tin hiệu thì đánh dấu offline
setInterval(() => {
    if (gatewayStatus.lastSeen) {
        const diff = (Date.now() - new Date(gatewayStatus.lastSeen).getTime()) / 1000;
        if (diff > 180 && gatewayStatus.isOnline) {
            gatewayStatus.isOnline = false;
            broadcastEvent('gateway_status', gatewayStatus);
        }
    }
}, 10000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 DTFF GATEWAY TEST SERVER ĐANG CHẠY TẠI:`);
    console.log(`👉 Trình duyệt máy tính : http://localhost:${PORT}`);
    console.log(`👉 URL webhook cho điện thoại: http://192.168.1.109:${PORT}/api/v1/payments/device/webhook`);
    console.log(`👉 Secret Key test       : ${SECRET}`);
    console.log(`======================================================\n`);
});

// Giao diện Web Dashboard Live
function getDashboardHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DTFF SHOP - Android Gateway Test Studio</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #090d16;
            --surface: #111726;
            --border: #1e293b;
            --primary: #38bdf8;
            --primary-glow: rgba(56, 189, 248, 0.15);
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --text: #f8fafc;
            --text-muted: #94a3b8;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 24px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 24px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
        }
        .badge-online { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-offline { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .grid {
            display: grid;
            grid-template-columns: 380px 1fr;
            gap: 24px;
        }
        @media (max-width: 1024px) { .grid { grid-template-columns: 1fr; } }
        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 20px;
        }
        .card-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }
        .btn {
            background: #1e293b;
            color: #fff;
            border: 1px solid var(--border);
            padding: 10px 16px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .btn:hover { background: #334155; }
        .btn-primary { background: #0284c7; border-color: #38bdf8; }
        .btn-primary:hover { background: #0369a1; }
        .btn-sample { width: 100%; justify-content: flex-start; text-align: left; margin-bottom: 8px; }
        textarea, input {
            width: 100%;
            background: #090d16;
            border: 1px solid var(--border);
            border-radius: 8px;
            color: #fff;
            padding: 10px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 13px;
            margin-bottom: 12px;
        }
        .code-block {
            background: #090d16;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #38bdf8;
            overflow-x: auto;
            margin-bottom: 12px;
            user-select: all;
        }
        .tx-card {
            background: #090d16;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .tx-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .tx-amount { font-size: 18px; font-weight: 800; color: #34d399; }
        .tx-code { background: #1e293b; padding: 2px 8px; border-radius: 6px; font-family: 'JetBrains Mono'; font-weight: 700; color: #38bdf8; }
        .tx-status-matched { color: #34d399; font-weight: 700; font-size: 12px; }
        .tx-status-unmatched { color: #f59e0b; font-weight: 700; font-size: 12px; }
        .tx-body { font-size: 13px; color: #cbd5e1; line-height: 1.5; font-family: 'JetBrains Mono', monospace; word-break: break-all; }
        .pulse { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .pulse-online { background: #10b981; box-shadow: 0 0 12px #10b981; }
        .pulse-offline { background: #ef4444; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 style="font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                ⚡ DTFF SHOP - Android Gateway Test Studio
            </h1>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">
                Môi trường thử nghiệm độc lập trước khi tích hợp vào SePay & Laravel
            </p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
            <div id="deviceBadge" class="badge badge-offline">
                <span class="pulse pulse-offline"></span> Thiết bị Offline
            </div>
            <button class="btn" onclick="clearLogs()">🗑️ Xóa Lịch Sử</button>
        </div>
    </div>

    <div class="grid">
        <!-- CỘT TRÁI: GIẢ LẬP & CẤU HÌNH -->
        <div>
            <!-- Box 1: Cấu hình MacroDroid trên điện thoại -->
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-title">📱 Cấu hình cho điện thoại thật</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                    Điện thoại Android cùng mạng Wi-Fi gửi vào URL này:
                </div>
                <div class="code-block" id="webhookUrl">http://192.168.1.109:8888/api/v1/payments/device/webhook</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Header bắt buộc:</div>
                <div class="code-block">Authorization: Bearer DTFF_SECRET_TEST_2026<br>Content-Type: application/json</div>
            </div>

            <!-- Box 2: Giả lập bắn thông báo ngay trên web -->
            <div class="card">
                <div class="card-title">🧪 Giả lập gửi thông báo</div>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                    Bấm các nút mẫu dưới đây để kiểm tra Regex bóc tách số tiền & mã đơn ngay lập tức:
                </p>
                <button class="btn btn-sample" onclick="fillSample('tpbank')">
                    🏦 TPBank: +50,000 VND (ACC-XQR4R4TC)
                </button>
                <button class="btn btn-sample" onclick="fillSample('mbbank')">
                    🏦 MBBank: +100,000 VND (ACCK7M2XQ9P)
                </button>
                <button class="btn btn-sample" onclick="fillSample('vcb')">
                    🏦 Vietcombank: +200.000 VND (ACC88889999)
                </button>
                <button class="btn btn-sample" onclick="fillSample('no_memo')">
                    ⚠️ Sai/Thiếu Memo: +50,000 VND
                </button>
                <button class="btn btn-sample" onclick="fillSample('out')">
                    ❌ Tiền trừ: GD -15,000 VND
                </button>

                <div style="margin-top: 12px;">
                    <label style="font-size: 12px; color: var(--text-muted); display: block; margin-bottom: 4px;">Nội dung thông báo giả lập:</label>
                    <textarea id="simContent" rows="4"></textarea>
                    <button class="btn btn-primary" style="width: 100%;" onclick="sendSimulation()">
                        🚀 Bắn Thử Webhook Vào Server
                    </button>
                </div>
            </div>
        </div>

        <!-- CỘT PHẢI: LOG GIAO DỊCH REALTIME -->
        <div>
            <div class="card" style="min-height: 600px;">
                <div class="card-title" style="justify-content: space-between;">
                    <span>📡 Luồng giao dịch nhận được (<span id="txCount">0</span>)</span>
                    <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">Tự động cập nhật không cần F5</span>
                </div>
                <div id="txList">
                    <div style="text-align: center; color: var(--text-muted); padding: 60px 0;">
                        Chưa có giao dịch nào được nhận.<br>
                        Hãy thử bấm <b>"Bắn Thử Webhook"</b> ở cột bên trái hoặc dùng điện thoại gửi vào!
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const samples = {
            tpbank: 'GD: +50,000VND vao luc 14:35 28/10/26. ND: ACC-XQR4R4TC Nguyen Van A chuyen tien. So du: 1,500,000VND.',
            mbbank: 'TK 0123456789 | GD: +100,000VND 28/10/26 14:35 | ND: ACCK7M2XQ9P THANH TOAN DON HANG',
            vcb: 'Bien dong so du: TK 1012345678 +200.000 VND vao 14:35 28/10/2026. ND: ACC88889999',
            no_memo: 'GD: +50,000VND vao luc 15:00 28/10/26. ND: Nguyen Van B chuyen tien an trua. So du: 2,000,000VND.',
            out: 'GD: -15,000VND thanh toan Grab. So du: 1,485,000VND.'
        };

        function fillSample(type) {
            document.getElementById('simContent').value = samples[type] || '';
        }
        fillSample('tpbank');

        // Bắn request thử
        async function sendSimulation() {
            const content = document.getElementById('simContent').value.trim();
            if (!content) return alert('Vui lòng nhập nội dung thông báo');

            try {
                const res = await fetch('/api/v1/payments/device/webhook', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer DTFF_SECRET_TEST_2026'
                    },
                    body: JSON.stringify({
                        app_package: 'com.simulator.bank',
                        title: 'Thông báo biến động',
                        raw_content: content
                    })
                });
                const json = await res.json();
                console.log('Result:', json);
            } catch (err) {
                alert('Lỗi gửi request: ' + err.message);
            }
        }

        // Xóa log
        async function clearLogs() {
            await fetch('/api/v1/clear', { method: 'POST' });
            renderTransactions([]);
        }

        function renderTransactions(list) {
            document.getElementById('txCount').innerText = list.length;
            const container = document.getElementById('txList');
            if (!list || list.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 60px 0;">Chưa có giao dịch nào được nhận.</div>';
                return;
            }

            container.innerHTML = list.map(tx => {
                const isMatched = tx.status === 'KHỚP ĐƠN';
                const statusClass = isMatched ? 'tx-status-matched' : 'tx-status-unmatched';
                const statusIcon = isMatched ? '✅' : '⚠️';
                const amountText = tx.parsed.amount ? (tx.parsed.amount.toLocaleString('vi-VN') + ' đ') : '0 đ';
                const codeText = tx.parsed.codes.length > 0 ? tx.parsed.codes.join(', ') : 'KHÔNG CÓ';

                return \`
                    <div class="tx-card">
                        <div class="tx-header">
                            <div>
                                <span class="tx-amount">\${amountText}</span>
                                <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">\${tx.receivedAt}</span>
                            </div>
                            <div>
                                <span class="\${statusClass}">\${statusIcon} \${tx.status}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; margin-bottom: 8px; font-size: 12px;">
                            <span>Mã đơn: <b class="tx-code">\${codeText}</b></span>
                            <span style="color: var(--text-muted);">Xác thực: \${tx.authMode}</span>
                        </div>
                        <div class="tx-body">
                            \${tx.maskedContent}
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // Tải dữ liệu ban đầu
        async function loadInitial() {
            try {
                const res = await fetch('/api/v1/data');
                const data = await res.json();
                updateGatewayStatus(data.status);
                renderTransactions(data.transactions);
            } catch (e) {}
        }
        loadInitial();

        function updateGatewayStatus(s) {
            const badge = document.getElementById('deviceBadge');
            if (s.isOnline) {
                badge.className = 'badge badge-online';
                badge.innerHTML = '<span class="pulse pulse-online"></span> Thiết bị Online (' + (s.battery ? s.battery + '%' : 'Wi-Fi') + ')';
            } else {
                badge.className = 'badge badge-offline';
                badge.innerHTML = '<span class="pulse pulse-offline"></span> Thiết bị Offline';
            }
        }

        // Kết nối SSE Realtime
        const evt = new EventSource('/events');
        evt.addEventListener('new_transaction', (e) => {
            const tx = JSON.parse(e.data);
            fetch('/api/v1/data').then(r => r.json()).then(d => renderTransactions(d.transactions));
        });
        evt.addEventListener('gateway_status', (e) => {
            const s = JSON.parse(e.data);
            updateGatewayStatus(s);
        });
        evt.addEventListener('cleared', () => {
            renderTransactions([]);
        });
    </script>
</body>
</html>`;
}
