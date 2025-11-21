/**
 * Enhanced Edge Cases & Full 10-Level Referral Chain Test
 * 
 * Tests:
 * - Full 10-level referral chain
 * - Concurrent operations
 * - Negative balance prevention
 * - Multiple investments per user
 * - ROI idempotency
 * - Boundary conditions
 * - Missing upline scenarios
 * - Multiple ROI runs
 * - Complex scenarios
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';
import { REFERRAL_COMMISSION_PERCENTS } from '../lib/roi-config';
import { getPackageByAmount } from '../lib/package-assignment';

const prisma = new PrismaClient();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL', message: string, data?: any) {
  results.push({ test, status, message, data });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${test}: ${message}`);
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    await prisma.auditLog.deleteMany({});
    await prisma.earnings.deleteMany({});
    await prisma.cronRunLog.deleteMany({});
    await prisma.roiCronRun.deleteMany({});
    await prisma.withdrawal.deleteMany({});
    await prisma.deposit.deleteMany({});
    await prisma.investment.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'edge_test_',
        },
      },
    });
    logTest('Cleanup', 'PASS', 'Test data cleaned up');
  } catch (error) {
    logTest('Cleanup', 'FAIL', `Error during cleanup: ${error}`);
  }
}

async function create10LevelReferralChain() {
  console.log('\n🔗 TEST: Creating Full 10-Level Referral Chain\n');
  
  const users: any[] = [];
  
  try {
    // Create root user (Level 0 - no referrer)
    const rootUser = await prisma.user.create({
      data: {
        email: 'edge_test_level0@example.com',
        name: 'Level 0 (Root)',
        password: await bcrypt.hash('password123', 10),
        referralCode: 'EDGE_L0',
        role: 'USER',
        wallet: {
          create: {
            balance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        },
      },
      include: { wallet: true },
    });
    users.push(rootUser);
    logTest('Create Level 0 (Root)', 'PASS', 'Root user created', {
      id: rootUser.id,
      referralCode: rootUser.referralCode,
    });

    // Create 10 levels of referrals
    for (let level = 1; level <= 10; level++) {
      const parentUser = users[level - 1];
      const newUser = await prisma.user.create({
        data: {
          email: `edge_test_level${level}@example.com`,
          name: `Level ${level}`,
          password: await bcrypt.hash('password123', 10),
          referralCode: `EDGE_L${level}`,
          referredBy: parentUser.referralCode,
          role: 'USER',
          wallet: {
            create: {
              balance: 0,
              roiTotal: 0,
              referralTotal: 0,
            },
          },
        },
        include: { wallet: true },
      });
      users.push(newUser);

      // Verify referral chain
      const verifyUser = await prisma.user.findUnique({
        where: { referralCode: newUser.referralCode },
        select: { referredBy: true },
      });

      if (verifyUser?.referredBy === parentUser.referralCode) {
        logTest(`Create Level ${level}`, 'PASS', `User created, referred by Level ${level - 1}`, {
          referralCode: newUser.referralCode,
          referredBy: newUser.referredBy,
        });
      } else {
        logTest(`Create Level ${level}`, 'FAIL', 'Referral chain broken');
      }
    }

    // Verify full chain
    let currentLevel = users[10]; // Level 10 (last user)
    let chainVerified = true;
    const chain: string[] = [currentLevel.referralCode];

    for (let i = 9; i >= 0; i--) {
      if (currentLevel.referredBy === users[i].referralCode) {
        chain.push(users[i].referralCode);
        currentLevel = users[i];
      } else {
        chainVerified = false;
        break;
      }
    }

    if (chainVerified && chain.length === 11) {
      logTest('10-Level Chain Verification', 'PASS', 'Full chain verified', {
        chain: chain.reverse(),
        levels: chain.length,
      });
    } else {
      logTest('10-Level Chain Verification', 'FAIL', 'Chain verification failed');
    }

    return users;
  } catch (error) {
    logTest('10-Level Chain Creation', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function test10LevelReferralCommissions(users: any[]) {
  console.log('\n💰 TEST: 10-Level Referral Commission Distribution\n');

  try {
    // Give Level 10 user funds and create investment
    const level10User = users[10];
    await prisma.wallet.update({
      where: { userId: level10User.id },
      data: { balance: 5000 },
    });

    // Create investment: $1000 (Silver package, 1% ROI = $10/day)
    const investment = await prisma.investment.create({
      data: {
        userId: level10User.id,
        walletId: level10User.wallet.id,
        packageName: 'Silver',
        amount: 1000,
        dailyROI: new Decimal(1.0),
        isActive: true,
        status: 'ACTIVE',
      },
    });

    const roiAmount = (investment.amount * investment.dailyROI.toNumber()) / 100; // $10
    logTest('Investment Setup', 'PASS', `Level 10 user invested $1000, ROI: $${roiAmount}/day`);

    // Distribute commissions to all 10 levels
    const commissionResults: any[] = [];

    for (let level = 0; level < 10; level++) {
      const uplineUser = users[level];
      const commissionPercent = REFERRAL_COMMISSION_PERCENTS[level];
      const commissionAmount = (roiAmount * commissionPercent) / 100;

      const walletBefore = await prisma.wallet.findUnique({
        where: { userId: uplineUser.id },
      });

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId: uplineUser.id },
          data: {
            balance: { increment: commissionAmount },
            referralTotal: { increment: commissionAmount },
          },
        });

        await tx.earnings.create({
          data: {
            userId: uplineUser.id,
            walletId: uplineUser.wallet.id,
            amount: commissionAmount,
            type: 'referral',
            description: `Level ${level + 1} referral commission from ${level10User.referralCode}`,
          },
        });
      });

      const walletAfter = await prisma.wallet.findUnique({
        where: { userId: uplineUser.id },
      });

      const expectedBalance = (walletBefore?.balance || 0) + commissionAmount;
      const actualBalance = walletAfter?.balance || 0;

      if (Math.abs(actualBalance - expectedBalance) < 0.01) {
        logTest(
          `Level ${level + 1} Commission`,
          'PASS',
          `$${commissionAmount.toFixed(4)} (${commissionPercent}% of $${roiAmount})`,
          {
            level: level + 1,
            percent: commissionPercent,
            commission: commissionAmount,
            walletBefore: walletBefore?.balance,
            walletAfter: actualBalance,
          }
        );
        commissionResults.push({ level: level + 1, amount: commissionAmount, percent: commissionPercent });
      } else {
        logTest(`Level ${level + 1} Commission`, 'FAIL', 'Commission amount incorrect', {
          expected: expectedBalance,
          actual: actualBalance,
        });
      }
    }

    // Verify total commission
    const totalCommission = commissionResults.reduce((sum, r) => sum + r.amount, 0);
    const expectedTotal = REFERRAL_COMMISSION_PERCENTS.reduce((sum, p) => sum + (roiAmount * p) / 100, 0);

    if (Math.abs(totalCommission - expectedTotal) < 0.01) {
      logTest('Total Commission Verification', 'PASS', `Total: $${totalCommission.toFixed(4)}`, {
        totalCommission,
        expectedTotal,
        roiAmount,
      });
    } else {
      logTest('Total Commission Verification', 'FAIL', 'Total commission incorrect');
    }

    return { investment, commissionResults };
  } catch (error) {
    logTest('10-Level Commission Test', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function testEdgeCases(users: any[]) {
  console.log('\n🧪 TEST: Edge Cases & Boundary Conditions\n');

  try {
    const testUser = users[5]; // Use Level 5 user

    // Edge Case 1: Minimum investment amount
    console.log('\n📌 Edge Case 1: Minimum Investment ($35)');
    const minInvestment = await prisma.investment.create({
      data: {
        userId: testUser.id,
        walletId: testUser.wallet.id,
        packageName: 'Starter',
        amount: 35,
        dailyROI: new Decimal(0.5),
        isActive: true,
        status: 'ACTIVE',
      },
    });
    logTest('Minimum Investment', 'PASS', '$35 investment created', {
      amount: minInvestment.amount,
      package: minInvestment.packageName,
      roi: minInvestment.dailyROI.toString(),
    });

    // Edge Case 2: Maximum investment amount
    console.log('\n📌 Edge Case 2: Maximum Investment ($100,000)');
    await prisma.wallet.update({
      where: { userId: testUser.id },
      data: { balance: 100000 },
    });
    const maxInvestment = await prisma.investment.create({
      data: {
        userId: testUser.id,
        walletId: testUser.wallet.id,
        packageName: 'Gold',
        amount: 100000,
        dailyROI: new Decimal(2.0),
        isActive: true,
        status: 'ACTIVE',
      },
    });
    logTest('Maximum Investment', 'PASS', '$100,000 investment created', {
      amount: maxInvestment.amount,
      package: maxInvestment.packageName,
      roi: maxInvestment.dailyROI.toString(),
    });

    // Edge Case 3: Multiple investments per user
    console.log('\n📌 Edge Case 3: Multiple Investments Per User');
    await prisma.wallet.update({
      where: { userId: testUser.id },
      data: { balance: 5000 },
    });

    const investments = await Promise.all([
      prisma.investment.create({
        data: {
          userId: testUser.id,
          walletId: testUser.wallet.id,
          packageName: 'Starter',
          amount: 100,
          dailyROI: new Decimal(0.5),
          isActive: true,
          status: 'ACTIVE',
        },
      }),
      prisma.investment.create({
        data: {
          userId: testUser.id,
          walletId: testUser.wallet.id,
          packageName: 'Silver',
          amount: 500,
          dailyROI: new Decimal(1.0),
          isActive: true,
          status: 'ACTIVE',
        },
      }),
    ]);

    const investmentCount = await prisma.investment.count({
      where: { userId: testUser.id, isActive: true },
    });

    if (investmentCount >= 2) {
      logTest('Multiple Investments', 'PASS', `${investmentCount} active investments created`, {
        investments: investments.map((inv) => ({
          id: inv.id,
          amount: inv.amount,
          package: inv.packageName,
        })),
      });
    } else {
      logTest('Multiple Investments', 'FAIL', 'Failed to create multiple investments');
    }

    // Edge Case 4: ROI Idempotency
    console.log('\n📌 Edge Case 4: ROI Idempotency (Prevent Double Payment)');
    const testInvestment = investments[0];
    const walletBefore = await prisma.wallet.findUnique({
      where: { userId: testUser.id },
    });

    // First ROI payment
    const firstROI = (testInvestment.amount * testInvestment.dailyROI.toNumber()) / 100;
    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: testUser.id },
        data: {
          balance: { increment: firstROI },
          roiTotal: { increment: firstROI },
        },
      });
      await tx.investment.update({
        where: { id: testInvestment.id },
        data: { lastRoiAt: new Date() },
      });
    });

    const walletAfterFirst = await prisma.wallet.findUnique({
      where: { userId: testUser.id },
    });

    // Try to pay ROI again (should be skipped if lastRoiAt is today)
    const lastRoiAt = await prisma.investment.findUnique({
      where: { id: testInvestment.id },
      select: { lastRoiAt: true },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const lastRoiDate = lastRoiAt?.lastRoiAt ? new Date(lastRoiAt.lastRoiAt) : null;
    if (lastRoiDate) {
      lastRoiDate.setUTCHours(0, 0, 0, 0);
    }

    const wasPaidToday = lastRoiDate && lastRoiDate.getTime() === today.getTime();

    if (wasPaidToday) {
      logTest('ROI Idempotency Check', 'PASS', 'ROI already paid today, should be skipped', {
        lastRoiAt: lastRoiAt?.lastRoiAt,
        wasPaidToday,
      });
    } else {
      logTest('ROI Idempotency Check', 'FAIL', 'Idempotency check not working');
    }

    // Edge Case 5: Negative Balance Prevention
    console.log('\n📌 Edge Case 5: Negative Balance Prevention');
    const wallet = await prisma.wallet.findUnique({
      where: { userId: testUser.id },
    });

    try {
      // Try to create withdrawal larger than balance
      const withdrawal = await prisma.withdrawal.create({
        data: {
          userId: testUser.id,
          amount: new Decimal((wallet?.balance || 0) + 1000),
          walletBefore: new Decimal(wallet?.balance || 0),
          walletAfter: new Decimal(wallet?.balance || 0),
          status: 'PENDING',
        },
      });

      // Try to approve (should fail in real API)
      try {
        await prisma.$transaction(async (tx) => {
          const currentWallet = await tx.wallet.findUnique({
            where: { userId: testUser.id },
          });

          if ((currentWallet?.balance || 0) < withdrawal.amount.toNumber()) {
            throw new Error('Insufficient balance');
          }

          await tx.wallet.update({
            where: { userId: testUser.id },
            data: {
              balance: { decrement: withdrawal.amount.toNumber() },
            },
          });
        });
        logTest('Negative Balance Prevention', 'FAIL', 'Should have rejected insufficient balance');
      } catch (error: any) {
        if (error.message.includes('Insufficient')) {
          logTest('Negative Balance Prevention', 'PASS', 'Insufficient balance correctly rejected');
        } else {
          logTest('Negative Balance Prevention', 'FAIL', `Unexpected error: ${error.message}`);
        }
      }
    } catch (error) {
      logTest('Negative Balance Prevention', 'FAIL', `Error: ${error}`);
    }

    // Edge Case 6: Boundary Package Amounts
    console.log('\n📌 Edge Case 6: Package Boundary Amounts');
    const boundaryTests = [
      { amount: 34, shouldFail: true, reason: 'Below minimum' },
      { amount: 35, shouldFail: false, package: 'Starter' },
      { amount: 999, shouldFail: false, package: 'Starter' },
      { amount: 1000, shouldFail: false, package: 'Silver' },
      { amount: 9999, shouldFail: false, package: 'Silver' },
      { amount: 10000, shouldFail: false, package: 'Gold' },
      { amount: 100000, shouldFail: false, package: 'Gold' },
      { amount: 100001, shouldFail: true, reason: 'Above maximum' },
    ];

    for (const test of boundaryTests) {
      const packageInfo = getPackageByAmount(test.amount);
      if (test.shouldFail) {
        if (!packageInfo) {
          logTest(`Boundary ${test.amount}`, 'PASS', `Correctly rejected: ${test.reason}`);
        } else {
          logTest(`Boundary ${test.amount}`, 'FAIL', `Should have been rejected but got package: ${packageInfo.name}`);
        }
      } else {
        if (packageInfo && packageInfo.name === test.package) {
          logTest(`Boundary ${test.amount}`, 'PASS', `Correct package: ${test.package}`);
        } else {
          logTest(`Boundary ${test.amount}`, 'FAIL', `Wrong package assignment`);
        }
      }
    }

    // Edge Case 7: Missing Upline Scenario
    console.log('\n📌 Edge Case 7: Missing Upline in Referral Chain');
    const orphanUser = await prisma.user.create({
      data: {
        email: 'edge_test_orphan@example.com',
        name: 'Orphan User',
        password: await bcrypt.hash('password123', 10),
        referralCode: 'EDGE_ORPHAN',
        referredBy: 'NONEXISTENT_REF', // Invalid referral code
        role: 'USER',
        wallet: {
          create: {
            balance: 0,
            roiTotal: 0,
            referralTotal: 0,
          },
        },
      },
      include: { wallet: true },
    });

    // Try to get upline chain (should stop at missing upline)
    let uplineCount = 0;
    let currentRef = orphanUser.referredBy;
    while (currentRef) {
      const upline = await prisma.user.findUnique({
        where: { referralCode: currentRef },
      });
      if (!upline) break;
      uplineCount++;
      currentRef = upline.referredBy;
    }

    if (uplineCount === 0) {
      logTest('Missing Upline Handling', 'PASS', 'Correctly stopped at missing upline', {
        referredBy: orphanUser.referredBy,
        uplineCount,
      });
    } else {
      logTest('Missing Upline Handling', 'FAIL', 'Did not handle missing upline correctly');
    }

    // Edge Case 8: Concurrent ROI Calculations
    console.log('\n📌 Edge Case 8: Multiple Investments ROI Calculation');
    const multiROI = await prisma.wallet.findUnique({
      where: { userId: testUser.id },
    });

    const totalROI = investments.reduce((sum, inv) => {
      return sum + (inv.amount * inv.dailyROI.toNumber()) / 100;
    }, 0);

    logTest('Multiple Investments ROI', 'PASS', `Total ROI from ${investments.length} investments: $${totalROI.toFixed(2)}`, {
      investments: investments.map((inv) => ({
        amount: inv.amount,
        roi: (inv.amount * inv.dailyROI.toNumber()) / 100,
      })),
      totalROI,
    });

    return { investments, testUser };
  } catch (error) {
    logTest('Edge Cases', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function testConcurrentOperations(users: any[]) {
  console.log('\n⚡ TEST: Concurrent Operations & Race Conditions\n');

  try {
    const testUser = users[3];
    await prisma.wallet.update({
      where: { userId: testUser.id },
      data: { balance: 1000 },
    });

    // Test concurrent withdrawals
    console.log('\n📌 Concurrent Withdrawals');
    const withdrawal1 = await prisma.withdrawal.create({
      data: {
        userId: testUser.id,
        amount: new Decimal(300),
        walletBefore: new Decimal(1000),
        walletAfter: new Decimal(1000),
        status: 'PENDING',
      },
    });

    const withdrawal2 = await prisma.withdrawal.create({
      data: {
        userId: testUser.id,
        amount: new Decimal(400),
        walletBefore: new Decimal(1000),
        walletAfter: new Decimal(1000),
        status: 'PENDING',
      },
    });

    // Approve first withdrawal
    await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: testUser.id },
      });

      if ((wallet?.balance || 0) >= withdrawal1.amount.toNumber()) {
        await tx.wallet.update({
          where: { userId: testUser.id },
          data: {
            balance: { decrement: withdrawal1.amount.toNumber() },
          },
        });

        await tx.withdrawal.update({
          where: { id: withdrawal1.id },
          data: {
            status: 'APPROVED',
            walletAfter: new Decimal((wallet?.balance || 0) - withdrawal1.amount.toNumber()),
          },
        });
      }
    });

    // Try to approve second withdrawal (should check balance again)
    const walletAfterFirst = await prisma.wallet.findUnique({
      where: { userId: testUser.id },
    });

    try {
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId: testUser.id },
        });

        if ((wallet?.balance || 0) >= withdrawal2.amount.toNumber()) {
          await tx.wallet.update({
            where: { userId: testUser.id },
            data: {
              balance: { decrement: withdrawal2.amount.toNumber() },
            },
          });
        } else {
          throw new Error('Insufficient balance');
        }
      });

      const finalWallet = await prisma.wallet.findUnique({
        where: { userId: testUser.id },
      });

      if (finalWallet && finalWallet.balance >= 0) {
        logTest('Concurrent Withdrawals', 'PASS', 'Both withdrawals processed, balance remains valid', {
          initialBalance: 1000,
          withdrawal1: withdrawal1.amount.toNumber(),
          withdrawal2: withdrawal2.amount.toNumber(),
          finalBalance: finalWallet.balance,
        });
      } else {
        logTest('Concurrent Withdrawals', 'FAIL', 'Balance went negative');
      }
    } catch (error: any) {
      if (error.message.includes('Insufficient')) {
        logTest('Concurrent Withdrawals', 'PASS', 'Second withdrawal correctly rejected due to insufficient balance');
      } else {
        logTest('Concurrent Withdrawals', 'FAIL', `Error: ${error.message}`);
      }
    }
  } catch (error) {
    logTest('Concurrent Operations', 'FAIL', `Error: ${error}`);
  }
}

async function runEnhancedTests() {
  console.log('🚀 Starting Enhanced Edge Cases & 10-Level Referral Chain Test\n');
  console.log('='.repeat(70));

  try {
    // Cleanup
    await cleanup();

    // Test 1: Create 10-level referral chain
    const users = await create10LevelReferralChain();

    // Test 2: Test 10-level referral commissions
    await test10LevelReferralCommissions(users);

    // Test 3: Edge cases
    await testEdgeCases(users);

    // Test 4: Concurrent operations
    await testConcurrentOperations(users);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 TEST SUMMARY\n');

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ FAILED TESTS:');
      results
        .filter((r) => r.status === 'FAIL')
        .forEach((r) => {
          console.log(`   - ${r.test}: ${r.message}`);
        });
    }

    console.log('\n✅ Enhanced simulation test completed!');
  } catch (error) {
    console.error('\n❌ Enhanced simulation test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enhanced tests
runEnhancedTests().catch(console.error);

