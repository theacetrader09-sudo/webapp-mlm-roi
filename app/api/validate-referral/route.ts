import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to validate referral codes in real-time
 * Used by the signup page to provide instant feedback
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');

        if (!code || typeof code !== 'string') {
            return NextResponse.json({ valid: false, error: 'No code provided' });
        }

        const cleanCode = code.trim().toUpperCase();

        // Validate length
        if (cleanCode.length === 0 || cleanCode.length > 20) {
            return NextResponse.json({ valid: false, error: 'Invalid code length' });
        }

        // Check if referral code exists
        const referrer = await prisma.user.findUnique({
            where: { referralCode: cleanCode },
            select: {
                referralCode: true,
                name: true,
                email: true,
            },
        });

        if (!referrer) {
            return NextResponse.json({ valid: false, error: 'Referral code not found' });
        }

        // Return success with referrer info
        return NextResponse.json({
            valid: true,
            referralCode: referrer.referralCode,
            referrerName: referrer.name || referrer.email?.split('@')[0] || 'a user',
        });

    } catch (error) {
        console.error('Referral validation error:', error);
        return NextResponse.json(
            { valid: false, error: 'Validation failed' },
            { status: 500 }
        );
    }
}
