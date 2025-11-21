import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PACKAGE_TIERS } from '@/lib/package-assignment';
import BottomNavigation from '@/components/bottom-navigation';
import PackageCard from '@/components/package-card';

export default async function PackagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const wallet = user.wallet || {
    balance: 0,
    depositBalance: 0,
    roiTotal: 0,
    referralTotal: 0,
  };
  
  const depositBalance = (user.wallet as { depositBalance?: number })?.depositBalance || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Investment Packages
            </h1>
          </div>
          <p className="text-sm font-medium text-gray-700 mt-2">
            Choose a package and start earning daily returns
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Deposit Balance Info */}
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/90 mb-1">Available Deposit Balance</p>
              <p className="text-3xl font-bold text-white">${depositBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            {depositBalance === 0 && (
              <div className="text-right">
                <p className="text-sm font-medium text-white/90 mb-2">Need to deposit first?</p>
                <a
                  href="/dashboard/deposit"
                  className="inline-block px-4 py-2 bg-white/25 hover:bg-white/35 rounded-lg transition-colors text-sm font-semibold text-white shadow-md"
                >
                  Go to Deposit
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGE_TIERS.map((pkg) => (
            <PackageCard key={pkg.name} packageInfo={pkg} depositBalance={depositBalance} />
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How It Works
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 font-semibold text-xs">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Choose Your Package</p>
                <p className="text-gray-700">Select an investment package that fits your budget</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 font-semibold text-xs">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Make Deposit</p>
                <p className="text-gray-700">Deposit the required amount to activate your investment</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 font-semibold text-xs">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Earn Daily Returns</p>
                <p className="text-gray-700">Receive daily ROI payments directly to your wallet</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

