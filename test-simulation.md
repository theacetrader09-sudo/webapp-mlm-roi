# Comprehensive System Simulation Test Plan

## Test Scenarios to Execute

### 1. USER REGISTRATION & REFERRAL SYSTEM
- [ ] Create User A (root user, no referrer)
- [ ] Create User B via User A's referral link
- [ ] Create User C via User B's referral link
- [ ] Create User D via User C's referral link
- [ ] Verify referral chain: D → C → B → A
- [ ] Verify unique referral codes
- [ ] Verify wallets created automatically

### 2. DEPOSIT SYSTEM
- [ ] User A creates deposit request ($1000)
- [ ] Verify deposit status = PENDING
- [ ] Admin approves deposit
- [ ] Verify wallet balance increased by $1000
- [ ] Verify AuditLog created
- [ ] Test duplicate txHash rejection
- [ ] Test invalid amount validation

### 3. INVESTMENT PACKAGE ASSIGNMENT
- [ ] Test Starter package: $50 investment → 0.5% ROI
- [ ] Test Silver package: $2000 investment → 1% ROI
- [ ] Test Gold package: $15000 investment → 2% ROI
- [ ] Test minimum amount validation ($35)
- [ ] Test maximum amount validation ($100,000)
- [ ] Test invalid amount ranges
- [ ] Verify packageName and dailyROI stored correctly

### 4. INVESTMENT CREATION
- [ ] Create investment with sufficient balance
- [ ] Verify wallet balance decreased
- [ ] Verify investment status = ACTIVE
- [ ] Test insufficient balance rejection
- [ ] Verify AuditLog created
- [ ] Verify investment amount deducted atomically

### 5. ROI CALCULATION & DISTRIBUTION
- [ ] Run daily ROI cron
- [ ] Verify ROI calculated correctly: (amount * dailyROI) / 100
- [ ] Verify ROI added to wallet balance
- [ ] Verify roiTotal incremented
- [ ] Verify Earnings record created (type: "roi")
- [ ] Verify lastRoiAt updated
- [ ] Test idempotency (run twice, should skip second time)
- [ ] Test manual run (skip idempotency)

### 6. REFERRAL COMMISSION DISTRIBUTION (10 Levels)
- [ ] User D invests $1000 (Silver, 1% ROI = $10/day)
- [ ] Run ROI cron
- [ ] Verify Level 1 (User C): 10% of $10 = $1.00
- [ ] Verify Level 2 (User B): 5% of $10 = $0.50
- [ ] Verify Level 3 (User A): 3% of $10 = $0.30
- [ ] Verify commission added to upline wallets
- [ ] Verify referralTotal incremented
- [ ] Verify Earnings records created (type: "referral")
- [ ] Verify AuditLog entries for each commission
- [ ] Test 10-level chain (if applicable)

### 7. WITHDRAWAL SYSTEM
- [ ] User creates withdrawal request ($100)
- [ ] Verify withdrawal status = PENDING
- [ ] Verify walletBefore and walletAfter set correctly
- [ ] Admin approves withdrawal
- [ ] Verify wallet balance decreased
- [ ] Verify walletAfter updated
- [ ] Verify AuditLog created
- [ ] Test insufficient balance on approval
- [ ] Test double approval prevention
- [ ] Test withdrawal rejection

### 8. EDGE CASES & VALIDATIONS
- [ ] Test concurrent investments
- [ ] Test negative balance prevention
- [ ] Test ROI calculation precision
- [ ] Test referral chain with missing upline
- [ ] Test multiple investments per user
- [ ] Test ROI on multiple investments

### 9. AUDIT LOGGING
- [ ] Verify all financial transactions logged
- [ ] Verify before/after balances recorded
- [ ] Verify metadata stored correctly

### 10. DATA INTEGRITY
- [ ] Verify all transactions are atomic
- [ ] Verify no double payments
- [ ] Verify wallet balances are consistent
- [ ] Verify referral totals match sum of commissions

