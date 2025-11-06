#!/bin/bash

# Fix GitHub Push Protection - Remove AWS Credentials from Git

echo "🔒 Fixing GitHub Push Protection Issue..."
echo ""

cd /Users/muhammadaliullah/WebstormProjects/AURAlos/auralos

# Step 1: Remove .env from git tracking (keep local file)
echo "1️⃣ Removing .env from git tracking..."
git rm --cached .env 2>/dev/null || git rm --cached auralos/.env 2>/dev/null || echo "   .env already removed or not tracked"

# Step 2: Unstage all current changes
echo "2️⃣ Resetting staged changes..."
git reset HEAD .env 2>/dev/null
git reset HEAD auralos/.env 2>/dev/null

# Step 3: Check if .env is in .gitignore
echo "3️⃣ Verifying .gitignore..."
if grep -q "^\.env$" .gitignore; then
    echo "   ✅ .env is in .gitignore"
else
    echo "   Adding .env to .gitignore..."
    echo "" >> .gitignore
    echo "# AWS Credentials - DO NOT COMMIT" >> .gitignore
    echo ".env" >> .gitignore
fi

# Step 4: Commit the removal
echo "4️⃣ Committing .env removal..."
git add .gitignore
git commit -m "Remove .env file with AWS credentials from git tracking" || echo "   Nothing to commit"

echo ""
echo "✅ Done! Now you can push safely."
echo ""
echo "📝 Next steps:"
echo "   1. Run: git push"
echo "   2. Your .env file is still on your computer (safe!)"
echo "   3. It won't be pushed to GitHub anymore"
echo ""
echo "⚠️  Important: Never commit .env files with credentials!"

