#!/bin/bash

# MATT 502 Error Fix Script
# This script attempts to fix the most common causes of 502 errors

echo "🔧 MATT 502 Error Fix Script"
echo "============================"
echo ""

# Ensure we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in MATT project directory"
    echo "Please run this script from: /opt/reactproject/matt-automated-testing-tool"
    exit 1
fi

echo "✅ In MATT project directory: $(pwd)"
echo ""

# Step 1: Stop any running processes
echo "🛑 Step 1: Stopping existing processes"
echo "--------------------------------------"
pm2 stop matt-production 2>/dev/null || echo "No PM2 process to stop"
pm2 delete matt-production 2>/dev/null || echo "No PM2 process to delete"

# Kill any node processes on port 3000
echo "🔌 Checking for processes on port 3000..."
PID=$(lsof -ti :3000 2>/dev/null)
if [ -n "$PID" ]; then
    echo "Found process $PID on port 3000, killing it..."
    kill -9 $PID 2>/dev/null || echo "Could not kill process"
fi
echo ""

# Step 2: Update code from GitHub
echo "📥 Step 2: Updating from GitHub"
echo "-------------------------------"
git fetch origin
git reset --hard origin/main
echo "✅ Code updated from GitHub"
echo ""

# Step 3: Install dependencies
echo "📦 Step 3: Installing dependencies"
echo "----------------------------------"
npm install --production=false
echo "✅ Dependencies installed"
echo ""

# Step 4: Check environment variables
echo "🌍 Step 4: Verifying environment variables"
echo "------------------------------------------"
if [ ! -f ".env" ]; then
    echo "❌ .env file missing, creating from .env.example"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "⚠️  Please edit .env file with your actual values"
    else
        echo "❌ .env.example not found"
    fi
else
    echo "✅ .env file exists"
fi

# Check critical environment variables
if grep -q "PORT=3000" .env; then
    echo "✅ PORT=3000 configured"
else
    echo "⚠️  PORT not set to 3000, fixing..."
    sed -i 's/PORT=.*/PORT=3000/' .env 2>/dev/null || echo "PORT=3000" >> .env
fi

if grep -q "NODE_ENV=production" .env; then
    echo "✅ NODE_ENV=production configured"
else
    echo "⚠️  NODE_ENV not set to production, fixing..."
    sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env 2>/dev/null || echo "NODE_ENV=production" >> .env
fi
echo ""

# Step 5: Build the application
echo "🏗️  Step 5: Building application"
echo "--------------------------------"
echo "Building frontend..."
npm run build 2>&1 | tail -10

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Application built successfully"
echo ""

# Step 6: Verify build output
echo "🔍 Step 6: Verifying build output"
echo "---------------------------------"
if [ -f "dist/index.js" ]; then
    echo "✅ Server build: dist/index.js exists"
else
    echo "❌ Server build: dist/index.js missing"
    exit 1
fi

if [ -f "dist/public/index.html" ]; then
    echo "✅ Client build: dist/public/index.html exists"
else
    echo "❌ Client build: dist/public/index.html missing"
    exit 1
fi
echo ""

# Step 7: Test database connection
echo "🗄️  Step 7: Testing database connection"
echo "---------------------------------------"
if command -v psql &> /dev/null; then
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d'=' -f2)
    if [ -n "$DATABASE_URL" ]; then
        echo "Testing database connection..."
        timeout 5 psql "$DATABASE_URL" -c "SELECT 1;" &>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Database connection successful"
        else
            echo "❌ Database connection failed"
            echo "Please check:"
            echo "1. PostgreSQL service: systemctl status postgresql"
            echo "2. DATABASE_URL in .env file"
            echo "3. Database exists: psql -l"
        fi
    else
        echo "⚠️  DATABASE_URL not found in .env"
    fi
else
    echo "⚠️  psql not available for testing"
fi
echo ""

# Step 8: Start the application with PM2
echo "🚀 Step 8: Starting application with PM2"
echo "----------------------------------------"
pm2 start ecosystem.config.cjs --env production
sleep 5

# Check if the process started successfully
pm2 describe matt-production &>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ PM2 process started successfully"
    pm2 list | grep matt-production
else
    echo "❌ PM2 process failed to start"
    echo "Checking logs..."
    pm2 logs matt-production --lines 20 --nostream
    exit 1
fi
echo ""

# Step 9: Test application health
echo "🏥 Step 9: Testing application health"
echo "------------------------------------"
echo "Waiting for application to start..."
sleep 10

# Test local health endpoint
for i in {1..10}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
        echo "✅ Application responding on port 3000"
        curl -s http://localhost:3000/health | head -3
        break
    else
        echo "Attempt $i: Application not responding yet..."
        sleep 3
    fi
done
echo ""

# Step 10: Check Nginx
echo "🌐 Step 10: Checking Nginx"
echo "--------------------------"
if command -v nginx &> /dev/null; then
    echo "Testing Nginx configuration..."
    nginx -t
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration valid"
        echo "Restarting Nginx..."
        systemctl restart nginx
        echo "✅ Nginx restarted"
    else
        echo "❌ Nginx configuration invalid"
    fi
else
    echo "⚠️  Nginx not available"
fi
echo ""

# Step 11: Test public access
echo "🌍 Step 11: Testing public access"
echo "---------------------------------"
echo "Testing https://demo.mars-techs.ai/health..."
if curl -s -k --connect-timeout 10 https://demo.mars-techs.ai/health | grep -q "status"; then
    echo "✅ Public site accessible"
    curl -s -k https://demo.mars-techs.ai/health | head -3
else
    echo "❌ Public site not accessible"
    echo "This could be due to:"
    echo "1. Nginx not properly configured"
    echo "2. SSL certificate issues"
    echo "3. DNS issues"
    echo "4. Firewall blocking connections"
fi
echo ""

# Step 12: Save PM2 configuration
echo "💾 Step 12: Saving PM2 configuration"
echo "------------------------------------"
pm2 save
pm2 startup | grep -E "^sudo" | head -1 || echo "PM2 startup command not available"
echo ""

# Final status
echo "📊 FINAL STATUS"
echo "==============="
echo ""
echo "PM2 Status:"
pm2 list
echo ""
echo "Process Details:"
pm2 describe matt-production | grep -E "(status|pid|memory|cpu)" || echo "Process not found"
echo ""
echo "Recent Logs:"
pm2 logs matt-production --lines 5 --nostream 2>/dev/null || echo "No logs available"
echo ""
echo "✅ Fix script completed!"
echo ""
echo "🔗 Test URLs:"
echo "• Local health: http://localhost:3000/health"
echo "• Public health: https://demo.mars-techs.ai/health"
echo "• Public site: https://demo.mars-techs.ai/"
echo ""
echo "📋 If still not working, run:"
echo "• pm2 logs matt-production --lines 100"
echo "• node deployment-health-check.js"
echo "• systemctl status nginx"
echo ""