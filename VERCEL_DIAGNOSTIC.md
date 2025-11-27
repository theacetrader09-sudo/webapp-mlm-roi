# Vercel Diagnostic Check

## Required Environment Variables

The following environment variables MUST be set in Vercel:

1. **DATABASE_URL** - PostgreSQL connection string (NeonDB)
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
   - This is CRITICAL for signup to work

2. **NEXTAUTH_SECRET** - Secret key for NextAuth
   - Generate with: `openssl rand -base64 32`
   - Required for authentication

3. **NEXTAUTH_URL** - Your Vercel deployment URL
   - Format: `https://your-app.vercel.app`
   - Or production domain if custom

## How to Check Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project: "Webapp mlm roi"
3. Go to Settings → Environment Variables
4. Verify all required variables are set

## Common Vercel Issues

### 1. Database Connection Timeout
- **Symptom**: Internal server error on signup
- **Cause**: Database URL incorrect or database not accessible
- **Fix**: Check DATABASE_URL in Vercel environment variables

### 2. Missing Environment Variables
- **Symptom**: Build succeeds but runtime errors
- **Cause**: Environment variables not set in Vercel
- **Fix**: Add all required environment variables

### 3. Build Cache Issues
- **Symptom**: Old code still running
- **Cause**: Vercel build cache
- **Fix**: Clear build cache or redeploy

### 4. Function Timeout
- **Symptom**: Request timeout on signup
- **Cause**: Database query taking too long
- **Fix**: Optimize database queries or increase timeout

## Testing Steps

1. **Test Health Endpoint**:
   ```
   https://webapp-fp7j64d3h-aces-projects-fc2f7fc5.vercel.app/api/health
   ```
   - Should return: `{"status":"ok","database":"connected"}`
   - If error: Database connection issue

2. **Test Signup API**:
   ```
   POST https://webapp-fp7j64d3h-aces-projects-fc2f7fc5.vercel.app/api/auth/signup
   ```
   - Check Vercel logs for errors

3. **Check Vercel Logs**:
   ```bash
   vercel logs webapp-fp7j64d3h-aces-projects-fc2f7fc5.vercel.app
   ```

## Vercel-Specific Configuration

### vercel.json
- ✅ Cron jobs configured
- ✅ Headers set for admin routes
- ✅ Rewrites configured

### next.config.js
- ✅ Standalone output (good for Vercel)
- ✅ Server actions body size limit set
- ✅ ESLint warnings ignored during build

## Potential Issues from Vercel Side

1. **Cold Start Delays**
   - First request after inactivity may be slow
   - Database connection may timeout
   - **Solution**: Health check endpoint keeps functions warm

2. **Region Mismatch**
   - Database in different region than Vercel
   - **Solution**: Use same region or enable connection pooling

3. **Environment Variable Sync**
   - Variables not synced to all environments
   - **Solution**: Check Production, Preview, and Development all have variables

4. **Build Output Issues**
   - `output: 'standalone'` may cause issues
   - **Solution**: Try removing it if problems persist

## Next Steps

1. Check Vercel dashboard for environment variables
2. Test health endpoint
3. Check Vercel logs for errors
4. Verify database is accessible from Vercel

