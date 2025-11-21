'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface DepositFormProps {
  depositAddress: string;
}

interface Deposit {
  id: string;
  amount: number;
  txHash: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

export default function DepositForm({ depositAddress }: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/deposit/history');
      const data = await response.json();
      if (data.success) {
        setDeposits(data.deposits);
      }
    } catch {
      // Error fetching deposit history - continue
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/deposit/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          txHash: txHash.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit deposit');
        setLoading(false);
        return;
      }

      setSuccess('Deposit request submitted successfully! Awaiting admin approval.');
      setAmount('');
      setTxHash('');
      await fetchHistory();
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

  return (
    <div className="space-y-6">
      {/* Step-by-Step Guide */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6 border border-purple-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Deposit</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Copy the deposit address below</p>
              <p className="text-xs text-gray-600 mt-1">This is our shared BEP20 USDT address</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Send BEP20 USDT to this address</p>
              <p className="text-xs text-gray-600 mt-1">Use your crypto wallet (MetaMask, Trust Wallet, etc.)</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Submit deposit request with transaction hash</p>
              <p className="text-xs text-gray-600 mt-1">Enter the amount and transaction hash from your wallet</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Wait for admin approval</p>
              <p className="text-xs text-gray-600 mt-1">Once approved, funds will be added to your Deposit Balance</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              5
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Start investing!</p>
              <p className="text-xs text-gray-600 mt-1">Use your Deposit Balance to choose and invest in packages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Address Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deposit Address</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-1">Network</p>
            <p className="text-sm text-blue-700">BEP20 USDT (Binance Smart Chain)</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Deposit Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={depositAddress}
                readOnly
                className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-lg bg-white text-gray-900 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleCopy}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-lg"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <QRCodeSVG
                value={depositAddress}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900 mb-2">Important Notes:</p>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>Only send BEP20 USDT to this address</li>
              <li>Do not send other cryptocurrencies or tokens</li>
              <li>Double-check the address before sending</li>
              <li>Minimum deposit: $35</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Deposit Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Submit Deposit</h2>
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
              Amount (USD)
            </label>
            <input
              id="amount"
              type="number"
              min="35"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Enter amount (minimum $35)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="txHash" className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Hash
            </label>
            <input
              id="txHash"
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              required
              minLength={20}
              placeholder="Enter transaction hash (at least 20 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-gray-900 font-medium"
            />
            <p className="text-xs text-gray-700 mt-1 font-medium">
              Enter the transaction hash from your wallet after sending USDT
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !amount || !txHash}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Deposit Request'}
          </button>
        </form>
      </div>

      {/* Deposit History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Deposit History</h2>
        {loadingHistory ? (
          <p className="text-gray-500">Loading...</p>
        ) : deposits.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No deposits yet</p>
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
                    Transaction Hash
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Admin Note
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(deposit.createdAt).toLocaleString()}
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
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                      {deposit.adminNote || '-'}
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

