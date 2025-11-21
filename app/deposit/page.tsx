import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DepositView from '@/components/deposit-view';

export default async function DepositPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const depositAddress = process.env.DEPOSIT_ADDRESS || '0xDa51B37Bf7872f9adeF99eC99365d0673D027E72';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Deposit</h1>
            <a
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DepositView depositAddress={depositAddress} />
      </main>
    </div>
  );
}

