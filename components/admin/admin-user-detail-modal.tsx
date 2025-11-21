'use client';

interface AdminUserDetailModalProps {
  user: any;
  open: boolean;
  onClose: () => void;
}

export default function AdminUserDetailModal({
  user,
  open,
  onClose,
}: AdminUserDetailModalProps) {
  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">User Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-700 font-semibold">Name</label>
                    <p className="text-sm font-medium text-gray-900">{user.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-semibold">Email</label>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-semibold">Referral Code</label>
                    <p className="text-sm font-medium text-gray-900">{user.referralCode}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-semibold">Referred By</label>
                    <p className="text-sm font-medium text-gray-900">{user.referredBy || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-semibold">Role</label>
                    <p className="text-sm font-medium text-gray-900">{user.role}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-700 font-semibold">Joined</label>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(user.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              {user.wallet && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Wallet Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-700 font-semibold">Main Balance</label>
                      <p className="text-sm font-medium text-gray-900">
                        ${user.wallet.balance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-700 font-semibold">Deposit Balance</label>
                      <p className="text-sm font-medium text-gray-900">
                        ${user.wallet.depositBalance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-700 font-semibold">Total ROI Earned</label>
                      <p className="text-sm font-medium text-gray-900">
                        ${user.wallet.roiTotal?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-700 font-semibold">Total Referral Earned</label>
                      <p className="text-sm font-medium text-gray-900">
                        ${user.wallet.referralTotal?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Investments */}
              {user.investments && user.investments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Investments</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Package</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Daily ROI</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {user.investments.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="px-3 py-2 text-sm text-gray-900">{inv.packageName}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">${inv.amount.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{inv.dailyROI}%</td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                inv.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Deposits */}
              {user.deposits && user.deposits.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Deposits</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {user.deposits.map((dep: any) => (
                          <tr key={dep.id}>
                            <td className="px-3 py-2 text-sm text-gray-900">${dep.amount.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                dep.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                dep.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {dep.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700 font-medium">
                              {new Date(dep.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Withdrawals */}
              {user.withdrawals && user.withdrawals.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Withdrawals</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Status</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {user.withdrawals.map((w: any) => (
                          <tr key={w.id}>
                            <td className="px-3 py-2 text-sm text-gray-900">${w.amount.toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs ${
                                w.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-700 font-medium">
                              {new Date(w.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

