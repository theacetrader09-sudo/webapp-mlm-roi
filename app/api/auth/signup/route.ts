import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

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
    const { name, email, password, referralCode } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code
    let newReferralCode = generateReferralCode();
    let isUnique = false;
    while (!isUnique) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: newReferralCode },
      });
      if (!existing) {
        isUnique = true;
      } else {
        newReferralCode = generateReferralCode();
      }
    }

    // Check if referral code is valid (if provided)
    let referredBy = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        referredBy = referralCode;
      }
    }

    // Create user and wallet in a transaction
    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        referralCode: newReferralCode,
        referredBy,
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

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        user: userWithoutPassword,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

