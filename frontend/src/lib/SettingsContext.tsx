'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface StoreSettings {
  store_name?: string;
  store_slogan?: string;
  store_hotline?: string;
  store_telegram?: string;
  store_facebook?: string;
  store_zalo_group?: string;
  banner_active?: boolean;
  banner_text?: string;
  banner_gift_code?: string;
  banner_gift_discount_text?: string;
  store_real_hearts?: number;
  store_maintenance_mode?: boolean;
  [key: string]: any;
}

const defaultSettings: StoreSettings = {
  store_name: 'Tạp Hóa 247',
  store_slogan: 'Shop Bán Acc Game, Tài Khoản AI & Phần Mềm Tự Động 24/7 Uy Tín #1',
  store_hotline: '0937809305',
  store_zalo_group: 'https://zalo.me/g/ovxv2lnx8zvdw8f6q6qb',
  store_telegram: 'https://t.me/dtffshop',
  store_facebook: 'https://www.facebook.com/bill300213/',
  banner_active: false,
  banner_text: 'Ưu đãi đặc biệt: Tặng bảo hiểm tài khoản 5 tiếng cho toàn bộ đơn hàng hôm nay!',
  banner_gift_code: 'CHAOBANMOI',
  banner_gift_discount_text: 'Giảm 100% (tối đa 50.000đ)',
  store_real_hearts: 86,
  store_maintenance_mode: false,
};

const SettingsContext = createContext<StoreSettings>(defaultSettings);

import { API_BASE_URL } from '@/lib/api';

export function SettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings?: StoreSettings | null;
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<StoreSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dtff_settings_data');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return initialSettings || defaultSettings;
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings((prev) => ({ ...prev, ...initialSettings }));
    }
  }, [initialSettings]);

  useEffect(() => {
    const fetchLatestSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/store/settings`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setSettings(json.data);
            try {
              localStorage.setItem('dtff_settings_data', JSON.stringify(json.data));
            } catch {}
          }
        }
      } catch {}
    };

    // 1. Lắng nghe cập nhật cùng tab (từ Admin form)
    const onLocalUpdated = (e: any) => {
      if (e.detail) {
        setSettings((prev) => ({ ...prev, ...e.detail }));
      }
    };

    // 2. Lắng nghe cập nhật chéo tab (khi admin sửa ở tab Admin, tab Khách đổi ngay lập tức 0ms)
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'dtff_settings_data' && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'dtff_settings_sync') {
        fetchLatestSettings();
      }
    };

    // 3. Tự động kiểm tra đồng bộ khi quay lại tab
    const onFocus = () => fetchLatestSettings();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestSettings();
      }
    };

    window.addEventListener('dtff_settings_updated', onLocalUpdated);
    window.addEventListener('storage', onStorageChange);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('dtff_settings_updated', onLocalUpdated);
      window.removeEventListener('storage', onStorageChange);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(SettingsContext);
}
