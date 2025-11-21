/**
 * ROI and Referral Commission Configuration
 * 
 * Referral commission percentages for 10 levels.
 * Each percentage is of the ROI amount (not the investment amount).
 * 
 * Example: If ROI is $10 and Level 1 is 10%, the commission is $1.
 */
export const REFERRAL_COMMISSION_PERCENTS = [
  10.0, // Level 1: 10%
  5.0,  // Level 2: 5%
  3.0,  // Level 3: 3%
  2.0,  // Level 4: 2%
  1.0,  // Level 5: 1%
  0.5,  // Level 6: 0.5%
  0.5,  // Level 7: 0.5%
  0.3,  // Level 8: 0.3%
  0.2,  // Level 9: 0.2%
  0.1,  // Level 10: 0.1%
] as const;

export const MAX_REFERRAL_LEVELS = REFERRAL_COMMISSION_PERCENTS.length;

/**
 * Calculate total commission percentage across all levels
 */
export function getTotalCommissionPercent(): number {
  return REFERRAL_COMMISSION_PERCENTS.reduce((sum, percent) => sum + percent, 0);
}

