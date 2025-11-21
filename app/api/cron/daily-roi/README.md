# Daily ROI Cron Endpoint

## Overview

This endpoint processes daily ROI payments for all active investments and distributes referral commissions up to 10 levels.

## Endpoint

- **URL**: `/api/cron/daily-roi`
- **Methods**: `GET`, `POST`
- **Authentication**: None (should be protected by cron service secret in production)

## How It Works

1. **Idempotency Check**: Uses `RoiCronRun` table to ensure the cron only runs once per day
2. **Load Active Investments**: Fetches all active investments with user, package, and wallet relations
3. **Process ROI**: For each investment:
   - Calculates daily ROI amount
   - Updates user's wallet balance and roiTotal
   - Creates ROI earnings record
   - Updates investment's lastRoiAt timestamp
4. **Distribute Referrals**: For each ROI payment:
   - Traces upline referral chain up to 10 levels
   - Distributes commission to each level based on configured percentages
   - Updates upline wallets and creates referral earnings records

## Referral Commission Structure

- Level 1: 10% of ROI
- Level 2: 5% of ROI
- Level 3: 3% of ROI
- Level 4: 2% of ROI
- Level 5: 1% of ROI
- Level 6: 0.5% of ROI
- Level 7: 0.5% of ROI
- Level 8: 0.3% of ROI
- Level 9: 0.2% of ROI
- Level 10: 0.1% of ROI

**Total Commission**: 22.6% of ROI distributed across upline

## Safety Features

- **Idempotent**: Safe to run multiple times per day (won't double-pay)
- **Atomic Transactions**: Each investment's ROI + referrals processed in single transaction
- **Error Handling**: Continues processing even if one investment fails
- **Skip Logic**: Skips investments that already received ROI today

## Response Format

### Success (First Run)
```json
{
  "status": "success",
  "date": "2024-01-15T00:00:00.000Z",
  "message": "Daily ROI cron completed",
  "processed": 10,
  "skipped": 0,
  "total": 10
}
```

### Already Run
```json
{
  "status": "already_run",
  "date": "2024-01-15T00:00:00.000Z",
  "message": "Daily ROI cron already executed today"
}
```

### Error
```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Setup for Production

### Vercel Cron

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/daily-roi",
    "schedule": "0 0 * * *"
  }]
}
```

### Manual Trigger

```bash
curl -X GET http://localhost:3000/api/cron/daily-roi
```

### Security

In production, protect this endpoint with:
- Vercel Cron secret
- API key authentication
- IP whitelisting

## Testing

1. Create test investments
2. Manually trigger: `GET /api/cron/daily-roi`
3. Verify:
   - Wallet balances updated
   - Earnings records created
   - Referral commissions distributed
   - RoiCronRun record created
4. Run again to verify idempotency (should return "already_run")

