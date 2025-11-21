'use client';

import { useState } from 'react';

export default function AdminFinancialView() {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [balanceType, setBalanceType] = useState<'balance' | 'depositBalance'>('balance');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSearchUser = async () => {
    if (!userEmail) return;

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(userEmail)}&limit=1`);
      const data = await response.json();

      if (data.success && data.users.length > 0) {
        setUserId(data.users[0].id);
        setSuccess(`User found: ${data.users[0].name || data.users[0].email}`);
      } else {
        setError('User not found');
        setUserId('');
      }
    } catch (error) {
      setError('Failed to search user');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userId || !amount) {
      setError('Please search and select a user, and enter an amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/financial/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: balanceType,
          amount: parseFloat(amount),
          note,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Balance adjusted successfully. New ${balanceType}: $${data.newBalance.toFixed(2)}`);
        setAmount('');
        setNote('');
      } else {
        setError(data.error || 'Failed to adjust balance');
      }
    } catch (error) {
      setError('Failed to adjust balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Adjust User Balance</h2>

        <form onSubmit={handleAdjustBalance} className="space-y-4">
          {/* User Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search User by Email
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleSearchUser}
                disabled={loading || !userEmail}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Search
              </button>
            </div>
            {userId && (
              <p className="mt-2 text-sm text-green-600">✓ User selected</p>
            )}
          </div>

          {/* Balance Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Balance Type
            </label>
            <select
              value={balanceType}
              onChange={(e) => setBalanceType(e.target.value as 'balance' | 'depositBalance')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="balance">Main Balance</option>
              <option value="depositBalance">Deposit Balance</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (positive to add, negative to subtract)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="100.00 or -50.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Reason for adjustment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !userId}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Adjust Balance'}
          </button>
        </form>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> All balance adjustments are logged in the audit log for security and compliance.
        </p>
      </div>
    </div>
  );
}

