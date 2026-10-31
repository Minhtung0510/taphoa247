import React from 'react';
import type { Metadata } from 'next';
import { CursorFullGuide } from '@/components/guide/CursorFullGuide';

export const metadata: Metadata = {
  title: 'Hướng Dẫn Cài Đặt & Sử Dụng Cursor AI Pro (Key VSIX) | Tạp Hóa 247',
  description:
    'Tài liệu chính thức hướng dẫn cài đặt Extension VSIX, kích hoạt Key bản quyền JG-CF, chuyển đổi tài khoản, chế độ Master/Ease và sửa 100% lỗi Cursor AI.',
};

export default function CursorGuidePage() {
  return (
    <div className="min-h-screen bg-[#040812]">
      <CursorFullGuide />
    </div>
  );
}
