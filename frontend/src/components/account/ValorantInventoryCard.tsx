'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { ParsedAccountData } from './CheckAccModal';
import { fetchAllSkinsMap, getQuickSkinIcon, getRankMeta } from '@/lib/valorantAssets';

interface ValorantInventoryCardProps {
  orderCode: string;
  data: ParsedAccountData;
  rawCredentials?: string;
  onDownloadHtml?: () => void;
  showExportButtons?: boolean;
}

export function ValorantInventoryCard({
  orderCode,
  data,
  rawCredentials,
  onDownloadHtml,
  showExportButtons = true,
}: ValorantInventoryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [skinIcons, setSkinIcons] = useState<Map<string, string>>(new Map());
  const [downloadingImg, setDownloadingImg] = useState(false);
  const [copiedImg, setCopiedImg] = useState(false);

  // Load skins map from valorant-api.com
  useEffect(() => {
    fetchAllSkinsMap().then((map) => {
      setSkinIcons(new Map(map));
    });
  }, []);

  const d = data;
  const rankMeta = getRankMeta(d.rank);

  // Count weapons by tier
  const tierCounts = {
    Ultra: 0,
    Exclusive: 0,
    Premium: 0,
    Deluxe: 0,
    Select: 0,
  };

  if (d.weapons && d.weapons.length > 0) {
    for (const w of d.weapons) {
      const t = w.tier as keyof typeof tierCounts;
      if (tierCounts[t] !== undefined) {
        tierCounts[t]++;
      } else {
        tierCounts.Select++;
      }
    }
  }

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'Ultra':
        return 'border-[#eab308] text-[#fef08a] bg-[#eab308]/10';
      case 'Exclusive':
        return 'border-[#f97316] text-[#fed7aa] bg-[#f97316]/10';
      case 'Premium':
        return 'border-[#ec4899] text-[#fbcfe8] bg-[#ec4899]/10';
      case 'Deluxe':
        return 'border-[#06b6d4] text-[#a5f3fc] bg-[#06b6d4]/10';
      default:
        return 'border-[#3b82f6] text-[#bfdbfe] bg-[#3b82f6]/10';
    }
  };

  const getTierLeftBorder = (tier: string) => {
    switch (tier) {
      case 'Ultra':
        return 'border-l-[#eab308]';
      case 'Exclusive':
        return 'border-l-[#f97316]';
      case 'Premium':
        return 'border-l-[#ec4899]';
      case 'Deluxe':
        return 'border-l-[#06b6d4]';
      default:
        return 'border-l-[#3b82f6]';
    }
  };

  const getTierTextColor = (tier: string) => {
    switch (tier) {
      case 'Ultra':
        return 'text-[#facc15]';
      case 'Exclusive':
        return 'text-[#fb923c]';
      case 'Premium':
        return 'text-[#f472b6]';
      case 'Deluxe':
        return 'text-[#22d3ee]';
      default:
        return 'text-[#60a5fa]';
    }
  };

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setDownloadingImg(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0e17',
      });
      const link = document.createElement('a');
      link.download = `TapHoa247_Valorant_${orderCode}_CheckAcc.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setDownloadingImg(false);
    }
  };

  const handleCopyPng = async () => {
    if (!cardRef.current) return;
    try {
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0a0e17',
      });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImg(true);
        setTimeout(() => setCopiedImg(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy PNG to clipboard:', err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Header for Downloading / Copying Image */}
      {showExportButtons && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f59b] animate-pulse" />
            <span className="text-xs font-bold text-slate-300 font-mono">
              Ảnh Thẻ Check Acc (Chuẩn Discord Bot)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPng}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>📋</span>
              <span>{copiedImg ? '✓ Đã Copy Ảnh!' : 'Copy Ảnh Thẻ'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloadingImg}
              className="px-3.5 py-1.5 bg-[#00f59b] hover:bg-[#00d888] text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#00f59b]/20 active:scale-95 disabled:opacity-50"
            >
              <span>📸</span>
              <span>{downloadingImg ? 'Đang xuất ảnh...' : 'Tải Ảnh PNG'}</span>
            </button>
          </div>
        </div>
      )}

      {/* The EXACT Card Layout from User Screenshots */}
      <div
        ref={cardRef}
        className="w-full bg-[#0b1019] border border-[#16202e] rounded-2xl overflow-hidden shadow-2xl text-slate-200 font-sans relative"
        style={{ backgroundColor: '#0b1019' }}
      >
        {/* Top Neon Accent Bar */}
        <div className="h-1 w-full bg-[#00f59b]" />

        <div className="p-5 sm:p-7 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[#00f59b] font-black text-sm tracking-wider">
                TẠP HÓA 247
              </span>
              <span className="text-slate-500 text-xs font-semibold">
                • HỆ THỐNG TRA CỨU KHO TÀI KHOẢN VALORANT
              </span>
            </div>

            <div className="px-3 py-1 rounded-lg border border-[#00f59b] bg-[#00f59b]/10 text-white font-mono font-bold text-xs tracking-wide">
              Đơn hàng #{orderCode}
            </div>
          </div>

          {/* Account Overview + Rank Card */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-5">
            {/* Left Account Details */}
            <div className="space-y-2 flex-1">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-all">
                {d.riot_id || d.username || 'Valorant Player'}
              </h2>

              <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Tài khoản:{' '}
                  <b className="text-slate-200 font-bold select-all">
                    {d.username || '—'}
                  </b>
                </span>
                <span className="text-slate-600">|</span>
                <span>
                  Khu vực:{' '}
                  <b className="text-slate-200 font-bold">{d.region || 'AP'}</b>
                </span>
                <span className="text-slate-600">|</span>
                <span>
                  Cấp độ:{' '}
                  <b className="text-slate-200 font-bold">Lv {d.level || 1}</b>
                </span>
              </div>

              {/* Security info */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#00f59b] font-mono pt-0.5">
                <span className="flex items-center gap-1.5">
                  <span>🗹</span>
                  <span>
                    Email:{' '}
                    {d.email_verified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span>🗹</span>
                  <span>
                    SĐT: {d.phone_verified ? 'Đã liên kết' : 'Chưa liên kết'}
                  </span>
                </span>
              </div>

              {/* Currencies */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#f59e0b] font-mono pt-1">
                <span className="flex items-center gap-1.5">
                  <span>🪙</span>
                  <span>VP: {d.vp ?? 0}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>RP: {d.rp ?? 0}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span>👑</span>
                  <span>KC: {d.kc ?? 0}</span>
                </span>
              </div>
            </div>

            {/* Right: XẾP HẠNG RANK Box */}
            <div className="w-full lg:w-72 p-4 bg-[#0d1624] border border-[#1e293b] rounded-2xl flex items-center gap-4 shadow-xl shrink-0">
              <div className="w-14 h-14 rounded-full bg-slate-900/90 border border-slate-800 flex items-center justify-center p-2 shrink-0">
                {rankMeta.icon ? (
                  <img
                    src={rankMeta.icon}
                    alt={d.rank || 'Rank'}
                    className="w-full h-full object-contain drop-shadow"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="text-2xl">🏆</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                  XẾP HẠNG RANK
                </div>
                <div
                  className="text-sm font-black truncate mt-0.5"
                  style={{ color: rankMeta.color }}
                >
                  {d.rank || 'Unranked'}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  Peak:{' '}
                  <b className="text-slate-300 font-semibold">
                    {d.peak_rank || 'Unranked'}
                  </b>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Trận cuối: {d.last_game || 'Gần đây'}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Kho Vũ Khí & Skin */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-[#00f59b] tracking-wide flex items-center gap-2 font-mono">
              <span>🗹</span>
              <span>
                KHO VŨ KHÍ & SKIN ({d.skins_count ?? d.weapons?.length ?? 0} SKINS)
              </span>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
              <span
                className={`px-3 py-1 rounded-lg border text-[11px] ${getTierBadgeStyle(
                  'Ultra'
                )}`}
              >
                Ultra: {tierCounts.Ultra}
              </span>
              <span
                className={`px-3 py-1 rounded-lg border text-[11px] ${getTierBadgeStyle(
                  'Exclusive'
                )}`}
              >
                Exclusive: {tierCounts.Exclusive}
              </span>
              <span
                className={`px-3 py-1 rounded-lg border text-[11px] ${getTierBadgeStyle(
                  'Premium'
                )}`}
              >
                Premium: {tierCounts.Premium}
              </span>
              <span
                className={`px-3 py-1 rounded-lg border text-[11px] ${getTierBadgeStyle(
                  'Deluxe'
                )}`}
              >
                Deluxe: {tierCounts.Deluxe}
              </span>
              <span
                className={`px-3 py-1 rounded-lg border text-[11px] ${getTierBadgeStyle(
                  'Select'
                )}`}
              >
                Select: {tierCounts.Select}
              </span>
            </div>

            {/* Gun Skins Grid */}
            {d.weapons && d.weapons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {d.weapons.map((w, idx) => {
                  const quickIcon = getQuickSkinIcon(w.name);
                  const dynamicIcon = skinIcons.get(w.name.toLowerCase().trim());
                  const iconUrl = quickIcon || dynamicIcon;

                  return (
                    <div
                      key={idx}
                      className={`p-3 bg-[#0c1421] border border-[#1e293b] border-l-4 rounded-xl flex items-center justify-between gap-3 shadow-md ${getTierLeftBorder(
                        w.tier
                      )}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {w.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          <span className={getTierTextColor(w.tier)}>
                            {w.tier}
                          </span>{' '}
                          • {w.type}
                        </div>
                      </div>

                      {iconUrl ? (
                        <div className="h-10 sm:h-12 w-28 sm:w-32 flex items-center justify-end shrink-0">
                          <img
                            src={iconUrl}
                            alt={w.name}
                            className="h-full w-auto max-w-full object-contain drop-shadow"
                            crossOrigin="anonymous"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono text-slate-500 px-2 py-1 bg-slate-900 rounded shrink-0">
                          {w.type}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-xs text-slate-500 italic">
                Chưa phát hiện skin súng nào trong log.
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
            <div>
              TẠP HÓA 247 • Hệ thống tra cứu kho đồ tự động | Mã đơn: #{orderCode}
            </div>

            {onDownloadHtml ? (
              <button
                type="button"
                onClick={onDownloadHtml}
                className="text-[#00f59b] hover:underline font-bold transition-colors cursor-pointer"
              >
                Bấm "Tải File HTML" để mở 3D
              </button>
            ) : (
              <span className="text-[#00f59b] font-bold">
                Bấm "Tải File HTML" để mở 3D
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
