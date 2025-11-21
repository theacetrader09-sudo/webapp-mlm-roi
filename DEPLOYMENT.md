# Deployment Guide - Vercel

## Pre-Deployment Checklist

✅ **Completed:**
- [x] Removed admin login link from user login page
- [x] Admin routes secured and hidden from regular users
- [x] Backup created at `~/webapp-backups/`
- [x] robots.txt created to prevent admin route indexing
- [x] vercel.json configured for admin route protection

## Environment Variables Required

Set these in Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=your_neondb_connection_string
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=https://your-app.vercel.app
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Deployment Steps

### 1. Install Vercel CLI (if not installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel
```bash
# From project root
vercel

# For production deployment
vercel --prod
```

### 4. Set Environment Variables in Vercel Dashboard
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add all required variables (see above)
4. Redeploy after adding variables

### 5. Run Database Migrations
After deployment, run:
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 6. Create Admin User
After deployment, create admin user:
```bash
# Update scripts/create-admin-user.ts with production database
node scripts/create-admin-user.ts
```

## Admin Panel Access

- **URL**: `https://your-app.vercel.app/admin/login`
- **Email**: `forfxai@gmail.com`
- **Password**: `Markus@72`

⚠️ **Important**: Admin panel is hidden from regular users. Only accessible via direct URL.

## Security Features

1. ✅ Admin routes protected by middleware
2. ✅ Admin login link removed from user login page
3. ✅ robots.txt prevents search engine indexing
4. ✅ X-Robots-Tag header set for admin routes
5. ✅ Role-based access control enforced

## Post-Deployment

### Test Checklist:
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads correctly
- [ ] Deposit/Withdraw functions work
- [ ] Investment creation works
- [ ] Admin panel accessible via direct URL
- [ ] Admin panel not visible to regular users
- [ ] All API endpoints working

## Moving to Custom Domain (Hostinger)

### Steps:
1. Purchase domain from Hostinger
2. Configure DNS settings in Hostinger
3. Add custom domain in Vercel Dashboard
4. Update `NEXTAUTH_URL` environment variable
5. Update database connection if needed
6. Test all functionality

## Backup Location

Backup created at: `~/webapp-backups/webapp-backup-[timestamp].tar.gz`

To restore:
```bash
cd /Users/apple
tar -xzf ~/webapp-backups/webapp-backup-[timestamp].tar.gz
```

