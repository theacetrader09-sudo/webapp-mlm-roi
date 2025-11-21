'use client';

import { useState, useEffect } from 'react';

interface WithdrawFormProps {
  currentBalance: number;
}

interface Withdrawal {
  id: string;
  amount: number;
  walletBefore: number;
  walletAfter: number;
  status: string;
  adminNote: string | null;
  txReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function WithdrawForm({ currentBalance }: WithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [balance, setBalance] = useState(currentBalance);

  useEffect(() => {
    fetchHistory();
    // Fetch updated balance
    fetch('/api/user/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.wallet) {
          setBalance(data.wallet.balance);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/withdraw/history');
      const data = await response.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch {
      // Error fetching withdrawal history - continue
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit withdrawal request');
        setLoading(false);
        return;
      }

      setSuccess('Withdrawal request submitted successfully! Awaiting admin approval.');
      setAmount('');
      await fetchHistory();
      
      // Update balance
      const userResponse = await fetch('/api/user/me');
      const userData = await userResponse.json();
      if (userData.wallet) {
        setBalance(userData.wallet.balance);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
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

  const canWithdraw = balance > 0 && parseFloat(amount) > 0 && parseFloat(amount) <= balance;

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Balance</h2>
        <div className="text-4xl font-bold text-indigo-600 mb-2">
          ${balance.toFixed(2)}
        </div>
        <p className="text-sm text-gray-500">
          Available for withdrawal
        </p>
      </div>

      {/* Withdrawal Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Withdrawal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Withdrawal Amount (USD)
            </label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder={`Enter amount (max: $${balance.toFixed(2)})`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 font-medium"
            />
            {parseFloat(amount) > balance && (
              <p className="text-sm text-red-600 mt-1">
                Amount exceeds available balance
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !canWithdraw}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdrawal History</h2>
        {loadingHistory ? (
          <p className="text-gray-500">Loading...</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No withdrawals yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Admin Note
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    TX Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(withdrawal.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ${withdrawal.amount.toFixed(2)}
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {withdrawal.adminNote || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {withdrawal.txReference ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                          {withdrawal.txReference}
                        </code>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

