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

      // Giữ cảnh báo Self-XSS trong console, không can thiệp phím tắt của người dùng
    }
  }, []);

  return null;
}
