'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PackageInfo } from '@/lib/package-assignment';

interface PackageInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  packageInfo: PackageInfo;
  depositBalance: number;
}

export default function PackageInvestmentModal({
  isOpen,
  onClose,
  onSuccess,
  packageInfo,
  depositBalance,
}: PackageInvestmentModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(packageInfo.minAmount.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset amount when package changes
  useEffect(() => {
    if (isOpen) {
      setAmount(packageInfo.minAmount.toString());
      setError('');
    }
  }, [isOpen, packageInfo]);

  const numAmount = parseFloat(amount) || 0;
  const expectedDailyReturn = (numAmount * packageInfo.dailyROI) / 100;
  const hasInsufficientBalance = numAmount > depositBalance;
  const isAmountValid = numAmount >= packageInfo.minAmount && numAmount <= packageInfo.maxAmount;

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');

    if (value) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (num < packageInfo.minAmount) {
        setError(`Minimum investment is $${packageInfo.minAmount.toLocaleString()}`);
        return;
      }

      if (num > packageInfo.maxAmount) {
        setError(`Maximum investment is $${packageInfo.maxAmount.toLocaleString()}`);
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
    
    if (numAmount < packageInfo.minAmount || numAmount > packageInfo.maxAmount) {
      setError(`Amount must be between $${packageInfo.minAmount.toLocaleString()} and $${packageInfo.maxAmount.toLocaleString()}`);
      return;
    }

    // Check balance
    if (numAmount > depositBalance) {
      setError('Insufficient deposit balance. Please deposit funds first.');
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
        // If insufficient balance error, redirect to deposit
        if (data.error?.toLowerCase().includes('insufficient') || data.error?.toLowerCase().includes('balance')) {
          setError('Insufficient deposit balance. Redirecting to deposit page...');
          setTimeout(() => {
            router.push('/dashboard/deposit');
            onClose();
          }, 1500);
          return;
        }
        setError(data.error || 'Failed to create investment');
        setLoading(false);
        return;
      }

      // Success
      onSuccess();
      onClose();
      setAmount(packageInfo.minAmount.toString());
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleGoToDeposit = () => {
    router.push('/dashboard/deposit');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invest in {packageInfo.name}</h2>
              <p className="text-sm text-gray-700 font-medium mt-1">Package Investment</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Package Info */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Package</span>
              <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-semibold">
                {packageInfo.name}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Daily ROI</span>
              <span className="text-lg font-bold text-purple-600">{packageInfo.dailyROI}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Investment Range</span>
              <span className="text-sm font-semibold text-gray-900">
                ${packageInfo.minAmount.toLocaleString()} - ${packageInfo.maxAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Deposit Balance */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Available Deposit Balance</span>
              <span className={`text-xl font-bold ${depositBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${depositBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {depositBalance === 0 && (
              <p className="text-xs text-red-600 mt-1">You need to deposit funds first</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              min={packageInfo.minAmount}
              max={packageInfo.maxAmount}
              step="0.01"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={`Enter amount (${packageInfo.minAmount.toLocaleString()} - ${packageInfo.maxAmount.toLocaleString()})`}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                hasInsufficientBalance || !isAmountValid
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-purple-500'
              }`}
            />
            {!isAmountValid && amount && (
              <p className="text-xs text-red-600 mt-1">
                Amount must be between ${packageInfo.minAmount.toLocaleString()} and ${packageInfo.maxAmount.toLocaleString()}
              </p>
            )}
          </div>

          {/* Expected Return */}
          {isAmountValid && numAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Expected Daily Return</span>
                <span className="text-lg font-bold text-green-600">
                  ${expectedDailyReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-xs text-gray-700 font-medium">
                Based on {packageInfo.dailyROI}% daily ROI
              </p>
            </div>
          )}

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && isAmountValid && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">Insufficient Balance</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    You need ${(numAmount - depositBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} more to invest this amount.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            {hasInsufficientBalance ? (
              <button
                onClick={handleGoToDeposit}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg"
              >
                Go to Deposit
              </button>
            ) : (
              <button
                onClick={handleInvest}
                disabled={loading || !isAmountValid || numAmount <= 0 || hasInsufficientBalance}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Invest Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

