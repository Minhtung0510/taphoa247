'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface CursorFullGuideProps {
  embedded?: boolean;
}

export function CursorFullGuide({ embedded = false }: CursorFullGuideProps) {
  const [activeTab, setActiveTab] = useState<'windows' | 'macos' | 'linux'>('windows');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const troubleshootingList = [
    {
      id: 1,
      title: 'Lỗi thiếu quyền (Permission Denied / 权限不足) khi vá hoặc sao lưu file',
      tags: ['Windows', 'macOS', 'Linux', 'Quyền Quản Trị'],
      severity: 'high',
      solution: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            Đây là nguyên nhân của hơn 80% trường hợp cài đặt plugin thất bại. Hãy xử lý theo hệ điều hành của bạn:
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <b className="text-white">Dành cho Windows:</b>
              <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                <li>
                  <b className="text-amber-300">Cách 1:</b> Tắt hoàn toàn Cursor. Chuột phải vào biểu tượng Cursor ➔ Chọn{' '}
                  <span className="text-emerald-400 font-bold">Run as administrator</span> (Chạy với quyền Quản trị viên).
                </li>
                <li>
                  <b className="text-amber-300">Cách 2:</b> Cài đặt Cursor vào thư mục mặc định người dùng:{' '}
                  <code className="text-cyan-300 font-mono">C:\Users\TênUser\AppData\Local\Programs</code>.
                </li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <b className="text-white">Dành cho macOS:</b>
              <p className="mt-1 text-slate-400">Mở Terminal và chạy lệnh cấp quyền cho thư mục Cursor App:</p>
              <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-black/60 border border-white/5 font-mono text-[11px] text-[#00e5a0]">
                <span>sudo chown -R `whoami` /Applications/Cursor.app/Contents/Resources/app</span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      'sudo chown -R `whoami` /Applications/Cursor.app/Contents/Resources/app',
                      'chown-mac'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 cursor-pointer"
                >
                  {copiedText === 'chown-mac' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Lỗi không thể truy cập thư mục '.cursor_free_data'",
      tags: ['Windows', 'macOS', 'Data Permission'],
      severity: 'medium',
      solution: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>Lỗi do Windows hoặc Mac chặn quyền ghi file cấu hình của plugin vào thư mục người dùng:</p>
          <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono block">Lệnh sửa trên Windows (Chạy CMD với Run as Administrator):</span>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#00e5a0]">
              <span className="break-all">icacls %USERPROFILE%\.cursor_free_data /grant Everyone:F /T /C</span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard('icacls %USERPROFILE%\\.cursor_free_data /grant Everyone:F /T /C', 'icacls-win')
                }
                className="px-2 py-0.5 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 cursor-pointer ml-2 shrink-0"
              >
                {copiedText === 'icacls-win' ? '✓ Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono block">Lệnh sửa trên macOS / Linux (Chạy Terminal):</span>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#00e5a0]">
              <span>sudo chmod 777 ~/.cursor_free_data</span>
              <button
                type="button"
                onClick={() => copyToClipboard('sudo chmod 777 ~/.cursor_free_data', 'chmod-free-data')}
                className="px-2 py-0.5 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 cursor-pointer ml-2 shrink-0"
              >
                {copiedText === 'chmod-free-data' ? '✓ Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'Lỗi tải Webview (加载Web视图时出错 / Webview Loading Error)',
      tags: ['Windows', 'Webview', 'Service Worker'],
      severity: 'high',
      solution: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>
            Khi plugin hiện màn hình trắng hoặc báo lỗi load Webview, nguyên nhân là bộ đệm Service Worker của Cursor bị nghẽn:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
            <li>Đóng hoàn toàn Cursor (kiểm tra trong Task Manager để chắc chắn không còn tiến trình Cursor nào).</li>
            <li>
              Nhấn tổ hợp phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">Win + R</kbd>,
              dán đường dẫn sau rồi nhấn Enter:
              <div className="mt-1 flex items-center justify-between p-2 rounded bg-black/60 font-mono text-[11px] text-[#00c4ff]">
                <span>%APPDATA%\Cursor\Service Worker</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('%APPDATA%\\Cursor\\Service Worker', 'sw-path')}
                  className="px-2 py-0.5 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 cursor-pointer"
                >
                  {copiedText === 'sw-path' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </li>
            <li>Khi thư mục mở ra, xóa toàn bộ thư mục con <b className="text-red-400">Service Worker</b>.</li>
            <li>Mở lại Cursor với quyền Run as Administrator là lỗi sẽ biến mất hoàn toàn.</li>
          </ol>
        </div>
      ),
    },
    {
      id: 4,
      title: 'Lỗi kết nối mạng: Waiting for extension host, Reconnecting, The connection stalled',
      tags: ['Mạng', 'Node', 'HTTP/2', 'Proxy'],
      severity: 'medium',
      solution: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>
            Vấn đề này do mạng cục bộ chặn đường truyền HTTP/2 hoặc do phần mềm VPN/Proxy gây xung đột. Cách xử lý:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-300">
            <li>
              <b>Tắt VPN / Proxy:</b> Đảm bảo tắt hoàn toàn 1.1.1.1, Clash, v2ray, VPN trước khi sử dụng.
            </li>
            <li>
              <b>Đổi chế độ Node trong Extension:</b> Mở bảng tiện ích Cursor Free, thử lần lượt 4 cấu hình:
              <span className="block pl-4 text-cyan-300 font-mono mt-1">
                • Smart Node + HTTP/1.1 (Khuyên dùng buổi chiều tối)
                <br />
                • Smart Node + HTTP/2
                <br />
                • Standard Node + HTTP/1.1
              </span>
            </li>
            <li>
              <b>Dùng chế độ Ease (Đổi tài khoản cục bộ):</b> Bật chế độ Ease Mode trong extension để dùng server dự phòng khi mạng quá lag.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 5,
      title: 'Xung đột Extension gây tình trạng liên tục Reconnecting',
      tags: ['Claude Code', 'Third-party Skills', 'Reconnecting'],
      severity: 'low',
      solution: (
        <div className="space-y-1.5 text-xs leading-relaxed text-slate-300">
          <p>
            Nếu bạn từng cài đặt các Skill trong Claude Code (CC), Cursor sẽ tự động import các Skill này dưới dạng plugin và gây xung đột.
          </p>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-slate-300">
            <b className="text-white">Cách khắc phục:</b>
            <p className="mt-1">
              Vào mục Cài đặt của Cursor ➔ Tìm và TẮT tùy chọn:{' '}
              <span className="text-amber-300 font-mono">Include third-party Plugins, Skills, and other configs</span>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 6,
      title: "Lỗi 'An unexpected error occurred on our servers. Please try again'",
      tags: ['Context', 'New Chat', 'Cursor Bug'],
      severity: 'low',
      solution: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>
            Đây là lỗi phía máy chủ chính thức của Cursor khi phiên trò chuyện hiện tại bị tràn bộ nhớ hoặc crash session:
          </p>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-bold text-white">Cách xử lý tức thì:</p>
            <p>
              Nhấn vào biểu tượng <b className="text-[#00e5a0] text-sm">+</b> ở góc trên bên phải cửa sổ chat để tạo{' '}
              <span className="text-cyan-300 font-bold">New Chat</span> hoặc <span className="text-cyan-300 font-bold">New Agent</span>.
            </p>
            <p className="text-slate-400 text-[11px] italic">
              💡 Mẹo: Muốn gọi lại nội dung cũ mà không bị lỗi, chỉ cần gõ <code className="text-amber-300 font-bold">@p</code> ➔ chọn{' '}
              <b className="text-white">Past Chats</b>.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 7,
      title: "Lỗi 'AI Model Not Found' hoặc không thể gọi mô hình",
      tags: ['API Key', 'Model', 'Settings'],
      severity: 'medium',
      solution: (
        <div className="space-y-1.5 text-xs leading-relaxed text-slate-300">
          <p>
            Nguyên nhân là do bạn đang bật cấu hình Custom API Key (OpenAI API Key / Anthropic API Key) trong cài đặt Cursor.
          </p>
          <p className="text-amber-300 font-bold">
            ➔ Hãy vào Cursor Settings ➔ Models ➔ TẮT toàn bộ các API Keys cá nhân. Plugin bản quyền sẽ tự động quản lý kết nối đến pool model VIP.
          </p>
        </div>
      ),
    },
    {
      id: 8,
      title: "Lỗi 'If you are logged in, try logging out and back in' trên Cursor 3.9+",
      tags: ['Patch Mode', 'Reactivate', 'Cursor 3.9'],
      severity: 'medium',
      solution: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>Trên các phiên bản Cursor 3.9 trở lên, hãy xử lý theo 3 bước:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <li>Trong tiện ích Cursor Free, chọn <b className="text-amber-300">Exit Patch Mode</b> (Thoát chế độ Patch).</li>
            <li>Đóng Cursor và mở lại bằng quyền Administrator.</li>
            <li>Bấm nút <b className="text-[#00e5a0]">Activate</b> một lần nữa để làm mới token ủy quyền.</li>
          </ol>
        </div>
      ),
    },
    {
      id: 9,
      title: 'Cách xóa toàn bộ cache hoặc gỡ cài đặt Cursor sạch sẽ',
      tags: ['Cache', 'Uninstall', 'Reset'],
      severity: 'low',
      solution: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>Nếu bạn muốn dọn dẹp cache của Cursor để tránh xung đột cấu hình cũ:</p>
          <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono block">Xóa cache trên Windows (Thoát Cursor trước khi chạy):</span>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#00e5a0]">
              <span>cmd /c rd /s /q %APPDATA%\Cursor\User\globalStorage</span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard('cmd /c rd /s /q %APPDATA%\\Cursor\\User\\globalStorage', 'cache-win')
                }
                className="px-2 py-0.5 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 cursor-pointer ml-2"
              >
                {copiedText === 'cache-win' ? '✓ Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-black/60 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono block">Xóa cache trên macOS:</span>
            <div className="flex items-center justify-between font-mono text-[11px] text-[#00e5a0]">
              <span>sudo rm -rf ~/Library/Application\ Support/Cursor/User/globalStorage</span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    'sudo rm -rf ~/Library/Application\\ Support/Cursor/User/globalStorage',
                    'cache-mac'
                  )
                }
                className="px-2 py-0.5 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 cursor-pointer ml-2"
              >
                {copiedText === 'cache-mac' ? '✓ Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 10,
      title: 'Cài đặt tiếng Việt hoặc sửa lỗi hiển thị ký tự / Font encoding UTF-8',
      tags: ['Việt Hóa', 'UTF-8', 'Encoding'],
      severity: 'low',
      solution: (
        <div className="space-y-2 text-xs leading-relaxed text-slate-300">
          <p>Để đảm bảo Cursor đọc file tiếng Việt chuẩn xác không bị lỗi font:</p>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
            <p>
              1. Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">Ctrl + Shift + P</kbd> ➔
              gõ <code className="text-[#00c4ff]">Open User Settings JSON</code> và nhấn Enter.
            </p>
            <p>2. Thêm hai dòng cấu hình sau vào trong dấu ngoặc nhọn rồi lưu lại:</p>
            <div className="p-2 bg-black/70 rounded-lg font-mono text-[11px] text-[#00e5a0] flex items-center justify-between">
              <pre>{`"files.encoding": "utf8",\n"files.autoGuessEncoding": false`}</pre>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `"files.encoding": "utf8",\n"files.autoGuessEncoding": false`,
                    'utf8-config'
                  )
                }
                className="px-2 py-1 rounded bg-slate-800 text-xs text-white hover:bg-slate-700 cursor-pointer ml-3 shrink-0"
              >
                {copiedText === 'utf8-config' ? '✓ Đã chép' : 'Sao chép'}
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredErrors = troubleshootingList.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={`space-y-10 text-white ${embedded ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
      {/* Hero Banner Header */}
      <div className="relative rounded-3xl overflow-hidden p-6 sm:p-10 bg-gradient-to-br from-[#0b101d] via-[#11192e] to-[#080d18] border border-cyan-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              ⚡ HƯỚNG DẪN BẢN QUYỀN VSIX CHÍNH THỨC
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300">
              Phiên bản Cursor 3.0+
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/15 border border-emerald-500/30 text-[#00e5a0]">
              ● Kích Hoạt Tự Động
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Hướng Dẫn Kích Hoạt & Sử Dụng <span className="gradient-text">Cursor AI Pro</span>
          </h1>

          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Tài liệu hướng dẫn đầy đủ từng bước cài đặt extension kích hoạt bản quyền mã Key (<code className="text-amber-300 font-mono">JG-CF-...</code>),
            tính năng đổi tài khoản tự động (One-click Switch Account), tối ưu token context và cách xử lý triệt để 100% lỗi thường gặp.
          </p>

          {/* Quick Action Download Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://drive.google.com/drive/folders/1UJ6OH9wMvOYwhRvxDB71FW36PW-uEk8x"
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs !py-3 !px-5 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>📦 Tải Gói Extension .VSIX (Google Drive)</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <a
              href="https://cursor.com/download"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs !py-3 !px-5 flex items-center gap-2"
            >
              <span>📥 Tải Cursor Chính Hãng</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* QUICK RULES BANNER (TIẾT KIỆM 90% THỜI GIAN) */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
          <span>📌</span>
          <span>QUY TẮC CẦN NẮM ĐỂ TIẾT KIỆM 90% THỜI GIAN:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-300 pt-1">
          <div className="flex items-start gap-2">
            <span className="text-[#00e5a0] font-bold">✓</span>
            <span><b>Không cần VPN/Proxy:</b> Plugin chạy thẳng trực tiếp với đường truyền tốc độ cao.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00e5a0] font-bold">✓</span>
            <span><b>Khuyên dùng Cursor 3.0+:</b> Bản mới nhất hỗ trợ đầy đủ Agents & HTTP/2.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00e5a0] font-bold">✓</span>
            <span><b>Cài đặt mới (Khuyến nghị):</b> Gỡ bản cũ rồi cài lại mới giúp tránh 99% sự cố.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00e5a0] font-bold">✓</span>
            <span><b>Windows:</b> Luôn mở Cursor bằng <b className="text-amber-300">Run as administrator</b>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00e5a0] font-bold">✓</span>
            <span><b>Giới hạn thiết bị:</b> 1 Key dùng cho 1 máy. Muốn đổi máy chỉ cần bấm <b>Hủy liên kết (Unbind)</b>.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#00e5a0] font-bold">✓</span>
            <span><b>Gia hạn linh hoạt:</b> Bấm nút Renew trong extension, dán key mới để cộng dồn hạn mức.</span>
          </div>
        </div>
      </div>

      {/* STEP-BY-STEP INSTALLATION GUIDE (TABBED BY OS) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">BƯỚC CÀI ĐẶT</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Quy Trình Cài Đặt Chi Tiết Từng Hệ Điều Hành</h2>
          </div>

          {/* OS Switcher Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('windows')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'windows'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🪟 Windows (x64)</span>
            </button>
            <button
              onClick={() => setActiveTab('macos')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'macos'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🍏 macOS Universal</span>
            </button>
            <button
              onClick={() => setActiveTab('linux')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'linux'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🐧 Linux (.AppImage)</span>
            </button>
          </div>
        </div>

        {/* Tab Content: Windows */}
        {activeTab === 'windows' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 font-black text-sm flex items-center justify-center font-mono">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Mở Cursor bằng Run as Admin</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chuột phải vào shortcut Cursor trên Desktop hoặc Start Menu, chọn <b className="text-amber-300">Run as administrator</b>.
              </p>
              <div className="p-2.5 rounded-xl bg-[#090f1e] border border-white/5 text-[11px] text-slate-400">
                💡 Nếu hiện giao diện Agents Window (Cursor 3.x), nhấn <kbd className="text-amber-300 font-mono">Ctrl + Shift + N</kbd> hoặc click <b className="text-white">Editor Window</b> ở góc trên bên phải.
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-sm flex items-center justify-center font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Mở Command Palette</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhấn tổ hợp phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">Ctrl + Shift + P</kbd> trong cửa sổ Editor của Cursor.
              </p>
              <p className="text-xs text-slate-400">
                Gõ tìm kiếm: <code className="text-[#00e5a0] font-mono">Install from VSIX</code> và nhấn chọn.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 font-black text-sm flex items-center justify-center font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Chọn Tệp Plugin .VSIX</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Duyệt đến file tiện ích có đuôi <code className="text-purple-300 font-mono">.vsix</code> bạn vừa tải về từ Google Drive và nhấn <b className="text-white">Install</b>.
              </p>
              <p className="text-[11px] text-slate-500">Chờ vài giây cho tới khi Cursor thông báo cài đặt hoàn tất.</p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#00e5a0] font-black text-sm flex items-center justify-center font-mono">
                04
              </div>
              <h3 className="text-sm font-bold text-white">Nhập Mã Key & Kích Hoạt</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">Ctrl + Shift + F</kbd> hoặc click icon sấm sét / <b className="text-white">Cursor Free</b> ở góc dưới bên trái.
              </p>
              <p className="text-xs text-slate-300">
                Dán Key <code className="text-amber-300 font-mono">JG-CF-...</code> vào ô Ủy quyền và nhấn <b className="text-[#00e5a0]">Activate</b>.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: macOS */}
        {activeTab === 'macos' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 font-black text-sm flex items-center justify-center font-mono">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Cài Cursor vào thư mục Applications</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Khuyên dùng bản Cursor Mac Universal. Kéo thả Cursor vào thư mục Applications mặc định.
              </p>
              <div className="p-2.5 rounded-xl bg-[#090f1e] border border-white/5 text-[11px] text-slate-400">
                💡 Nếu ở Agents Window, nhấn <kbd className="text-purple-300 font-mono">⌘ + Shift + N</kbd> để mở cửa sổ Editor truyền thống.
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 font-black text-sm flex items-center justify-center font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Kéo Thả .VSIX hoặc Cài qua Lệnh</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mở mục Extensions trong Cursor, kéo thả file <code className="text-pink-300 font-mono">.vsix</code> vào cửa sổ. Hoặc nhấn <kbd className="text-amber-300 font-mono">Cmd + Shift + P</kbd> ➔ gõ <code className="text-[#00e5a0]">Install from VSIX</code>.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-[#00e5a0] font-black text-sm flex items-center justify-center font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Kích Hoạt Key Bản Quyền</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhấn vào chữ <b className="text-white">Cursor Free</b> ở thanh trạng thái phía dưới bên trái. Dán mã Key <code className="text-amber-300 font-mono">JG-CF-...</code> và bấm <b className="text-[#00e5a0]">Activate</b>.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Linux */}
        {activeTab === 'linux' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center font-mono">
                01
              </div>
              <h3 className="text-sm font-bold text-white">Tải Bản .AppImage</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Người dùng Ubuntu / Linux hãy tải gói <code className="text-emerald-300 font-mono">.AppImage</code> chính thức từ cursor.com. Cấp quyền thực thi: <code className="text-cyan-300 font-mono">chmod +x cursor.AppImage</code>.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 font-black text-sm flex items-center justify-center font-mono">
                02
              </div>
              <h3 className="text-sm font-bold text-white">Cài đặt .VSIX qua Command Palette</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhấn <kbd className="text-amber-300 font-mono">Ctrl + Shift + P</kbd> ➔ nhập <code className="text-[#00e5a0]">Install from VSIX</code> ➔ Chọn tệp plugin vừa tải về.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden border-slate-800">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-sm flex items-center justify-center font-mono">
                03
              </div>
              <h3 className="text-sm font-bold text-white">Dán Key & Bắt Đầu Sử Dụng</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mở Cursor Free ở góc dưới, dán Key bản quyền và ấn <b className="text-[#00e5a0]">Activate</b>.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CORE OPERATIONAL FEATURES (TÍNH NĂNG VẬN HÀNH VIP) */}
      <div className="space-y-4">
        <div className="section-header">
          <span className="text-xs font-mono text-[#00e5a0] font-bold uppercase tracking-wider">CƠ CHẾ HOẠT ĐỘNG</span>
          <h2 className="text-xl sm:text-2xl font-black text-white">Hướng Dẫn Vận Hành & Tính Năng Chuyên Sâu</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Switch Account */}
          <div className="glass-card rounded-2xl p-5 space-y-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔄</span>
              <h3 className="text-base font-bold text-white">Đổi Tài Khoản 1 Cú Nhấp (Switch Account)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nếu Cursor chưa đăng nhập hoặc khi bạn dùng hết hạn mức của pool hiện tại, chỉ cần bấm nút{' '}
              <span className="text-cyan-400 font-bold">"Đổi tài khoản bằng 1 cú nhấp"</span> trong plugin. Hệ thống sẽ tự động gán tài khoản mới tức thì mà không cần bạn phải thao tác đăng nhập thủ công.
            </p>
          </div>

          {/* Ease Mode */}
          <div className="glass-card rounded-2xl p-5 space-y-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <h3 className="text-base font-bold text-white">Chế Độ Ease (Đổi Tài Khoản Cục Bộ)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thiết kế dành riêng cho người dùng có kết nối mạng không ổn định hoặc nhà mạng bóp băng thông quốc tế. Chế độ Ease sử dụng cơ chế xoay vòng tài khoản độc lập, giúp bạn luôn kết nối mượt mà ngay cả khi server chính bị nghẽn.
            </p>
          </div>

          {/* Master Mode */}
          <div className="glass-card rounded-2xl p-5 space-y-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🚀</span>
              <h3 className="text-base font-bold text-white">Chế Độ Master (Đường Truyền Riêng Siêu Tốc)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dành cho tác vụ lập trình chuyên sâu đòi hỏi chất lượng phản hồi cao nhất từ Claude 3.5 Sonnet / Opus / GPT-4o. Sử dụng đường truyền chuyên dụng không nén, độ trễ cực thấp và không bị suy giảm chất lượng suy luận.
            </p>
          </div>

          {/* Unbind Device */}
          <div className="glass-card rounded-2xl p-5 space-y-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💻</span>
              <h3 className="text-base font-bold text-white">Quản Lý & Hủy Liên Kết Thiết Bị (Unbind)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mỗi mã Key được bảo vệ gắn với 1 máy tính. Nếu bạn đổi sang máy tính xách tay hoặc PC khác làm việc, hãy mở plugin trên máy cũ và bấm{' '}
              <span className="text-amber-400 font-bold">Hủy liên kết (Unbind)</span>, sau đó có thể kích hoạt bình thường trên máy mới.
            </p>
          </div>

          {/* Planning next moves explanation */}
          <div className="glass-card rounded-2xl p-5 space-y-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔎</span>
              <h3 className="text-base font-bold text-white">Trạng thái "Planning next moves" là gì?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Đây là trạng thái hoàn toàn bình thường khi AI Agent đang đọc mã nguồn dự án, tìm kiếm tệp và lập kế hoạch thực thi từng bước. Đối với các tác vụ phức tạp, bạn chỉ cần kiên nhẫn chờ AI hoàn thành.
            </p>
          </div>

          {/* Context optimization tips */}
          <div className="glass-card rounded-2xl p-5 space-y-3 border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💡</span>
              <h3 className="text-base font-bold text-white">Mẹo Tiết Kiệm 70% Token & Tránh Ảo Giác</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <b className="text-amber-300">Không nên dùng 1 chat quá dài:</b> Ngữ cảnh quá dài làm hao token rất nhanh và khiến AI dễ bị ảo giác (Hallucination). Khi sang tính năng mới, hãy bấm <kbd className="text-[#00e5a0] font-bold">+</kbd> để tạo New Chat. Muốn gọi ngữ cảnh cũ chỉ cần gõ <code className="text-cyan-300 font-mono">@p</code> ➔ <b className="text-white">Past Chats</b>.
            </p>
          </div>
        </div>
      </div>

      {/* COMPREHENSIVE TROUBLESHOOTING & ERROR LOOKUP */}
      <div id="sua-loi" className="space-y-4 pt-4 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">KHẮC PHỤC SỰ CỐ</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">Tra Cứu & Khắc Phục Toàn Bộ Lỗi Thường Gặp</h2>
            <p className="text-xs text-slate-400 mt-1">
              Tìm kiếm mã lỗi hoặc từ khóa để xem hướng dẫn xử lý từng bước (Webview, Service Worker, Permission, Proxy...)
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Nhập tên lỗi (vd: webview, quyền, node...)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Error Accordions */}
        <div className="space-y-3">
          {filteredErrors.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-slate-400 text-xs">
              Không tìm thấy lỗi khớp với từ khóa "{searchQuery}". Bạn có thể thử tìm theo từ khóa khác hoặc gửi yêu cầu tại Trung Tâm Bảo Hành.
            </div>
          ) : (
            filteredErrors.map((item) => {
              const isOpen = openFaq === item.id;
              return (
                <div
                  key={item.id}
                  className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : item.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug flex items-center gap-2">
                        <span className="text-amber-400 font-mono text-xs">Q{item.id}:</span>
                        <span>{item.title}</span>
                      </h3>
                    </div>

                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-800/50 bg-[#070b14]/50 animate-in fade-in duration-150">
                      <div className="pt-3">{item.solution}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Self-service Footer */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-bold text-white">Chính Sách Bảo Hành Bản Quyền Tự Động 100%</h3>
          <p className="text-xs text-slate-400">
            Mọi lỗi về Key, hạn mức hoặc đổi máy đều được xử lý tự động trong vòng 24 giờ qua hệ thống bảo hành.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/bao-hanh" className="btn-primary text-xs !py-2.5 !px-5">
            🛡️ Trung Tâm Bảo Hành 1 Đổi 1
          </Link>
          <Link href="/lich-su-don-hang" className="btn-secondary text-xs !py-2.5 !px-4">
            📦 Xem Đơn Hàng Của Bạn
          </Link>
        </div>
      </div>
    </div>
  );
}
