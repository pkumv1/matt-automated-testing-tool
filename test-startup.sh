#!/bin/bash

# Simple test to see what happens when we try to start the app

echo "🧪 Testing MATT Application Startup"
echo "==================================="
echo ""

# Navigate to app directory
cd /opt/reactproject/matt-automated-testing-tool 2>/dev/null || {
    echo "❌ Cannot find application directory"
    exit 1
}

echo "📁 Working directory: $(pwd)"
echo ""

# Check if build exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ Build output not found (dist/index.js)"
    echo "Run: npm run build"
    exit 1
fi

echo "✅ Build output exists"
echo ""

# Check environment
echo "🔍 Checking environment..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo ""
    echo "Environment settings:"
    grep -E "^(NODE_ENV|PORT|HOST|DATABASE_URL|ANTHROPIC_API_KEY)" .env | while read line; do
        KEY=$(echo "$line" | cut -d'=' -f1)
        VALUE=$(echo "$line" | cut -d'=' -f2)
        if [[ "$KEY" == "DATABASE_URL" || "$KEY" == "ANTHROPIC_API_KEY" ]]; then
            echo "  $KEY = ***hidden***"
        else
            echo "  $KEY = $VALUE"
        fi
    done
else
    echo "❌ .env file missing"
    echo ""
    echo "Creating .env from environment variables..."
    
    if [ -z "$DATABASE_URL" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "❌ Required environment variables not set"
        echo "Please run:"
        echo "export DATABASE_URL=\"postgresql://postgres:post123@localhost:5432/postgres\""
        echo "export ANTHROPIC_API_KEY=\"sk-ant-api03-...\""
        exit 1
    fi
    
    cat > .env << EOF
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=$DATABASE_URL
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
SESSION_SECRET=test-secret-$(date +%s)
EOF
    echo "✅ Created .env file"
fi
echo ""

# Kill any existing processes on port 5000
echo "🔌 Checking port 5000..."
PID=$(lsof -ti :5000 2>/dev/null)
if [ -n "$PID" ]; then
    echo "Found process $PID on port 5000, killing it..."
    kill -9 $PID 2>/dev/null
    sleep 2
fi
echo "✅ Port 5000 is clear"
echo ""

# Try to start directly with Node.js
echo "🚀 Starting application directly with Node.js..."
echo "================================================"
echo ""

# Start in background and capture output
node dist/index.js > /tmp/matt-startup.log 2>&1 &
NODE_PID=$!

echo "Started with PID: $NODE_PID"
echo "Waiting 10 seconds for startup..."
echo ""

# Wait and show output
for i in {1..10}; do
    echo -n "."
    sleep 1
done
echo ""
echo ""

# Check if process is still running
if ps -p $NODE_PID > /dev/null 2>&1; then
    echo "✅ Process is still running!"
    echo ""
    
    # Test the health endpoint
    echo "🧪 Testing health endpoint..."
    if curl -s http://localhost:5000/health | head -10; then
        echo ""
        echo "✅ Application is working!"
    else
        echo "❌ Health endpoint not responding"
    fi
    
    # Kill the test process
    echo ""
    echo "Stopping test process..."
    kill $NODE_PID 2>/dev/null
else
    echo "❌ Process died"
fi

echo ""
echo "📋 Startup output:"
echo "=================="
cat /tmp/matt-startup.log
echo ""
echo "=================="
echo ""

# Analyze the output
if grep -q "DATABASE_URL must be set" /tmp/matt-startup.log 2>/dev/null; then
    echo "❌ ISSUE: Environment variables not loading"
    echo "This is likely due to the ES module configuration issue."
    echo ""
    echo "🔧 FIX: Make sure .env file exists with all required variables"
elif grep -q "EADDRINUSE" /tmp/matt-startup.log 2>/dev/null; then
    echo "❌ ISSUE: Port already in use"
    echo ""
    echo "🔧 FIX: Kill the process using the port"
elif grep -q "ECONNREFUSED.*5432" /tmp/matt-startup.log 2>/dev/null; then
    echo "❌ ISSUE: Cannot connect to PostgreSQL database"
    echo ""
    echo "🔧 FIX: "
    echo "1. Check PostgreSQL is running: systemctl status postgresql"
    echo "2. Update DATABASE_URL to use 'localhost' instead of 'host'"
elif grep -q "Error:" /tmp/matt-startup.log 2>/dev/null; then
    echo "❌ ISSUE: Application error (see output above)"
else
    echo "✅ Application started successfully!"
    echo ""
    echo "🚀 Now start with PM2:"
    echo "   pm2 start ecosystem.config.cjs --env production"
fi

# Cleanup
rm -f /tmp/matt-startup.log
echo ""