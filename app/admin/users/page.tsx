import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminUsersView from '@/components/admin/admin-users-view';

// Mark as dynamic to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  try {
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
  } catch (error) {
    console.error('Admin Users Page - Error:', error);
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Users</h2>
          <p className="text-red-700">
            An error occurred while loading the users page. Please try refreshing.
          </p>
          <p className="text-sm text-red-600 mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}

