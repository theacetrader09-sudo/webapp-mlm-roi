import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const referralLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?ref=${user.referralCode}`;

    // Convert Decimal to number helper
    const convertToNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'object' && value !== null) {
        if ('toNumber' in value) return value.toNumber();
        if ('toString' in value) return parseFloat(value.toString());
      }
      return parseFloat(String(value)) || 0;
    };

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      role: user.role,
      wallet: user.wallet
        ? {
            balance: convertToNumber(user.wallet.balance),
            depositBalance: convertToNumber((user.wallet as { depositBalance?: any }).depositBalance) || 0,
            roiTotal: convertToNumber(user.wallet.roiTotal),
            referralTotal: convertToNumber(user.wallet.referralTotal),
          }
        : null,
      referralLink,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

