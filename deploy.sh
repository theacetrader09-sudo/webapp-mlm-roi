#!/bin/bash
# Vercel Deployment Script

echo "🚀 Starting Vercel Deployment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if logged in
echo "📋 Checking Vercel login status..."
npx vercel whoami > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Not logged in. Please login first:${NC}"
    echo "   Run: npx vercel login"
    echo "   Then run this script again."
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Vercel${NC}"
echo ""

# Step 2: Generate NEXTAUTH_SECRET
echo "🔐 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "   Secret: $NEXTAUTH_SECRET"
echo ""

# Step 3: Get DATABASE_URL
echo "📊 Reading DATABASE_URL..."
DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d "'\"")
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not found in .env${NC}"
    exit 1
fi
echo -e "${GREEN}✅ DATABASE_URL found${NC}"
echo ""

# Step 4: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "   Project name: webapp-mlm-roi"
echo ""

# Deploy (preview first)
npx vercel --yes

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Preview deployment successful!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Go to Vercel Dashboard: https://vercel.com/dashboard"
    echo "   2. Open your project: webapp-mlm-roi"
    echo "   3. Go to Settings → Environment Variables"
    echo "   4. Add these variables:"
    echo ""
    echo "   DATABASE_URL = $DATABASE_URL"
    echo "   NEXTAUTH_SECRET = $NEXTAUTH_SECRET"
    echo "   NEXTAUTH_URL = https://your-app.vercel.app (update after deployment)"
    echo ""
    echo "   5. After adding variables, run: npx vercel --prod"
    echo ""
else
    echo -e "${YELLOW}⚠️  Deployment failed. Check errors above.${NC}"
    exit 1
fi

