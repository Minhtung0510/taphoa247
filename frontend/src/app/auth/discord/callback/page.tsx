'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import Link from 'next/link';

function DiscordCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setAuthSession } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const executedRef = useRef(false);

  useEffect(() => {
    // Nếu user đã đăng nhập thành công thì chuyển hướng ngay
    if (user) {
      router.replace('/lich-su-don-hang');
      return;
    }

    if (executedRef.current) return;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage('Bạn đã hủy liên kết hoặc từ chối cấp quyền từ Discord.');
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('Không tìm thấy mã xác thực (code) từ Discord.');
      return;
    }

    executedRef.current = true;

    // Gửi code lên Backend để xác thực (chỉ chạy 1 lần duy nhất)
    fetch(`${API_BASE_URL}/auth/discord/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: window.location.origin + '/auth/discord/callback',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.token) {
          setAuthSession(data.data.token, data.data.user);
          setStatus('success');
          router.replace('/lich-su-don-hang');
        } else {
          // Nếu mã báo invalid_grant nhưng user trong localStorage đã có phiên đăng nhập
          const existingToken = localStorage.getItem('dtff_auth_token');
          if (existingToken) {
            router.replace('/lich-su-don-hang');
            return;
          }
          setStatus('error');
          setErrorMessage(data.message || 'Xác thực tài khoản Discord thất bại.');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Lỗi kết nối máy chủ xác thực.');
      });
  }, [searchParams, router, setAuthSession, user]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#5865F2]/20 flex items-center justify-center animate-bounce">
              <span className="text-3xl">🎮</span>
            </div>
            <h2 className="text-xl font-bold text-white">Đang kết nối Discord...</h2>
            <p className="text-xs text-slate-400">
              Hệ thống đang đồng bộ tài khoản và đơn hàng của bạn. Vui lòng chờ trong giây lát.
            </p>
            <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-[#5865F2] mx-auto rounded-full animate-pulse" />
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl">
              ✓
            </div>
            <h2 className="text-xl font-bold text-emerald-400">Đăng Nhập Thành Công!</h2>
            <p className="text-xs text-slate-300">
              Đang chuyển hướng bạn tới trang Lịch Sử Đơn Hàng...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-3xl">
              ✕
            </div>
            <h2 className="text-xl font-bold text-red-400">Liên Kết Thất Bại</h2>
            <p className="text-xs text-slate-400">{errorMessage}</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href="/"
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Về Trang Chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiscordCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">
          Đang tải dữ liệu xác thực...
        </div>
      }
    >
      <DiscordCallbackContent />
    </Suspense>
  );
}
