'use client';

import React from 'react';

interface AdminSettingsViewProps {
  settingsData: any;
  setSettingsData: React.Dispatch<React.SetStateAction<any>>;
  handleSaveSettings: (e: React.FormEvent) => void;
  savingSettings: boolean;
  settingsSaveMsg: string | null;
  coupons: any[];
  onNavigateTab: (tab: string) => void;
}

export function AdminSettingsView({
  settingsData,
  setSettingsData,
  handleSaveSettings,
  savingSettings,
  settingsSaveMsg,
  coupons,
  onNavigateTab,
}: AdminSettingsViewProps) {
  return (
    <form onSubmit={handleSaveSettings} className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      {/* ══════════════════════════════════════════════════════════
          1. HEADER BANNER
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5a0] via-[#00c4ff] to-[#7c3aed]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[#00e5a0] text-[11px] font-mono font-bold uppercase mb-2">
              <span>⚙️ HỆ THỐNG CẤU HÌNH TRỰC TUYẾN</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Cấu Hình Toàn Diện Cửa Hàng (Shop Settings)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Các thiết lập sẽ có hiệu lực trực tiếp trên website ngay khi lưu mà không cần khởi động lại máy chủ
            </p>
          </div>

          {settingsSaveMsg && (
            <div className="text-xs font-bold text-[#00e5a0] bg-[#00e5a0]/10 px-4 py-2.5 rounded-2xl border border-[#00e5a0]/30 animate-pulse flex items-center gap-2 shrink-0">
              <span>✓</span>
              <span>{settingsSaveMsg}</span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. SETTINGS SECTIONS
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nhóm 1: Thông tin thương hiệu */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#00e5a0] uppercase tracking-wider flex items-center gap-2">
            <span>🏷️</span> 1. Thông Tin Thương Hiệu
          </h3>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tên Cửa Hàng</label>
            <input
              type="text"
              value={settingsData.store_name || ''}
              onChange={(e) => setSettingsData({ ...settingsData, store_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Slogan Tiêu Đề</label>
            <input
              type="text"
              value={settingsData.store_slogan || ''}
              onChange={(e) => setSettingsData({ ...settingsData, store_slogan: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>
        </div>

        {/* Nhóm 2: Kênh CSKH & Mạng xã hội */}
        <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#00e5a0] uppercase tracking-wider flex items-center gap-2">
            <span>📞</span> 2. Kênh Chăm Sóc Khách Hàng
          </h3>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Số Hotline / Zalo</label>
            <input
              type="text"
              value={settingsData.store_hotline || ''}
              onChange={(e) => setSettingsData({ ...settingsData, store_hotline: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Link Telegram Hỗ Trợ</label>
            <input
              type="text"
              value={settingsData.store_telegram || ''}
              onChange={(e) => setSettingsData({ ...settingsData, store_telegram: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Link Fanpage Facebook</label>
            <input
              type="text"
              value={settingsData.store_facebook || ''}
              onChange={(e) => setSettingsData({ ...settingsData, store_facebook: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>
        </div>

        {/* Nhóm 3: Banner Thông Báo & Hộp Quà 3D (Full Width) */}
        <div className="md:col-span-2 bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="text-xs font-mono font-bold text-[#00c4ff] uppercase tracking-wider flex items-center gap-2">
            <span>📢</span> 3. Banner Chạy Chữ Đầu Trang & Hộp Quà May Mắn 3D (Sườn Trái)
          </h3>

          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#050a14] border border-[#1e293b]">
            <input
              type="checkbox"
              id="banner_active"
              checked={Boolean(settingsData.banner_active)}
              onChange={(e) => setSettingsData({ ...settingsData, banner_active: e.target.checked })}
              className="w-4 h-4 rounded text-[#00e5a0] bg-[#12151c] border-[#1e293b] cursor-pointer"
            />
            <label htmlFor="banner_active" className="text-xs text-white font-medium cursor-pointer">
              Bật thanh banner thông báo chạy chữ trên đầu website & 2 bên sườn (Đồng bộ thời gian thực)
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nội Dung Chữ Chạy</label>
            <textarea
              rows={2}
              value={settingsData.banner_text || ''}
              onChange={(e) => setSettingsData({ ...settingsData, banner_text: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>

          {/* Cấu hình Hộp Quà May Mắn 3D */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-[#050a14] border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>🎁</span> MÃ GIẢM GIÁ GẮN VÀO HỘP QUÀ 3D (BANNER SƯỜN TRÁI)
              </span>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 font-bold">
                Tự Động Copy & Áp Dụng
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Chọn Mã Giảm Giá Kèm Theo
                </label>
                <select
                  value={settingsData.banner_gift_code || ''}
                  onChange={(e) => {
                    const code = e.target.value;
                    const c = coupons.find((x) => x.code === code);
                    let discountText = '';
                    if (c) {
                      discountText =
                        c.discount_type === 'percent'
                          ? `Giảm ${c.discount_value}%${c.max_discount_amount ? ` (tối đa ${Number(c.max_discount_amount).toLocaleString('vi-VN')}đ)` : ''}`
                          : `Giảm ${Number(c.discount_value).toLocaleString('vi-VN')}đ`;
                      if (c.description) discountText += ` - ${c.description}`;
                    }
                    setSettingsData({
                      ...settingsData,
                      banner_gift_code: code,
                      banner_gift_discount_text: discountText,
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white font-mono outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- Không chọn mã nào --</option>
                  {coupons.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — ({c.discount_type === 'percent' ? `Giảm ${c.discount_value}%` : `Giảm ${c.discount_value.toLocaleString('vi-VN')}đ`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Dòng Chữ Ưu Đãi Hiển Thị Trong Hộp Quà
                </label>
                <input
                  type="text"
                  value={settingsData.banner_gift_discount_text || ''}
                  onChange={(e) => setSettingsData({ ...settingsData, banner_gift_discount_text: e.target.value })}
                  placeholder="VD: Giảm 100% (tối đa 50.000đ) - QUÀ TẶNG THÀNH VIÊN"
                  className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-[#00e5a0] font-semibold outline-none focus:border-[#00e5a0]"
                />
              </div>
            </div>

            {/* Live Preview Mini Card */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">🎁</span>
                <div>
                  <div className="text-[10px] text-amber-300/80 font-mono uppercase">
                    XEM TRƯỚC DIỆN MẠO HỘP QUÀ SAU KHI LƯU:
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-mono font-black text-amber-300 text-sm tracking-wider bg-black/60 px-2 py-0.5 rounded border border-amber-400/30">
                      {settingsData.banner_gift_code || 'TAPHOA247'}
                    </span>
                    <span className="text-[#00e5a0] font-bold text-xs truncate">
                      {settingsData.banner_gift_discount_text || 'Giảm giá đơn hàng'}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30 font-bold shrink-0">
                ✓ TỰ ĐỘNG ĐỒNG BỘ
              </span>
            </div>
          </div>
        </div>

        {/* Nhóm 4: Tim Thật & Chế Độ Bảo Trì */}
        <div className="md:col-span-2 bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#00e5a0] uppercase tracking-wider flex items-center gap-2">
            <span>🛡️</span> 4. Trạng Thái Hoạt Động & Tim Thật
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Số Lượt Thả Tim Thật (CSDL)
              </label>
              <input
                type="number"
                min="0"
                value={settingsData.store_real_hearts ?? 0}
                onChange={(e) => setSettingsData({ ...settingsData, store_real_hearts: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-[#050a14] border border-[#1e293b] rounded-xl text-xs text-white font-mono outline-none focus:border-[#00e5a0]"
              />
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 self-end">
              <input
                type="checkbox"
                id="maintenance_mode"
                checked={Boolean(settingsData.store_maintenance_mode)}
                onChange={(e) => setSettingsData({ ...settingsData, store_maintenance_mode: e.target.checked })}
                className="w-4 h-4 rounded text-rose-500 bg-[#12151c] border-[#1e293b] cursor-pointer"
              />
              <label htmlFor="maintenance_mode" className="text-xs text-rose-300 font-medium cursor-pointer">
                Bật chế độ bảo trì toàn website (Khách không thể đặt hàng)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. STICKY SAVE BAR AT BOTTOM
         ══════════════════════════════════════════════════════════ */}
      <div className="sticky bottom-6 z-30 p-4 bg-[#080d19]/95 backdrop-blur-xl border border-[#1e293b] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="text-xs text-slate-400">
          {settingsSaveMsg ? (
            <span className="text-[#00e5a0] font-bold flex items-center gap-2">
              <span>✓</span> {settingsSaveMsg}
            </span>
          ) : (
            <span>Nhấn nút bên phải để áp dụng toàn bộ cấu hình mới cho cửa hàng.</span>
          )}
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:brightness-110 text-[#050a14] rounded-xl text-xs font-black transition-all shadow-xl shadow-[#00e5a0]/30 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {savingSettings ? 'ĐANG LƯU CẤU HÌNH...' : '💾 LƯU CẤU HÌNH CỬA HÀNG NGAY'}
        </button>
      </div>
    </form>
  );
}
