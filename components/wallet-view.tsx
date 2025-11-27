'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import WalletBalanceCard from './wallet-balance-card';

interface WalletViewProps {
  balance: number;
  depositBalance: number;
  roiTotal: number;
  referralTotal: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function WalletView({
  balance,
  depositBalance,
  roiTotal,
  referralTotal,
}: WalletViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Fetch earnings (ROI and referrals)
      const earningsRes = await fetch('/api/user/earnings', {
        credentials: 'include',
        cache: 'no-store',
      });
      const earningsData = earningsRes.ok ? await earningsRes.json() : { success: false, earnings: [] };

      // Fetch deposits
      const depositsRes = await fetch('/api/deposit/history', {
        credentials: 'include',
        cache: 'no-store',
      });
      const depositsData = depositsRes.ok ? await depositsRes.json() : { success: false, deposits: [] };

      // Fetch withdrawals
      const withdrawalsRes = await fetch('/api/withdraw/history', {
        credentials: 'include',
        cache: 'no-store',
      });
      const withdrawalsData = withdrawalsRes.ok ? await withdrawalsRes.json() : { success: false, withdrawals: [] };

      const allTransactions: Transaction[] = [];

      // Add earnings
      if (earningsData.success && earningsData.earnings) {
        earningsData.earnings.forEach((earning: any) => {
          allTransactions.push({
            id: earning.id,
            type: earning.type === 'roi' ? 'ROI' : 'REFERRAL',
            amount: earning.amount,
            description: earning.description || `${earning.type === 'roi' ? 'ROI' : 'Referral'} Earnings`,
            createdAt: earning.createdAt,
          });
        });
      }

      // Add deposits
      if (depositsData.success && depositsData.deposits) {
        depositsData.deposits.forEach((deposit: any) => {
          allTransactions.push({
            id: deposit.id,
            type: 'DEPOSIT',
            amount: deposit.amount,
            description: `Deposit ${deposit.status === 'APPROVED' ? '(Approved)' : deposit.status === 'PENDING' ? '(Pending)' : '(Rejected)'}`,
            createdAt: deposit.createdAt,
          });
        });
      }

      // Add withdrawals
      if (withdrawalsData.success && withdrawalsData.withdrawals) {
        withdrawalsData.withdrawals.forEach((withdrawal: any) => {
          allTransactions.push({
            id: withdrawal.id,
            type: 'WITHDRAWAL',
            amount: -withdrawal.amount,
            description: `Withdrawal ${withdrawal.status === 'APPROVED' ? '(Approved)' : withdrawal.status === 'PENDING' ? '(Pending)' : '(Rejected)'}`,
            createdAt: withdrawal.createdAt,
          });
        });
      }

      // Sort by date (newest first)
      allTransactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTransactions(allTransactions.slice(0, 50)); // Show last 50
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ROI':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'REFERRAL':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'DEPOSIT':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'WITHDRAWAL':
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <WalletBalanceCard
        balance={balance}
        depositBalance={depositBalance}
        roiTotal={roiTotal}
        referralTotal={referralTotal}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/deposit"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-2 border-purple-200 hover:border-purple-400"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Deposit Funds</h3>
              <p className="text-sm text-gray-600">Add funds to your deposit wallet</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/packages"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-2 border-green-200 hover:border-green-400"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Invest Now</h3>
              <p className="text-sm text-gray-600">Choose a package and start investing</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/withdraw"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow border-2 border-red-200 hover:border-red-400"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Withdraw Funds</h3>
              <p className="text-sm text-gray-600">Withdraw from your main balance</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-700 font-medium">
            <p>No transactions yet</p>
            <Link href="/dashboard/deposit" className="text-purple-600 hover:text-purple-700 mt-2 inline-block">
              Make your first deposit →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.type}</p>
                      <p className="text-xs text-gray-700 font-medium">{transaction.description}</p>
                      <p className="text-xs text-gray-600 font-medium mt-1">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                      {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

