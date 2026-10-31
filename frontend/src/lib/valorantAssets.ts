// Helper for Valorant Ranks and Skin Icons mapping via Valorant-API CDN

export interface ValorantRankMeta {
  displayName: string;
  tierNumber: number;
  icon: string;
  color: string;
}

const RANK_DATA: Record<string, { tier: number; icon: string; color: string }> = {
  unranked: {
    tier: 0,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/0/smallicon.png',
    color: '#818cf8',
  },
  iron: {
    tier: 5,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/5/smallicon.png',
    color: '#a1a1aa',
  },
  bronze: {
    tier: 8,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/8/smallicon.png',
    color: '#d97706',
  },
  silver: {
    tier: 11,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/11/smallicon.png',
    color: '#cbd5e1',
  },
  gold: {
    tier: 13,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/13/smallicon.png',
    color: '#facc15',
  },
  platinum: {
    tier: 16,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/16/smallicon.png',
    color: '#38bdf8',
  },
  diamond: {
    tier: 19,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/19/smallicon.png',
    color: '#c084fc',
  },
  ascendant: {
    tier: 22,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/22/smallicon.png',
    color: '#34d399',
  },
  immortal: {
    tier: 25,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/25/smallicon.png',
    color: '#f43f5e',
  },
  radiant: {
    tier: 27,
    icon: 'https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/27/smallicon.png',
    color: '#fef08a',
  },
};

export function getRankMeta(rankStr?: string): ValorantRankMeta {
  const normalized = (rankStr || '').toLowerCase();
  for (const [key, data] of Object.entries(RANK_DATA)) {
    if (normalized.includes(key)) {
      return {
        displayName: rankStr || 'Unranked',
        tierNumber: data.tier,
        icon: data.icon,
        color: data.color,
      };
    }
  }
  return {
    displayName: rankStr || 'Unranked',
    tierNumber: 0,
    icon: RANK_DATA.unranked.icon,
    color: RANK_DATA.unranked.color,
  };
}

// In-memory cache for skin names to displayIcon
let skinsCache: Map<string, string> | null = null;
let fetchingSkins: Promise<Map<string, string>> | null = null;

// Preloaded popular skins mapping so initial render has instant zero-delay images
const PRELOADED_SKINS: Record<string, string> = {
  'bubble pop classic': 'https://media.valorant-api.com/weaponskins/d90a940b-4040-4c7b-7a9b-7ab574429226/displayicon.png',
  'byteshift ghost': 'https://media.valorant-api.com/weaponskins/cd3f54e0-45f4-116b-c86c-cc8ca728c369/displayicon.png',
  'overlay sheriff': 'https://media.valorant-api.com/weaponskins/63260230-44aa-2a9f-71db-329e2a3afab5/displayicon.png',
  'nanobreak sheriff': 'https://media.valorant-api.com/weaponskins/1e8fc4bc-4940-88fc-639e-b0b74bfdae18/displayicon.png',
  'atlas // cmd classic': 'https://media.valorant-api.com/weaponskins/1a8f0b7c-47ff-d5ff-c23f-e8b15d02324f/displayicon.png',
  'solarex sheriff': 'https://media.valorant-api.com/weaponskins/3c2a93f4-436e-d98c-6878-3db823e20ec4/displayicon.png',
  'velocity shorty': 'https://media.valorant-api.com/weaponskins/3ee60212-4cbe-4c4f-c0bb-f99ec006e232/displayicon.png',
  'aero frenzy': 'https://media.valorant-api.com/weaponskins/a1b8cf26-4448-73b3-1f19-33b8656ee5db/displayicon.png',
  'celestia ghost': 'https://media.valorant-api.com/weaponskins/c329b3be-4977-8c88-17a4-ad9fdb8234ea/displayicon.png',
  'fire/arm classic': 'https://media.valorant-api.com/weaponskins/05698b64-44aa-4952-bfd7-628fcf4fca1a/displayicon.png',
  'immortalized sheriff': 'https://media.valorant-api.com/weaponskins/5c98cf29-4592-80ba-3522-68a8c43fb721/displayicon.png',
  'karabasan shorty': 'https://media.valorant-api.com/weaponskins/f0e69882-4fa1-ca91-d21f-a39c9fe7fa1d/displayicon.png',
  'live wire frenzy': 'https://media.valorant-api.com/weaponskins/49195b45-4235-9f5b-b9d9-6bbad71c3506/displayicon.png',
  'shimmer classic': 'https://media.valorant-api.com/weaponskins/c8973b75-4c07-b3ff-24a6-7788cb20cfa8/displayicon.png',
  'striker classic': 'https://media.valorant-api.com/weaponskins/55a8f7c9-43c3-3286-90bb-589fc25b7d90/displayicon.png',
  'vendetta ghost': 'https://media.valorant-api.com/weaponskins/62d85b1a-4be8-30ae-9a63-ad97d67fa17e/displayicon.png',
  'prime vandal': 'https://media.valorant-api.com/weaponskins/9c82e19d-4575-0200-1a81-3eacf001872b/displayicon.png',
  'reaver vandal': 'https://media.valorant-api.com/weaponskins/b4c8167d-41f8-0524-2c3f-c19a973ee24f/displayicon.png',
  'kuronami vandal': 'https://media.valorant-api.com/weaponskins/1ebec755-4421-2e21-0a6b-c39f04646193/displayicon.png',
  'oni phantom': 'https://media.valorant-api.com/weaponskins/ebdb3e33-40a2-aa92-f0b4-3a95b45c2f90/displayicon.png',
};

export async function fetchAllSkinsMap(): Promise<Map<string, string>> {
  if (skinsCache) return skinsCache;
  if (fetchingSkins) return fetchingSkins;

  fetchingSkins = fetch('https://valorant-api.com/v1/weapons/skins')
    .then((res) => res.json())
    .then((json) => {
      const map = new Map<string, string>();
      // Pre-seed
      for (const [k, v] of Object.entries(PRELOADED_SKINS)) {
        map.set(k, v);
      }
      if (json && json.data) {
        for (const s of json.data) {
          if (s.displayName && s.displayIcon) {
            map.set(s.displayName.toLowerCase().trim(), s.displayIcon);
          }
        }
      }
      skinsCache = map;
      return map;
    })
    .catch(() => {
      const map = new Map<string, string>();
      for (const [k, v] of Object.entries(PRELOADED_SKINS)) {
        map.set(k, v);
      }
      skinsCache = map;
      return map;
    });

  return fetchingSkins;
}

export function getQuickSkinIcon(skinName: string): string | null {
  const norm = skinName.toLowerCase().trim();
  if (PRELOADED_SKINS[norm]) return PRELOADED_SKINS[norm];
  if (skinsCache && skinsCache.has(norm)) return skinsCache.get(norm) || null;
  return null;
}
