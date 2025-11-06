#!/bin/bash
# ✅ COMPLETE FIX - Run this to resolve all issues

echo "🔧 AURAlos Complete Fix Script"
echo "================================"
echo ""

# Step 1: Kill all processes
echo "1️⃣ Killing all Vite and Node processes..."
pkill -9 -f "vite" 2>/dev/null
pkill -9 -f "node.*5173" 2>/dev/null
pkill -9 -f "tsserver" 2>/dev/null
sleep 2
echo "✅ Processes killed"
echo ""

# Step 2: Clear all caches
echo "2️⃣ Clearing all build caches..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite
rm -rf build
rm -f tsconfig.tsbuildinfo
echo "✅ Caches cleared"
echo ""

# Step 3: Verify files exist
echo "3️⃣ Verifying critical files..."
if [ -f "src/services/bedrockService.ts" ] && [ -s "src/services/bedrockService.ts" ]; then
    echo "✅ bedrockService.ts exists and has content"
else
    echo "❌ bedrockService.ts is missing or empty!"
    exit 1
fi

if [ -f "src/services/s3Service.ts" ]; then
    echo "✅ s3Service.ts exists"
else
    echo "❌ s3Service.ts is missing!"
    exit 1
fi

if [ -f "src/pages/AICollection.tsx" ]; then
    echo "✅ AICollection.tsx exists"
else
    echo "❌ AICollection.tsx is missing!"
    exit 1
fi
echo ""

# Step 4: Verify .env
echo "4️⃣ Verifying .env configuration..."
if [ -f ".env" ]; then
    if grep -q "VITE_AWS_ACCESS_KEY_ID=ASIATCKARDBCA2WHHRZM" .env; then
        echo "✅ AWS credentials configured"
    else
        echo "⚠️  AWS credentials need to be added to .env"
    fi
else
    echo "❌ .env file missing!"
    exit 1
fi
echo ""

# Step 5: Start fresh server
echo "5️⃣ Starting fresh dev server..."
echo ""
echo "================================"
echo "🚀 Starting npm run dev..."
echo "================================"
echo ""

npm run dev

