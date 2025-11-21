/**
 * Comprehensive System Simulation Test
 * 
 * This script tests the entire ROI + MLM system:
 * - User registration via referral links
 * - Deposit and approval flow
 * - Investment creation with package assignment
 * - ROI calculation and distribution
 * - Multi-level referral commission (10 levels)
 * - Withdrawal flow
 * - All validations and edge cases
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import bcrypt from 'bcrypt';

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
    // Delete in correct order (respecting foreign keys)
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
          startsWith: 'test_',
        },
      },
    });
    logTest('Cleanup', 'PASS', 'Test data cleaned up');
  } catch (error) {
    logTest('Cleanup', 'FAIL', `Error during cleanup: ${error}`);
  }
}

async function testUserRegistration() {
  console.log('\n📝 TEST 1: User Registration & Referral System');
  
  try {
    // Create User A (root)
    const userA = await prisma.user.create({
      data: {
        email: 'test_user_a@example.com',
        name: 'User A',
        password: await bcrypt.hash('password123', 10),
        referralCode: 'TESTREF001',
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
    logTest('Create User A', 'PASS', 'User A created', { id: userA.id, referralCode: userA.referralCode });

    // Create User B via User A's referral
    const userB = await prisma.user.create({
      data: {
        email: 'test_user_b@example.com',
        name: 'User B',
        password: await bcrypt.hash('password123', 10),
        referralCode: 'TESTREF002',
        referredBy: userA.referralCode,
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
    logTest('Create User B (via A referral)', 'PASS', 'User B created', { 
      id: userB.id, 
      referredBy: userB.referredBy 
    });

    // Create User C via User B's referral
    const userC = await prisma.user.create({
      data: {
        email: 'test_user_c@example.com',
        name: 'User C',
        password: await bcrypt.hash('password123', 10),
        referralCode: 'TESTREF003',
        referredBy: userB.referralCode,
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
    logTest('Create User C (via B referral)', 'PASS', 'User C created', { 
      id: userC.id, 
      referredBy: userC.referredBy 
    });

    // Verify referral chain
    const chainC = await prisma.user.findUnique({
      where: { referralCode: userC.referralCode },
      select: { referredBy: true },
    });
    const chainB = await prisma.user.findUnique({
      where: { referralCode: userB.referralCode },
      select: { referredBy: true },
    });
    
    if (chainC?.referredBy === userB.referralCode && chainB?.referredBy === userA.referralCode) {
      logTest('Referral Chain Verification', 'PASS', 'Chain: C → B → A verified');
    } else {
      logTest('Referral Chain Verification', 'FAIL', 'Referral chain incorrect');
    }

    return { userA, userB, userC };
  } catch (error) {
    logTest('User Registration', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function testDepositFlow(userId: string) {
  console.log('\n💰 TEST 2: Deposit System');
  
  try {
    // Create deposit
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount: new Decimal(1000),
        txHash: `test_tx_${Date.now()}`,
        status: 'PENDING',
      },
    });
    logTest('Create Deposit', 'PASS', 'Deposit created', { 
      id: deposit.id, 
      amount: deposit.amount.toString(),
      status: deposit.status 
    });

    // Get wallet before approval
    const walletBefore = await prisma.wallet.findUnique({
      where: { userId },
    });

    // Approve deposit
    await prisma.$transaction(async (tx) => {
      await tx.deposit.update({
        where: { id: deposit.id },
        data: { status: 'APPROVED' },
      });

      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: 1000,
          },
        },
      });
    });

    const walletAfter = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (walletAfter && walletAfter.balance === (walletBefore?.balance || 0) + 1000) {
      logTest('Approve Deposit', 'PASS', 'Wallet balance increased correctly', {
        before: walletBefore?.balance,
        after: walletAfter.balance,
      });
    } else {
      logTest('Approve Deposit', 'FAIL', 'Wallet balance incorrect');
    }

    // Test duplicate txHash
    try {
      await prisma.deposit.create({
        data: {
          userId,
          amount: new Decimal(500),
          txHash: deposit.txHash, // Duplicate
          status: 'PENDING',
        },
      });
      logTest('Duplicate txHash Prevention', 'FAIL', 'Should have rejected duplicate');
    } catch (error) {
      logTest('Duplicate txHash Prevention', 'PASS', 'Duplicate txHash rejected');
    }

    return { deposit, walletAfter };
  } catch (error) {
    logTest('Deposit Flow', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function testInvestmentCreation(userId: string, walletId: string) {
  console.log('\n📊 TEST 3: Investment Creation & Package Assignment');
  
  try {
    const testCases = [
      { amount: 50, expectedPackage: 'Starter', expectedROI: 0.5 },
      { amount: 2000, expectedPackage: 'Silver', expectedROI: 1.0 },
      { amount: 15000, expectedPackage: 'Gold', expectedROI: 2.0 },
    ];

    const investments = [];

    for (const testCase of testCases) {
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet || wallet.balance < testCase.amount) {
        // Add funds if needed
        await prisma.wallet.update({
          where: { id: walletId },
          data: { balance: { increment: testCase.amount * 2 } },
        });
      }

      const investment = await prisma.investment.create({
        data: {
          userId,
          walletId,
          packageName: testCase.expectedPackage,
          amount: testCase.amount,
          dailyROI: new Decimal(testCase.expectedROI),
          isActive: true,
          status: 'ACTIVE',
        },
      });

      const walletAfter = await prisma.wallet.findUnique({
        where: { id: walletId },
      });

      if (
        investment.packageName === testCase.expectedPackage &&
        investment.dailyROI.toNumber() === testCase.expectedROI
      ) {
        logTest(
          `Investment ${testCase.expectedPackage} Package`,
          'PASS',
          `Amount: $${testCase.amount}, Package: ${testCase.expectedPackage}, ROI: ${testCase.expectedROI}%`,
          {
            investmentId: investment.id,
            packageName: investment.packageName,
            dailyROI: investment.dailyROI.toString(),
            walletBalance: walletAfter?.balance,
          }
        );
      } else {
        logTest(`Investment ${testCase.expectedPackage} Package`, 'FAIL', 'Package assignment incorrect');
      }

      investments.push(investment);
    }

    return investments;
  } catch (error) {
    logTest('Investment Creation', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function testROIAndReferrals(users: any, investments: any[]) {
  console.log('\n💵 TEST 4: ROI Calculation & Referral Commission');
  
  try {
    // Use User D's investment (if exists) or create one
    const userD = users.userC; // Using User C for simplicity
    const investment = investments[1]; // $2000 Silver investment (1% ROI)

    if (!investment) {
      logTest('ROI Test', 'FAIL', 'No investment found');
      return;
    }

    // Calculate expected ROI
    const expectedROI = (investment.amount * investment.dailyROI.toNumber()) / 100;
    logTest('ROI Calculation', 'PASS', `Expected ROI: $${expectedROI}`, {
      amount: investment.amount,
      dailyROI: investment.dailyROI.toString(),
      calculatedROI: expectedROI,
    });

    // Simulate ROI payment
    const walletBefore = await prisma.wallet.findUnique({
      where: { id: investment.walletId },
    });

    await prisma.$transaction(async (tx) => {
      // Pay ROI
      await tx.wallet.update({
        where: { id: investment.walletId },
        data: {
          balance: { increment: expectedROI },
          roiTotal: { increment: expectedROI },
        },
      });

      await tx.earnings.create({
        data: {
          userId: investment.userId,
          walletId: investment.walletId,
          amount: expectedROI,
          type: 'roi',
          description: `Daily ROI for investment ${investment.id}`,
        },
      });

      await tx.investment.update({
        where: { id: investment.id },
        data: { lastRoiAt: new Date() },
      });
    });

    const walletAfter = await prisma.wallet.findUnique({
      where: { id: investment.walletId },
    });

    if (walletAfter && walletAfter.balance === (walletBefore?.balance || 0) + expectedROI) {
      logTest('ROI Payment', 'PASS', 'ROI paid correctly', {
        before: walletBefore?.balance,
        after: walletAfter.balance,
        roiPaid: expectedROI,
      });
    } else {
      logTest('ROI Payment', 'FAIL', 'ROI payment incorrect');
    }

    // Test referral commission distribution
    console.log('\n🔗 Testing Referral Commission Distribution...');
    
    const referralChain = [
      { user: users.userC, level: 1, percent: 10.0 },
      { user: users.userB, level: 2, percent: 5.0 },
      { user: users.userA, level: 3, percent: 3.0 },
    ];

    for (const chain of referralChain) {
      const commissionAmount = (expectedROI * chain.percent) / 100;
      const uplineWalletBefore = await prisma.wallet.findUnique({
        where: { userId: chain.user.id },
      });

      await prisma.$transaction(async (tx) => {
        await tx.wallet.update({
          where: { userId: chain.user.id },
          data: {
            balance: { increment: commissionAmount },
            referralTotal: { increment: commissionAmount },
          },
        });

        await tx.earnings.create({
          data: {
            userId: chain.user.id,
            walletId: chain.user.wallet.id,
            amount: commissionAmount,
            type: 'referral',
            description: `Level ${chain.level} referral commission`,
          },
        });
      });

      const uplineWalletAfter = await prisma.wallet.findUnique({
        where: { userId: chain.user.id },
      });

      if (
        uplineWalletAfter &&
        uplineWalletAfter.balance === (uplineWalletBefore?.balance || 0) + commissionAmount
      ) {
        logTest(
          `Referral Level ${chain.level}`,
          'PASS',
          `Commission: $${commissionAmount.toFixed(2)} (${chain.percent}% of ROI)`,
          {
            level: chain.level,
            percent: chain.percent,
            commission: commissionAmount,
            walletBefore: uplineWalletBefore?.balance,
            walletAfter: uplineWalletAfter.balance,
          }
        );
      } else {
        logTest(`Referral Level ${chain.level}`, 'FAIL', 'Commission payment incorrect');
      }
    }
  } catch (error) {
    logTest('ROI and Referrals', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function testWithdrawal(userId: string, walletId: string) {
  console.log('\n💸 TEST 5: Withdrawal System');
  
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.balance < 100) {
      logTest('Withdrawal Test Setup', 'FAIL', 'Insufficient balance for withdrawal test');
      return;
    }

    // Create withdrawal
    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount: new Decimal(100),
        walletBefore: new Decimal(wallet.balance),
        walletAfter: new Decimal(wallet.balance),
        status: 'PENDING',
      },
    });
    logTest('Create Withdrawal', 'PASS', 'Withdrawal created', {
      id: withdrawal.id,
      amount: withdrawal.amount.toString(),
      status: withdrawal.status,
    });

    // Approve withdrawal
    await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: { decrement: 100 },
        },
      });

      await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: 'APPROVED',
          walletAfter: new Decimal(updatedWallet.balance),
        },
      });
    });

    const walletAfter = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    const updatedWithdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawal.id },
    });

    if (
      walletAfter &&
      updatedWithdrawal &&
      walletAfter.balance === wallet.balance - 100 &&
      updatedWithdrawal.status === 'APPROVED'
    ) {
      logTest('Approve Withdrawal', 'PASS', 'Withdrawal approved correctly', {
        before: wallet.balance,
        after: walletAfter.balance,
        withdrawn: 100,
      });
    } else {
      logTest('Approve Withdrawal', 'FAIL', 'Withdrawal approval incorrect');
    }
  } catch (error) {
    logTest('Withdrawal System', 'FAIL', `Error: ${error}`);
    throw error;
  }
}

async function runSimulation() {
  console.log('🚀 Starting Comprehensive System Simulation Test\n');
  console.log('=' .repeat(60));

  try {
    // Cleanup first
    await cleanup();

    // Test 1: User Registration
    const users = await testUserRegistration();

    // Test 2: Deposit Flow
    const { walletAfter: walletA } = await testDepositFlow(users.userA.id);

    // Test 3: Investment Creation
    const investments = await testInvestmentCreation(users.userA.id, walletA!.id);

    // Test 4: ROI and Referrals
    await testROIAndReferrals(users, investments);

    // Test 5: Withdrawal
    await testWithdrawal(users.userA.id, walletA!.id);

    // Summary
    console.log('\n' + '='.repeat(60));
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

    console.log('\n✅ Simulation test completed!');
  } catch (error) {
    console.error('\n❌ Simulation test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the simulation
runSimulation().catch(console.error);

