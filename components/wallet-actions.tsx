'use client';

import { useRouter } from 'next/navigation';
import WalletTransfer from './wallet-transfer';

export default function WalletActions() {
  const router = useRouter();

  const handleDeposit = () => {
    router.push('/dashboard/deposit');
  };

  const handleWithdraw = () => {
    router.push('/dashboard/withdraw');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Wallet Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleDeposit}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Deposit
        </button>
        <button
          onClick={handleWithdraw}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Withdraw
        </button>
        <WalletTransfer />
      </div>
    </div>
  );
}

