'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export function AuthModal() {
  const { isAuthModalOpen } = useAuth();

  // Each opening owns a fresh form, including messages and credentials.
  return isAuthModalOpen ? <AuthModalForm /> : null;
}

function AuthModalForm() {
  const { closeAuthModal, login, sendOtp, register, getDiscordRedirectUrl } = useAuth();

  const [activeTab, setActiveTab] = useState<'traditional' | 'discord'>('discord');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleSendOtpCode = async () => {
    setError(null);
    setSuccessMsg(null);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError('Vui lòng nhập đúng định dạng email trước khi gửi mã (Ví dụ: tenban@gmail.com)');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendOtp(email.trim());
      if (res.success) {
        setOtpSent(true);
        setSuccessMsg(res.message);
        setOtpCountdown(60);
      } else {
        setError(res.message || 'Không thể gửi mã OTP.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi gửi yêu cầu mã xác thực.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmitTraditional = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!name.trim()) {
          setError('Vui lòng nhập tên của bạn');
          setLoading(false);
          return;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
          setError('Địa chỉ email không hợp lệ. Phải có đuôi tên miền (Ví dụ: tenban@gmail.com)');
          setLoading(false);
          return;
        }
        if (!otp.trim() || otp.trim().length !== 6) {
          setError('Vui lòng nhập mã OTP gồm 6 chữ số đã gửi về email.');
          setLoading(false);
          return;
        }
        const res = await register(name, email, password, otp.trim());
        if (!res.success) {
          setError(res.message || 'Đăng ký không thành công');
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.message || 'Email hoặc mật khẩu không chính xác');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordRealLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const url = await getDiscordRedirectUrl();
      if (url) {
        window.location.href = url;
      } else {
        setError('Không thể tạo liên kết đăng nhập Discord. Vui lòng kiểm tra kết nối mạng.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối Discord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050a14]/85 backdrop-blur-xl">
      <div
        className="relative w-full max-w-md glass-card rounded-2xl shadow-2xl shadow-black/50 overflow-hidden p-6 sm:p-8 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Anti-DDoS badge top */}
        <div className="absolute top-3 right-12 flex items-center gap-1.5 px-2.5 py-1 bg-[#00e5a0]/5 border border-[#00e5a0]/15 rounded-full text-[10px] font-mono text-[#00e5a0]">
          <span className="live-dot" style={{ width: 5, height: 5 }} />
          Shield Protected
        </div>

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#00e5a0]/10 to-[#00c4ff]/10 border border-[#00e5a0]/20 text-2xl mb-3">
            🎮
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">
            {isRegisterMode && activeTab === 'traditional' ? 'Tạo Tài Khoản Tạp Hóa 247' : 'Đăng Nhập Tạp Hóa 247'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Xem lịch sử tài khoản đã mua, bảo hành 1 chạm và quản lý đơn hàng
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#050a14]/70 border border-slate-800/50 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('discord');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'discord'
                ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/20'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Tài Khoản Discord
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('traditional');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'traditional'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <span>✉️</span>
            Email & Mật Khẩu
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Discord */}
        {activeTab === 'discord' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <span>🛡️</span>
                <span>Tiện ích khi đăng nhập bằng Discord:</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-slate-400">
                <li>Đồng bộ tên & ảnh đại diện Discord tự động.</li>
                <li>Lưu trữ toàn bộ đơn hàng đã mua vào tài khoản.</li>
                <li>Bảo hành 1 đổi 1 nhanh chóng ngay khi acc lỗi.</li>
                <li>Tự động chặn tấn công DDoS, bảo mật 2 lớp.</li>
              </ul>
            </div>

            {/* Nút đăng nhập Discord OAuth thật */}
            <button
              type="button"
              onClick={handleDiscordRealLogin}
              disabled={loading}
              className="w-full py-3 bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.99] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#5865F2]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Đăng Nhập Với Discord OAuth2</span>
            </button>
          </div>
        )}

        {/* Tab Email & Mật Khẩu */}
        {activeTab === 'traditional' && (
          <form onSubmit={handleSubmitTraditional} className="space-y-4">
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và tên / Biệt danh
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Long Gamer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isRegisterMode ? 'Địa chỉ Email (Nhận mã OTP)' : 'Email hoặc Tên tài khoản'}
              </label>
              <div className="flex gap-2">
                <input
                  type={isRegisterMode ? 'email' : 'text'}
                  required
                  placeholder={isRegisterMode ? 'tenban@gmail.com' : 'email@gmail.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                />
                {isRegisterMode && (
                  <button
                    type="button"
                    onClick={handleSendOtpCode}
                    disabled={sendingOtp || otpCountdown > 0}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-all shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {sendingOtp
                      ? 'Đang gửi...'
                      : otpCountdown > 0
                        ? `${otpCountdown}s`
                        : otpSent
                          ? 'Gửi lại'
                          : 'Gửi mã OTP'}
                  </button>
                )}
              </div>
            </div>

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mã xác thực OTP (6 số gửi về Email)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Nhập 6 số xác thực..."
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-widest text-center focus:outline-none focus:border-emerald-400 transition-colors"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  * Nhập email và bấm <b>Gửi mã OTP</b>, sau đó kiểm tra hộp thư (hoặc mục Spam).
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Ít nhất 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading
                ? 'Đang xử lý...'
                : isRegisterMode
                  ? 'Đăng Ký Tài Khoản'
                  : 'Đăng Nhập Ngay'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              {isRegisterMode ? (
                <>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(false);
                      setError(null);
                    }}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Đăng nhập
                  </button>
                </>
              ) : (
                <>
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(true);
                      setError(null);
                    }}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Đăng ký ngay
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
