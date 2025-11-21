import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Placeholder - withdraw logic will be implemented later
    return NextResponse.json({
      message: 'Withdraw functionality coming soon',
      success: false,
    });
  } catch (error) {
    console.error('Error processing withdraw:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

