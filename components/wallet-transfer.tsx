'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string | null;
  email: string;
  referralCode: string;
}

interface Transfer {
  id: string;
  amount: number;
  type: 'sent' | 'received';
  fromUser: User;
  toUser: User;
  note: string | null;
  createdAt: string;
}

export default function WalletTransfer() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [walletBalance, setWalletBalance] = useState({ balance: 0, depositBalance: 0 });

  useEffect(() => {
    fetchWalletBalance();
    fetchTransferHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/user/me', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setWalletBalance({
          balance: Number(data.wallet?.balance) || 0,
          depositBalance: Number(data.wallet?.depositBalance) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const fetchTransferHistory = async () => {
    try {
      const response = await fetch('/api/wallet/transfer/history', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || []);
      } else {
        setTransfers([]);
      }
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      setTransfers([]);
    }
  };

  const searchUsers = async () => {
    try {
      const response = await fetch(`/api/wallet/transfer/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!selectedUser) {
      setError('Please select a user');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/wallet/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          toUserId: selectedUser.id,
          amount: parseFloat(amount),
          note: note || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Transfer failed');
        setLoading(false);
        return;
      }

      setSuccess('Transfer completed successfully!');
      setAmount('');
      setNote('');
      setSelectedUser(null);
      setSearchQuery('');
      await fetchWalletBalance();
      await fetchTransferHistory();
      setTimeout(() => {
        setIsOpen(false);
        setSuccess('');
      }, 2000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = walletBalance.balance + walletBalance.depositBalance;

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        Transfer Funds
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Transfer Funds</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError('');
                  setSuccess('');
                  setSelectedUser(null);
                  setSearchQuery('');
                  setAmount('');
                  setNote('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Balance Info */}
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-semibold mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-purple-600">${totalBalance.toFixed(2)}</p>
                <div className="mt-2 text-xs text-gray-700 font-medium space-y-1">
                  <p>Main: ${walletBalance.balance.toFixed(2)}</p>
                  <p>Deposit: ${walletBalance.depositBalance.toFixed(2)}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleTransfer} className="space-y-4">
                {/* User Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Downline User
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or referral code..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchQuery(user.name || user.email);
                            setSearchResults([]);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                            selectedUser?.id === user.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <p className="font-medium text-gray-900">{user.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-700 font-medium">{user.email}</p>
                          <p className="text-xs text-gray-600 font-medium">Code: {user.referralCode}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedUser && (
                    <div className="mt-2 bg-purple-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-purple-900">Selected:</p>
                      <p className="text-sm text-gray-700 font-medium">{selectedUser.name || selectedUser.email}</p>
                      <p className="text-xs text-gray-700 font-medium">{selectedUser.referralCode}</p>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Add a note..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedUser || !amount}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Transfer'}
                </button>
              </form>

              {/* Transfer History */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Recent Transfers</h4>
                {transfers.length === 0 ? (
                  <p className="text-sm text-gray-700 font-medium">No transfers yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {transfers.slice(0, 5).map((transfer) => (
                      <div key={transfer.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {transfer.type === 'sent' ? 'To' : 'From'}:{' '}
                              {transfer.type === 'sent'
                                ? transfer.toUser.name || transfer.toUser.email
                                : transfer.fromUser.name || transfer.fromUser.email}
                            </p>
                            <p className="text-xs text-gray-700 font-medium">
                              {new Date(transfer.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              transfer.type === 'sent' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {transfer.type === 'sent' ? '-' : '+'}${transfer.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

