'use client';

interface WalletBalanceCardProps {
  balance: number;
  depositBalance: number;
  roiTotal: number;
  referralTotal: number;
}

export default function WalletBalanceCard({
  balance,
  depositBalance,
  roiTotal,
  referralTotal,
}: WalletBalanceCardProps) {
  const totalBalance = balance + depositBalance;

  return (
    <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-semibold text-white/90 mb-1">Total Balance</h2>
          <p className="text-5xl font-bold text-white">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/30">
          <p className="text-xs font-medium text-white/90 mb-1">Main Balance</p>
          <p className="text-2xl font-bold text-white">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-white/80 mt-1">For withdrawals</p>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/30">
          <p className="text-xs font-medium text-white/90 mb-1">Deposit Balance</p>
          <p className="text-2xl font-bold text-white">${depositBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-white/80 mt-1">For investments</p>
        </div>
      </div>

      <div className="border-t border-white/30 pt-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-white/90 mb-1">Total ROI Earned</p>
            <p className="text-xl font-bold text-white">${roiTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-white/90 mb-1">Referral Earnings</p>
            <p className="text-xl font-bold text-white">${referralTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

