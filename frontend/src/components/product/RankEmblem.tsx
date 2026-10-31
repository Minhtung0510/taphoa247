import React from 'react';

export type RankType =
  | 'valo_unranked'
  | 'valo_unranked_off'
  | 'valo_iron'
  | 'valo_iron_off'
  | 'valo_bronze'
  | 'valo_bronze_off'
  | 'valo_silver'
  | 'valo_silver_off'
  | 'valo_gold'
  | 'valo_gold_off'
  | 'valo_platinum'
  | 'valo_platinum_off'
  | 'valo_diamond'
  | 'valo_diamond_off'
  | 'valo_ascendant'
  | 'valo_ascendant_off'
  | 'valo_immortal'
  | 'valo_immortal_off'
  | 'valo_radiant'
  | 'valo_radiant_off'
  | 'cs2_prime'
  | 'steam_tier_1'
  | 'steam_tier_2'
  | 'steam_tier_3'
  | 'pubg_plus';

export interface RankVisualConfig {
  label: string;
  subLabel: string;
  themeColor: string; // Hex for primary text/glow
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  glowClass: string;
  category: 'valorant' | 'cs2' | 'steam' | 'pubg';
}

export function getRankConfig(accountType?: string, name?: string): RankVisualConfig {
  const type = (accountType || '').toLowerCase();
  const lowerName = (name || '').toLowerCase();

  // Valorant Ranks
  if (type.includes('radiant') || lowerName.includes('radiant')) {
    return {
      label: 'RADIANT',
      subLabel: 'Bậc Thầy Tối Thượng',
      themeColor: '#facc15',
      gradientFrom: '#ca8a04',
      gradientTo: '#fef08a',
      borderColor: 'border-yellow-500/40',
      glowClass: 'from-yellow-500/20 via-amber-500/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('immortal') || lowerName.includes('immortal') || lowerName.includes('bất tử')) {
    return {
      label: 'IMMORTAL',
      subLabel: 'Hạng Bất Tử',
      themeColor: '#ef4444',
      gradientFrom: '#dc2626',
      gradientTo: '#fca5a5',
      borderColor: 'border-red-500/40',
      glowClass: 'from-red-500/20 via-rose-500/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('ascendant') || lowerName.includes('ascendant')) {
    return {
      label: 'ASCENDANT',
      subLabel: 'Hạng Siêu Đẳng',
      themeColor: '#10b981',
      gradientFrom: '#059669',
      gradientTo: '#6ee7b7',
      borderColor: 'border-emerald-500/40',
      glowClass: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('diamond') || lowerName.includes('diamond') || lowerName.includes('kim cương')) {
    return {
      label: 'DIAMOND',
      subLabel: 'Hạng Kim Cương',
      themeColor: '#c084fc',
      gradientFrom: '#7e22ce',
      gradientTo: '#e9d5ff',
      borderColor: 'border-purple-500/40',
      glowClass: 'from-purple-500/20 via-fuchsia-500/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('platinum') || lowerName.includes('platinum') || lowerName.includes('bạch kim')) {
    return {
      label: 'PLATINUM',
      subLabel: 'Hạng Bạch Kim',
      themeColor: '#06b6d4',
      gradientFrom: '#0891b2',
      gradientTo: '#a5f3fc',
      borderColor: 'border-cyan-500/40',
      glowClass: 'from-cyan-500/20 via-sky-500/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('gold') || lowerName.includes('gold') || lowerName.includes('vàng')) {
    return {
      label: 'GOLD',
      subLabel: 'Hạng Vàng',
      themeColor: '#eab308',
      gradientFrom: '#b45309',
      gradientTo: '#fde047',
      borderColor: 'border-amber-500/40',
      glowClass: 'from-amber-500/20 via-yellow-500/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('silver') || lowerName.includes('silver') || lowerName.includes('bạc')) {
    return {
      label: 'SILVER',
      subLabel: 'Hạng Bạc',
      themeColor: '#94a3b8',
      gradientFrom: '#475569',
      gradientTo: '#cbd5e1',
      borderColor: 'border-slate-400/40',
      glowClass: 'from-slate-400/20 via-slate-500/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('bronze') || lowerName.includes('bronze') || lowerName.includes('đồng')) {
    return {
      label: 'BRONZE',
      subLabel: 'Hạng Đồng',
      themeColor: '#d97706',
      gradientFrom: '#78350f',
      gradientTo: '#fed7aa',
      borderColor: 'border-amber-700/40',
      glowClass: 'from-amber-700/20 via-orange-600/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('iron') || lowerName.includes('iron') || lowerName.includes('sắt')) {
    return {
      label: 'IRON',
      subLabel: 'Hạng Sắt',
      themeColor: '#64748b',
      gradientFrom: '#334155',
      gradientTo: '#94a3b8',
      borderColor: 'border-slate-600/40',
      glowClass: 'from-slate-600/20 via-slate-700/10 to-transparent',
      category: 'valorant',
    };
  }
  if (type.includes('unranked') || lowerName.includes('unranked')) {
    return {
      label: 'UNRANKED',
      subLabel: 'Chưa Xếp Hạng',
      themeColor: '#38bdf8',
      gradientFrom: '#0284c7',
      gradientTo: '#bae6fd',
      borderColor: 'border-sky-500/40',
      glowClass: 'from-sky-500/20 via-blue-500/10 to-transparent',
      category: 'valorant',
    };
  }

  // CS2
  if (type.includes('cs2') || lowerName.includes('cs2') || lowerName.includes('csgo')) {
    return {
      label: 'CS2 PRIME',
      subLabel: 'Bao Chơi Rank Sạch',
      themeColor: '#f97316',
      gradientFrom: '#c2410c',
      gradientTo: '#fed7aa',
      borderColor: 'border-orange-500/40',
      glowClass: 'from-orange-500/20 via-amber-500/10 to-transparent',
      category: 'cs2',
    };
  }

  // Steam
  if (type.includes('steam') || lowerName.includes('steam')) {
    const tier = type.includes('tier_3') || lowerName.includes('41+')
      ? 'TIER 3 (41+ Games)'
      : type.includes('tier_2') || lowerName.includes('11 - 40')
      ? 'TIER 2 (11-40 Games)'
      : 'TIER 1 (0-10 Games)';
    return {
      label: 'STEAM ACC',
      subLabel: tier,
      themeColor: '#60a5fa',
      gradientFrom: '#1d4ed8',
      gradientTo: '#bfdbfe',
      borderColor: 'border-blue-500/40',
      glowClass: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      category: 'steam',
    };
  }

  // PUBG
  if (type.includes('pubg') || lowerName.includes('pubg')) {
    return {
      label: 'PUBG PLUS',
      subLabel: 'Tài Khoản Rank Plus',
      themeColor: '#eab308',
      gradientFrom: '#a16207',
      gradientTo: '#fef08a',
      borderColor: 'border-amber-500/40',
      glowClass: 'from-amber-500/20 via-yellow-600/10 to-transparent',
      category: 'pubg',
    };
  }

  // Default fallback
  return {
    label: 'PRO ACC',
    subLabel: 'Tài Khoản Cao Cấp',
    themeColor: '#00e5a0',
    gradientFrom: '#059669',
    gradientTo: '#6ee7b7',
    borderColor: 'border-emerald-500/40',
    glowClass: 'from-emerald-500/20 to-transparent',
    category: 'valorant',
  };
}

export function RankEmblem({ accountType, name, size = 64 }: { accountType?: string; name?: string; size?: number }) {
  const config = getRankConfig(accountType, name);

  if (config.category === 'cs2') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="drop-shadow-lg">
        <defs>
          <linearGradient id="cs2Grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
        {/* Shield background */}
        <polygon points="50,6 88,24 88,62 50,94 12,62 12,24" fill="#0f172a" stroke="url(#cs2Grad)" strokeWidth="3" />
        {/* Star & wings */}
        <path d="M50 24 L56 38 L72 38 L60 48 L64 64 L50 54 L36 64 L40 48 L28 38 L44 38 Z" fill="url(#cs2Grad)" />
        <circle cx="50" cy="46" r="6" fill="#0f172a" stroke="#fff" strokeWidth="1.5" />
      </svg>
    );
  }

  if (config.category === 'steam') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="drop-shadow-lg">
        <defs>
          <linearGradient id="steamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {/* Steam Ring */}
        <circle cx="50" cy="50" r="42" fill="#0a1224" stroke="url(#steamGrad)" strokeWidth="3" />
        {/* Crank piston */}
        <circle cx="62" cy="38" r="14" stroke="url(#steamGrad)" strokeWidth="4" fill="none" />
        <circle cx="62" cy="38" r="6" fill="#38bdf8" />
        <circle cx="36" cy="62" r="10" stroke="url(#steamGrad)" strokeWidth="3" fill="#1e293b" />
        <circle cx="36" cy="62" r="4" fill="#6366f1" />
        <line x1="43" y1="56" x2="54" y2="44" stroke="url(#steamGrad)" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (config.category === 'pubg') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="drop-shadow-lg">
        <defs>
          <linearGradient id="pubgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        {/* Helmet base */}
        <path d="M22 52 C22 26 34 16 50 16 C66 16 78 26 78 52 C78 68 74 76 68 80 L32 80 C26 76 22 68 22 52 Z" fill="#1e293b" stroke="url(#pubgGrad)" strokeWidth="3" />
        {/* Visor slit */}
        <rect x="30" y="44" width="40" height="12" rx="3" fill="#050a14" stroke="url(#pubgGrad)" strokeWidth="2" />
        {/* Visor grid lines */}
        <line x1="40" y1="44" x2="40" y2="56" stroke="url(#pubgGrad)" strokeWidth="1.5" />
        <line x1="50" y1="44" x2="50" y2="56" stroke="url(#pubgGrad)" strokeWidth="1.5" />
        <line x1="60" y1="44" x2="60" y2="56" stroke="url(#pubgGrad)" strokeWidth="1.5" />
        {/* PLUS tag */}
        <rect x="36" y="66" width="28" height="10" rx="3" fill="url(#pubgGrad)" />
        <text x="50" y="74" textAnchor="middle" fill="#050a14" fontSize="8" fontWeight="900" fontFamily="monospace">PLUS</text>
      </svg>
    );
  }

  // Valorant Rank Shield / Crystal
  const gradId = `valoGrad_${config.label.toLowerCase()}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="drop-shadow-xl">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.gradientTo} />
          <stop offset="100%" stopColor={config.gradientFrom} />
        </linearGradient>
      </defs>
      {/* Outer Diamond Shield */}
      <polygon
        points="50,6 90,38 78,88 50,96 22,88 10,38"
        fill="#070d1a"
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
      />
      {/* Inner geometric facets */}
      <polygon
        points="50,18 80,42 70,80 50,86 30,80 20,42"
        fill={`url(#${gradId})`}
        fillOpacity="0.18"
      />
      {/* Valorant V Motif & Center Crest */}
      <path
        d="M32 36 L50 72 L68 36 L58 36 L50 56 L42 36 Z"
        fill={`url(#${gradId})`}
      />
      {/* Top accent gem */}
      <polygon
        points="50,22 58,32 50,42 42,32"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}
