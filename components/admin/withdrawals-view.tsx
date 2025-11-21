'use client';

import { useState, useEffect } from 'react';

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  walletBefore: number;
  walletAfter: number;
  status: string;
  adminNote: string | null;
  txReference: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    referralCode: string;
    wallet: {
      id: string;
      balance: number;
    } | null;
  };
}

export default function AdminWithdrawalsView() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [txReference, setTxReference] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/admin/withdrawals'
        : `/api/admin/withdrawals?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch {
      // Error fetching withdrawals - continue
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (withdrawal: Withdrawal, actionType: 'approve' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setAction(actionType);
    setAdminNote('');
    setTxReference('');
    setShowModal(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedWithdrawal || !action) return;

    setProcessing(true);
    setMessage(null);

    try {
      const endpoint = action === 'approve' 
        ? '/api/admin/withdraw/approve'
        : '/api/admin/withdraw/reject';

      const body: { id: string; adminNote: string | null; txReference?: string } = {
        id: selectedWithdrawal.id,
        adminNote: adminNote || null,
      };

      if (action === 'approve' && txReference) {
        body.txReference = txReference;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message || 'Action completed successfully' });
        setShowModal(false);
        setSelectedWithdrawal(null);
        setAction(null);
        setAdminNote('');
        setTxReference('');
        await fetchWithdrawals();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to process action' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;
  const afterBalance = selectedWithdrawal 
    ? selectedWithdrawal.walletBefore - selectedWithdrawal.amount
    : 0;

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({withdrawals.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'PENDING'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'APPROVED'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'REJECTED'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">All Withdrawals</h2>
          <button
            onClick={fetchWithdrawals}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No withdrawals found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    Wallet Before
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    Current Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    Admin Note
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {withdrawal.user.name || 'N/A'}
                        </p>
                        <p className="text-gray-700 text-xs font-medium">{withdrawal.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ${withdrawal.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                      ${withdrawal.walletBefore.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {withdrawal.user.wallet ? (
                        <span className="font-medium text-gray-900">
                          ${withdrawal.user.wallet.balance.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-600 font-medium">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          withdrawal.status
                        )}`}
                      >
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium max-w-xs truncate">
                      {withdrawal.adminNote || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {withdrawal.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(withdrawal, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(withdrawal, 'reject')}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {action === 'approve' ? 'Approve' : 'Reject'} Withdrawal
            </h3>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600">
                User: <span className="font-semibold">{selectedWithdrawal.user.email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Amount: <span className="font-semibold">${selectedWithdrawal.amount.toFixed(2)}</span>
              </p>
              {action === 'approve' && (
                <>
                  <p className="text-sm text-gray-600">
                    Wallet Before: <span className="font-semibold">${selectedWithdrawal.walletBefore.toFixed(2)}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Wallet After: <span className="font-semibold text-green-600">${afterBalance.toFixed(2)}</span>
                  </p>
                  {selectedWithdrawal.user.wallet && selectedWithdrawal.user.wallet.balance < selectedWithdrawal.amount && (
                    <p className="text-sm text-red-600 font-medium">
                      ⚠️ Warning: Current balance (${selectedWithdrawal.user.wallet.balance.toFixed(2)}) is less than withdrawal amount!
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Note {action === 'approve' && '(Optional)'}
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note about this action..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                required={action === 'reject'}
              />
            </div>
            {action === 'approve' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={txReference}
                  onChange={(e) => setTxReference(e.target.value)}
                  placeholder="Enter payout transaction reference..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
                />
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedWithdrawal(null);
                  setAction(null);
                  setAdminNote('');
                  setTxReference('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {processing ? 'Processing...' : action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

