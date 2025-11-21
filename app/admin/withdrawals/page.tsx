import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the client component to avoid SSR issues
const AdminWithdrawalsView = dynamic(
  () => import('@/components/admin/withdrawals-view'),
  { ssr: false }
);

export default async function AdminWithdrawalsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Withdrawals Management</h1>
        <p className="mt-2 text-gray-600">Approve, reject, and manage user withdrawal requests</p>
      </div>

      <AdminWithdrawalsView />
    </div>
  );
}

