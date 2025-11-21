/**
 * Create an admin user for admin panel access
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    const email = 'forfxai@gmail.com';
    const password = 'Markus@72';
    const name = 'Admin User';

    // Check if admin user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // Update existing user to admin if not already
      if (existing.role !== 'ADMIN') {
        await prisma.user.update({
          where: { email },
          data: { role: 'ADMIN' },
        });
        console.log('✅ User updated to ADMIN role!');
      } else {
        console.log('✅ Admin user already exists!');
      }
      
      // Update password
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
      
      console.log('\n📋 Admin Login Credentials:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      console.log(`Role: ADMIN`);
      console.log(`\n🔗 Admin Login URL: http://localhost:3000/admin/login`);
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

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        referralCode,
        role: 'ADMIN',
        wallet: {
          create: {
            balance: 0,
            depositBalance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Login Credentials:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Role: ${user.role}`);
    console.log(`Referral Code: ${user.referralCode}`);
    console.log(`\n🔗 Admin Login URL: http://localhost:3000/admin/login`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();

