'use client';

import { useState, useEffect } from 'react';

interface Deposit {
  id: string;
  userId: string;
  amount: number;
  txHash: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    referralCode: string;
  };
}

export default function AdminDepositsView() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/admin/deposits'
        : `/api/admin/deposits?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setDeposits(data.deposits);
      }
    } catch {
      // Error fetching deposits - continue
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (deposit: Deposit, actionType: 'approve' | 'reject') => {
    setSelectedDeposit(deposit);
    setAction(actionType);
    setAdminNote('');
    setShowModal(true);
  };

  const handleSubmitAction = async () => {
    if (!selectedDeposit || !action) return;

    setProcessing(true);
    setMessage(null);

    try {
      const endpoint = action === 'approve' 
        ? '/api/admin/deposit/approve'
        : '/api/admin/deposit/reject';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedDeposit.id,
          adminNote: adminNote || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const successMessage = data.message || 'Action completed successfully';
        if (data.data && action === 'approve') {
          // Show detailed success message with wallet balance info
          setMessage({ 
            type: 'success', 
            text: `${successMessage} User's deposit balance: $${data.data.walletBefore.toFixed(2)} → $${data.data.walletAfter.toFixed(2)}` 
          });
        } else {
          setMessage({ type: 'success', text: successMessage });
        }
        setShowModal(false);
        setSelectedDeposit(null);
        setAction(null);
        setAdminNote('');
        // Refresh deposits list
        await fetchDeposits();
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

  const pendingCount = deposits.filter((d) => d.status === 'PENDING').length;

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
            All ({deposits.length})
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

      {/* Deposits Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">All Deposits</h2>
          <button
            onClick={fetchDeposits}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : deposits.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No deposits found</p>
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
                    Transaction Hash
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
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">
                          {deposit.user.name || 'N/A'}
                        </p>
                        <p className="text-gray-700 text-xs font-medium">{deposit.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ${deposit.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-900 font-semibold">
                        {deposit.txHash.substring(0, 20)}...
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          deposit.status
                        )}`}
                      >
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium max-w-xs truncate">
                      {deposit.adminNote || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {deposit.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(deposit, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(deposit, 'reject')}
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

      {/* Admin Note Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {action === 'approve' ? 'Approve' : 'Reject'} Deposit
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Amount: <span className="font-semibold">${selectedDeposit.amount.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                User: <span className="font-semibold">{selectedDeposit.user.email}</span>
              </p>
              <p className="text-sm text-gray-700 mb-4 font-medium">
                TX Hash: <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-900 font-semibold">{selectedDeposit.txHash}</code>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Note (Optional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note about this action..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedDeposit(null);
                  setAction(null);
                  setAdminNote('');
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

