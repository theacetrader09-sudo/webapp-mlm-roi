/**
 * Fix users without wallets by creating wallets for them
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUsersWithoutWallets() {
  try {
    // Find all users without wallets
    const usersWithoutWallets = await prisma.user.findMany({
      where: { wallet: null },
      select: { id: true, email: true, name: true },
    });

    console.log(`Found ${usersWithoutWallets.length} users without wallets`);

    if (usersWithoutWallets.length === 0) {
      console.log('✅ All users have wallets!');
      return;
    }

    // Create wallets for all users without wallets
    let created = 0;
    for (const user of usersWithoutWallets) {
      try {
        await prisma.wallet.create({
          data: {
            userId: user.id,
            balance: 0,
            depositBalance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        });
        created++;
        console.log(`✅ Created wallet for user: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to create wallet for ${user.email}:`, error);
      }
    }

    console.log(`\n✅ Successfully created ${created} wallets out of ${usersWithoutWallets.length} users`);
  } catch (error) {
    console.error('❌ Error fixing users without wallets:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsersWithoutWallets();

