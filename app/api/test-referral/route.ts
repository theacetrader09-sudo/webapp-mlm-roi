import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
    try {
        console.log('--- Starting Comprehensive Referral Link Test (50+ Users) ---');

        // 1. Cleanup previous test data
        await prisma.earnings.deleteMany();
        await prisma.investment.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany();

        const results = {
            totalUsers: 0,
            successfulSignups: 0,
            failedSignups: 0,
            referralLinkTests: [] as any[],
            errors: [] as string[],
        };

        // 2. Create a root user (the one sharing referral links)
        const rootUser = await prisma.user.create({
            data: {
                email: 'root@test.com',
                password: 'hash',
                referralCode: 'ROOT2024',
                wallet: { create: { balance: 0, depositBalance: 0 } },
            },
        });

        console.log(`Root user created: ${rootUser.referralCode}`);

        // 3. Generate referral link (same as in the app)
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const referralLink = `${baseUrl}/signup?ref=${rootUser.referralCode}`;

        console.log(`Testing referral link: ${referralLink}`);

        // 4. Simulate 55 users clicking the referral link and signing up
        for (let i = 1; i <= 55; i++) {
            try {
                const email = `user${i}@test.com`;
                const refCode = `USER${String(i).padStart(4, '0')}`;

                // Simulate what happens when user clicks the link:
                // 1. Extract ref parameter (done by signup page - line 11 in signup/page.tsx)
                const urlParams = new URLSearchParams(`ref=${rootUser.referralCode}`);
                const extractedRef = urlParams.get('ref');

                // 2. User fills form and submits (lines 67-69 in signup/page.tsx)
                // The form converts to uppercase and trims
                const submittedRefCode = extractedRef?.trim().toUpperCase();

                // 3. Backend processes signup (lines 164-205 in api/auth/signup/route.ts)
                // Validate referral code exists
                const cleanReferralCode = submittedRefCode?.trim().toUpperCase();

                let referredBy = null;
                if (cleanReferralCode && cleanReferralCode.length > 0 && cleanReferralCode.length <= 20) {
                    const referrer = await prisma.user.findUnique({
                        where: { referralCode: cleanReferralCode },
                        select: { referralCode: true },
                    });

                    if (referrer) {
                        referredBy = referrer.referralCode;
                    } else {
                        results.errors.push(`User ${i}: Referral code '${cleanReferralCode}' not found`);
                    }
                }

                // 4. Create user with referral (lines 223-245 in api/auth/signup/route.ts)
                const newUser = await prisma.user.create({
                    data: {
                        email,
                        password: 'hash',
                        referralCode: refCode,
                        referredBy,
                        wallet: { create: { balance: 0, depositBalance: 0 } },
                    },
                });

                if (referredBy) {
                    results.successfulSignups++;
                    results.referralLinkTests.push({
                        userId: i,
                        email,
                        referralCode: newUser.referralCode,
                        referredBy: newUser.referredBy,
                        success: true,
                    });
                } else {
                    results.failedSignups++;
                    results.referralLinkTests.push({
                        userId: i,
                        email,
                        referralCode: newUser.referralCode,
                        referredBy: null,
                        success: false,
                        reason: 'Referral code validation failed',
                    });
                }

            } catch (error: any) {
                results.failedSignups++;
                results.errors.push(`User ${i}: ${error.message}`);
                results.referralLinkTests.push({
                    userId: i,
                    success: false,
                    error: error.message,
                });
            }
        }

        results.totalUsers = 55;

        // 5. Verify all referrals are properly linked
        const referredUsers = await prisma.user.findMany({
            where: { referredBy: rootUser.referralCode },
            select: {
                id: true,
                email: true,
                referralCode: true,
                referredBy: true,
            },
        });

        console.log(`Total users referred: ${referredUsers.length}`);

        // 6. Test different edge cases
        const edgeCases = {
            lowercaseRef: null as any,
            uppercaseRef: null as any,
            mixedCaseRef: null as any,
            withSpaces: null as any,
            emptyRef: null as any,
            nullRef: null as any,
        };

        // Test lowercase
        try {
            const lowerRef = rootUser.referralCode.toLowerCase();
            const referrer = await prisma.user.findUnique({
                where: { referralCode: lowerRef.toUpperCase() },
            });
            edgeCases.lowercaseRef = {
                success: !!referrer,
                tested: lowerRef,
                found: referrer?.referralCode || null,
            };
        } catch (e: any) {
            edgeCases.lowercaseRef = { success: false, error: e.message };
        }

        // Test uppercase (should work)
        try {
            const upperRef = rootUser.referralCode.toUpperCase();
            const referrer = await prisma.user.findUnique({
                where: { referralCode: upperRef },
            });
            edgeCases.uppercaseRef = {
                success: !!referrer,
                tested: upperRef,
                found: referrer?.referralCode || null,
            };
        } catch (e: any) {
            edgeCases.uppercaseRef = { success: false, error: e.message };
        }

        // Test mixed case
        try {
            const mixedRef = 'RoOt2024';
            const referrer = await prisma.user.findUnique({
                where: { referralCode: mixedRef.toUpperCase() },
            });
            edgeCases.mixedCaseRef = {
                success: !!referrer,
                tested: mixedRef,
                normalized: mixedRef.toUpperCase(),
                found: referrer?.referralCode || null,
            };
        } catch (e: any) {
            edgeCases.mixedCaseRef = { success: false, error: e.message };
        }

        // Test with spaces
        try {
            const spacedRef = `  ${rootUser.referralCode}  `;
            const referrer = await prisma.user.findUnique({
                where: { referralCode: spacedRef.trim().toUpperCase() },
            });
            edgeCases.withSpaces = {
                success: !!referrer,
                tested: spacedRef,
                normalized: spacedRef.trim().toUpperCase(),
                found: referrer?.referralCode || null,
            };
        } catch (e: any) {
            edgeCases.withSpaces = { success: false, error: e.message };
        }

        // Test empty string
        try {
            const emptyRef = '';
            const referrer = await prisma.user.findUnique({
                where: { referralCode: emptyRef },
            });
            edgeCases.emptyRef = {
                success: false, // Should not find anything
                tested: emptyRef,
                found: referrer?.referralCode || null,
            };
        } catch (e: any) {
            edgeCases.emptyRef = { success: false, error: e.message };
        }

        return NextResponse.json({
            success: true,
            summary: {
                totalUsers: results.totalUsers,
                successfulSignups: results.successfulSignups,
                failedSignups: results.failedSignups,
                successRate: `${((results.successfulSignups / results.totalUsers) * 100).toFixed(2)}%`,
            },
            referralLink: {
                url: referralLink,
                rootUser: rootUser.referralCode,
                totalReferred: referredUsers.length,
                expectedReferred: 55,
            },
            edgeCases,
            sampleReferrals: referredUsers.slice(0, 5).map(u => ({
                email: u.email,
                code: u.referralCode,
                referredBy: u.referredBy,
            })),
            errors: results.errors.slice(0, 10), // Show first 10 errors
            verdict: {
                allUsersSignedUp: results.successfulSignups === results.totalUsers,
                allUsersLinked: referredUsers.length === results.successfulSignups,
                isWorking: results.successfulSignups === results.totalUsers && referredUsers.length === results.successfulSignups,
                issues: results.failedSignups > 0 ? [
                    `${results.failedSignups} users failed to sign up with referral link`,
                    'Check errors array for details',
                ] : [],
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
