'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/api';
import { OrderDetails } from '@/lib/types';
import { CheckAccModal, ParsedAccountData } from '@/components/account/CheckAccModal';
import { ValorantInventoryCard } from '@/components/account/ValorantInventoryCard';
import { CursorKeyGuideModal } from '@/components/account/CursorKeyGuideModal';
import { useAuth } from '@/lib/AuthContext';

interface Props {
  params: Promise<{ code: string }>;
}

export default function OrderPage({ params }: Props) {
  const { code } = use(params);
  const { token: userAuthToken } = useAuth();
  const [tokenParam, setTokenParam] = useState<string>('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(1800);
  const [cursorGuideKey, setCursorGuideKey] = useState<string | null>(null);

  const [checkAccItem, setCheckAccItem] = useState<{
    orderCode: string;
    position: number;
    productName: string;
    credentials?: string;
    parsed?: ParsedAccountData;
    canWarranty?: boolean;
    replacementCount?: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const urlToken = url.searchParams.get('token') || '';
      const storedToken = sessionStorage.getItem(`order_token_${code}`) || '';
      setTokenParam(urlToken || storedToken || '');
      if (urlToken) {
        sessionStorage.setItem(`order_token_${code}`, urlToken);
        url.searchParams.delete('token');
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
      }
    }
  }, [code]);

  const loadOrder = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`order_token_${code}`) : '';
      const activeToken = tokenParam || storedToken || '';

      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['X-Order-Token'] = activeToken;
      }
      if (userAuthToken) {
        headers['Authorization'] = `Bearer ${userAuthToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/orders/${code}/details`, { headers });
      const json = await res.json();

      if (json.success && json.data) {
        setOrder(json.data);
        if (typeof json.data.remaining_seconds === 'number') {
          setCountdown(Math.max(0, json.data.remaining_seconds));
        }
        if (json.data.access_token && typeof window !== 'undefined') {
          sessionStorage.setItem(`order_token_${code}`, json.data.access_token);
        }
        setError(null);
      } else {
        setError(json.message || 'Không thể xem chi tiết đơn hàng.');
      }
    } catch (err: any) {
      if (!silent) setError(err.message || 'Lỗi tải đơn hàng.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [code, tokenParam, userAuthToken]);

  // Polling tự động kiểm tra thanh toán mỗi 2.5s nếu đơn đang pending (dừng ngay nếu đơn đã hủy, đã thanh toán hoặc hết hạn)
  useEffect(() => {
    if (!order || order.status === 'completed' || order.status === 'paid' || order.status === 'cancelled' || order.status === 'expired') return;

    const pollInterval = setInterval(() => {
      loadOrder(true);
    }, order.status === 'processing' ? 5000 : 2500);

    return () => clearInterval(pollInterval);
  }, [order?.is_paid, order?.status, order?.is_expired, code, tokenParam, userAuthToken]);

  // Đếm ngược thời gian thanh toán (chỉ chạy khi đơn đang pending và còn thời gian)
  useEffect(() => {
    if (!order || order.is_paid || order.status === 'cancelled' || order.status === 'expired' || order.is_expired || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.is_paid, order?.status, order?.is_expired, countdown]);

  const copyCreds = (item: any, idx: number) => {
    const text = item.raw_credentials || '';
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotice(`Đã sao chép ${label}!`);
    setTimeout(() => setCopyNotice(null), 2000);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#00e5a0] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-md">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Không Thể Mở Đơn Hàng</h1>
          <p className="text-sm text-slate-500">{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.'}</p>
          <Link href="/" className="btn-secondary inline-block text-sm">
            ← Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  const effectiveToken = order.access_token || tokenParam || (typeof window !== 'undefined' ? sessionStorage.getItem(`order_token_${code}`) : '') || '';
  const downloadOrderFile = async (format: 'txt' | 'html') => {
    const htmlWindow = format === 'html' ? window.open('about:blank', '_blank') : null;
    try {
      const headers: Record<string, string> = {};
      if (effectiveToken) headers['X-Order-Token'] = effectiveToken;
      if (userAuthToken) headers['Authorization'] = `Bearer ${userAuthToken}`;
      const response = await fetch(`${API_BASE_URL}/orders/${order.order_code}/download${format === 'html' ? '-html' : ''}`, { headers });
      if (!response.ok) throw new Error('Không thể tải tệp đơn hàng. Vui lòng đăng nhập lại hoặc mở lại liên kết đơn hàng.');
      const objectUrl = URL.createObjectURL(await response.blob());
      if (format === 'html' && htmlWindow) {
        htmlWindow.location.href = objectUrl;
      } else if (format === 'txt') {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `don-hang-${order.order_code}.txt`;
        link.click();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      htmlWindow?.close();
      window.alert(error instanceof Error ? error.message : 'Tải tệp thất bại.');
    }
  };

  // ─── TRƯỜNG HỢP 0A: ĐƠN ĐÃ BỊ HỦY / TỪ CHỐI BỞI HỆ THỐNG / ADMIN ───
  if (order.status === 'cancelled' || order.is_cancelled) {
    return (
      <div className="min-h-screen py-10 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="bg-[#0c1324] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-3xl flex items-center justify-center mx-auto shadow-inner">
              🚫
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                ĐƠN HÀNG ĐÃ BỊ HỦY / TỪ CHỐI
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono">
                {order.order_code}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Đơn hàng này đã bị từ chối hoặc hủy bỏ bởi quản trị viên (đơn trùng lặp, tài khoản đã được giải phóng hoặc vi phạm quy định thanh toán). Mã VietQR và thời gian giữ chỗ đã bị vô hiệu hóa.
              </p>
            </div>

            <div className="bg-[#050a14] border border-[#1e293b] rounded-2xl p-4 sm:p-5 text-left space-y-2.5 max-w-md mx-auto text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Khách hàng:</span>
                <b className="text-white">{order.customer_name}</b>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Số tiền đơn:</span>
                <b className="text-rose-400 font-bold">{order.total_amount?.toLocaleString('vi-VN')} đ</b>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Trạng thái:</span>
                <span className="text-rose-400 font-bold">ĐÃ HỦY (Cancelled)</span>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-md mx-auto text-left text-xs text-amber-300 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️</span> Bạn đã lỡ chuyển tiền cho đơn này?
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Đừng lo lắng! Tiền của bạn tuyệt đối an toàn. Vui lòng bấm vào Hotline hoặc Telegram bên dưới để gửi mã đơn <b className="text-white font-mono">{order.order_code}</b> cho Admin. Chúng tôi sẽ kiểm tra và hoàn tiền / giao bù tài khoản ngay lập tức.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="https://t.me/taphoa247_support"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>✈️</span> Hỗ Trợ Telegram
              </a>
              <a
                href="https://zalo.me/g/ovxv2lnx8zvdw8f6q6qb"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>💬</span> Nhóm Zalo Hỗ Trợ
              </a>
              <Link
                href="/lich-su-don-hang"
                className="px-5 py-2.5 bg-[#050a14] border border-[#1e293b] hover:border-slate-500 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                ← Lịch Sử Đơn Hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TRƯỜNG HỢP 0B: ĐƠN ĐÃ HẾT HẠN THANH TOÁN (EXPIRED) ───
  if (order.status === 'expired' || order.is_expired || (!order.is_paid && countdown <= 0)) {
    return (
      <div className="min-h-screen py-10 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="bg-[#0c1324] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-3xl flex items-center justify-center mx-auto shadow-inner">
              ⏱️
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                ĐƠN HÀNG ĐÃ HẾT HẠN GIỮ CHỖ (30 PHÚT)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono">
                {order.order_code}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Thời gian giữ đơn 30 phút đã kết thúc. Để đảm bảo công bằng cho khách hàng khác, tài khoản trong đơn đã được tự động hoàn lại kho chung.
              </p>
            </div>

            <div className="bg-[#050a14] border border-[#1e293b] rounded-2xl p-4 sm:p-5 text-left space-y-2.5 max-w-md mx-auto text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Khách hàng:</span>
                <b className="text-white">{order.customer_name}</b>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Số tiền đơn:</span>
                <b className="text-amber-400 font-bold">{order.total_amount?.toLocaleString('vi-VN')} đ</b>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Trạng thái:</span>
                <span className="text-slate-400 font-bold">HẾT HẠN (Expired)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="px-6 py-2.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black text-xs rounded-xl shadow-lg transition-all"
              >
                🎯 Tạo Đơn Mua Acc Mới
              </Link>
              <Link
                href="/lich-su-don-hang"
                className="px-5 py-2.5 bg-[#050a14] border border-[#1e293b] hover:border-slate-500 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                ← Lịch Sử Đơn Hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (order.status === 'processing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full rounded-3xl border border-cyan-500/30 bg-[#0c1324] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-400" />
          <p className="text-xs font-black uppercase tracking-widest text-emerald-300">Đã nhận thanh toán</p>
          <h1 className="mt-2 text-2xl font-black text-white">Đơn hàng đang được xử lý</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Hệ thống đang hoàn tất việc giao sản phẩm. Trang này tự cập nhật; bạn không cần thanh toán lại.
          </p>
          <p className="mt-5 font-mono text-sm text-cyan-300">{order.order_code}</p>
        </div>
      </div>
    );
  }

  // ─── TRƯỜNG HỢP 1: ĐƠN CHƯA THANH TOÁN (PENDING) ───
  if (!order.is_paid) {
    const qrUrl = order.qr_url || `https://img.vietqr.io/image/${order.bank_code || 'TPB'}-${order.account_no || '07553046301'}-compact2.png?amount=${order.total_amount}&addInfo=${encodeURIComponent(order.memo || order.order_code)}&accountName=${encodeURIComponent(order.account_name || 'NGUYEN MINH TUNG')}`;

    return (
      <div className="min-h-screen py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Thông báo sao chép */}
          {copyNotice && (
            <div className="fixed top-20 right-4 z-50 bg-[#00e5a0] text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
              <span>✓</span> {copyNotice}
            </div>
          )}

          {/* Header trạng thái */}
          <div className="glass-card rounded-2xl p-6 border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-slate-900 to-amber-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  ⏳ ĐƠN HÀNG ĐANG CHỜ THANH TOÁN
                </span>
                <h1 className="text-2xl font-black text-white">Đơn Hàng: <span className="gradient-text">{order.order_code}</span></h1>
                <p className="text-xs text-slate-400 mt-1">
                  Khách hàng: <b className="text-white">{order.customer_name}</b> | Tổng tiền: <b className="text-amber-400 font-bold">{order.total_amount.toLocaleString('vi-VN')} đ</b>
                </p>
              </div>

              {/* Đồng hồ đếm ngược */}
              <div className="text-right sm:text-right bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400">Thời gian giữ đơn còn lại</div>
                <div className="text-xl font-mono font-black text-amber-400">
                  {formatCountdown(countdown)}
                </div>
              </div>
            </div>
          </div>

          {/* Khung quét mã QR & Thông tin chuyển khoản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cột 1: Mã QR VietQR */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 border-[#00e5a0]/15">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span>📱</span> Quét mã VietQR bằng App Ngân Hàng
              </div>
              <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-slate-800 relative group">
                <img
                  src={qrUrl}
                  alt={`QR Thanh toán đơn ${order.order_code}`}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold pointer-events-none">
                  Tự điền số tiền & nội dung
                </div>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Mở ứng dụng ngân hàng bất kỳ (MB, Vietcombank, TPBank, MoMo...) và quét mã để thanh toán tự động trong 3 giây.
              </p>
            </div>

            {/* Cột 2: Thông tin chuyển khoản thủ công */}
            <div className="glass-card rounded-2xl p-6 space-y-4 border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span>🏦</span> Hoặc Chuyển Khoản Thủ Công
              </h3>

              <div className="space-y-3 text-xs">
                {/* Ngân hàng */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400">Ngân hàng:</span>
                  <span className="font-bold text-white">{order.bank_code || 'TPBank'} (TPBank)</span>
                </div>

                {/* Số tài khoản */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#00e5a0] text-sm">{order.account_no || '07553046301'}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.account_no || '07553046301', 'Số tài khoản')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                {/* Tên chủ tài khoản */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="font-bold text-white uppercase">{order.account_name || 'TẠP HÓA 247'}</span>
                </div>

                {/* Số tiền */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400">Số tiền:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-sm">{order.total_amount.toLocaleString('vi-VN')} đ</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.total_amount.toString(), 'Số tiền')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                {/* Nội dung chuyển khoản */}
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-300 font-bold text-[11px]">Nội dung chuyển khoản (Bắt buộc):</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(order.memo || order.order_code, 'Nội dung chuyển khoản')}
                      className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-[10px] font-bold transition-all"
                    >
                      Sao chép mã
                    </button>
                  </div>
                  <div className="font-mono font-black text-rose-200 text-base tracking-wider bg-black/40 p-2 rounded text-center border border-rose-500/20">
                    {order.memo || order.order_code}
                  </div>
                  <p className="text-[10px] text-rose-300/80 italic">
                    ⚠️ Vui lòng ghi chính xác nội dung trên để hệ thống tự động nhận diện và giao acc tức thì!
                  </p>
                </div>
              </div>

              {/* Nút kiểm tra thủ công & Quay lại */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => loadOrder(false)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:from-[#00c4ff] hover:to-[#00e5a0] text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-[#00e5a0]/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>⚡</span> Tôi Đã Chuyển Khoản (Kiểm Tra Ngay)
                </button>
                <Link
                  href="/lich-su-don-hang"
                  className="w-full py-2 text-center bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition-all"
                >
                  ← Về Lịch Sử Đơn Hàng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TRƯỜNG HỢP 2: ĐƠN ĐÃ THANH TOÁN THÀNH CÔNG (PAID / COMPLETED) ───
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="hero-bg border-b border-slate-800/30 py-8 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[#00e5a0]/15">
            <div>
              <span className="badge badge-stock mb-2">
                ✓ ĐÃ THANH TOÁN THÀNH CÔNG
              </span>
              <h1 className="text-2xl font-black text-white">Đơn Hàng: <span className="gradient-text">{order.order_code}</span></h1>
              <p className="text-xs text-slate-400 mt-1">
                Khách hàng: <b className="text-white">{order.customer_name}</b> | Tổng tiền: <b className="price-tag">{order.total_amount.toLocaleString('vi-VN')} VNĐ</b>
              </p>
            </div>

            {/* Action Downloads */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void downloadOrderFile('txt')}
                className="btn-secondary !py-2 !px-3.5 text-xs"
              >
                📥 Tải File TXT
              </button>
              <button
                type="button"
                onClick={() => void downloadOrderFile('html')}
                className="btn-primary !py-2 !px-3.5 text-xs"
              >
                🎨 Tải HTML 3D
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Account Items List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Danh Sách Tài Khoản ({order.items_count} acc)
          </h2>
          <Link
            href={`/bao-hanh?order_code=${order.order_code}`}
            className="text-xs text-[#f59e0b] hover:underline font-semibold flex items-center gap-1"
          >
            🛡️ Bảo hành →
          </Link>
        </div>

        {order.items.map((item, idx) => {
          const d = item.parsed;
          const isValorant =
            item.category_slug === 'valorant' ||
            item.account_type === 'valo_acc' ||
            item.category_name?.toLowerCase() === 'valorant';
          const isTokenProduct = item.delivery_format === 'token' || item.product_name.toLowerCase().includes('token');
          const isCursor = item.product_name.toLowerCase().includes('cursor');
          const isCs2 =
            item.product_name.toLowerCase().includes('cs2') ||
            item.product_name.toLowerCase().includes('cs:go') ||
            item.product_name.toLowerCase().includes('steam') ||
            Boolean(item.raw_credentials && item.raw_credentials.includes('CS2-'));
          const isKeyType =
            item.delivery_format === 'key_loader' ||
            isCursor ||
            isCs2;
          const isLoginCredentials =
            !isValorant &&
            (item.delivery_format === 'raw_text' || (!item.delivery_format && !isTokenProduct)) &&
            Boolean(d?.username && d?.password);

          return (
            <div
              key={item.order_item_id}
              className="glass-card rounded-2xl p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#00e5a0]/10 text-[#00e5a0] text-xs font-mono font-bold">
                    #{idx + 1}
                  </span>
                  <h3 className="font-bold text-white text-base">{item.product_name}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">
                    Hạn BH: {item.warranty_expires_at ? new Date(item.warranty_expires_at).toLocaleString('vi-VN') : '—'}
                  </span>
                  <button
                    onClick={() => copyCreds(item, idx)}
                    className="btn-secondary !py-1.5 !px-3 text-xs"
                  >
                    {copiedIndex === idx ? '✓ Đã Chép!' : isKeyType ? 'Copy Key' : isValorant ? 'Copy TK:MK' : isTokenProduct ? 'Copy token' : 'Copy thông tin'}
                  </button>
                  {isCursor && (
                    <button
                      onClick={() => setCursorGuideKey(item.raw_credentials || null)}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>📖</span>
                      <span>Hướng dẫn</span>
                    </button>
                  )}
                  {isCs2 && (
                    <a
                      href="/downloads/SteamLoader.exe"
                      download="SteamLoader.exe"
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>🎮</span>
                      <span>Tải Loader CS2</span>
                    </a>
                  )}
                  {isValorant && !isKeyType && (
                    <button
                      onClick={() =>
                        setCheckAccItem({
                          orderCode: order.order_code,
                          position: item.position || idx + 1,
                          productName: item.product_name,
                          credentials: item.raw_credentials,
                          parsed: item.parsed,
                          canWarranty: item.is_warranty_valid,
                          replacementCount: item.replacement_count || 0,
                        })
                      }
                      className="px-3 py-1.5 bg-gradient-to-r from-[#7c3aed] to-[#00c4ff] text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-[#7c3aed]/20 flex items-center gap-1.5 active:scale-95 hover:shadow-lg"
                    >
                      <span>🔍</span>
                      <span>Check Acc</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Box Mã Kích Hoạt (Activation Key) */}
              {isKeyType ? (
                <div className={`p-4 rounded-2xl bg-[#070a12] border space-y-3 ${isCs2 ? 'border-amber-500/30' : 'border-purple-500/30'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                      <span>{isCs2 ? '🎮 MÃ KEY CS2 PRIME LOADER' : '🔑 MÃ KÍCH HOẠT (ACTIVATION KEY)'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.raw_credentials || '');
                          setCopiedIndex(idx);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === idx ? '✓ Đã Chép!' : '📋 Sao chép Key'}
                      </button>
                      {isCursor && (
                        <button
                          type="button"
                          onClick={() => setCursorGuideKey(item.raw_credentials || null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[#00c4ff] border border-cyan-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          📖 Xem Hướng Dẫn
                        </button>
                      )}
                      {isCs2 && (
                        <Link
                          href="/huong-dan/cs2"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          📖 Hướng Dẫn CS2
                        </Link>
                      )}
                    </div>
                  </div>
                  <pre className="p-3 bg-black/60 rounded-xl border border-white/5 font-mono text-xs text-[#00e5a0] whitespace-pre-wrap break-all select-all leading-relaxed">
                    {item.raw_credentials}
                  </pre>
                  {isCs2 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
                      <span>⚡ Mở SteamLoader, dán mã key trên và nhấn Enter để vào game.</span>
                      <a
                        href="/downloads/SteamLoader.exe"
                        download="SteamLoader.exe"
                        className="text-amber-400 hover:underline font-bold font-mono text-[11px]"
                      >
                        ⬇️ Tải file SteamLoader.exe
                      </a>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Exact Discord Bot Inventory Card for Game Accounts */}
              {isValorant && d ? (
                <div className="pt-2">
                  <ValorantInventoryCard
                    orderCode={order.order_code}
                    data={d as any}
                    rawCredentials={item.raw_credentials}
                    onDownloadHtml={() => {
                      void downloadOrderFile('html');
                    }}
                    showExportButtons={true}
                  />
                </div>
              ) : null}

              {!isKeyType && !isValorant && (
                <section className="rounded-xl border border-cyan-500/20 bg-[#050a14]/70 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-cyan-200">
                      {isTokenProduct ? 'Mã / token được giao' : 'Thông tin giao hàng'}
                    </h4>
                  </div>
                  {isLoginCredentials ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-slate-800 bg-black/40 p-3">
                        <div className="mb-1 text-[11px] text-slate-500">Tài khoản</div>
                        <div className="break-all font-mono text-sm text-slate-100 select-all">{d?.username}</div>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-black/40 p-3">
                        <div className="mb-1 text-[11px] text-slate-500">Mật khẩu</div>
                        <div className="break-all font-mono text-sm text-slate-100 select-all">{d?.password}</div>
                      </div>
                    </div>
                  ) : (
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-slate-800 bg-black/40 p-3 font-mono text-xs leading-relaxed text-slate-100 select-all">
                      {item.raw_credentials || 'Thông tin đang được cập nhật.'}
                    </pre>
                  )}
                  <p className="text-[11px] text-slate-500">Giữ nguyên định dạng do hệ thống giao để bạn sao chép và sử dụng chính xác.</p>
                </section>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Check Acc chuẩn Discord Bot */}
      {checkAccItem && (
        <CheckAccModal
          isOpen={!!checkAccItem}
          onClose={() => setCheckAccItem(null)}
          orderCode={checkAccItem.orderCode}
          position={checkAccItem.position}
          productName={checkAccItem.productName}
          rawCredentials={checkAccItem.credentials}
          parsedData={checkAccItem.parsed}
          canWarranty={checkAccItem.canWarranty}
          replacementCount={checkAccItem.replacementCount}
          onOpenWarranty={() => {
            window.location.href = `/bao-hanh?order_code=${checkAccItem.orderCode}`;
          }}
        />
      )}

      {/* Modal Hướng Dẫn Kích Hoạt Key Cursor AI (Chuẩn Bản Quyền Tạp Hóa 247) */}
      <CursorKeyGuideModal
        isOpen={!!cursorGuideKey}
        onClose={() => setCursorGuideKey(null)}
        activationKey={cursorGuideKey || ''}
      />
      </div>
    </div>
  );
}
