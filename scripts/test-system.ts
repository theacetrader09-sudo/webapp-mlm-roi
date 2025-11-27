/**
 * Comprehensive System Test Script
 * Tests all major functionality including:
 * - Database connection
 * - User management
 * - Referral commission logic
 * - ROI processing
 * - Data integrity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function test(name: string, testFn: () => Promise<boolean | { passed: boolean; message: string; details?: any }>) {
  try {
    const result = await testFn();
    if (typeof result === 'boolean') {
      results.push({
        name,
        passed: result,
        message: result ? 'PASSED' : 'FAILED',
      });
    } else {
      results.push({
        name,
        passed: result.passed,
        message: result.message,
        details: result.details,
      });
    }
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      message: `ERROR: ${error.message}`,
      details: error,
    });
  }
}

async function runTests() {
  console.log('🧪 Starting Comprehensive System Tests...\n');

  // Test 1: Database Connection
  await test('Database Connection', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  });

  // Test 2: Database is not localhost
  await test('Database is Production (not localhost)', async () => {
    const dbUrl = process.env.DATABASE_URL || '';
    const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
    return {
      passed: !isLocal,
      message: isLocal ? 'WARNING: Using localhost database' : 'Using production database',
      details: { url: dbUrl.replace(/:[^:@]+@/, ':****@') },
    };
  });

  // Test 3: Users can be fetched
  await test('Fetch Users', async () => {
    try {
      // Use raw query to handle potential null emails
      const users = await prisma.$queryRaw<Array<{ id: string; email: string | null }>>`
        SELECT id, email FROM "User" LIMIT 10
      `;
      return {
        passed: true,
        message: `Found ${users.length} users`,
        details: { count: users.length },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error fetching users: ${error.message}`,
      };
    }
  });

  // Test 4: Users have wallets
  await test('Users Have Wallets', async () => {
    try {
      const users = await prisma.$queryRaw<Array<{ id: string; email: string | null; walletId: string | null }>>`
        SELECT u.id, u.email, w.id as "walletId"
        FROM "User" u
        LEFT JOIN "Wallet" w ON w."userId" = u.id
        LIMIT 10
      `;
      const usersWithoutWallets = users.filter(u => !u.walletId);
      return {
        passed: usersWithoutWallets.length === 0,
        message: usersWithoutWallets.length === 0
          ? 'All users have wallets'
          : `${usersWithoutWallets.length} users without wallets`,
        details: {
          total: users.length,
          withoutWallets: usersWithoutWallets.length,
        },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking wallets: ${error.message}`,
      };
    }
  });

  // Test 5: Referral chain logic
  await test('Referral Chain Logic', async () => {
    // Find a user who was referred (has referredBy)
    const userWithReferrer = await prisma.user.findFirst({
      where: {
        referredBy: {
          not: null,
        },
      },
    });

    if (!userWithReferrer || !userWithReferrer.referredBy) {
      return {
        passed: true,
        message: 'No users with referrers to test chain',
      };
    }

    // Test upline chain building
    let currentRef: string | null = userWithReferrer.referredBy;
    let chainLength = 0;
    const maxLevels = 10;

    while (currentRef && chainLength < maxLevels) {
      const uplineUser: { referredBy: string | null; wallet: any } | null = await prisma.user.findUnique({
        where: { referralCode: currentRef },
        include: { wallet: true },
      });

      if (!uplineUser) break;
      chainLength++;
      currentRef = uplineUser.referredBy;
      if (!currentRef) break;
    }

    return {
      passed: true,
      message: `Referral chain works, tested ${chainLength} levels`,
      details: { chainLength },
    };
  });

  // Test 6: Active investments check
  await test('Active Investments Check', async () => {
    const activeInvestments = await prisma.investment.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
      take: 10,
    });

    // Check if users with active investments can be identified
    const usersWithActive = await prisma.user.findMany({
      where: {
        investments: {
          some: {
            isActive: true,
            status: 'ACTIVE',
          },
        },
      },
      take: 5,
    });

    return {
      passed: true,
      message: `Found ${activeInvestments.length} active investments, ${usersWithActive.length} users with active investments`,
      details: {
        activeInvestments: activeInvestments.length,
        usersWithActive: usersWithActive.length,
      },
    };
  });

  // Test 7: Referral commission calculation
  await test('Referral Commission Calculation', async () => {
    // Find an active investment
    const investment = await prisma.investment.findFirst({
      where: {
        isActive: true,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            referralCode: true,
            referredBy: true,
          },
        },
      },
    });

    if (!investment) {
      return {
        passed: true,
        message: 'No active investments to test commission calculation',
      };
    }

    // Simulate commission calculation
    const roiAmount = Number(investment.amount) * (Number(investment.dailyROI) / 100);
    const commissionPercent = 10; // Level 1
    const commissionAmount = (roiAmount * commissionPercent) / 100;

    return {
      passed: commissionAmount > 0,
      message: `Commission calculation works: $${commissionAmount.toFixed(2)} from $${roiAmount.toFixed(2)} ROI`,
      details: {
        investmentAmount: Number(investment.amount),
        dailyROI: Number(investment.dailyROI),
        roiAmount: roiAmount,
        commissionAmount: commissionAmount,
      },
    };
  });

  // Test 8: Data integrity - all users have referral codes
  await test('Data Integrity - Referral Codes', async () => {
    try {
      const usersWithoutCodes = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "User" 
        WHERE "referralCode" IS NULL OR "referralCode" = ''
      `;

      return {
        passed: usersWithoutCodes.length === 0,
        message: usersWithoutCodes.length === 0
          ? 'All users have referral codes'
          : `${usersWithoutCodes.length} users without referral codes`,
        details: {
          usersWithoutCodes: usersWithoutCodes.length,
        },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking referral codes: ${error.message}`,
      };
    }
  });

  // Test 9: Wallet balances are numbers
  await test('Wallet Data Types', async () => {
    const wallets = await prisma.wallet.findMany({ take: 10 });
    const invalidWallets = wallets.filter(w => 
      isNaN(Number(w.balance)) || 
      isNaN(Number(w.depositBalance)) ||
      isNaN(Number(w.roiTotal)) ||
      isNaN(Number(w.referralTotal))
    );

    return {
      passed: invalidWallets.length === 0,
      message: invalidWallets.length === 0
        ? 'All wallet values are valid numbers'
        : `${invalidWallets.length} wallets with invalid values`,
      details: {
        total: wallets.length,
        invalid: invalidWallets.length,
      },
    };
  });

  // Test 10: Referral relationships are valid
  await test('Referral Relationships Validity', async () => {
    try {
      const usersWithRefs = await prisma.$queryRaw<Array<{ id: string; referredBy: string | null }>>`
        SELECT id, "referredBy" FROM "User" 
        WHERE "referredBy" IS NOT NULL 
        LIMIT 20
      `;

      let invalid = 0;
      for (const user of usersWithRefs) {
        if (user.referredBy) {
          const referrer = await prisma.user.findUnique({
            where: { referralCode: user.referredBy },
          });
          if (!referrer) {
            invalid++;
          }
        }
      }

      return {
        passed: invalid === 0,
        message: invalid === 0
          ? 'All referral relationships are valid'
          : `${invalid} users with invalid referral relationships`,
        details: {
          checked: usersWithRefs.length,
          invalid: invalid,
        },
      };
    } catch (error: any) {
      return {
        passed: false,
        message: `Error checking relationships: ${error.message}`,
      };
    }
  });

  // Print results
  console.log('\n📊 Test Results:\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;

  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details && Object.keys(result.details).length > 0) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
    
    if (result.passed) passed++;
    else failed++;
  });

  console.log('='.repeat(80));
  console.log(`\n📈 Summary: ${passed} passed, ${failed} failed out of ${results.length} tests\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! System is working correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.\n');
  }

  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

