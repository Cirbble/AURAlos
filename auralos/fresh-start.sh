#!/bin/bash
# Complete cleanup and fresh start for AURAlos

echo "🧹 Cleaning up AURAlos project..."
echo ""

# Kill any running processes
pkill -f "vite" 2>/dev/null
pkill -f "node.*auralos" 2>/dev/null

# Clear all caches
echo "Clearing build caches..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite
rm -rf build

# Clear TypeScript build info
rm -rf tsconfig.tsbuildinfo

echo "✅ Cleanup complete!"
echo ""
echo "Starting fresh dev server..."
npm run dev

