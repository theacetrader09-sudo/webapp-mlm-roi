import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminUsersView from '@/components/admin/admin-users-view';

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">Manage all users, edit data, and adjust balances</p>
      </div>

      <AdminUsersView />
    </div>
  );
}

