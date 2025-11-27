'use client';

import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon, href, trend }: StatCardProps) {
  const content = (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={`mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="p-3 bg-purple-100 rounded-lg">{icon}</div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface AdminDashboardStatsProps {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeInvestments: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalRevenue: number;
  totalPayouts: number;
  recentDeposits: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    user: { email: string | null; name: string | null };
  }>;
  recentWithdrawals: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    user: { email: string | null; name: string | null };
  }>;
}

export default function AdminDashboardStats({
  totalUsers,
  totalDeposits,
  totalWithdrawals,
  activeInvestments,
  pendingDeposits,
  pendingWithdrawals,
  totalRevenue,
  totalPayouts,
  recentDeposits,
  recentWithdrawals,
}: AdminDashboardStatsProps) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
          href="/admin/users"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${totalDeposits} approved deposits`}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          href="/admin/deposits"
        />
        <StatCard
          title="Total Payouts"
          value={`$${totalPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtitle={`${totalWithdrawals} approved withdrawals`}
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          }
          href="/admin/withdrawals"
        />
        <StatCard
          title="Active Investments"
          value={activeInvestments.toLocaleString()}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          href="/admin/investments"
        />
      </div>

      {/* Pending Actions */}
      {(pendingDeposits > 0 || pendingWithdrawals > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Pending Actions</h3>
              <p className="text-sm text-yellow-600 mt-1">
                {pendingDeposits} pending deposit{pendingDeposits !== 1 ? 's' : ''} • {pendingWithdrawals} pending withdrawal{pendingWithdrawals !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex space-x-3">
              {pendingDeposits > 0 && (
                <Link
                  href="/admin/deposits?status=PENDING"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Review Deposits
                </Link>
              )}
              {pendingWithdrawals > 0 && (
                <Link
                  href="/admin/withdrawals?status=PENDING"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Review Withdrawals
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Deposits */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Deposits</h3>
              <Link href="/admin/deposits" className="text-sm text-purple-600 hover:text-purple-700">
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentDeposits.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">No recent deposits</div>
            ) : (
              recentDeposits.map((deposit) => (
                <div key={deposit.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {deposit.user.name || deposit.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(deposit.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${deposit.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          deposit.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : deposit.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {deposit.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Withdrawals</h3>
              <Link href="/admin/withdrawals" className="text-sm text-purple-600 hover:text-purple-700">
                View all →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentWithdrawals.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">No recent withdrawals</div>
            ) : (
              recentWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {withdrawal.user.name || withdrawal.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(withdrawal.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${withdrawal.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          withdrawal.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : withdrawal.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

