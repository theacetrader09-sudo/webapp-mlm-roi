import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Update existing user to ADMIN
            const updated = await prisma.user.update({
                where: { email },
                data: { role: 'ADMIN' },
            });
            return NextResponse.json({
                success: true,
                message: 'User updated to ADMIN role',
                user: {
                    email: updated.email,
                    role: updated.role,
                    referralCode: updated.referralCode,
                },
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique referral code
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
                name: name || 'Admin',
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

        return NextResponse.json({
            success: true,
            message: 'Admin user created successfully',
            user: {
                email: user.email,
                role: user.role,
                referralCode: user.referralCode,
            },
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        return NextResponse.json(
            { error: 'Failed to create admin user' },
            { status: 500 }
        );
    }
}
