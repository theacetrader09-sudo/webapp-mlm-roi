import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">Configure system-wide settings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <p className="text-sm text-gray-900">
                  {process.env.NODE_ENV || 'development'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Database
                </label>
                <p className="text-sm text-gray-900">PostgreSQL (NeonDB)</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Mode</h3>
            <p className="text-sm text-gray-600 mb-4">
              When enabled, only admins can access the system. Regular users will see a maintenance message.
            </p>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenance"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                disabled
              />
              <label htmlFor="maintenance" className="ml-2 text-sm text-gray-700">
                Enable Maintenance Mode (Coming Soon)
              </label>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin Route Protection</p>
                  <p className="text-xs text-gray-500">All admin routes require ADMIN role</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Audit Logging</p>
                  <p className="text-xs text-gray-500">All admin actions are logged</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

