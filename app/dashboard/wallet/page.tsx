import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import WalletView from '@/components/wallet-view';
import BottomNavigation from '@/components/bottom-navigation';

export default async function DashboardWalletPage() {
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
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              My Wallet
            </h1>
            <a
              href="/dashboard"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        <WalletView
          balance={Number(wallet.balance)}
          depositBalance={depositBalance}
          roiTotal={Number(wallet.roiTotal)}
          referralTotal={Number(wallet.referralTotal)}
        />
      </main>

      <BottomNavigation />
    </div>
  );
}

