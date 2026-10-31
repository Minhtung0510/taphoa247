'use client';

import React, { useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { ValorantInventoryCard } from './ValorantInventoryCard';

export interface ParsedAccountData {
  username: string;
  password?: string;
  riot_id?: string;
  region?: string;
  rank?: string;
  peak_rank?: string;
  level?: number;
  vp?: number;
  rp?: number;
  kc?: number;
  email_verified?: boolean;
  phone_verified?: boolean;
  last_game?: string;
  skins_count?: number;
  knives?: string[];
  weapons?: Array<{
    name: string;
    type: string;
    tier: string;
  }>;
  is_cs?: boolean;
  raw?: string;
}

interface CheckAccModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderCode: string;
  position: number;
  productName: string;
  rawCredentials?: string;
  parsedData?: ParsedAccountData;
  onOpenWarranty?: () => void;
  canWarranty?: boolean;
  replacementCount?: number;
}

export function CheckAccModal({
  isOpen,
  onClose,
  orderCode,
  position,
  productName,
  rawCredentials,
  parsedData,
  onOpenWarranty,
  canWarranty,
  replacementCount = 0,
}: CheckAccModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRawLog, setShowRawLog] = useState(false);

  if (!isOpen) return null;

  const d = parsedData || {
    username: '',
    password: '',
    riot_id: '',
    rank: 'Unranked',
    peak_rank: 'Unranked',
    level: 1,
    skins_count: 0,
    knives: [],
    weapons: [],
  };

  const copyCreds = () => {
    const text = d.username && d.password ? `${d.username}:${d.password}` : rawCredentials || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-indigo-500/20 border border-[#00f59b]/40 flex items-center justify-center text-xl shadow-inner">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#00f59b]/20 text-[#00f59b] border border-[#00f59b]/30">
                  TẠP HÓA 247 BOT • CHECK ACC
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Đơn: <b className="text-white">#{orderCode}</b>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                Kho Đồ Tài Khoản #{position} - {productName}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 font-sans">
          {/* THE EXACT DISCORD BOT INVENTORY CARD */}
          <ValorantInventoryCard
            orderCode={orderCode}
            data={d}
            rawCredentials={rawCredentials}
            onDownloadHtml={() => {
              window.open(`${API_BASE_URL}/orders/${orderCode}/download-html`, '_blank');
            }}
            showExportButtons={true}
          />

          {/* Quick Credentials Strip */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">TÀI KHOẢN (USER)</span>
                <b className="text-emerald-400 font-bold select-all text-sm">{d.username || '—'}</b>
              </div>
              <div className="border-l border-slate-800 pl-4">
                <span className="text-[10px] text-slate-400 block">MẬT KHẨU (PASS)</span>
                <div className="flex items-center gap-2">
                  <b className="text-amber-300 font-bold select-all text-sm">
                    {showPassword ? d.password || '—' : '••••••••••••'}
                  </b>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCreds}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  copied
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <span>📋</span>
                <span>{copied ? '✓ Đã Sao Chép!' : 'Sao Chép TK:MK'}</span>
              </button>
            </div>
          </div>

          {/* Raw Log Details Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowRawLog(!showRawLog)}
              className="text-xs text-slate-400 hover:text-slate-200 underline flex items-center gap-1 font-mono cursor-pointer"
            >
              <span>{showRawLog ? '▼ Ẩn' : '▶ Xem'}</span> chuỗi dữ liệu gốc (Full Account Log)
            </button>
            {showRawLog && (
              <pre className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 select-all whitespace-pre-wrap max-h-40 overflow-y-auto">
                {rawCredentials || d.raw}
              </pre>
            )}
          </div>
        </div>

        {/* Footer Buttons (Giống Discord Bot) */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sao chép TK:MK */}
            <button
              type="button"
              onClick={copyCreds}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                copied
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              <span>📋</span>
              <span>{copied ? '✓ Đã Sao Chép!' : 'Sao Chép TK:MK'}</span>
            </button>

            {/* Tải File HTML 3D */}
            <a
              href={`${API_BASE_URL}/orders/${orderCode}/download-html`}
              className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <span>🌐</span>
              <span>Tải File HTML</span>
            </a>

            {/* Tải File TXT */}
            <a
              href={`${API_BASE_URL}/orders/${orderCode}/download`}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <span>📄</span>
              <span>File TXT</span>
            </a>
          </div>

          {/* Nút Bảo Hành nếu còn hạn */}
          {canWarranty && onOpenWarranty && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWarranty();
              }}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>🛡️</span>
              <span>Báo Lỗi (Lượt {replacementCount + 1}/3)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
