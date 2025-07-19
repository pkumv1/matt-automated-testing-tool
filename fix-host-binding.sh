#!/bin/bash

# Fix host binding to 0.0.0.0 for external access

echo "🔧 Fixing Host Binding to 0.0.0.0"
echo "================================="
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo "📝 Updating .env file..."
    
    # Check if HOST is already set
    if grep -q "^HOST=" .env; then
        # Update existing HOST
        sed -i 's/^HOST=.*/HOST=0.0.0.0/' .env
        echo "✅ Updated HOST to 0.0.0.0"
    else
        # Add HOST after PORT
        sed -i '/^PORT=/a HOST=0.0.0.0' .env
        echo "✅ Added HOST=0.0.0.0"
    fi
    
    echo ""
    echo "📋 Current network settings:"
    grep -E "^(PORT|HOST|NODE_ENV)=" .env
else
    echo "❌ .env file not found"
    echo "Run ./setup-production-env.sh first"
    exit 1
fi

echo ""
echo "🔄 Rebuilding application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🔄 Restarting PM2..."
pm2 stop matt-production 2>/dev/null || true
pm2 delete matt-production 2>/dev/null || true

# Kill any process on port 5000
PID=$(lsof -ti :5000 2>/dev/null)
if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null || true
fi

pm2 start ecosystem.config.cjs --env production

sleep 10

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "🧪 Testing connectivity..."
echo ""

# Test localhost
echo "Testing localhost:5000..."
curl -s http://localhost:5000/health | head -5 || echo "❌ Localhost test failed"

echo ""
# Test 0.0.0.0
echo "Testing 0.0.0.0:5000..."
curl -s http://0.0.0.0:5000/health | head -5 || echo "❌ 0.0.0.0 test failed"

echo ""
echo "✅ Host binding fix complete!"
echo ""
echo "The server is now listening on 0.0.0.0:5000"
echo "This allows connections from:"
echo "• localhost:5000"
echo "• YOUR_SERVER_IP:5000"
echo "• 0.0.0.0:5000"
echo ""
echo "📋 Check logs: pm2 logs matt-production"
echo ""