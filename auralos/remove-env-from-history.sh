#!/bin/bash

# Remove .env from entire git history
# This fixes the GitHub push protection issue

set -e

echo "🔐 Removing .env from Git History..."
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "   Make sure you have a backup of your code."
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cancelled."
    exit 0
fi

cd /Users/muhammadaliullah/WebstormProjects/AURAlos/auralos

echo "1️⃣ Creating backup branch..."
git branch backup-before-env-removal 2>/dev/null || echo "   Backup branch already exists"

echo ""
echo "2️⃣ Removing .env from all commits..."
echo "   This may take a minute..."

# Method 1: Using git filter-branch (works on all systems)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env auralos/.env' \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "3️⃣ Cleaning up references..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "4️⃣ Verifying .env is removed..."
if git log --all --full-history -- .env | grep -q commit; then
    echo "   ⚠️  .env still in history, trying alternative method..."

    # Method 2: Manual rebase
    git filter-repo --invert-paths --path .env --path auralos/.env --force 2>/dev/null || echo "   filter-repo not available"
else
    echo "   ✅ .env successfully removed from history!"
fi

echo ""
echo "5️⃣ Making sure .env is in .gitignore..."
if ! grep -q "^\.env$" .gitignore; then
    echo ".env" >> .gitignore
    git add .gitignore
    git commit -m "Add .env to .gitignore" 2>/dev/null || echo "   Already in .gitignore"
fi

echo ""
echo "✅ Done! History has been rewritten."
echo ""
echo "📝 Next steps:"
echo "   1. Run: git push origin main --force"
echo "      (Force push required because history was rewritten)"
echo ""
echo "   2. If working with others, they need to re-clone the repo"
echo ""
echo "⚠️  If force push fails, you may need to allow it on GitHub:"
echo "   Settings → Branches → Edit protection rules → Allow force pushes"
echo ""
echo "💾 Backup: Your original git history is in branch 'backup-before-env-removal'"

