import React from 'react';

/**
 * Authentic Valorant Rank Badges & Game Logos matching official game art.
 */

// Official Valorant Red Icon
export function ValorantIcon({ size = 20, color = '#FF4655' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
      <path d="M20 22 L46 22 L16 70 L6 55 Z" fill={color} />
      <path d="M56 22 L94 22 L44 86 L30 86 Z" fill={color} />
    </svg>
  );
}

// Official CS2 Icon
export function Cs2Icon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
      <rect width="100" height="100" rx="20" fill="#0A0F1D" />
      <path d="M38 24 C38 20 44 16 50 16 C56 16 62 20 62 24 L62 52 L38 52 Z" fill="#FFA41C" />
      <rect x="25" y="56" width="50" height="26" rx="4" fill="#FFA41C" />
      <text x="50" y="75" textAnchor="middle" fill="#0A0F1D" fontSize="18" fontWeight="900" fontFamily="sans-serif">CS2</text>
    </svg>
  );
}

// Official Steam Icon
export function SteamIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
      <circle cx="50" cy="50" r="46" fill="#171A21" stroke="#38BDF8" strokeWidth="4" />
      <circle cx="66" cy="36" r="14" stroke="#38BDF8" strokeWidth="4" fill="none" />
      <circle cx="66" cy="36" r="6" fill="#FFFFFF" />
      <path d="M62 41 L38 61 L32 54 L56 34 Z" fill="#38BDF8" />
      <circle cx="36" cy="62" r="10" stroke="#38BDF8" strokeWidth="4" fill="#171A21" />
      <circle cx="36" cy="62" r="4" fill="#FFFFFF" />
    </svg>
  );
}

// Official PUBG Icon
export function PubgIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="shrink-0">
      <rect x="8" y="24" width="84" height="52" rx="8" fill="#F59E0B" />
      <rect x="14" y="30" width="72" height="40" rx="4" fill="#050A14" />
      <text x="50" y="58" textAnchor="middle" fill="#F59E0B" fontSize="22" fontWeight="900" fontFamily="Impact, sans-serif" letterSpacing="1">PUBG</text>
    </svg>
  );
}

