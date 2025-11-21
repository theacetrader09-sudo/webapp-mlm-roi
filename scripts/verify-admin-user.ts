/**
 * Verify admin user exists and has correct role
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAdminUser() {
  try {
    const email = 'forfxai@gmail.com';

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        referralCode: true,
        wallet: {
          select: {
            balance: true,
            depositBalance: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ Admin user not found!');
      console.log('Please run: npx tsx scripts/create-admin-user.ts');
      return;
    }

    console.log('✅ Admin User Found!');
    console.log('\n📋 Admin Details:');
    console.log(`Email: ${user.email}`);
    console.log(`Name: ${user.name || 'N/A'}`);
    console.log(`Role: ${user.role}`);
    console.log(`Referral Code: ${user.referralCode}`);
    console.log(`Wallet Balance: $${user.wallet?.balance || 0}`);
    console.log(`Deposit Balance: $${user.wallet?.depositBalance || 0}`);
    
    if (user.role === 'ADMIN') {
      console.log('\n✅ User has ADMIN role - can access admin panel');
      console.log(`\n🔗 Admin Login URL: http://localhost:3000/admin/login`);
      console.log(`\n📝 Login Credentials:`);
      console.log(`Email: forfxai@gmail.com`);
      console.log(`Password: Markus@72`);
    } else {
      console.log('\n❌ User does NOT have ADMIN role!');
      console.log('Updating user to ADMIN role...');
      
      await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' },
      });
      
      console.log('✅ User updated to ADMIN role!');
    }
  } catch (error) {
    console.error('❌ Error verifying admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminUser();

