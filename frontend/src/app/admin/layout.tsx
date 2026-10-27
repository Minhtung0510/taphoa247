import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Trị Hệ Thống - DTFF SHOP',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
