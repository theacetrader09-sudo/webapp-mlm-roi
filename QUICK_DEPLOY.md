# Quick Deploy Instructions

## Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com/new
2. **Import Git Repository** (if you have GitHub) OR
3. **Drag and Drop** your project folder
4. **Project Name**: `webapp-mlm-roi`
5. **Framework Preset**: Next.js (auto-detected)
6. **Root Directory**: `./` (default)
7. **Build Command**: `npm run build` (default)
8. **Output Directory**: `.next` (default)

### Environment Variables (Add in Vercel Dashboard):

Go to **Settings → Environment Variables** and add:

1. **DATABASE_URL**
   ```
   postgresql://neondb_owner:npg_OyerBUEd6nC1@ep-frosty-shadow-a1xs40w0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

2. **NEXTAUTH_SECRET**
   ```
   tIA42R2uorP/b2SOKQWrla642RP/aj6xjUxPSboqGJw=
   ```

3. **NEXTAUTH_URL**
   ```
   https://webapp-mlm-roi.vercel.app
   ```
   (Update after you get your actual URL)

9. Click **Deploy**

## Option 2: CLI Deployment (After Login)

Run in terminal:
```bash
cd /Users/apple/webapp
npx vercel login
# Follow browser prompts
npx vercel --prod
```

Then add environment variables in Vercel Dashboard.

