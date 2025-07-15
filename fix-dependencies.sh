#!/bin/bash
# Script to fix npm dependency issues

echo "🔧 Fixing npm dependencies..."
echo "================================"

# Step 1: Clean npm cache
echo "1. Cleaning npm cache..."
npm cache clean --force

# Step 2: Remove node_modules and lock file
echo "2. Removing node_modules and package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# Step 3: Fresh install
echo "3. Running fresh npm install..."
npm install

# Step 4: Verify installation
echo "4. Verifying installation..."
npm ls

echo "================================"
echo "✅ Dependencies fixed successfully!"
echo ""
echo "You can now commit the updated package-lock.json file:"
echo "  git add package-lock.json"
echo "  git commit -m 'Update package-lock.json with fresh dependencies'"
echo ""