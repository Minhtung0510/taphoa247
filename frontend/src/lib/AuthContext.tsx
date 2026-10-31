'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from './api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  discord_id?: string;
  is_admin?: boolean;
  balance?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  sendOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  getDiscordRedirectUrl: () => Promise<string | null>;
  setAuthSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Khôi phục session từ token khi render lần đầu (bảo mật: không lưu dtff_auth_user ở LocalStorage)
  useEffect(() => {
    // Tự động quét dọn mọi key nhạy cảm cũ khỏi LocalStorage
    try {
      localStorage.removeItem('dtff_auth_user');
    } catch {}

    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('dtff_auth_token') : null;

    if (savedToken) {
      setToken(savedToken);

      // BẮT BUỘC xác thực danh tính thực tế với Server (/auth/me)
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
          Accept: 'application/json',
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token expired');
          return res.json();
        })
        .then((json) => {
          if (json.success && json.data) {
            // Giữ thông tin user trong bộ nhớ RAM, tuyệt đối KHÔNG lưu role/is_admin ra LocalStorage
            setUser(json.data);
          }
        })
        .catch(() => {
          // Token không còn hợp lệ -> thu hồi sạch sẽ
          localStorage.removeItem('dtff_auth_token');
          localStorage.removeItem('dtff_auth_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const setAuthSession = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('dtff_auth_token', newToken);
    // BẢO MẬT: Xóa hoàn toàn dtff_auth_user để F12 không thấy role hay is_admin để sửa
    localStorage.removeItem('dtff_auth_user');
  };

  // 1. Đăng nhập truyền thống (Email + Password)
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Email hoặc mật khẩu không chính xác.' };
      }

      setAuthSession(data.data.token, data.data.user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ.' };
    }
  };

  // 2. Gửi mã OTP xác thực email
  const sendOtp = async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      return { success: data.success ?? res.ok, message: data.message || 'Mã xác thực đã được gửi.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi gửi yêu cầu OTP.' };
    }
  };

  // 3. Đăng ký tài khoản mới (Email + Password + OTP)
  const register = async (name: string, email: string, password: string, otp: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, password, otp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Đăng ký không thành công.' };
      }

      setAuthSession(data.data.token, data.data.user);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi kết nối máy chủ.' };
    }
  };

  // 3. Lấy link Discord OAuth thực tế
  const getDiscordRedirectUrl = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/discord/redirect`);
      const data = await res.json();
      if (data.success && data.data?.auth_url) {
        return data.data.auth_url as string;
      }
      return null;
    } catch {
      return null;
    }
  };

  // 4. Đăng xuất
  const logout = async () => {
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }).catch(() => {});
    }
    localStorage.removeItem('dtff_auth_token');
    localStorage.removeItem('dtff_auth_user');
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  // Wrapper fetch có kèm token nếu đăng nhập
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        sendOtp,
        register,
        getDiscordRedirectUrl,
        setAuthSession,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
