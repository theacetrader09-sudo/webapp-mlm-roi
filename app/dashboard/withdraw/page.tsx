import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import WithdrawForm from '@/components/withdraw-form';
import BottomNavigation from '@/components/bottom-navigation';

export default async function DashboardWithdrawPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const wallet = user.wallet || {
    balance: 0,
    roiTotal: 0,
    referralTotal: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Withdraw</h1>
            <a
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <WithdrawForm currentBalance={wallet.balance} />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

