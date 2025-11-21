import AdminLayoutWrapper from '@/components/admin/admin-layout-wrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Let the client-side AdminLayoutWrapper handle all auth checks
  // This avoids server-side pathname detection issues
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}

