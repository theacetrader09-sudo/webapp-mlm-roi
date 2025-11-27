import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DepositForm from '@/components/deposit-form';
import BottomNavigation from '@/components/bottom-navigation';
import WalletBalanceCard from '@/components/wallet-balance-card';

export default async function DashboardDepositPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const depositAddress = process.env.DEPOSIT_ADDRESS || '0xDa51B37Bf7872f9adeF99eC99365d0673D027E72';

  // Convert Decimal to number helper
  const convertToNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      if ('toNumber' in value && typeof value.toNumber === 'function') {
        return value.toNumber();
      }
      if ('toString' in value) {
        return parseFloat(value.toString()) || 0;
      }
    }
    return parseFloat(String(value)) || 0;
  };

  const wallet = user.wallet || {
    balance: 0,
    depositBalance: 0,
    roiTotal: 0,
    referralTotal: 0,
  };

  const balance = convertToNumber(wallet.balance);
  const depositBalance = convertToNumber((user.wallet as any)?.depositBalance) || 0;
  const roiTotal = convertToNumber(wallet.roiTotal);
  const referralTotal = convertToNumber(wallet.referralTotal);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Deposit
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Current Wallet Balance */}
        <div className="mb-6">
          <WalletBalanceCard
            balance={balance}
            depositBalance={depositBalance}
            roiTotal={roiTotal}
            referralTotal={referralTotal}
          />
        </div>

        <DepositForm depositAddress={depositAddress} />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

