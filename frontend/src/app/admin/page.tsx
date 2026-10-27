'use client';

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function AdminPage() {
  const [token, setToken] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@dtffshop.com');
  const [password, setPassword] = useState('password123');

  const [tab, setTab] = useState<'dashboard' | 'products' | 'stock' | 'orders' | 'warranty'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);

  // State nạp kho
  const [importProductId, setImportProductId] = useState<number>(1);
  const [importText, setImportText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // State sửa giá
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  // Đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success && json.data.token) {
        setToken(json.data.token);
        setIsLoggedIn(true);
        localStorage.setItem('admin_token', json.data.token);
      } else {
        alert(json.message || 'Sai thông tin đăng nhập.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const loadData = () => {
    if (!token) return;

    fetch(`${API_BASE_URL}/admin/dashboard`, { headers: authHeaders })
      .then((r) => r.json())
      .then((j) => j.success && setDashboardData(j.data));

    fetch(`${API_BASE_URL}/admin/products`, { headers: authHeaders })
      .then((r) => r.json())
      .then((j) => j.success && setProducts(j.data));

    fetch(`${API_BASE_URL}/admin/orders`, { headers: authHeaders })
      .then((r) => r.json())
      .then((j) => j.success && setOrders(j.data.data || []));

    fetch(`${API_BASE_URL}/admin/warranty`, { headers: authHeaders })
      .then((r) => r.json())
      .then((j) => j.success && setClaims(j.data.data || []));
  };

  useEffect(() => {
    const saved = localStorage.getItem('admin_token');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && token) {
      loadData();
    }
  }, [isLoggedIn, token]);

  // Cập nhật giá
  const handleSavePrice = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}/price`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ price: newPrice }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setEditingPriceId(null);
        loadData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Nạp kho
  const handleImportStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/stock/import`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          product_id: importProductId,
          raw_text: importText,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setImportStatus(json.message);
        setImportText('');
        loadData();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Duyệt đơn thủ công
  const handleForceComplete = async (code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn duyệt thanh toán cho đơn ${code}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${code}/force-complete`, {
        method: 'POST',
        headers: authHeaders,
      });
      const json = await res.json();
      alert(json.message);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="text-center">
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-black text-white mt-2">Đăng Nhập Quản Trị DTFF</h1>
          <p className="text-xs text-slate-400 mt-1">Dành riêng cho Quản Trị Viên hệ thống</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Quản Trị</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mật Khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white p-3 rounded-xl text-sm outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition-all"
          >
            Đăng Nhập Quản Trị
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-bold">DTFF SHOP ADMIN PORTAL</span>
          <h1 className="text-2xl font-black text-white">Bảng Điều Khiển Quản Trị</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs"
          >
            🔄 Làm mới dữ liệu
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('admin_token');
              setIsLoggedIn(false);
            }}
            className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setTab('dashboard')}
          className={`pb-3 ${tab === 'dashboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
        >
          📊 Tổng Quan
        </button>
        <button
          onClick={() => setTab('products')}
          className={`pb-3 ${tab === 'products' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
        >
          🏷️ Quản Lý Giá ({products.length})
        </button>
        <button
          onClick={() => setTab('stock')}
          className={`pb-3 ${tab === 'stock' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
        >
          📦 Nạp Kho Acc
        </button>
        <button
          onClick={() => setTab('orders')}
          className={`pb-3 ${tab === 'orders' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
        >
          🛒 Đơn Hàng ({orders.length})
        </button>
        <button
          onClick={() => setTab('warranty')}
          className={`pb-3 ${tab === 'warranty' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'}`}
        >
          🛡️ Bảo Hành ({claims.length})
        </button>
      </div>

      {/* Tab 1: Dashboard Overview */}
      {tab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 block font-mono">DOANH THU THỰC</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {dashboardData.total_revenue.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 block font-mono">ĐƠN ĐÃ GIAO</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {dashboardData.completed_orders} / {dashboardData.total_orders}
              </div>
            </div>
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 block font-mono">TỒN KHO KHẢ DỤNG</span>
              <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                {dashboardData.total_stock} acc
              </div>
            </div>
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-400 block font-mono">BẢO HÀNH CHỜ DUYỆT</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {dashboardData.pending_claims} đơn
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sửa Giá Sản Phẩm */}
      {tab === 'products' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Bảng Giá Sản Phẩm Trực Tuyến</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Tên Sản Phẩm</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Tồn Kho</th>
                  <th className="py-3 px-4">Giá Hiện Tại</th>
                  <th className="py-3 px-4">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 text-white font-bold">{p.name}</td>
                    <td className="py-3 px-4 text-slate-400">{p.account_type}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{p.available_stock} acc</td>
                    <td className="py-3 px-4 text-amber-400 font-bold">
                      {editingPriceId === p.id ? (
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          className="bg-slate-950 border border-emerald-500 rounded p-1 text-white w-28"
                        />
                      ) : (
                        `${p.price.toLocaleString('vi-VN')} đ`
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingPriceId === p.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePrice(p.id)}
                            className="px-2 py-1 bg-emerald-600 text-white rounded font-bold"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="px-2 py-1 bg-slate-800 text-slate-400 rounded"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPriceId(p.id);
                            setNewPrice(p.price);
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold"
                        >
                          Sửa giá
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Nạp Kho Acc */}
      {tab === 'stock' && (
        <form onSubmit={handleImportStock} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 max-w-2xl">
          <h2 className="text-base font-bold text-white">Nạp Thêm Tài Khoản Vào Kho</h2>

          {importStatus && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs">
              ✓ {importStatus}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Chọn Sản Phẩm</label>
            <select
              value={importProductId}
              onChange={(e) => setImportProductId(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-sm outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Hiện có: {p.available_stock} acc)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Dán Danh Sách Acc (Mỗi dòng 1 acc hoặc dạng khối log ---------------------------)
            </label>
            <textarea
              rows={8}
              placeholder="user1:pass1&#10;user2:pass2"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs font-mono outline-none focus:border-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm"
          >
            📦 Nạp Kho Ngay (Mã hóa AES-256)
          </button>
        </form>
      )}

      {/* Tab 4: Danh Sách Đơn Hàng */}
      {tab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Danh Sách Đơn Hàng Gần Đây</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800 font-mono">
                <tr>
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Tổng Tiền</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{o.order_code}</td>
                    <td className="py-3 px-4 text-white">{o.customer_name}</td>
                    <td className="py-3 px-4 text-amber-400">{o.total_amount.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        o.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : o.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {o.status === 'pending' && (
                        <button
                          onClick={() => handleForceComplete(o.order_code)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px]"
                        >
                          Duyệt đơn
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
