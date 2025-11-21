# Quick Vercel Deployment Steps

## Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```
(Follow the prompts to authenticate)

## Step 3: Deploy to Vercel
```bash
# From project root directory
cd /Users/apple/webapp

# Deploy (will ask questions)
vercel

# For production deployment
vercel --prod
```

## Step 4: Set Environment Variables

After first deployment, go to Vercel Dashboard:
1. Open your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```
DATABASE_URL = your_neondb_connection_string
NEXTAUTH_SECRET = generate_with: openssl rand -base64 32
NEXTAUTH_URL = https://your-app-name.vercel.app
```

4. **Redeploy** after adding environment variables

## Step 5: Database Setup

After deployment, run these commands locally (or use Vercel CLI):
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

## Step 6: Create Admin User

Run the admin user creation script:
```bash
# Make sure DATABASE_URL in your local .env points to production database
node scripts/create-admin-user.ts
```

## Step 7: Test Deployment

Visit your deployed URL and test:
- ✅ User registration
- ✅ User login
- ✅ Dashboard
- ✅ Admin panel (via direct URL: `https://your-app.vercel.app/admin/login`)

## Admin Panel Access

- **Direct URL**: `https://your-app.vercel.app/admin/login`
- **Email**: `forfxai@gmail.com`
- **Password**: `Markus@72`

⚠️ **Note**: Admin panel is hidden from regular users. No link visible on login page.

## Troubleshooting

### Build Fails
- Check environment variables are set
- Ensure `DATABASE_URL` is correct
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check NeonDB connection settings
- Ensure database allows connections from Vercel IPs

### Admin Panel Not Accessible
- Verify `NEXTAUTH_URL` matches your Vercel domain
- Check middleware is working
- Verify admin user exists in database

## Next Steps: Custom Domain (Hostinger)

1. Purchase domain from Hostinger
2. In Vercel Dashboard → Settings → Domains
3. Add your custom domain
4. Update DNS records in Hostinger
5. Update `NEXTAUTH_URL` environment variable
6. Redeploy

