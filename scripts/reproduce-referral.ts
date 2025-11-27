import { prisma } from '../lib/prisma';
import { processDailyRoi } from '../lib/roi-processor';
import { Decimal } from '@prisma/client/runtime/library';

async function main() {
    console.log('--- Starting Referral Logic Reproduction ---');

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

    console.log('Users created:');
    console.log(`- Grandparent (${grandparent.referralCode})`);
    console.log(`- Parent (${parent.referralCode}) -> referred by ${grandparent.referralCode}`);
    console.log(`- Child (${child.referralCode}) -> referred by ${parent.referralCode}`);

    // 3. Create Investments
    // IMPORTANT: Upline users must have active investments to earn commissions
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

    console.log('\nInvestments created. Child invested $100 at 1% daily ROI.');
    console.log('Expected ROI for Child: $1.00');
    console.log('Expected Commission for Parent (Level 1 - 10%): $0.10');
    console.log('Expected Commission for Grandparent (Level 2 - 5%): $0.05');

    // 4. Run ROI Processor
    console.log('\nRunning ROI Processor...');
    const result = await processDailyRoi(true); // true = skip idempotency check
    console.log('ROI Process Result:', JSON.stringify(result, null, 2));

    // 5. Verify Earnings
    const parentWallet = await prisma.wallet.findUnique({ where: { id: parent.wallet!.id } });
    const grandparentWallet = await prisma.wallet.findUnique({ where: { id: grandparent.wallet!.id } });

    console.log('\n--- Verification Results ---');
    console.log(`Parent Balance: $${parentWallet?.balance} (Expected: $1.10 -> $1.00 own ROI + $0.10 comm)`);
    console.log(`Grandparent Balance: $${grandparentWallet?.balance} (Expected: $1.05 -> $1.00 own ROI + $0.05 comm)`);

    const parentEarnings = await prisma.earnings.findMany({
        where: { userId: parent.id, type: 'referral' },
    });
    const grandparentEarnings = await prisma.earnings.findMany({
        where: { userId: grandparent.id, type: 'referral' },
    });

    console.log(`Parent Referral Earnings: ${parentEarnings.length} records`);
    parentEarnings.forEach(e => console.log(`- Amount: $${e.amount} (${e.description})`));

    console.log(`Grandparent Referral Earnings: ${grandparentEarnings.length} records`);
    grandparentEarnings.forEach(e => console.log(`- Amount: $${e.amount} (${e.description})`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
