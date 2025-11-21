/**
 * Package assignment based on investment amount
 * Global rules:
 * - $35 - $999: Starter (0.5% daily ROI)
 * - $1000 - $9999: Silver (1% daily ROI)
 * - $10,000 - $100,000: Gold (2% daily ROI)
 */

export interface PackageInfo {
  name: 'Starter' | 'Silver' | 'Gold';
  dailyROI: number; // 0.5, 1.0, or 2.0
  minAmount: number;
  maxAmount: number;
}

export function getPackageByAmount(amount: number): PackageInfo | null {
  if (amount >= 35 && amount <= 999) {
    return {
      name: 'Starter',
      dailyROI: 0.5,
      minAmount: 35,
      maxAmount: 999,
    };
  }

  if (amount >= 1000 && amount <= 9999) {
    return {
      name: 'Silver',
      dailyROI: 1.0,
      minAmount: 1000,
      maxAmount: 9999,
    };
  }

  if (amount >= 10000 && amount <= 100000) {
    return {
      name: 'Gold',
      dailyROI: 2.0,
      minAmount: 10000,
      maxAmount: 100000,
    };
  }

  return null;
}

export function validateInvestmentAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 35) {
    return { valid: false, error: 'Minimum investment amount is $35' };
  }

  if (amount > 100000) {
    return { valid: false, error: 'Maximum investment amount is $100,000' };
  }

  const packageInfo = getPackageByAmount(amount);
  if (!packageInfo) {
    return { valid: false, error: 'Amount does not match any package tier' };
  }

  return { valid: true };
}

export const PACKAGE_TIERS: PackageInfo[] = [
  {
    name: 'Starter',
    dailyROI: 0.5,
    minAmount: 35,
    maxAmount: 999,
  },
  {
    name: 'Silver',
    dailyROI: 1.0,
    minAmount: 1000,
    maxAmount: 9999,
  },
  {
    name: 'Gold',
    dailyROI: 2.0,
    minAmount: 10000,
    maxAmount: 100000,
  },
];

