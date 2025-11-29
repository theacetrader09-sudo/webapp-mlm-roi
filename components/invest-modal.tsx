'use client';

import { useState } from 'react';
import { PACKAGE_TIERS, getPackageByAmount, validateInvestmentAmount } from '@/lib/package-assignment';
import { cn } from '@/lib/utils';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userBalance: number;
}

export default function InvestModal({
  isOpen,
  onClose,
  onSuccess,
  userBalance,
}: InvestModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const detectedPackage = amount ? getPackageByAmount(parseFloat(amount) || 0) : null;
  const dailyROI = detectedPackage ? detectedPackage.dailyROI.toNumber() : 0;
  const expectedDailyReturn = amount && detectedPackage
    ? ((parseFloat(amount) || 0) * dailyROI) / 100
    : 0;

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');

    if (value) {
      const numAmount = parseFloat(value);
      if (isNaN(numAmount) || numAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const validation = validateInvestmentAmount(numAmount);
      if (!validation.valid) {
        setError(validation.error || 'Invalid amount');
        return;
      }

      if (numAmount > userBalance) {
        setError('Insufficient balance');
        return;
      }
    }
  };

  const handleInvest = async () => {
    if (!amount) {
      setError('Please enter an investment amount');
      return;
    }

    const numAmount = parseFloat(amount);
    const validation = validateInvestmentAmount(numAmount);
    if (!validation.valid) {
      setError(validation.error || 'Invalid amount');
      return;
    }

    if (numAmount > userBalance) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invest/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create investment');
        setLoading(false);
        return;
      }

      // Success
      onSuccess();
      onClose();
      setAmount('');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Invest Now</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Available Balance</p>
            <p className="text-2xl font-bold text-gray-900">${userBalance.toFixed(2)}</p>
          </div>

          {/* Package Tiers */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Investment Packages
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PACKAGE_TIERS.map((pkg) => (
                <div
                  key={pkg.name}
                  className={cn(
                    'border-2 rounded-lg p-4 transition-colors cursor-pointer',
                    detectedPackage?.name === pkg.name
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => {
                    const midAmount = (pkg.minAmount.toNumber() + pkg.maxAmount.toNumber()) / 2;
                    handleAmountChange(midAmount.toString());
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    <span className="text-sm font-medium text-indigo-600">
                      {pkg.dailyROI.toNumber()}% daily
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    ${pkg.minAmount.toNumber().toLocaleString()} - ${pkg.maxAmount.toNumber().toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Daily ROI: {pkg.dailyROI.toNumber()}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Investment Amount
            </label>
            <input
              id="amount"
              type="number"
              min={35}
              max={100000}
              step="0.01"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount ($35 - $100,000)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {detectedPackage && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 mb-1">
                  Selected Package: <span className="font-bold">{detectedPackage.name}</span>
                </p>
                <p className="text-sm text-indigo-700">
                  Daily ROI: <span className="font-semibold">{dailyROI}%</span>
                </p>
                <p className="text-sm text-indigo-700">
                  Expected Daily Return: <span className="font-semibold">${expectedDailyReturn.toFixed(2)}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleInvest}
              disabled={loading || !amount || !detectedPackage}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Invest Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
