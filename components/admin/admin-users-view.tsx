'use client';

import { useState, useEffect } from 'react';
import AdminUserEditModal from './admin-user-edit-modal';
import AdminUserDetailModal from './admin-user-detail-modal';

interface User {
  id: string;
  name: string | null;
  email: string | null; // Allow null email
  referralCode: string;
  referredBy: string | null;
  role: string;
  createdAt: string;
  wallet: {
    balance: number;
    depositBalance: number;
    roiTotal: number;
    referralTotal: number;
  } | null;
  counts: {
    investments: number;
    deposits: number;
    withdrawals: number;
  };
}

export default function AdminUsersView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (search) params.append('search', search);
      if (roleFilter !== 'ALL') params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      
      const data = await response.json();

      console.log('Admin Users View - API Response:', {
        ok: response.ok,
        status: response.status,
        success: data.success,
        usersCount: data.users?.length || 0,
        total: data.pagination?.total || 0,
        error: data.error,
      });

      if (!response.ok) {
        const errorMsg = data.error || `Error ${response.status}`;
        console.error('API Error:', errorMsg, data);
        setError(errorMsg);
        setUsers([]);
        setTotalPages(0);
        return;
      }

      if (data.success) {
        const fetchedUsers = data.users || [];
        console.log('Users fetched successfully:', fetchedUsers.length, 'users');
        console.log('Sample user data:', fetchedUsers.length > 0 ? fetchedUsers[0] : 'No users');
        console.log('Pagination:', data.pagination);
        
        // Ensure we have valid user data
        const validUsers = fetchedUsers.filter((u: any) => u && u.id);
        console.log('Valid users after filtering:', validUsers.length);
        
        if (validUsers.length === 0 && fetchedUsers.length > 0) {
          console.error('All users were filtered out!', fetchedUsers);
          setError('Users data format is invalid. Please check console for details.');
        }
        
        setUsers(validUsers);
        setTotalPages(data.pagination?.totalPages || 0);
      } else {
        console.error('API returned success=false:', data);
        setError(data.error || 'Failed to fetch users');
        setUsers([]);
        setTotalPages(0);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching users:', error);
      setError(`Failed to fetch users: ${errorMsg}`);
      setUsers([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleViewDetails = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedUser(data.user);
        setDetailModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete user' }));
        alert(errorData.error || `Failed to delete user: ${response.status}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        fetchUsers();
        alert('User deleted successfully');
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={() => {
                setError(null);
                fetchUsers();
              }}
              className="ml-auto text-red-600 hover:text-red-800 underline text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by email, name, or referral code..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">Users</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-500 mb-4">No users found</div>
            {error && (
              <div className="text-sm text-red-600 mt-2">
                {error}
              </div>
            )}
            <button
              onClick={() => {
                setError(null);
                fetchUsers();
              }}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-semibold">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-semibold">
                      Referral Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-semibold">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-semibold">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-semibold">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-700 font-medium">
                            {user.email || 'No email'}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">{user.referralCode}</div>
                        {user.referredBy && (
                          <div className="text-xs text-gray-700 font-medium">Referred by: {user.referredBy}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">
                          Main: ${(user.wallet?.balance || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-700 font-medium">
                          Deposit: ${(user.wallet?.depositBalance || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                        <div>Investments: {user.counts.investments}</div>
                        <div>Deposits: {user.counts.deposits}</div>
                        <div>Withdrawals: {user.counts.withdrawals}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(user)}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <AdminUserEditModal
            user={selectedUser}
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={() => {
              fetchUsers();
              setEditModalOpen(false);
              setSelectedUser(null);
            }}
          />
          <AdminUserDetailModal
            user={selectedUser}
            open={detailModalOpen}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedUser(null);
            }}
          />
        </>
      )}
    </div>
  );
}

