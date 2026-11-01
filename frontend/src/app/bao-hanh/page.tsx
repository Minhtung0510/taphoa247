import type { Metadata } from 'next';
import WarrantyClient from './WarrantyClient';

export const metadata: Metadata = {
  title: 'Trung Tâm Bảo Hành',
  description:
    'Tra cứu điều kiện bảo hành và gửi yêu cầu hỗ trợ cho đơn hàng tại Tạp Hóa 247.',
  alternates: { canonical: 'https://taphoa247.io.vn/bao-hanh' },
  openGraph: {
    title: 'Trung Tâm Bảo Hành | Tạp Hóa 247',
    description: 'Tra cứu điều kiện bảo hành và gửi yêu cầu hỗ trợ cho đơn hàng tại Tạp Hóa 247.',
    url: 'https://taphoa247.io.vn/bao-hanh',
    type: 'website',
  },
};

export default function WarrantyPage() {
  return <WarrantyClient />;
}
