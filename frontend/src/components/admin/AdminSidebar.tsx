'use client';

import React from 'react';
import Link from 'next/link';

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  counts: {
    products: number;
    orders: number;
    claims: number;
    coupons: number;
  };
  storeName?: string;
  userEmail?: string;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  count?: number;
  alert?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  counts,
  storeName = 'Tạp Hóa 247',
  userEmail,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}: AdminSidebarProps) {
  const navSections: NavSection[] = [
    {
      title: 'BÁO CÁO & PHÂN TÍCH',
      items: [
        { id: 'dashboard', label: 'Tổng Quan', icon: '📊' },
        { id: 'revenue', label: 'Bảng Doanh Thu', icon: '💰', badge: 'Live', badgeColor: 'bg-[#00e5a0]/15 text-[#00e5a0]' },
      ],
    },
    {
      title: 'KHO HÀNG & BẢNG GIÁ',
      items: [
        { id: 'products', label: 'Quản Lý Sản Phẩm', icon: '🏷️', count: counts.products },
        { id: 'stock', label: 'Nạp Kho Acc', icon: '📦' },
      ],
    },

    {
      title: 'GIAO DỊCH & CSKH',
      items: [
        { id: 'orders', label: 'Đơn Hàng', icon: '🛒', count: counts.orders },
        {
          id: 'warranty',
          label: 'Bảo Hành',
          icon: '🛡️',
          count: counts.claims,
          alert: counts.claims > 0,
        },
        { id: 'coupons', label: 'Mã Giảm Giá', icon: '🎁', count: counts.coupons },
      ],
    },
    {
      title: 'HỆ THỐNG',
      items: [
        { id: 'users', label: 'Quản Lý Người Dùng', icon: '👥' },
        { id: 'audit', label: 'Nhật Ký Thao Tác', icon: '🧾' },
        { id: 'settings', label: 'Cấu Hình Shop', icon: '⚙️' },
      ],
    },
  ];

  const handleSelect = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 w-64 sm:w-72 bg-[#090e1a] border-r border-[#1a2338] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } h-screen overflow-y-auto select-none`}
      >
        {/* SIDEBAR HEADER: LOGO & STATUS */}
        <div className="p-5 border-b border-[#1a2338]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00e5a0] via-[#00c4ff] to-[#7c3aed] p-0.5 shadow-lg shadow-[#00e5a0]/15 shrink-0">
                <div className="w-full h-full bg-[#050a14] rounded-[14px] overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/chatbot-avatar.png"
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#00e5a0] rounded-full border-2 border-[#090e1a] shadow-sm shadow-[#00e5a0]" />
              </div>

              <div className="min-w-0">
                <h1 className="text-sm font-black text-white tracking-tight truncate">
                  {storeName}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e5a0] animate-ping shrink-0" />
                  <span className="text-[10px] font-mono text-[#00e5a0] font-bold uppercase tracking-wider">
                    PORTAL ADMIN 2.0
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* NAVIGATION SECTIONS */}
        <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {section.title}
              </div>

              {section.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] shadow-lg shadow-[#00e5a0]/20 font-black scale-[1.01]'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-base group-hover:scale-110 transition-transform ${isActive ? 'scale-110' : ''}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase ${
                            isActive ? 'bg-[#050a14]/20 text-[#050a14]' : item.badgeColor
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {typeof item.count === 'number' && (
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-[#050a14]/20 text-[#050a14]'
                              : item.alert
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* SIDEBAR FOOTER: USER PROFILE & ACTIONS */}
        <div className="p-4 border-t border-[#1a2338] bg-[#070b14]/70 space-y-3">
          {/* Admin User info card */}
          <div className="p-2.5 rounded-xl bg-[#0d1424] border border-[#1e293b] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-[#00e5a0] text-[#050a14] font-black text-xs flex items-center justify-center shrink-0">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-white truncate font-mono">
                {userEmail || 'admin@taphoa247.io.vn'}
              </div>
              <div className="text-[9px] text-[#00e5a0] font-mono font-semibold flex items-center gap-1">
                <span>🛡️ Super Admin</span>
              </div>
            </div>
          </div>

          {/* Quick External Links & Logout */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
              title="Mở giao diện bán hàng cho khách"
            >
              <span>🌐</span>
              <span>Xem Shop</span>
            </Link>

            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              title="Đăng xuất khỏi trang quản trị"
            >
              <span>🚪</span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
