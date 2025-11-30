import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function createAdminUser() {
    const email = 'forfxai@gmail.com';
    const password = 'Markus@72';
    const name = 'Admin';

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('User already exists. Updating to ADMIN role...');
            await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' },
            });
            console.log('✅ Updated user to ADMIN role');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let referralCode = generateReferralCode();
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            const existing = await prisma.user.findUnique({
                where: { referralCode },
            });
            if (!existing) {
                isUnique = true;
            } else {
                referralCode = generateReferralCode();
                attempts++;
            }
        }

        // Create admin user with wallet
        const user = await prisma.user.create({
            data: {
                name,
                email,
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
            include: { wallet: true },
        });

        console.log('✅ Admin user created successfully!');
        console.log('-----------------------------------');
        console.log('Email:', email);
        console.log('Role:', user.role);
        console.log('Referral Code:', user.referralCode);
        console.log('-----------------------------------');
        console.log('You can now login at /login and access /admin');
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser()
    .then(() => {
        console.log('Script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
