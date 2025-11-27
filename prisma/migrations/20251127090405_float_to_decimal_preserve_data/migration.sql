-- AlterTable: Convert Float columns to Decimal while preserving data
-- This migration converts DOUBLE PRECISION (Float) to NUMERIC (Decimal)

-- Wallet table
ALTER TABLE "Wallet" 
  ALTER COLUMN "balance" TYPE DECIMAL(18,2) USING "balance"::DECIMAL(18,2),
  ALTER COLUMN "roiTotal" TYPE DECIMAL(18,2) USING "roiTotal"::DECIMAL(18,2),
  ALTER COLUMN "referralTotal" TYPE DECIMAL(18,2) USING "referralTotal"::DECIMAL(18,2),
  ALTER COLUMN "depositBalance" TYPE DECIMAL(18,2) USING "depositBalance"::DECIMAL(18,2);

-- Package table
ALTER TABLE "Package"
  ALTER COLUMN "minAmount" TYPE DECIMAL(18,2) USING "minAmount"::DECIMAL(18,2),
  ALTER COLUMN "maxAmount" TYPE DECIMAL(18,2) USING "maxAmount"::DECIMAL(18,2),
  ALTER COLUMN "dailyROI" TYPE DECIMAL(5,2) USING "dailyROI"::DECIMAL(5,2);

-- Investment table
ALTER TABLE "Investment"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2) USING "amount"::DECIMAL(18,2);

-- CronRunLog table
ALTER TABLE "CronRunLog"
  ALTER COLUMN "totalRoiPaid" TYPE DECIMAL(18,2) USING "totalRoiPaid"::DECIMAL(18,2),
  ALTER COLUMN "totalReferralPaid" TYPE DECIMAL(18,2) USING "totalReferralPaid"::DECIMAL(18,2);

-- AuditLog table
ALTER TABLE "AuditLog"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2) USING "amount"::DECIMAL(18,2),
  ALTER COLUMN "before" TYPE DECIMAL(18,2) USING "before"::DECIMAL(18,2),
  ALTER COLUMN "after" TYPE DECIMAL(18,2) USING "after"::DECIMAL(18,2);

-- Earnings table
ALTER TABLE "Earnings"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2) USING "amount"::DECIMAL(18,2);
