import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processDailyRoi } from '@/lib/roi-processor';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
    try {
        console.log('--- Starting Referral Logic Test ---');

        // 1. Cleanup previous test data
        await prisma.earnings.deleteMany();
        await prisma.investment.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();

        // 2. Create Users: Grandparent -> Parent -> Child
        const grandparent = await prisma.user.create({
            data: {
                email: 'grandparent@test.com',
                password: 'hash',
                referralCode: 'GRAND',
                wallet: { create: { balance: 0, depositBalance: 1000 } },
            },
            include: { wallet: true },
        });

        const parent = await prisma.user.create({
            data: {
                email: 'parent@test.com',
                password: 'hash',
                referralCode: 'PARENT',
                referredBy: 'GRAND',
                wallet: { create: { balance: 0, depositBalance: 1000 } },
            },
            include: { wallet: true },
        });

        const child = await prisma.user.create({
            data: {
                email: 'child@test.com',
                password: 'hash',
                referralCode: 'CHILD',
                referredBy: 'PARENT',
                wallet: { create: { balance: 0, depositBalance: 1000 } },
            },
            include: { wallet: true },
        });

        // 3. Create Investments - Upline users must have active investments
        await prisma.investment.create({
            data: {
                userId: grandparent.id,
                walletId: grandparent.wallet!.id,
                packageName: 'Starter',
                amount: new Decimal(100),
                dailyROI: new Decimal(1.0), // 1% daily
                status: 'ACTIVE',
                isActive: true,
            },
        });

        await prisma.investment.create({
            data: {
                userId: parent.id,
                walletId: parent.wallet!.id,
                packageName: 'Starter',
                amount: new Decimal(100),
                dailyROI: new Decimal(1.0), // 1% daily
                status: 'ACTIVE',
                isActive: true,
            },
        });

        const childInvestment = await prisma.investment.create({
            data: {
                userId: child.id,
                walletId: child.wallet!.id,
                packageName: 'Starter',
                amount: new Decimal(100), // $100 investment
                dailyROI: new Decimal(1.0), // 1% daily ROI = $1.00
                status: 'ACTIVE',
                isActive: true,
            },
        });

        // 4. Run ROI Processor
        const result = await processDailyRoi(true); // true = skip idempotency check

        // 5. Verify Earnings
        const childWalletAfter = await prisma.wallet.findUnique({ where: { id: child.wallet!.id } });
        const parentWalletAfter = await prisma.wallet.findUnique({ where: { id: parent.wallet!.id } });
        const grandparentWalletAfter = await prisma.wallet.findUnique({ where: { id: grandparent.wallet!.id } });

        const childEarnings = await prisma.earnings.findMany({
            where: { userId: child.id },
            orderBy: { createdAt: 'asc' },
        });

        const parentEarnings = await prisma.earnings.findMany({
            where: { userId: parent.id },
            orderBy: { createdAt: 'asc' },
        });

        const grandparentEarnings = await prisma.earnings.findMany({
            where: { userId: grandparent.id },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({
            success: true,
            summary: {
                processed: result.processed,
                skipped: result.skipped,
                totalRoiPaid: result.totalRoiPaid.toString(),
                totalReferralPaid: result.totalReferralPaid.toString(),
            },
            expected: {
                childROI: '$1.00',
                parentCommission: '$0.10 (Level 1 - 10% of Child ROI)',
                grandparentCommission: '$0.05 (Level 2 - 5% of Child ROI)',
            },
            actual: {
                child: {
                    balance: childWalletAfter?.balance.toString(),
                    earnings: childEarnings.map(e => ({
                        type: e.type,
                        amount: e.amount.toString(),
                        description: e.description,
                    })),
                },
                parent: {
                    balance: parentWalletAfter?.balance.toString(),
                    roiTotal: parentWalletAfter?.roiTotal.toString(),
                    referralTotal: parentWalletAfter?.referralTotal.toString(),
                    earnings: parentEarnings.map(e => ({
                        type: e.type,
                        amount: e.amount.toString(),
                        description: e.description,
                    })),
                },
                grandparent: {
                    balance: grandparentWalletAfter?.balance.toString(),
                    roiTotal: grandparentWalletAfter?.roiTotal.toString(),
                    referralTotal: grandparentWalletAfter?.referralTotal.toString(),
                    earnings: grandparentEarnings.map(e => ({
                        type: e.type,
                        amount: e.amount.toString(),
                        description: e.description,
                    })),
                },
            },
            verdict: {
                parentGotCommission: parentEarnings.some(e => e.type === 'referral'),
                grandparentGotCommission: grandparentEarnings.some(e => e.type === 'referral'),
                isWorking: parentEarnings.some(e => e.type === 'referral') && grandparentEarnings.some(e => e.type === 'referral'),
            },
        });
    } catch (error) {
        console.error('Test error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Test failed' },
            { status: 500 }
        );
    }
}
