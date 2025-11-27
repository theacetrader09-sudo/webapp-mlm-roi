import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        wallet: {
          select: {
            id: true,
            userId: true,
            balance: true,
            depositBalance: true,
            roiTotal: true,
            referralTotal: true,
            updatedAt: true,
          },
        },
      },
    });

    // Ensure wallet exists
    if (user && !user.wallet) {
      try {
        // Create wallet if it doesn't exist
        const wallet = await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            depositBalance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        });
        return { ...user, wallet };
      } catch (walletError) {
        console.error('Error creating wallet:', walletError);
        // Return user without wallet if creation fails
        return user;
      }
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    // Return null on error to prevent crashes
    return null;
  }
}

