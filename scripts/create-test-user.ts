/**
 * Create a test user for login testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'password123';
    const name = 'Test User';

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('✅ Test user already exists!');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`Referral Code: ${existing.referralCode}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode = '';
    for (let i = 0; i < 8; i++) {
      referralCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        referralCode,
        role: 'USER',
        wallet: {
          create: {
            balance: 1000,
            depositBalance: 500,
            roiTotal: 0,
            referralTotal: 0,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    console.log('✅ Test user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${name}`);
    console.log(`Referral Code: ${user.referralCode}`);
    console.log(`\n💰 Wallet Balance:`);
    console.log(`Main Balance: $${user.wallet?.balance || 0}`);
    console.log(`Deposit Balance: $${user.wallet?.depositBalance || 0}`);
    console.log(`\n🔗 Login URL: http://localhost:3000/login`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

