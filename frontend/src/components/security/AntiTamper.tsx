'use client';

import { useEffect } from 'react';

export function AntiTamper() {
  useEffect(() => {
    // 1. Cảnh báo DevTools chống dính Console Scams / Self-XSS
    if (typeof window !== 'undefined') {
      const banner = `%cTẠP HÓA 247 SHIELD SYSTEM 🛡️\n%cDỪNG LẠI! Đây là tính năng dành cho nhà phát triển hệ thống.\nNếu ai đó bảo bạn dán mã vào đây để nhận acc miễn phí hoặc tiền, đó là hành vi LỪA ĐẢO chiếm đoạt tài khoản (Self-XSS)!`;
      console.log(
        banner,
        'color: #00f59b; font-size: 20px; font-weight: bold;',
        'color: #ef4444; font-size: 13px; font-weight: 600;'
      );

      // 2. Chặn các phím tắt mở DevTools cơ bản trên trình duyệt đối với khách vãng lai
      const handleKeyDown = (e: KeyboardEvent) => {
        // F12
        if (e.key === 'F12') {
          // Cho phép admin mở nếu đang giữ phím Alt+F12, còn lại chặn mặc định
          if (!e.altKey) {
            e.preventDefault();
            return false;
          }
        }

        // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+U
        if (
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
          (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
        ) {
          if (!e.altKey) {
            e.preventDefault();
            return false;
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, []);

  return null;
}
