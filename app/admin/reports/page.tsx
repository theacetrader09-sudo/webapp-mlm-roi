import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ReportsView from '@/components/admin/reports-view';

export default async function AdminReportsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-2 text-gray-600">View system reports and analytics</p>
      </div>

      <ReportsView />
    </div>
  );
}

