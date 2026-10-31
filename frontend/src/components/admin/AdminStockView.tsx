'use client';

import React, { useMemo } from 'react';

interface Product {
  id: number;
  name: string;
  category?: { name: string };
  available_stock?: number;
  price?: number;
}

interface AdminStockViewProps {
  products: Product[];
  importProductId: number;
  setImportProductId: (id: number) => void;
  importText: string;
  setImportText: (text: string) => void;
  importStatus: string | null;
  handleImportStock: (e: React.FormEvent) => void;
}

export function AdminStockView({
  products,
  importProductId,
  setImportProductId,
  importText,
  setImportText,
  importStatus,
  handleImportStock,
}: AdminStockViewProps) {
  // Phân tích định dạng tài khoản thông minh (Chuẩn xác 100% cho cả dạng 1 dòng và dạng khối log game/tool)
  const parsedInfo = useMemo(() => {
    const raw = importText.trim();
    if (!raw) return { count: 0, format: 'empty', items: [], sample: null };

    // 1. Kiểm tra dạng khối log game (ngăn cách bởi dấu gạch ngang hoặc từ khóa Username:/User:)
    const isBlockLog = /-{5,}/.test(raw) || /Username:\s*/i.test(raw) || /User:\s*/i.test(raw);

    if (isBlockLog) {
      let blocks: string[] = [];

      if (/-{5,}/.test(raw)) {
        blocks = raw
          .split(/-{5,}/)
          .map((b) => b.trim())
          .filter((b) => b.length > 0 && (/Username:\s*/i.test(b) || /User:\s*/i.test(b) || /Password:\s*/i.test(b) || b.includes(':')));
      } else {
        // Tách theo Username: hoặc User: đầu dòng
        blocks = raw
          .split(/(?=^(?:Username|User):\s*)/im)
          .map((b) => b.trim())
          .filter((b) => b.length > 0 && (/Username:\s*/i.test(b) || /User:\s*/i.test(b)));
      }

      if (blocks.length > 0) {
        // Trích xuất sample từ block đầu tiên
        const first = blocks[0];
        const uMatch = first.match(/(?:Username|User):\s*([^\r\n]+)/i);
        const pMatch = first.match(/(?:Password|Pass):\s*([^\r\n]+)/i);
        const rankMatch = first.match(/(?:Current Rank|Peak Rank):\s*([^\r\n]+)/i);
        const regionMatch = first.match(/Region:\s*([^\r\n]+)/i);

        return {
          count: blocks.length,
          format: 'block_log' as const,
          items: blocks,
          sample: {
            user: uMatch ? uMatch[1].trim() : '...',
            pass: pMatch ? pMatch[1].trim() : '...',
            extra: [
              regionMatch ? `Region: ${regionMatch[1].trim()}` : null,
              rankMatch ? `Rank: ${rankMatch[1].trim()}` : null,
            ].filter(Boolean).join(' • '),
          },
        };
      }
    }

    // 2. Dạng danh sách 1 dòng 1 acc (user:pass hoặc user|pass)
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('---') && !l.startsWith('#') && (l.includes(':') || l.includes('|')));

    const firstLine = lines[0] || '';
    const parts = firstLine.includes('|') ? firstLine.split('|') : firstLine.split(':');

    return {
      count: lines.length,
      format: 'single_line' as const,
      items: lines,
      sample: lines.length > 0 ? {
        user: parts[0]?.trim() || '...',
        pass: parts[1]?.trim() || '...',
        extra: parts[2] ? `2FA/Email: ${parts[2].trim()}` : null,
      } : null,
    };
  }, [importText]);

  // Chỉ các sản phẩm quản lý tồn kho nội bộ (như Valorant / Game Accounts) mới nạp kho thủ công
  // Các sản phẩm bot tự động (AI, VPN, Canva, Capcut, Netflix) mua trực tiếp từ nguồn ngoài, không nạp kho ở đây
  const stockableProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      const cat = (p.category?.name || '').toLowerCase();
      const catSlug = ((p as any).category?.slug || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return (
        cat.includes('valorant') ||
        catSlug === 'valorant' ||
        p.id === 1 ||
        name.includes('valorant') ||
        name.includes('valo')
      );
    });
    return filtered.length > 0 ? filtered : products.filter((p) => p.id === 1);
  }, [products]);

  const selectedProduct = stockableProducts.find((p) => p.id === importProductId) || stockableProducts[0];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setImportText(importText ? `${importText}\n${text}` : text);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* ══════════════════════════════════════════════════════════
          1. HEADER BANNER
         ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e5a0] via-[#00c4ff] to-[#7c3aed]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[#00e5a0] text-[11px] font-mono font-bold uppercase mb-2">
              <span>🔒 MÃ HÓA AES-256 BIT BẢO VỆ MẬT KHẨU</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Nạp Thêm Tài Khoản Vào Kho (Stock Import)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống tự động tách định dạng đa dạng, loại bỏ trùng lặp và mã hóa tài khoản trước khi lưu vào CSDL
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#050a14] border border-[#1e293b] px-4 py-3 rounded-2xl shrink-0">
            <span className="text-2xl">📦</span>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                TỔNG ACC SẴN CÓ
              </div>
              <div className="text-lg font-black text-[#00e5a0] font-mono">
                {stockableProducts.reduce((s, p) => s + (p.available_stock || 0), 0)} acc
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. MAIN IMPORT FORM & SIDEBAR
         ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Import Form */}
        <div className="lg:col-span-2 bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
          {importStatus && (
            <div className="p-4 bg-[#00e5a0]/15 border border-[#00e5a0]/40 text-[#00e5a0] rounded-2xl text-xs flex items-center gap-2.5 font-bold animate-in fade-in">
              <span className="text-base">✓</span>
              <span>{importStatus}</span>
            </div>
          )}

          <form onSubmit={handleImportStock} className="space-y-5">
            {/* Step 1: Select Product */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>1. CHỌN SẢN PHẨM CẦN NẠP KHO</span>
                {selectedProduct && (
                  <span className="text-[#00e5a0] font-bold text-[11px] normal-case">
                    Tồn hiện tại: {selectedProduct.available_stock || 0} acc
                  </span>
                )}
              </label>
              <select
                value={importProductId || stockableProducts[0]?.id || 1}
                onChange={(e) => setImportProductId(Number(e.target.value))}
                className="w-full bg-[#050a14] border border-[#1e293b] text-white rounded-xl p-3.5 text-xs font-bold outline-none focus:border-[#00e5a0] transition-colors cursor-pointer"
              >
                {stockableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — (Kho: {p.available_stock ?? 0} acc) [{p.category?.name || 'Valorant'}]
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Paste Stock Textarea */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                  2. DÁN DANH SÁCH TÀI KHOẢN (HỖ TRỢ CẢ KHỐI LOG & 1 DÒNG)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {parsedInfo.format === 'block_log' ? (
                    <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                      <span>🎯 Khối Log Game:</span>
                      <b className="text-white">{parsedInfo.count} acc</b>
                    </span>
                  ) : parsedInfo.format === 'single_line' ? (
                    <span className="text-[11px] font-mono text-cyan-400 font-bold bg-cyan-400/10 px-2.5 py-0.5 rounded-full border border-cyan-400/20 flex items-center gap-1">
                      <span>📋 1 dòng 1 acc:</span>
                      <b className="text-white">{parsedInfo.count} acc</b>
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-800 px-2.5 py-0.5 rounded-full">
                      Chưa phát hiện acc
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handlePaste}
                    className="text-[11px] text-slate-400 hover:text-white bg-slate-800 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    📋 Dán từ Clipboard
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={10}
                  placeholder={`Dán danh sách vào đây. Hệ thống tự động nhận diện cả 2 định dạng:\n\n1. Dạng 1 dòng: taikhoan1:matkhau1 hoặc taikhoan2|matkhau2\n2. Dạng khối log game/tool:\nUsername: taikhoan1\nPassword: matkhau1\nRegion: AP\n---------------------------`}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full bg-[#050a14] border border-[#1e293b] text-[#00e5a0] rounded-2xl p-4 text-xs font-mono outline-none focus:border-[#00e5a0] transition-colors resize-y placeholder:text-slate-600 leading-relaxed"
                  required
                />
                {importText && (
                  <button
                    type="button"
                    onClick={() => setImportText('')}
                    className="absolute right-3 top-3 text-[11px] text-slate-500 hover:text-slate-300 bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Xóa sạch
                  </button>
                )}
              </div>

              {/* Sample preview card when parsed */}
              {parsedInfo.sample && (
                <div className="mt-3 p-3.5 rounded-2xl bg-[#050a14] border border-[#1e293b] space-y-1 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🔍</span> XEM TRƯỚC TÀI KHOẢN ĐẦU TIÊN ĐƯỢC NHẬN DIỆN ({parsedInfo.count} ACC HỢP LỆ)
                    </span>
                    <span className="text-[10px] text-[#00e5a0] font-mono font-bold">
                      ✓ Đã tách khối thành công
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs pt-1 flex-wrap">
                    <div className="bg-black/50 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                      <span className="text-slate-500 text-[10px]">User: </span>
                      <b className="text-white">{parsedInfo.sample.user}</b>
                    </div>
                    <div className="bg-black/50 px-2.5 py-1 rounded-lg border border-white/5 font-mono">
                      <span className="text-slate-500 text-[10px]">Pass: </span>
                      <b className="text-[#00c4ff]">{parsedInfo.sample.pass}</b>
                    </div>
                    {parsedInfo.sample.extra && (
                      <span className="text-[11px] text-slate-400 font-sans">
                        ({parsedInfo.sample.extra})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={parsedInfo.count === 0}
              className="w-full py-4 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 text-[#050a14] font-black rounded-xl text-sm transition-all shadow-xl shadow-[#00e5a0]/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>📦</span>
              <span>BẮT ĐẦU NẠP VÀO KHO ({parsedInfo.count} ACC HỢP LỆ)</span>
            </button>
          </form>
        </div>

        {/* Right 1 Col: Format Guide & Current Stock */}
        <div className="space-y-6">
          {/* Format Guide Box */}
          <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>💡</span> HƯỚNG DẪN ĐỊNH DẠNG HỢP LỆ
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#050a14] border border-[#1e293b] space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                  ĐỊNH DẠNG 1: 1 DÒNG 1 ACC
                </span>
                <code className="text-[#00e5a0] font-mono text-xs block">
                  username:password
                </code>
                <code className="text-[#00e5a0] font-mono text-xs block">
                  username|password|2fa_token
                </code>
              </div>

              <div className="p-3 rounded-xl bg-[#050a14] border border-[#1e293b] space-y-1">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">
                  ĐỊNH DẠNG 2: KHỐI LOG TOOL / VALORANT CHECKER
                </span>
                <pre className="text-amber-300 font-mono text-[11px] leading-tight">
                  Username: taikhoan1&#10;Password: matkhau1&#10;Region: AP&#10;---------------------------
                </pre>
                <p className="text-[10px] text-slate-500 mt-1">
                  Hệ thống tự động gom toàn bộ thông tin skin, rank, weapons vào từng acc riêng biệt.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Inventory Breakdown */}
          <div className="bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#00c4ff] uppercase tracking-wider flex items-center gap-2">
              <span>📊</span> TỒN KHO THEO SẢN PHẨM
            </h3>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {stockableProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setImportProductId(p.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    importProductId === p.id
                      ? 'bg-[#00e5a0]/10 border-[#00e5a0]/50 text-white font-bold'
                      : 'bg-[#050a14] border-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate pr-2">{p.name}</span>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    (p.available_stock || 0) === 0
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-[#00e5a0]/20 text-[#00e5a0]'
                  }`}>
                    {p.available_stock || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
