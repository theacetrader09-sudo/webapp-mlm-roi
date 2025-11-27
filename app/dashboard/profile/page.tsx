import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/logout-button';
import BottomNavigation from '@/components/bottom-navigation';
import CopyButton from '@/components/copy-button';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Get additional user stats
  const [investments, deposits, withdrawals, earnings] = await Promise.all([
    prisma.investment.count({
      where: { userId: user.id },
    }),
    prisma.deposit.count({
      where: { userId: user.id },
    }),
    prisma.withdrawal.count({
      where: { userId: user.id },
    }),
    prisma.earnings.count({
      where: { userId: user.id },
    }),
  ]);

  // Get total invested amount
  const totalInvested = await prisma.investment.aggregate({
    where: { userId: user.id },
    _sum: {
      amount: true,
    },
  });

  // Get total deposits and withdrawals
  const totalDeposits = await prisma.deposit.aggregate({
    where: { userId: user.id, status: 'APPROVED' },
    _sum: {
      amount: true,
    },
  });

  const totalWithdrawals = await prisma.withdrawal.aggregate({
    where: { userId: user.id, status: 'APPROVED' },
    _sum: {
      amount: true,
    },
  });

  // Convert Decimal to number helper
  const convertToNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'object' && value !== null) {
      if ('toNumber' in value && typeof value.toNumber === 'function') {
        return value.toNumber();
      }
      if ('toString' in value) {
        const parsed = parseFloat(value.toString());
        return isNaN(parsed) ? 0 : parsed;
      }
    }
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? 0 : parsed;
  };

  const wallet = user.wallet || {
    balance: 0,
    depositBalance: 0,
    roiTotal: 0,
    referralTotal: 0,
  };

  const balance = convertToNumber(wallet.balance);
  const depositBalance = convertToNumber(wallet.depositBalance);
  const roiTotal = convertToNumber(wallet.roiTotal);
  const referralTotal = convertToNumber(wallet.referralTotal);
  const totalInvestedAmount = convertToNumber(totalInvested._sum.amount);
  const totalDepositsAmount = convertToNumber(totalDeposits._sum.amount);
  const totalWithdrawalsAmount = convertToNumber(totalWithdrawals._sum.amount);

  // Get referrer info if exists
  let referrerName = null;
  if (user.referredBy) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: user.referredBy },
      select: { name: true, email: true },
    });
    if (referrer) {
      referrerName = referrer.name || referrer.email || user.referredBy;
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const referralLink = `${baseUrl}/signup?ref=${user.referralCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Profile
            </h1>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.name || 'User'}
              </h2>
              <p className="text-gray-600">{user.email || 'No email'}</p>
              {user.role === 'ADMIN' && (
                <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                  Admin
                </span>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">User ID</p>
              <p className="text-lg font-semibold text-gray-900 font-mono text-sm">
                {user.id.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Your Referral Code</p>
            <div className="flex items-center justify-between">
              <code className="text-2xl font-bold text-purple-600 font-mono">
                {user.referralCode}
              </code>
              <CopyButton referralLink={referralLink} />
            </div>
            <p className="text-xs text-gray-600 mt-2 break-all">{referralLink}</p>
          </div>

          {/* Referrer Info */}
          {referrerName && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Referred By</p>
              <p className="text-lg font-semibold text-blue-900">{referrerName}</p>
              <p className="text-xs text-gray-600 mt-1">Referral Code: {user.referredBy}</p>
            </div>
          )}
        </div>

        {/* Wallet Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Wallet Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-purple-600">
                ${(balance + depositBalance).toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total ROI Earned</p>
              <p className="text-2xl font-bold text-green-600">
                ${roiTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Referral Earnings</p>
              <p className="text-2xl font-bold text-blue-600">
                ${referralTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total Invested</p>
              <p className="text-2xl font-bold text-orange-600">
                ${totalInvestedAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Account Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{investments}</p>
              <p className="text-sm text-gray-600 mt-1">Investments</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{deposits}</p>
              <p className="text-sm text-gray-600 mt-1">Deposits</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{withdrawals}</p>
              <p className="text-sm text-gray-600 mt-1">Withdrawals</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600">{earnings}</p>
              <p className="text-sm text-gray-600 mt-1">Earnings</p>
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Transaction Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Total Deposits</span>
              <span className="text-lg font-bold text-green-600">
                ${totalDepositsAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Total Withdrawals</span>
              <span className="text-lg font-bold text-red-600">
                ${totalWithdrawalsAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-700 font-medium">Net Balance</span>
              <span className="text-lg font-bold text-purple-600">
                ${(totalDepositsAmount - totalWithdrawalsAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

