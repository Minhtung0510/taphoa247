'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MascotProps {
  initialHearts?: number;
  liveViewers?: number;
}

export function AiGamingMascot({ initialHearts = 186, liveViewers = 18 }: MascotProps) {
  const [hearts, setHearts] = useState(initialHearts);
  const [speech, setSpeech] = useState(
    'Chào người anh em! Em là AI Thu Ngân Gaming của DTFF SHOP 🎧. Đang trực ca đêm phục vụ anh em leo rank đây!'
  );
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; left: number }>>([]);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Hiệu ứng mắt liếc theo con trỏ chuột
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mascotX = rect.left + rect.width / 2;
      const mascotY = rect.top + rect.height / 2;

      const dx = e.clientX - mascotX;
      const dy = e.clientY - mascotY;
      const dist = Math.hypot(dx, dy) || 1;

      // Giới hạn độ lệch con ngươi tối đa 6px
      const maxOffset = 6;
      setPupilOffset({
        x: (dx / dist) * Math.min(maxOffset, Math.abs(dx / 15)),
        y: (dy / dist) * Math.min(maxOffset, Math.abs(dy / 15)),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Đổi lời thoại ngẫu nhiên
  useEffect(() => {
    const quips = [
      'Rank Immortal hôm nay bán chạy quá trời! Còn ít acc Diamond anh em múc nhanh kẻo lỡ!',
      'Quét mã VietQR MBBank là em tự động nhả acc liền trong 3 giây nha ⚡',
      'Đang có ' + liveViewers + ' anh em đang cùng xem stream kho hàng với bạn!',
      'Acc Chủ Off bảo hành tới 5 tiếng lận, tha hồ quẩy đêm không lo chủ phá!',
      'Gõ phím lạch cạch nãy giờ mỏi tay quá, anh em mua ủng hộ 1 acc cho em đạt KPI nha 🥺',
    ];

    const timer = setInterval(() => {
      const q = quips[Math.floor(Math.random() * quips.length)];
      setSpeech(q);
    }, 9000);

    return () => clearInterval(timer);
  }, [liveViewers]);

  const handleHeartClick = () => {
    setHearts((h) => h + 1);
    const newHeart = { id: Date.now() + Math.random(), left: 20 + Math.random() * 60 };
    setFloatingHearts((prev) => [...prev.slice(-15), newHeart]);

    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-2xl overflow-hidden"
    >
      {/* Floating Hearts Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {floatingHearts.map((h) => (
          <span
            key={h.id}
            style={{ left: `${h.left}%` }}
            className="absolute bottom-10 text-2xl animate-float-up opacity-90 select-none"
          >
            ❤️
          </span>
        ))}
      </div>

      {/* Speech Bubble */}
      <div className="relative mb-3 bg-slate-800 text-slate-100 px-4 py-2.5 rounded-2xl rounded-bl-none text-xs sm:text-sm font-medium border border-emerald-500/30 shadow-lg max-w-xs sm:max-w-md text-center transition-all duration-300">
        <span className="text-emerald-400 font-bold mr-1">[AI Thu Ngân]:</span>
        {speech}
        <div className="absolute -bottom-2 left-6 w-3 h-3 bg-slate-800 border-r border-b border-emerald-500/30 transform rotate-45" />
      </div>

      {/* SVG Mascot Character */}
      <div className="relative w-48 h-44 sm:w-56 sm:h-52">
        <svg viewBox="0 0 240 210" className="w-full h-full drop-shadow-xl" aria-hidden="true">
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="screenGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Gaming Headset Band */}
          <path
            d="M 68 84 A 52 52 0 0 1 172 84"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 72 82 A 48 48 0 0 1 168 82"
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Ear Cups */}
          <rect x="54" y="70" width="16" height="32" rx="8" fill="#334155" stroke="#10b981" strokeWidth="2" />
          <rect x="170" y="70" width="16" height="32" rx="8" fill="#334155" stroke="#10b981" strokeWidth="2" />

          {/* Head & Body */}
          <ellipse cx="120" cy="160" rx="55" ry="30" fill="url(#bodyGrad)" stroke="#065f46" strokeWidth="2" />
          <ellipse cx="120" cy="95" rx="46" ry="38" fill="url(#bodyGrad)" stroke="#065f46" strokeWidth="2" />

          {/* Big Gamer Eyes (White) */}
          <circle cx="102" cy="92" r="13" fill="#ffffff" stroke="#065f46" strokeWidth="2" />
          <circle cx="138" cy="92" r="13" fill="#ffffff" stroke="#065f46" strokeWidth="2" />

          {/* Dynamic Pupils (tracking cursor) */}
          <g transform={`translate(${pupilOffset.x}, ${pupilOffset.y})`}>
            <circle cx="102" cy="92" r="7" fill="#0f172a" />
            <circle cx="104" cy="89" r="2.5" fill="#ffffff" />

            <circle cx="138" cy="92" r="7" fill="#0f172a" />
            <circle cx="140" cy="89" r="2.5" fill="#ffffff" />
          </g>

          {/* Cute Blush */}
          <ellipse cx="88" cy="110" rx="6" ry="3" fill="#f43f5e" opacity="0.6" />
          <ellipse cx="152" cy="110" rx="6" ry="3" fill="#f43f5e" opacity="0.6" />

          {/* Smiling Mouth */}
          <path d="M 112 114 Q 120 124 128 114" fill="none" stroke="#064e3b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Mechanical Keyboard Desk */}
          <rect x="40" y="172" width="160" height="22" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          {/* RGB Keyboard Underglow */}
          <line x1="45" y1="192" x2="195" y2="192" stroke="#10b981" strokeWidth="3" opacity="0.8" />

          {/* Hands typing */}
          <circle cx="95" cy="172" r="10" fill="#34d399" stroke="#065f46" strokeWidth="1.5" />
          <circle cx="145" cy="172" r="10" fill="#34d399" stroke="#065f46" strokeWidth="1.5" />

          {/* Energy Drink Can */}
          <rect x="22" y="162" width="14" height="24" rx="2" fill="#e11d48" />
          <path d="M 22 170 L 36 170" stroke="#facc15" strokeWidth="3" />
        </svg>
      </div>

      {/* Interactive Controls & Heart Button */}
      <div className="flex items-center gap-4 mt-2 z-10">
        <button
          onClick={handleHeartClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-full text-xs font-bold transition-all transform active:scale-95"
        >
          <span>❤️ Thả tim</span>
          <span className="text-white font-mono">{hearts.toLocaleString('vi-VN')}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{liveViewers} người đang xem trực tiếp</span>
        </div>
      </div>
    </div>
  );
}
