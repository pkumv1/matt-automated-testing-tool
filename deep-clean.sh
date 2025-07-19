#!/bin/bash

# MATT Deep Clean Script
# Complete removal of all dependencies and caches (use with caution)

echo "🧹 MATT Deep Clean Script (AGGRESSIVE)"
echo "======================================"
echo "⚠️  WARNING: This will remove ALL dependencies and caches!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deep clean cancelled"
    exit 0
fi

echo ""
echo "🚨 Starting deep clean..."
echo ""

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in MATT project directory"
    exit 1
fi

# Stop everything
echo "🛑 Stopping all processes..."
pm2 kill 2>/dev/null || true
pkill -f node 2>/dev/null || true
pkill -f npm 2>/dev/null || true

# Kill processes on all common ports
for port in 3000 3001 5000 5001 8080 8081; do
    lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done

# Remove ALL build artifacts and caches
echo "🗑️  Removing all build artifacts..."
rm -rf dist/
rm -rf build/
rm -rf .next/
rm -rf .nuxt/
rm -rf .output/
rm -rf .svelte-kit/
rm -rf .parcel-cache/
rm -rf .turbo/
rm -rf .vite/
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/
rm -rf coverage/
rm -rf .nyc_output/
rm -rf .jest/
rm -rf tsconfig.tsbuildinfo
rm -rf .tsbuildinfo

# Remove ALL node_modules
echo "📦 Removing node_modules..."
rm -rf node_modules/

# Remove lock files
echo "🔒 Removing lock files..."
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Clear ALL npm/yarn/pnpm caches
echo "📦 Clearing package manager caches..."
npm cache clean --force 2>/dev/null || true
yarn cache clean 2>/dev/null || true
pnpm store prune 2>/dev/null || true

# Remove PM2 completely
echo "🛑 Removing PM2 data..."
rm -rf ~/.pm2/

# Clear system temp files related to node
echo "🗑️  Clearing system temp files..."
rm -rf /tmp/npm-* 2>/dev/null || true
rm -rf /tmp/yarn-* 2>/dev/null || true
rm -rf ~/.npm/_cacache/ 2>/dev/null || true
rm -rf ~/.yarn/cache/ 2>/dev/null || true
rm -rf ~/.pnpm-store/ 2>/dev/null || true

# Remove logs
echo "📋 Removing all logs..."
rm -rf logs/
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*
rm -f lerna-debug.log*

# Remove any .env files (backup first)
echo "🔐 Backing up .env files..."
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backed up .env file"
fi

# Clear VS Code workspace storage
rm -rf .vscode/.ropeproject/ 2>/dev/null || true

# Show what's left
echo ""
echo "📊 Current directory contents:"
ls -la
echo ""

echo "💾 Disk space recovered:"
df -h . | head -2
echo ""

echo "✅ Deep clean complete!"
echo ""
echo "🔧 To rebuild from scratch:"
echo ""
echo "1. Restore your .env file or set environment variables"
echo "2. Run: npm install"
echo "3. Run: npm run build"
echo "4. Run: pm2 start ecosystem.config.cjs --env production"
echo ""
echo "💡 Or use the automated scripts:"
echo "   ./setup-production-env.sh"
echo "   ./fix-env-variables.sh"
echo ""