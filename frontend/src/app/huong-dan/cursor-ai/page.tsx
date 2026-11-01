import React from 'react';
import type { Metadata } from 'next';
import { CursorFullGuide } from '@/components/guide/CursorFullGuide';

export const metadata: Metadata = {
  title: 'Hướng Dẫn Cài Đặt & Sử Dụng Cursor AI Pro (Key VSIX)',
  description:
    'Tài liệu chính thức hướng dẫn cài đặt Extension VSIX, kích hoạt Key bản quyền JG-CF, chuyển đổi tài khoản, chế độ Master/Ease và sửa 100% lỗi Cursor AI.',
  alternates: { canonical: 'https://taphoa247.io.vn/huong-dan/cursor-ai' },
  openGraph: {
    title: 'Hướng Dẫn Cài Đặt & Sử Dụng Cursor AI Pro | Tạp Hóa 247',
    description:
      'Hướng dẫn cài đặt Extension VSIX, kích hoạt key, chuyển đổi tài khoản và xử lý sự cố Cursor AI.',
    url: 'https://taphoa247.io.vn/huong-dan/cursor-ai',
    type: 'article',
  },
};

export default function CursorGuidePage() {
  return (
    <div className="min-h-screen bg-[#040812]">
      <CursorFullGuide />
    </div>
  );
}
