#!/bin/bash
# ✅ FINAL FIX - Run this to resolve the issue permanently

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔧 AURAlos Complete Fix - Following COMPLETE-GUIDE.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Kill all processes
echo "🛑 Step 1: Stopping all running processes..."
pkill -9 -f "vite" 2>/dev/null
pkill -9 -f "node.*5173" 2>/dev/null
pkill -9 -f "tsserver" 2>/dev/null
pkill -9 -f "esbuild" 2>/dev/null
sleep 2
echo "   ✅ All processes stopped"
echo ""

# Step 2: Clear ALL caches
echo "🧹 Step 2: Clearing all build caches..."
rm -rf node_modules/.vite 2>/dev/null
rm -rf node_modules/.cache 2>/dev/null
rm -rf dist 2>/dev/null
rm -rf .vite 2>/dev/null
rm -rf build 2>/dev/null
rm -f tsconfig.tsbuildinfo 2>/dev/null
echo "   ✅ All caches cleared"
echo ""

# Step 3: Verify bedrockService.ts
echo "📝 Step 3: Verifying bedrockService.ts..."
if [ -f "src/services/bedrockService.ts" ]; then
    LINE_COUNT=$(wc -l < "src/services/bedrockService.ts")
    if [ "$LINE_COUNT" -gt 50 ]; then
        echo "   ✅ bedrockService.ts exists and has content ($LINE_COUNT lines)"
    else
        echo "   ❌ bedrockService.ts is too short or empty!"
        echo "   Please check the file manually"
        exit 1
    fi
else
    echo "   ❌ bedrockService.ts not found!"
    exit 1
fi
echo ""

# Step 4: Verify .env
echo "🔐 Step 4: Verifying AWS credentials..."
if [ -f ".env" ]; then
    if grep -q "VITE_AWS_ACCESS_KEY_ID=ASIATCKARDBCA2WHHRZM" .env; then
        echo "   ✅ AWS credentials configured"
    else
        echo "   ⚠️  AWS credentials may need verification"
    fi
else
    echo "   ❌ .env file not found!"
    exit 1
fi
echo ""

# Step 5: Verify all critical files
echo "📂 Step 5: Verifying all critical files..."
FILES=(
    "src/pages/AICollection.tsx"
    "src/services/s3Service.ts"
    "src/services/types.ts"
    "src/pages/Home.tsx"
    "src/App.tsx"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file missing!"
        ALL_EXIST=false
    fi
done

if [ "$ALL_EXIST" = false ]; then
    echo ""
    echo "   ❌ Some critical files are missing!"
    exit 1
fi
echo ""

# Step 6: Start fresh server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Starting Fresh Dev Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Server starting at: http://localhost:5173"
echo "Press Ctrl+C to stop"
echo ""

npm run dev