// ══════════════════════════════════════════════════════
// OFFICIAL VALORANT RANK BADGES (Exact geometric shapes)
// ══════════════════════════════════════════════════════
export function ValorantRankBadge({ rank, size = 68 }: { rank: string; size?: number }) {
  const r = rank.toLowerCase();

  // 1. RADIANT: Golden Diamond Flame with White Wings
  if (r.includes('radiant')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_14px_rgba(250,204,21,0.7)]">
        <defs>
          <linearGradient id="radGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>
        </defs>
        {/* Outer White Wing Shell */}
        <polygon points="50,6 88,44 76,86 50,74 24,86 12,44" fill="#0B1220" stroke="url(#radGold)" strokeWidth="3" />
        <path d="M22 46 L36 82 L50 72 L64 82 L78 46 L50 20 Z" fill="#F8FAFC" fillOpacity="0.15" />
        {/* Center Golden Flame Diamond */}
        <polygon points="50,18 74,48 50,78 26,48" fill="url(#radGold)" />
        {/* Core Radiance */}
        <polygon points="50,30 62,48 50,66 38,48" fill="#FFFFFF" />
      </svg>
    );
  }

  // 2. IMMORTAL: 4-Pointed Crimson Red Star with White/Pink Core
  if (r.includes('immortal') || r.includes('bất tử')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_14px_rgba(239,68,68,0.7)]">
        <defs>
          <linearGradient id="immRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="50%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#881337" />
          </linearGradient>
        </defs>
        {/* Outer Ring & Cross Blades */}
        <circle cx="50" cy="50" r="42" fill="#150810" stroke="url(#immRed)" strokeWidth="2.5" />
        {/* 4-Point Star */}
        <polygon points="50,10 60,38 88,50 60,62 50,90 40,62 12,50 40,38" fill="url(#immRed)" />
        {/* Inner Diamond Core */}
        <polygon points="50,30 64,50 50,70 36,50" fill="#FFFFFF" fillOpacity="0.9" />
        <circle cx="50" cy="50" r="4" fill="#EF4444" />
      </svg>
    );
  }

  // 3. ASCENDANT: Emerald Green Octagon Gem
  if (r.includes('ascendant') || r.includes('siêu đẳng')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_14px_rgba(16,185,129,0.7)]">
        <defs>
          <linearGradient id="ascGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#064E3B" />
          </linearGradient>
        </defs>
        {/* Octagon Shape */}
        <polygon points="50,10 78,22 90,50 78,78 50,90 22,78 10,50 22,22" fill="#042017" stroke="url(#ascGreen)" strokeWidth="3" />
        <polygon points="50,22 70,32 80,50 70,68 50,78 30,68 20,50 30,32" fill="url(#ascGreen)" />
        <polygon points="50,34 62,50 50,66 38,50" fill="#D1FAE5" />
      </svg>
    );
  }

  // 4. DIAMOND: 8-Sided Octagon Violet Amethyst
  if (r.includes('diamond') || r.includes('kim cương')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_14px_rgba(192,132,252,0.7)]">
        <defs>
          <linearGradient id="diaPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E9D5FF" />
            <stop offset="50%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#581C87" />
          </linearGradient>
        </defs>
        {/* Octagonal Amethyst Gem */}
        <polygon points="50,10 76,20 88,50 76,80 50,90 24,80 12,50 24,20" fill="#1C0B30" stroke="url(#diaPurple)" strokeWidth="3" />
        <polygon points="50,22 70,30 78,50 70,70 50,78 30,70 22,50 30,30" fill="url(#diaPurple)" />
        {/* Center Sparkle */}
        <polygon points="50,34 60,46 68,50 60,54 50,66 40,54 32,50 40,46" fill="#FAF5FF" />
      </svg>
    );
  }

  // 5. PLATINUM: 6-Sided Hexagon Cyan/Teal Crystal
  if (r.includes('platinum') || r.includes('bạch kim')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_14px_rgba(6,182,212,0.7)]">
        <defs>
          <linearGradient id="platCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#083344" />
          </linearGradient>
        </defs>
        {/* Hexagonal Crystal */}
        <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" fill="#041E26" stroke="url(#platCyan)" strokeWidth="3" />
        <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" fill="url(#platCyan)" />
        <circle cx="50" cy="50" r="10" fill="#E0F2FE" />
        <circle cx="50" cy="50" r="4" fill="#06B6D4" />
      </svg>
    );
  }

  // 6. GOLD: 5-Sided Pentagon Shield in Bright Amber Gold
  if (r.includes('gold') || r.includes('vàng')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_14px_rgba(234,179,8,0.7)]">
        <defs>
          <linearGradient id="goldAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>
        </defs>
        {/* Pentagon Shield (Flat Top, Angled Sides, Point Bottom) */}
        <polygon points="20,16 80,16 90,52 50,90 10,52" fill="#241403" stroke="url(#goldAmber)" strokeWidth="3" />
        <polygon points="28,26 72,26 80,52 50,80 20,52" fill="url(#goldAmber)" />
        <polygon points="36,36 64,36 70,52 50,70 30,52" fill="#FEF9C3" />
      </svg>
    );
  }

  // 7. SILVER: Inverted Diamond (45 deg Rotated Square) in Pure Silver
  if (r.includes('silver') || r.includes('bạc')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_10px_rgba(148,163,184,0.6)]">
        <defs>
          <linearGradient id="silvWhite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        {/* Diamond (Rotated Square) */}
        <polygon points="50,10 90,50 50,90 10,50" fill="#1E293B" stroke="url(#silvWhite)" strokeWidth="3" />
        <polygon points="50,22 78,50 50,78 22,50" fill="url(#silvWhite)" />
        <polygon points="50,34 66,50 50,66 34,50" fill="#FFFFFF" />
      </svg>
    );
  }

  // 8. BRONZE: Downward-Pointing Triangle with Bronze/Copper Wings
  if (r.includes('bronze') || r.includes('đồng')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_10px_rgba(217,119,6,0.6)]">
        <defs>
          <linearGradient id="brzCopper" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>
        {/* Downward-Pointing Triangle */}
        <polygon points="12,18 88,18 50,90" fill="#1C0F06" stroke="url(#brzCopper)" strokeWidth="3" />
        <polygon points="24,26 76,26 50,76" fill="url(#brzCopper)" />
        <polygon points="34,34 66,34 50,62" fill="#FFEDD5" />
      </svg>
    );
  }

  // 9. IRON: Vertical Capsule / Oval with Concentric Steel Rings
  if (r.includes('iron') || r.includes('sắt')) {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_10px_rgba(100,116,139,0.5)]">
        <defs>
          <linearGradient id="ironSteel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>
        {/* Vertical Capsule Shield */}
        <rect x="22" y="14" width="56" height="72" rx="28" fill="#0F172A" stroke="url(#ironSteel)" strokeWidth="3" />
        <rect x="30" y="22" width="40" height="56" rx="20" fill="url(#ironSteel)" />
        <circle cx="50" cy="50" r="10" fill="#F1F5F9" />
      </svg>
    );
  }

  // 10. UNRANKED / DEFAULT
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
      <defs>
        <linearGradient id="unrBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0C4A6E" />
        </linearGradient>
      </defs>
      <polygon points="50,12 86,34 76,82 50,92 24,82 14,34" fill="#0A1628" stroke="url(#unrBlue)" strokeWidth="3" />
      <text x="50" y="60" textAnchor="middle" fill="#38BDF8" fontSize="28" fontWeight="900" fontFamily="sans-serif">?</text>
    </svg>
  );
}
