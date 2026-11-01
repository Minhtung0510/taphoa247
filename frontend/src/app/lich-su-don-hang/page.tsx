'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import { CheckAccModal, ParsedAccountData } from '@/components/account/CheckAccModal';
import { CursorKeyGuideModal } from '@/components/account/CursorKeyGuideModal';

interface ClaimItemDetail {
  claim_item_id: number;
  order_item_id: number;
  error_description: string;
  evidence_url?: string;
  replacement_credentials?: string;
}

interface OrderClaim {
  id: number;
  claim_code: string;
  status: string;
  state: string;
  status_badge: string;
  created_at: string;
  admin_reply?: string;
  admin_note?: string;
  replacement_credentials?: string;
  items?: ClaimItemDetail[];
}

interface OrderItemData {
  id: number;
  position: number;
  product_name: string;
  category_name: string;
  category_slug?: string;
  account_type?: string;
  delivery_format?: string;
  credentials?: string;
  parsed?: ParsedAccountData;
  warranty_duration_hours: number;
  warranty_expires_at?: string;
  is_warranty_valid: boolean;
  replacement_count: number;
  claim_info?: {
    claim_code: string;
    state: string;
    status: string;
    status_label: string;
    admin_note?: string;
    evidence_url?: string;
    replacement_credentials?: string;
  };
}

interface UserOrder {
  order_code: string;
  customer_name: string;
  customer_email?: string;
  total_amount: number;
  status: string;
  paid_at?: string;
  created_at: string;
  items_count: number;
  items: OrderItemData[];
  warranty_claims: OrderClaim[];
}

