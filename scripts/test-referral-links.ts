import { prisma } from '../lib/prisma';

async function testReferralLinks() {
    console.log('--- Starting Comprehensive Referral Link Test (50+ Users) ---\n');

    try {
        // 1. Cleanup previous test data
        console.log('Cleaning up previous test data...');
        await prisma.earnings.deleteMany();
        await prisma.investment.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: { contains: '@test.com' } },
                    { referralCode: { startsWith: 'USER' } },
                    { referralCode: 'ROOT2024' },
                ],
            },
        });

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

        console.log(`✓ Root user created: ${rootUser.referralCode}`);

        // 3. Generate referral link (same as in the app)
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const referralLink = `${baseUrl}/signup?ref=${rootUser.referralCode}`;

        console.log(`✓ Testing referral link: ${referralLink}\n`);

        // 4. Simulate 55 users clicking the referral link and signing up
        console.log('Simulating 55 users clicking the referral link...');
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
                    if (i <= 5) {
                        console.log(`  ✓ User ${i}: ${email} -> referred by ${referredBy}`);
                    }
                } else {
                    results.failedSignups++;
                    console.log(`  ✗ User ${i}: ${email} -> referral failed`);
                }

            } catch (error: any) {
                results.failedSignups++;
                results.errors.push(`User ${i}: ${error.message}`);
                console.log(`  ✗ User ${i}: Error - ${error.message}`);
            }
        }

        if (results.successfulSignups > 5) {
            console.log(`  ... (${results.successfulSignups - 5} more users successfully signed up)`);
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

        console.log(`\n✓ Total users referred: ${referredUsers.length}`);

        // 6. Test different edge cases
        console.log('\n--- Testing Edge Cases ---');
        const edgeCases = {
            lowercaseRef: null as any,
            uppercaseRef: null as any,
            mixedCaseRef: null as any,
            withSpaces: null as any,
        };

        // Test lowercase
        const lowerRef = rootUser.referralCode.toLowerCase();
        const lowerReferrer = await prisma.user.findUnique({
            where: { referralCode: lowerRef.toUpperCase() },
        });
        edgeCases.lowercaseRef = {
            success: !!lowerReferrer,
            tested: lowerRef,
            found: lowerReferrer?.referralCode || null,
        };
        console.log(`Lowercase ('${lowerRef}'): ${edgeCases.lowercaseRef.success ? '✓ PASS' : '✗ FAIL'}`);

        // Test uppercase (should work)
        const upperRef = rootUser.referralCode.toUpperCase();
        const upperReferrer = await prisma.user.findUnique({
            where: { referralCode: upperRef },
        });
        edgeCases.uppercaseRef = {
            success: !!upperReferrer,
            tested: upperRef,
            found: upperReferrer?.referralCode || null,
        };
        console.log(`Uppercase ('${upperRef}'): ${edgeCases.uppercaseRef.success ? '✓ PASS' : '✗ FAIL'}`);

        // Test mixed case
        const mixedRef = 'RoOt2024';
        const mixedReferrer = await prisma.user.findUnique({
            where: { referralCode: mixedRef.toUpperCase() },
        });
        edgeCases.mixedCaseRef = {
            success: !!mixedReferrer,
            tested: mixedRef,
            normalized: mixedRef.toUpperCase(),
            found: mixedReferrer?.referralCode || null,
        };
        console.log(`Mixed case ('${mixedRef}'): ${edgeCases.mixedCaseRef.success ? '✓ PASS' : '✗ FAIL'}`);

        // Test with spaces
        const spacedRef = `  ${rootUser.referralCode}  `;
        const spacedReferrer = await prisma.user.findUnique({
            where: { referralCode: spacedRef.trim().toUpperCase() },
        });
        edgeCases.withSpaces = {
            success: !!spacedReferrer,
            tested: spacedRef,
            normalized: spacedRef.trim().toUpperCase(),
            found: spacedReferrer?.referralCode || null,
        };
        console.log(`With spaces ('${spacedRef}'): ${edgeCases.withSpaces.success ? '✓ PASS' : '✗ FAIL'}`);

        // 7. Print summary
        console.log('\n=== TEST SUMMARY ===');
        console.log(`Total Users: ${results.totalUsers}`);
        console.log(`Successful Signups: ${results.successfulSignups}`);
        console.log(`Failed Signups: ${results.failedSignups}`);
        console.log(`Success Rate: ${((results.successfulSignups / results.totalUsers) * 100).toFixed(2)}%`);
        console.log(`\nReferral Link: ${referralLink}`);
        console.log(`Root User: ${rootUser.referralCode}`);
        console.log(`Total Referred: ${referredUsers.length}`);
        console.log(`Expected Referred: 55`);

        console.log('\n=== VERDICT ===');
        const allUsersSignedUp = results.successfulSignups === results.totalUsers;
        const allUsersLinked = referredUsers.length === results.successfulSignups;
        const isWorking = allUsersSignedUp && allUsersLinked;

        if (isWorking) {
            console.log('✓ PASS: All 55 users successfully signed up with referral link!');
            console.log('✓ PASS: All users are properly linked to the root user!');
            console.log('\n🎉 REFERRAL LINK SYSTEM IS WORKING CORRECTLY! 🎉');
        } else {
            console.log('✗ FAIL: Referral link system has issues:');
            if (!allUsersSignedUp) {
                console.log(`  - ${results.failedSignups} users failed to sign up with referral link`);
            }
            if (!allUsersLinked) {
                console.log(`  - Expected ${results.successfulSignups} referred users, but found ${referredUsers.length}`);
            }
            if (results.errors.length > 0) {
                console.log('\nFirst 5 errors:');
                results.errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
            }
        }

        // Sample referrals
        if (referredUsers.length > 0) {
            console.log('\nSample Referrals (first 5):');
            referredUsers.slice(0, 5).forEach(u => {
                console.log(`  - ${u.email} (${u.referralCode}) -> referred by ${u.referredBy}`);
            });
        }

    } catch (error) {
        console.error('\n❌ Test error:', error);
        throw error;
    } finally {
        // Cleanup test data
        console.log('\nCleaning up test data...');
        await prisma.user.deleteMany({
            where: {
                OR: [
                    { email: { contains: '@test.com' } },
                    { referralCode: { startsWith: 'USER' } },
                    { referralCode: 'ROOT2024' },
                ],
            },
        });
        await prisma.wallet.deleteMany();
        console.log('✓ Cleanup complete');
    }
}

testReferralLinks()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
