import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/components/logout-button';
import BottomNavigation from '@/components/bottom-navigation';
import DashboardClient from '@/components/dashboard-client';
import WalletBalanceCard from '@/components/wallet-balance-card';
import ActiveInvestmentsCard from '@/components/active-investments-card';
import ROICountdown from '@/components/roi-countdown';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Allow admins to access user dashboard for testing
  // Removed redirect to allow both panels to be open simultaneously

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const referralLink = `${baseUrl}/signup?ref=${user.referralCode}`;

  // Wallet fields are Float type in Prisma, so they're already numbers
  // But we'll ensure they're properly converted just in case
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

  // Ensure wallet exists, create default if not
  const wallet = user.wallet || {
    balance: 0,
    depositBalance: 0,
    roiTotal: 0,
    referralTotal: 0,
  };
  
  // Convert all values to ensure they're numbers
  const balance = convertToNumber(wallet.balance);
  const depositBalance = convertToNumber(wallet.depositBalance);
  const roiTotal = convertToNumber(wallet.roiTotal);
  const referralTotal = convertToNumber(wallet.referralTotal);

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard Data:', {
      userId: user.id,
      email: user.email,
      wallet: {
        balance,
        depositBalance,
        roiTotal,
        referralTotal,
      },
      rawWallet: wallet,
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/profile"
                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Profile"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* ROI Countdown */}
        <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <ROICountdown showLabel={true} size="medium" />
        </div>

        {/* Wallet Balance Card - Prominent Display */}
        <div className="mb-6">
          <WalletBalanceCard
            balance={balance}
            depositBalance={depositBalance}
            roiTotal={roiTotal}
            referralTotal={referralTotal}
          />
        </div>

        {/* Dashboard Stats with Animated Charts */}
        <DashboardClient
          userName={user.name || 'User'}
          referralLink={referralLink}
          availableBalance={balance + depositBalance}
        />

        {/* Active Investments */}
        <div className="mt-6">
          <ActiveInvestmentsCard />
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
