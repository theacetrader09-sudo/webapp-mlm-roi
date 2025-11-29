import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Test endpoint to validate referral link functionality with 50+ users
 * This simulates the entire referral flow from link generation to signup
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // ... (existing code) ...
    } catch (error) {
        console.error('Test error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Test failed' },
            { status: 500 }
        );
    } finally {
        // Cleanup test data
        // Delete related records first to avoid foreign key constraints
        const testUserEmailFilter = { email: { contains: '@test.com' } };

        // Find test users first
        const testUsers = await prisma.user.findMany({
            where: testUserEmailFilter,
            select: { id: true }
        });

        const testUserIds = testUsers.map(u => u.id);

        if (testUserIds.length > 0) {
            await prisma.deposit.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.withdrawal.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.investment.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.earnings.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.internalTransfer.deleteMany({
                where: {
                    OR: [
                        { fromUserId: { in: testUserIds } },
                        { toUserId: { in: testUserIds } }
                    ]
                }
            });
            await prisma.wallet.deleteMany({ where: { userId: { in: testUserIds } } });
            await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
        }
    }
}
