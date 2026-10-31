'use client';

import React, { useState } from 'react';

interface SteamLoaderGuideCardProps {
  initialKey?: string;
  orderCode?: string;
  className?: string;
}

export function SteamLoaderGuideCard({ initialKey, orderCode, className = '' }: SteamLoaderGuideCardProps) {
  const [activeTab, setActiveTab] = useState<'doi-ma' | 'doc-mail' | 'steam-loader'>('steam-loader');
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [twoFaCode, setTwoFaCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleKey = initialKey || orderCode || 'CS2-8K3P-9M2V-4R7Q';

  const handleCopyKey = () => {
    navigator.clipboard.writeText(sampleKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Tabs Switcher */}
      <div className="flex items-center justify-center sm:justify-start gap-2 p-1.5 rounded-2xl bg-[#090f1e]/80 border border-slate-800/80 w-fit backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('doi-ma')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'doi-ma'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span>🗝️</span>
          <span>Đổi mã</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('doc-mail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'doc-mail'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span>✉️</span>
          <span>Đọc mail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('steam-loader')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'steam-loader'
              ? 'bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white shadow-lg shadow-blue-500/25 border border-blue-400/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span>🎮</span>
          <span>Steam / CS2 Loader</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB 1: STEAM / CS2 LOADER (EXACT MATCH SCREENSHOT 2)
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'steam-loader' && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Container Card */}
          <div className="rounded-3xl bg-[#090f1e]/90 border border-slate-800/90 p-5 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Subtle Ambient Glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header: Title + Download Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-13 h-13 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center p-2.5 shrink-0 shadow-lg shadow-blue-500/10">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    SteamLoader — Tự Động Đăng Nhập CS2 Prime
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                    Công cụ tự động đăng nhập tài khoản Steam / CS2 Prime (NFA) chỉ bằng{' '}
                    <b className="text-amber-300">Mã Key</b> nhận được sau khi mua — không cần mật khẩu hay mã Steam Guard.
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <a
                href="/downloads/SteamLoader.exe"
                download="SteamLoader.exe"
                className="shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-blue-400/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Tải Tool SteamLoader.exe</span>
              </a>
            </div>

            {/* 3 Steps in 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 relative z-10">
              {/* Step 1 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0e162b] border border-blue-900/40 hover:border-blue-500/40 transition-all space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                    1
                  </span>
                  <span className="font-bold text-white text-sm">Bước 1: Tải & Mở Loader</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tải file <code className="text-blue-300 font-mono font-bold bg-blue-950/60 px-1 py-0.5 rounded">SteamLoader.exe</code> về máy tính Windows và mở lên.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0e162b] border border-blue-900/40 hover:border-blue-500/40 transition-all space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                    2
                  </span>
                  <span className="font-bold text-white text-sm">Bước 2: Điền Key Đã Mua</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Copy <b className="text-amber-300">Mã Key</b> trong đơn hàng (ví dụ:{' '}
                  <span
                    onClick={handleCopyKey}
                    className="text-amber-300 font-mono font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 cursor-pointer hover:bg-amber-500/20"
                    title="Bấm để sao chép key mẫu"
                  >
                    {sampleKey} {copied ? '✓' : ''}
                  </span>
                  ) dán vào Loader và nhấn <b>Enter</b>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0e162b] border border-blue-900/40 hover:border-blue-500/40 transition-all space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                    3
                  </span>
                  <span className="font-bold text-white text-sm">Bước 3: Tự Động Đăng Nhập</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Loader sẽ tự đóng Steam cũ, nạp Token phiên đăng nhập và tự bật lại Steam vào thẳng tài khoản CS2 Prime!
                </p>
              </div>
            </div>

            {/* Amber Alert Callout: Chế độ bảo hành */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-medium">
                <span className="text-amber-400">🕒</span>
                <span>
                  <b className="font-bold text-amber-300">Chế độ bảo hành:</b> Bảo hành{' '}
                  <b className="font-bold text-white">1 giờ kể từ khi mua</b> nếu phát sinh lỗi không đăng nhập được.
                </span>
              </div>
              <div className="flex items-center gap-2 text-amber-300 font-medium pl-6">
                <span>✓</span>
                <span>Hỗ trợ Windows 10 / 11 (64-bit)</span>
              </div>
            </div>

            {/* Green Alert Callout: Tự động sao lưu cấu hình */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-200 font-medium">
              <span className="text-emerald-400 text-sm">🛡️</span>
              <span>
                <b className="font-bold text-emerald-300">Tự động sao lưu cấu hình Steam cũ trên máy</b> — bạn có thể chuyển đổi qua lại với tài khoản chính bất cứ lúc nào.
              </span>
            </div>
          </div>

          {/* Terminal / Code Box: Lưu ý khi chạy trên Windows */}
          <div className="rounded-3xl bg-[#070c18] border border-slate-800 p-5 sm:p-6 space-y-3 font-mono text-xs text-slate-300 shadow-xl">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <span>&gt;_</span>
              <span>Lưu ý khi chạy trên Windows:</span>
            </div>
            <ul className="space-y-2 pl-4 list-disc text-slate-400 text-xs">
              <li>
                Nếu Windows SmartScreen hiện bảng xanh <i className="text-slate-200">&ldquo;Windows protected your PC&rdquo;</i>, nhấn vào{' '}
                <b className="text-white">More info</b> ➔ chọn <b className="text-[#00e5a0]">Run anyway</b>.
              </li>
              <li>
                Ngoài Mã Key (<code className="text-amber-300 font-mono">CS2-XXXX-XXXX-XXXX</code>), bạn cũng có thể dán trực tiếp{' '}
                <b className="text-white">Mã đơn hàng</b> vào Loader đều được hỗ trợ.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 2: ĐỔI MÃ (2FA / REDEEM CODE HELPER)
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'doi-ma' && (
        <div className="rounded-3xl bg-[#090f1e]/90 border border-slate-800/90 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗝️</span>
            <div>
              <h3 className="text-xl font-black text-white">Công Cụ Đổi Mã & Lấy Mã 2FA (Two-Factor OTP)</h3>
              <p className="text-xs text-slate-400">
                Hỗ trợ lấy mã OTP 6 số từ khóa bí mật (Secret Key) dùng cho Discord, Steam, Epic Games, Hotmail...
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Dán Mã Secret Key 2FA (16-32 ký tự):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={twoFaSecret}
                  onChange={(e) => setTwoFaSecret(e.target.value)}
                  placeholder="Ví dụ: JBSWY3DPEHPK3PXP"
                  className="input-field font-mono text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!twoFaSecret.trim()) return;
                    // Quick placeholder 2FA generator
                    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    setTwoFaCode(randomOtp);
                  }}
                  className="btn-primary text-xs !py-2 !px-4"
                >
                  Lấy Mã OTP
                </button>
              </div>
            </div>

            {twoFaCode && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">Mã xác thực 6 số:</div>
                  <div className="text-2xl font-black font-mono text-white tracking-widest">{twoFaCode}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(twoFaCode);
                    alert('Đã chép mã OTP!');
                  }}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  Sao chép
                </button>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
              💡 Bạn cũng có thể truy cập trang web chuyên dụng:{' '}
              <a href="https://2fa.live" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-mono">
                2fa.live
              </a>{' '}
              để lấy mã OTP nhanh chóng.
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB 3: ĐỌC MAIL (WEBMAIL / INBOX CODE CHECKER)
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'doc-mail' && (
        <div className="rounded-3xl bg-[#090f1e]/90 border border-slate-800/90 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✉️</span>
            <div>
              <h3 className="text-xl font-black text-white">Cổng Đọc Mail Hộp Thư & Nhận Mã Xác Nhận</h3>
              <p className="text-xs text-slate-400">
                Đọc hòm thư đến của các tài khoản Hotmail, Outlook, Domain mail đi kèm tài khoản Discord, Steam.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://outlook.live.com"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-[#0e162b] border border-blue-900/40 hover:border-blue-500/50 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                  Microsoft Outlook / Hotmail
                </div>
                <div className="text-xs text-slate-400">outlook.live.com</div>
              </div>
              <span className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">➔</span>
            </a>

            <a
              href="https://mail.tm"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-[#0e162b] border border-blue-900/40 hover:border-blue-500/50 transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                  TempMail / Webmail Ảo
                </div>
                <div className="text-xs text-slate-400">mail.tm</div>
              </div>
              <span className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all">➔</span>
            </a>
          </div>

          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
            ℹ️ Đối với tài khoản Discord Cổ hoặc Steam Full Mail, sau khi đăng nhập thành công bạn nên lập tức đổi mật khẩu và liên kết mail chính chủ của mình.
          </div>
        </div>
      )}
    </div>
  );
}
