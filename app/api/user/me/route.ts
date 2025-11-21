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

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      role: user.role,
      wallet: user.wallet
        ? {
            balance: user.wallet.balance,
            depositBalance: (user.wallet as { depositBalance?: number }).depositBalance || 0,
            roiTotal: user.wallet.roiTotal,
            referralTotal: user.wallet.referralTotal,
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

