#!/bin/bash

# MATT Clean Build Script
# Removes all cache, build artifacts, and previous deployment residue

echo "🧹 MATT Clean Build Script"
echo "========================="
echo ""

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in MATT project directory"
    echo "Please run this script from: /opt/reactproject/matt-automated-testing-tool"
    exit 1
fi

echo "✅ In MATT project directory: $(pwd)"
echo ""

# Stop all PM2 processes
echo "🛑 Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || echo "No PM2 processes to stop"
pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
pm2 kill 2>/dev/null || echo "PM2 daemon not running"
echo "✅ PM2 processes cleaned"
echo ""

# Kill any Node.js processes on common ports
echo "🔌 Killing processes on ports 3000, 5000..."
for port in 3000 5000; do
    PID=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$PID" ]; then
        echo "Killing process $PID on port $port"
        kill -9 $PID 2>/dev/null || echo "Could not kill process $PID"
    fi
done
echo "✅ Port cleanup complete"
echo ""

# Remove build directories and files
echo "🗑️  Removing build artifacts..."
rm -rf dist/ 2>/dev/null && echo "✅ Removed dist/"
rm -rf node_modules/.cache/ 2>/dev/null && echo "✅ Removed node_modules/.cache/"
rm -rf node_modules/.vite/ 2>/dev/null && echo "✅ Removed node_modules/.vite/"
rm -rf .parcel-cache/ 2>/dev/null && echo "✅ Removed .parcel-cache/"
rm -rf .turbo/ 2>/dev/null && echo "✅ Removed .turbo/"
rm -rf .next/ 2>/dev/null && echo "✅ Removed .next/"
rm -rf build/ 2>/dev/null && echo "✅ Removed build/"
rm -rf coverage/ 2>/dev/null && echo "✅ Removed coverage/"
rm -rf .nyc_output/ 2>/dev/null && echo "✅ Removed .nyc_output/"
echo ""

# Remove PM2 logs and dumps
echo "📋 Cleaning PM2 logs and dumps..."
rm -rf ~/.pm2/logs/* 2>/dev/null && echo "✅ Removed PM2 logs"
rm -rf ~/.pm2/dump.pm2 2>/dev/null && echo "✅ Removed PM2 dump"
rm -rf logs/*.log 2>/dev/null && echo "✅ Removed application logs"
echo ""

# Clear npm cache
echo "📦 Clearing npm cache..."
npm cache clean --force 2>/dev/null && echo "✅ npm cache cleared"
echo ""

# Remove package lock files (optional - uncomment if needed)
# echo "🔒 Removing lock files..."
# rm -f package-lock.json yarn.lock pnpm-lock.yaml
# echo "✅ Lock files removed"
# echo ""

# Clear TypeScript cache
echo "📘 Clearing TypeScript cache..."
rm -rf tsconfig.tsbuildinfo 2>/dev/null && echo "✅ Removed tsconfig.tsbuildinfo"
rm -rf .tsbuildinfo 2>/dev/null && echo "✅ Removed .tsbuildinfo"
echo ""

# Clear temporary files
echo "🗑️  Clearing temporary files..."
rm -rf tmp/ 2>/dev/null && echo "✅ Removed tmp/"
rm -rf temp/ 2>/dev/null && echo "✅ Removed temp/"
rm -rf .tmp/ 2>/dev/null && echo "✅ Removed .tmp/"
rm -rf *.log 2>/dev/null && echo "✅ Removed root log files"
echo ""

# Clear Vite specific cache
echo "⚡ Clearing Vite cache..."
rm -rf node_modules/.vite-storybook/ 2>/dev/null && echo "✅ Removed .vite-storybook/"
rm -rf public/.vite/ 2>/dev/null && echo "✅ Removed public/.vite/"
echo ""

# Clear jest cache
echo "🧪 Clearing Jest cache..."
jest --clearCache 2>/dev/null || echo "Jest not available or no cache to clear"
echo ""

# Optional: Remove node_modules completely (uncomment if needed)
# echo "📦 Removing node_modules..."
# rm -rf node_modules/
# echo "✅ Removed node_modules/"
# echo ""

# Create fresh directories
echo "📁 Creating fresh directories..."
mkdir -p logs uploads backups config
echo "✅ Created fresh directories"
echo ""

# Show disk space recovered
echo "💾 Disk space information:"
df -h . | head -2
echo ""

echo "🎉 Clean build preparation complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables:"
echo "   export DATABASE_URL=\"postgresql://postgres:post123@localhost:5432/postgres\""
echo "   export ANTHROPIC_API_KEY=\"sk-ant-api03-...\""
echo ""
echo "2. Run setup or fix script:"
echo "   ./setup-production-env.sh"
echo "   OR"
echo "   ./fix-env-variables.sh"
echo ""
echo "3. Or manually rebuild:"
echo "   npm install"
echo "   npm run build"
echo "   pm2 start ecosystem.config.js --env production"
echo ""