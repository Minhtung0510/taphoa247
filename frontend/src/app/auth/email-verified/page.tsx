'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export default function EmailVerifiedPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác minh email…');

  useEffect(() => {
    const token = window.location.hash.slice(1);
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) {
      setStatus('error');
      setMessage('Link xác minh không hợp lệ hoặc đã được sử dụng.');
      return;
    }
    fetch(`${API_BASE_URL}/auth/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async response => {
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Không thể xác minh email.');
      setStatus('success');
      setMessage('Email tài khoản của bạn đã được xác minh thành công.');
    }).catch(error => {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Không thể xác minh email.');
    });
  }, []);

  return <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
    <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d1522] p-8 text-center shadow-2xl shadow-black/20">
      <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl ${status === 'error' ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}>{status === 'loading' ? '…' : status === 'success' ? '✓' : '!'}</div>
      <h1 className="mt-5 text-2xl font-black text-white">{status === 'success' ? 'Email đã được xác minh' : status === 'error' ? 'Không thể xác minh' : 'Đang xác minh email'}</h1>
      <p role="status" className="mt-2 text-sm text-slate-400">{message}</p>
      {status !== 'loading' && <Link href="/" className="mt-6 inline-flex rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950">Về trang chủ</Link>}
    </section>
  </main>;
}
