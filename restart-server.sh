#!/bin/bash

# MATT Server Restart Script
# Use this to restart the server with proper environment variables

echo "🔄 Restarting MATT Server"
echo "========================"

# Check if environment variables are set
if [ -z "$DATABASE_URL" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Please set environment variables first:"
    echo "export DATABASE_URL=\"postgresql://postgres:post123@localhost:5432/postgres\""
    echo "export ANTHROPIC_API_KEY=\"sk-ant-api03-...\""
    exit 1
fi

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in MATT project directory"
    exit 1
fi

echo "✅ In MATT project directory: $(pwd)"

# Stop existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop matt-production 2>/dev/null || echo "No existing process to stop"
pm2 delete matt-production 2>/dev/null || echo "No existing process to delete"

# Kill any process on port 5000
echo "🔌 Checking port 5000..."
PID=$(lsof -ti :5000 2>/dev/null)
if [ -n "$PID" ]; then
    echo "Killing process $PID on port 5000"
    kill -9 $PID
fi

# Update code from GitHub
echo "📥 Pulling latest code..."
git pull origin main

# Setup environment
echo "🌍 Setting up environment..."
./setup-production-env.sh

# Build application
echo "🏗️  Building application..."
npm run build

# Start with PM2
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.js --env production

# Wait and check status
sleep 5
echo "📊 PM2 Status:"
pm2 list

# Test the application
echo "🧪 Testing application..."
sleep 10
curl -s http://localhost:5000/health | head -10 || echo "❌ Health check failed"

echo ""
echo "✅ Server restart complete!"
echo "🔗 Test URLs:"
echo "• Health: http://localhost:5000/health"
echo "• App: http://localhost:5000/"
echo ""
echo "📋 To check logs: pm2 logs matt-production"