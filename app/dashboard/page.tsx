import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
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
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <LogoutButton />
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
            balance={Number(wallet.balance)}
            depositBalance={depositBalance}
            roiTotal={Number(wallet.roiTotal)}
            referralTotal={Number(wallet.referralTotal)}
          />
        </div>

        {/* Dashboard Stats with Animated Charts */}
        <DashboardClient
          userName={user.name || 'User'}
          referralLink={referralLink}
          availableBalance={Number(wallet.balance) + Number(depositBalance)}
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
