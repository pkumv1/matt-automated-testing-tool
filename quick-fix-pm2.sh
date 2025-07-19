#!/bin/bash

# Quick fix for PM2 ecosystem.config.js ES module error

echo "🔧 Quick PM2 Fix Script"
echo "======================="
echo ""

# Stop any running PM2 processes
echo "🛑 Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Kill process on port 5000
PID=$(lsof -ti :5000 2>/dev/null)
if [ -n "$PID" ]; then
    echo "🔌 Killing process on port 5000: $PID"
    kill -9 $PID 2>/dev/null || true
fi

# Start with the correct .cjs file
echo "🚀 Starting PM2 with ecosystem.config.cjs..."
pm2 start ecosystem.config.cjs --env production

# Wait and check
sleep 5
echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📋 Recent logs:"
pm2 logs matt-production --lines 10 --nostream

echo ""
echo "🧪 Testing health endpoint..."
sleep 5
if curl -s http://localhost:5000/health | grep -q "status"; then
    echo "✅ Application is running!"
    curl -s http://localhost:5000/health | head -5
else
    echo "❌ Health check failed"
    echo "Check logs: pm2 logs matt-production"
fi

echo ""
echo "✅ Quick fix complete!"
echo ""