export default function LichSuDonHangPage() {
  const { user, token, authFetch, openAuthModal } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cursorGuideKey, setCursorGuideKey] = useState<string | null>(null);

  // Modal Check Acc chuẩn Discord Bot
  const [checkAccItem, setCheckAccItem] = useState<{
    orderCode: string;
    position: number;
    productName: string;
    credentials?: string;
    parsed?: ParsedAccountData;
    canWarranty?: boolean;
    replacementCount?: number;
    itemId?: number;
  } | null>(null);

  // Modal báo lỗi bảo hành nhanh
  const [claimModalItem, setClaimModalItem] = useState<{
    orderCode: string;
    itemId: number;
    productName: string;
  } | null>(null);
  const [claimReason, setClaimReason] = useState<string>('Sai mật khẩu không đăng nhập được');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimNotice, setClaimNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadOrders = async (silent = false) => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/user/orders`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    if (!token) return;

    // 1. Tự động đồng bộ mỗi 20 giây ngầm (silent)
    const interval = setInterval(() => {
      loadOrders(true);
    }, 20000);

    // 2. Tự động kiểm tra ngay khi người dùng chuyển lại tab (Focus)
    const onFocus = () => loadOrders(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOrders(true);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token]);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimModalItem) return;

    if (!evidenceFile) {
      setClaimNotice({
        type: 'error',
        msg: 'Vui lòng đính kèm ảnh chụp màn hình chứng minh lỗi tài khoản (Bắt buộc).',
      });
      return;
    }

    setClaimSubmitting(true);
    setClaimNotice(null);

    try {
      const formData = new FormData();
      formData.append('order_code', claimModalItem.orderCode);

      const itemsPayload = JSON.stringify([
        {
          order_item_id: claimModalItem.itemId,
          error_description: claimReason,
        },
      ]);
      formData.append('items', itemsPayload);
      formData.append('selected_items[]', claimModalItem.itemId.toString());
      formData.append(`reasons[${claimModalItem.itemId}]`, claimReason);
      formData.append('buyer_note', `Bảo hành tài khoản ${claimModalItem.productName} - Lý do: ${claimReason}`);
      formData.append('customer_contact', user?.email || user?.name || 'Khách hàng');
      formData.append('customer_note', `Yêu cầu bảo hành từ tài khoản người dùng: ${user?.name}`);

      // Gửi file minh chứng
      formData.append('files[]', evidenceFile);
      formData.append('file', evidenceFile);
      formData.append('evidence', evidenceFile);

      const res = await authFetch(`${API_BASE_URL}/warranty/claims`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Không thể gửi yêu cầu bảo hành');
      }

      setClaimNotice({
        type: 'success',
        msg: 'Yêu cầu bảo hành kèm ảnh minh chứng đã được gửi thành công! Admin sẽ duyệt và cấp acc mới ngay.',
      });

      // Reload orders to reflect updated status
      loadOrders();
      setTimeout(() => {
        setClaimModalItem(null);
        setEvidenceFile(null);
        setEvidencePreview(null);
        setClaimNotice(null);
      }, 2000);
    } catch (err: any) {
      setClaimNotice({ type: 'error', msg: err.message || 'Lỗi khi gửi yêu cầu' });
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-[#5865F2]/20 border border-emerald-500/30 flex items-center justify-center text-4xl mb-6 shadow-inner">
            🎮
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Lịch Sử Đơn Hàng & Kho Tài Khoản
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            Vui lòng đăng nhập bằng Email hoặc tài khoản Discord để tra cứu toàn bộ acc đã mua, thông tin đăng nhập và thời hạn bảo hành.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openAuthModal}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-[#5865F2] hover:opacity-90 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              <span>Đăng Nhập / Kết Nối Discord Ngay</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-all"
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = orders
    .filter((o) => o.status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const totalAccounts = orders
    .filter((o) => o.status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + (o.items?.length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Profile Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/80 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 text-2xl font-black flex items-center justify-center border-2 border-emerald-400/50">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{user.name}</h1>
              {user.discord_id ? (
                <span className="px-2.5 py-0.5 bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#5865F2] rounded-full text-[11px] font-bold">
                  Discord Verified
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full text-[11px] font-bold">
                  Member VIP
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Hệ thống bảo vệ Anti-DDoS & OWASP Shield kích hoạt</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full md:w-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center min-w-[100px]">
            <div className="text-lg font-black text-white">{orders.length}</div>
            <div className="text-[11px] text-slate-400">Đơn Hàng</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center min-w-[100px]">
            <div className="text-lg font-black text-emerald-400">{totalAccounts}</div>
            <div className="text-[11px] text-slate-400">Tài Khoản</div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center min-w-[120px]">
            <div className="text-lg font-black text-amber-400">
              {totalSpent.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-[11px] text-slate-400">Tổng Đã Chi</div>
          </div>
        </div>
      </div>

      {/* Title & Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📦</span> Danh Sách Đơn Hàng Đã Mua
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tất cả tài khoản kèm thông tin đăng nhập và hỗ trợ bảo hành 1 đổi 1
          </p>
        </div>
        <button
          onClick={() => loadOrders()}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <span>🔄</span> Làm mới
        </button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Đang tải lịch sử đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <span className="text-4xl block mb-3">🛒</span>
          <h3 className="text-lg font-bold text-white mb-1">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
            Bạn chưa thực hiện đơn hàng nào trên Tạp Hóa 247. Khám phá kho acc game hot giá rẻ nhận ngay sau 3 giây!
          </p>
          <Link
            href="/valorant"
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 transition-all"
          >
            <span>🎯</span> Mua Acc Valorant Ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const isPaid = order.status === 'paid' || order.status === 'completed' || order.status === 'processing';
            const isProcessing = order.status === 'processing';
            const isCancelled = order.status === 'cancelled';
            const isExpired = order.status === 'expired';

            return (
              <div
                key={order.order_code}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-xl transition-all"
              >
                {/* Order Card Header */}
                <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🎮</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm sm:text-base">
                          {order.order_code}
                        </span>
                        {isProcessing ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Đã nhận tiền · Đang giao
                          </span>
                        ) : isPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Đã Thanh Toán
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            Đã Hủy / Từ Chối
                          </span>
                        ) : isExpired ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Đã Hết Hạn
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            Chờ Thanh Toán
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Ngày tạo: {order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : 'Vừa xong'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-400">
                        {order.total_amount.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {order.items?.length || 0} tài khoản
                      </div>
                    </div>
                    {order.status === 'pending' ? (
                      <Link
                        href={`/don-hang/${order.order_code}`}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 animate-pulse"
                      >
                        ⚡ Thanh toán ngay →
                      </Link>
                    ) : isCancelled ? (
                      <Link
                        href={`/don-hang/${order.order_code}`}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition-all"
                      >
                        Chi tiết đơn →
                      </Link>
                    ) : (
                      <Link
                        href={`/don-hang/${order.order_code}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all"
                      >
                        Chi tiết đơn →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Items in order */}
                <div className="p-4 sm:p-5 space-y-4">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => {
                      const copyKey = `${order.order_code}_${item.id}`;
                      const isCopied = copiedId === copyKey;
                      const isValorant = item.category_slug === 'valorant' || item.account_type === 'valo_acc' || item.category_name?.toLowerCase() === 'valorant';
                      const isTokenProduct = item.delivery_format === 'token' || item.product_name.toLowerCase().includes('token');
                      const isCursor = item.product_name.toLowerCase().includes('cursor');
                      const isCs2 = item.product_name.toLowerCase().includes('cs2') || item.product_name.toLowerCase().includes('cs:go') || item.product_name.toLowerCase().includes('steam');
                      const isKey = item.delivery_format === 'key_loader' || isCursor || isCs2;
                      const isLoginCredentials = !isValorant && !isTokenProduct && (item.delivery_format === 'raw_text' || !item.delivery_format) && Boolean(item.parsed?.username && item.parsed?.password);

                      // Check if there is an active claim for this order
                      const relatedClaim = order.warranty_claims?.[0];
                      const claimInfo = item.claim_info || (relatedClaim ? {
                        state: relatedClaim.state || relatedClaim.status,
                        status: relatedClaim.status || relatedClaim.state,
                        status_label: relatedClaim.status_badge || 'Bảo hành',
                        admin_note: relatedClaim.admin_reply,
                      } : null);

                      return (
                        <div
                          key={item.id || idx}
                          className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold">
                                Acc #{item.position || idx + 1}
                              </span>
                              <h4 className="font-bold text-white text-sm">
                                {item.product_name}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({item.category_name})
                              </span>
                            </div>

                            {/* Credentials box */}
                            {item.credentials ? (
                              <div className="w-full space-y-2 pt-1">
                                {!isValorant && !isKey ? (
                                  <div className="rounded-lg border border-cyan-500/20 bg-slate-900/80 p-3 space-y-2">
                                    <div className="text-[11px] font-semibold text-cyan-200">
                                      {isTokenProduct ? 'Mã / token được giao' : 'Thông tin giao hàng'}
                                    </div>
                                    {isLoginCredentials ? (
                                      <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="rounded-md bg-black/30 p-2"><div className="text-[10px] text-slate-500">Tài khoản</div><div className="break-all font-mono text-xs text-slate-100 select-all">{item.parsed?.username}</div></div>
                                        <div className="rounded-md bg-black/30 p-2"><div className="text-[10px] text-slate-500">Mật khẩu</div><div className="break-all font-mono text-xs text-slate-100 select-all">{item.parsed?.password}</div></div>
                                      </div>
                                    ) : (
                                      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-black/30 p-2 font-mono text-xs text-slate-100 select-all">{item.credentials}</pre>
                                    )}
                                  </div>
                                ) : (
                                  <div className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border px-3 py-1.5 font-mono text-xs select-all ${isValorant ? 'border-slate-700 bg-slate-900 text-amber-300' : 'border-amber-500/20 bg-slate-900 text-amber-200'}`}>
                                    {item.credentials}
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(item.credentials || '', copyKey)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isCopied ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}`}
                                  >
                                    {isCopied ? '✓ Đã Chép' : isKey ? 'Sao chép Key' : isValorant ? 'Sao chép TK:MK' : isTokenProduct ? 'Sao chép token' : 'Sao chép toàn bộ'}
                                  </button>
                                  {isCursor && (
                                    <button type="button" onClick={() => setCursorGuideKey(item.credentials || null)} className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
                                      <span>📖</span><span>Hướng dẫn</span>
                                    </button>
                                  )}
                                  {isValorant && !isKey && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const canW = item.is_warranty_valid && item.replacement_count < 3 && (!claimInfo || (claimInfo.state !== 'waiting_admin' && claimInfo.status !== 'waiting_admin'));
                                        setCheckAccItem({ orderCode: order.order_code, position: item.position || idx + 1, productName: item.product_name, credentials: item.credentials, parsed: item.parsed, canWarranty: canW, replacementCount: item.replacement_count, itemId: item.id });
                                      }}
                                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                                    >
                                      <span>🔍</span><span>Check Acc</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-500 italic">
                                Thông tin tài khoản sẽ hiển thị sau khi hoàn tất thanh toán.
                              </div>
                            )}

                            {/* Warranty expiration timer & attempts */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                              {item.warranty_expires_at ? (
                                <div className="flex items-center gap-1">
                                  <span>🛡️ Hạn bảo hành:</span>
                                  <b className={item.is_warranty_valid ? 'text-emerald-400' : 'text-slate-500'}>
                                    {new Date(item.warranty_expires_at).toLocaleString('vi-VN')}
                                  </b>
                                  {item.is_warranty_valid ? (
                                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">
                                      Còn bảo hành
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 bg-slate-800 text-slate-500 rounded text-[10px]">
                                      Đã hết hạn
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span>🛡️ Bảo hành: {item.warranty_duration_hours || 2} giờ</span>
                              )}

                              <div className="flex items-center gap-1 font-mono text-[10px]">
                                <span className="text-slate-500">•</span>
                                <span>Lượt bảo hành:</span>
                                <b className={item.replacement_count > 0 ? 'text-amber-400' : 'text-slate-300'}>
                                  {item.replacement_count}/3
                                </b>
                                {item.replacement_count === 2 && (
                                  <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded font-bold">
                                    Lượt 3: Admin check tay
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Warranty Action button / Claim Status */}
                          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                            {claimInfo && (claimInfo.state === 'waiting_admin' || claimInfo.status === 'waiting_admin') ? (
                              <div className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse flex items-center gap-1.5 shadow-sm">
                                <span>⏳ Đang Chờ Shop Duyệt (Lượt {item.replacement_count + 1})</span>
                              </div>
                            ) : item.replacement_count > 0 && item.replacement_count < 3 && item.is_warranty_valid ? (
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                                  ✓ Đã Đổi Lượt {item.replacement_count}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEvidenceFile(null);
                                    setEvidencePreview(null);
                                    setClaimNotice(null);
                                    setClaimModalItem({
                                      orderCode: order.order_code,
                                      itemId: item.id,
                                      productName: `${item.product_name} (Lượt đổi ${item.replacement_count + 1}/3)`,
                                    });
                                  }}
                                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                >
                                  <span>🛡️</span>
                                  <span>Báo Lỗi Acc Bù (Lượt {item.replacement_count + 1}/3)</span>
                                </button>
                              </div>
                            ) : item.replacement_count === 0 && item.is_warranty_valid ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEvidenceFile(null);
                                  setEvidencePreview(null);
                                  setClaimNotice(null);
                                  setClaimModalItem({
                                    orderCode: order.order_code,
                                    itemId: item.id,
                                    productName: item.product_name,
                                  });
                                }}
                                className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                              >
                                <span>🛡️</span>
                                <span>Báo Lỗi / Đổi Acc</span>
                              </button>
                            ) : item.replacement_count >= 3 ? (
                              <span className="text-xs text-rose-400 font-semibold px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                                ✕ Hết 3 lượt bảo hành
                              </span>
                            ) : !isPaid ? (
                              <span className={`text-xs px-3 py-1.5 font-medium ${isCancelled ? 'text-rose-400/80 font-bold' : isExpired ? 'text-slate-500' : 'text-amber-400/80'}`}>
                                {isCancelled ? 'Đơn đã hủy' : isExpired ? 'Đơn đã hết hạn' : 'Chờ thanh toán'}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 px-3 py-1.5">
                                Hết hạn bảo hành
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 italic">Đang cập nhật danh sách...</div>
                  )}

                  {/* Replacement credentials if approved claim */}
                  {order.warranty_claims?.some((c) => (c.state === 'approved' || c.status === 'approved') && c.replacement_credentials) && (
                    <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl space-y-3 mt-3 shadow-lg">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                          <span className="text-xl">🎁</span>
                          <span>TÀI KHOẢN ĐỔI MỚI CỦA BẠN (ĐÃ DUYỆT BẢO HÀNH):</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded-full border border-emerald-500/30">
                          Trạng thái: Đã Cấp Bù Acc Mới
                        </span>
                      </div>

                      {order.warranty_claims
                        .filter((c) => c.replacement_credentials)
                        .map((c, cIdx) => (
                          <div key={c.id || cIdx} className="space-y-2 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
                              <span>Mã đơn bảo hành: <b className="text-amber-400 font-mono">{c.claim_code}</b></span>
                              {c.admin_reply && (
                                <span className="text-slate-400 text-[11px] italic">Ghi chú của Shop: "{c.admin_reply}"</span>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              <pre className="px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-xs select-all flex-1 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                                {c.replacement_credentials}
                              </pre>
                              <button
                                onClick={() => copyToClipboard(c.replacement_credentials || '', `rep_${c.id}`)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                                  copiedId === `rep_${c.id}`
                                    ? 'bg-emerald-400 text-slate-950'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                                }`}
                              >
                                {copiedId === `rep_${c.id}` ? '✓ Đã Sao Chép' : 'Sao Chép TK:MK Mới'}
                              </button>
                            </div>

                            {c.items?.some((it) => it.evidence_url) && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-800/80">
                                <span>📸 Minh chứng đã gửi:</span>
                                {c.items.filter((it) => it.evidence_url).map((it, idx) => (
                                  <a
                                    key={idx}
                                    href={it.evidence_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-400 underline hover:text-emerald-300 font-semibold"
                                  >
                                    Xem ảnh lỗi đã tải lên ↗
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Báo Lỗi Bảo Hành Nhanh */}
      {claimModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setClaimModalItem(null);
                setEvidenceFile(null);
                setEvidencePreview(null);
                setClaimNotice(null);
              }}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-bold text-white text-base">Yêu Cầu Bảo Hành 1 Đổi 1</h3>
                <p className="text-xs text-slate-400">Đơn hàng: {claimModalItem.orderCode}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl mb-4 text-xs text-slate-300">
              <span className="text-slate-400 block mb-0.5">Sản phẩm cần đổi:</span>
              <b className="text-white">{claimModalItem.productName}</b>
            </div>

            {claimNotice && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs ${
                  claimNotice.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}
              >
                {claimNotice.msg}
              </div>
            )}

            <form onSubmit={handleQuickClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lý do tài khoản bị lỗi:
                </label>
                <select
                  value={claimReason}
                  onChange={(e) => setClaimReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  <option value="Sai mật khẩu không đăng nhập được">Sai mật khẩu không đăng nhập được</option>
                  <option value="Tài khoản bị cấm / khoá (Banned / Suspended)">Tài khoản bị cấm / khoá</option>
                  <option value="Tài khoản bị người khác đăng nhập (Chủ onl)">Bị người khác đăng nhập (Chủ onl)</option>
                  <option value="Sai thông tin rank / level so với mô tả">Sai thông tin rank / skin</option>
                  <option value="Lý do khác">Lý do khác</option>
                </select>
              </div>

              {/* Upload ảnh minh chứng (Bắt buộc) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span>📸</span>
                    <span>Hình ảnh minh chứng acc bị lỗi (Bắt buộc):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">PNG, JPG tối đa 25MB</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setEvidenceFile(file);
                    if (file) {
                      setEvidencePreview(URL.createObjectURL(file));
                    } else {
                      setEvidencePreview(null);
                    }
                  }}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 file:cursor-pointer cursor-pointer bg-slate-950 border border-slate-700 rounded-xl p-1.5 focus:outline-none focus:border-emerald-400"
                />

                {evidencePreview ? (
                  <div className="mt-2 relative rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950">
                    <img src={evidencePreview} alt="Minh chứng" className="w-full h-32 object-cover rounded-lg" />
                    <div className="absolute top-1.5 right-1.5 bg-slate-950/80 backdrop-blur px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold border border-emerald-500/30">
                      ✓ Đã chọn ảnh
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 italic">
                    * Vui lòng chụp rõ màn hình game báo sai mật khẩu / bị cấm để Shop đối soát và duyệt cấp bù acc mới ngay.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setClaimModalItem(null);
                    setEvidenceFile(null);
                    setEvidencePreview(null);
                    setClaimNotice(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {claimSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Bảo Hành'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            if (checkAccItem.itemId) {
              setEvidenceFile(null);
              setEvidencePreview(null);
              setClaimNotice(null);
              setClaimModalItem({
                orderCode: checkAccItem.orderCode,
                itemId: checkAccItem.itemId,
                productName: `${checkAccItem.productName} (Lượt đổi ${(checkAccItem.replacementCount || 0) + 1}/3)`,
              });
            }
          }}
        />
      )}

      {/* Modal Hướng Dẫn Kích Hoạt Key Cursor AI */}
      <CursorKeyGuideModal
        isOpen={!!cursorGuideKey}
        onClose={() => setCursorGuideKey(null)}
        activationKey={cursorGuideKey || ''}
      />
    </div>
  );
}
