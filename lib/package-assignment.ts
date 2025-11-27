import { Decimal } from '@prisma/client/runtime/library';

export interface PackageInfo {
  name: 'Starter' | 'Silver' | 'Gold';
  dailyROI: Decimal; // 0.5, 1.0, or 2.0
  minAmount: Decimal;
  maxAmount: Decimal;
}

export function getPackageByAmount(amount: number | Decimal): PackageInfo | null {
  const amountDec = new Decimal(amount);

  if (amountDec.gte(35) && amountDec.lte(999)) {
    return {
      name: 'Starter',
      dailyROI: new Decimal(0.5),
      minAmount: new Decimal(35),
      maxAmount: new Decimal(999),
    };
  }

  if (amountDec.gte(1000) && amountDec.lte(9999)) {
    return {
      name: 'Silver',
      dailyROI: new Decimal(1.0),
      minAmount: new Decimal(1000),
      maxAmount: new Decimal(9999),
    };
  }

  if (amountDec.gte(10000) && amountDec.lte(100000)) {
    return {
      name: 'Gold',
      dailyROI: new Decimal(2.0),
      minAmount: new Decimal(10000),
      maxAmount: new Decimal(100000),
    };
  }

  return null;
}

export function validateInvestmentAmount(amount: number | Decimal): { valid: boolean; error?: string } {
  const amountDec = new Decimal(amount);

  if (amountDec.lt(35)) {
    return { valid: false, error: 'Minimum investment amount is $35' };
  }

  if (amountDec.gt(100000)) {
    return { valid: false, error: 'Maximum investment amount is $100,000' };
  }

  const packageInfo = getPackageByAmount(amountDec);
  if (!packageInfo) {
    return { valid: false, error: 'Amount does not match any package tier' };
  }

  return { valid: true };
}

export const PACKAGE_TIERS: PackageInfo[] = [
  {
    name: 'Starter',
    dailyROI: new Decimal(0.5),
    minAmount: new Decimal(35),
    maxAmount: new Decimal(999),
  },
  {
    name: 'Silver',
    dailyROI: new Decimal(1.0),
    minAmount: new Decimal(1000),
    maxAmount: new Decimal(9999),
  },
  {
    name: 'Gold',
    dailyROI: new Decimal(2.0),
    minAmount: new Decimal(10000),
    maxAmount: new Decimal(100000),
  },
];

