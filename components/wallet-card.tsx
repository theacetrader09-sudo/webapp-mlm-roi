interface WalletCardProps {
  balance: number;
  depositBalance?: number;
  roiTotal: number;
  referralTotal: number;
}

export default function WalletCard({
  balance,
  depositBalance = 0,
  roiTotal,
  referralTotal,
}: WalletCardProps) {
  const totalBalance = balance + depositBalance;

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Wallet Balance</h3>
      <div className="text-4xl font-bold mb-2">
        ${totalBalance.toFixed(2)}
      </div>
      <div className="text-sm opacity-80 mb-4">
        Main: ${balance.toFixed(2)} • Deposit: ${depositBalance.toFixed(2)}
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
        <div>
          <p className="text-sm opacity-90">Total ROI</p>
          <p className="text-xl font-semibold">${roiTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm opacity-90">Referral Earnings</p>
          <p className="text-xl font-semibold">${referralTotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

