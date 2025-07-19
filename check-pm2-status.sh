#!/bin/bash

# Comprehensive PM2 and application status check

echo "🔍 PM2 and Application Status Check"
echo "==================================="
echo ""

# Check current directory
echo "📁 Current directory: $(pwd)"
echo ""

# Check PM2 status
echo "📊 PM2 Process List:"
echo "-------------------"
pm2 list
echo ""

# Check specific process
echo "📋 Matt Production Process Details:"
echo "-----------------------------------"
pm2 describe matt-production 2>/dev/null || echo "❌ matt-production process not found"
echo ""

# Check logs location
echo "📂 PM2 Log Locations:"
echo "--------------------"
echo "PM2 Home: $HOME/.pm2"
echo "Log directory: $HOME/.pm2/logs"
echo ""

# List log files
echo "📄 Available Log Files:"
echo "----------------------"
ls -la $HOME/.pm2/logs/ 2>/dev/null || echo "No logs directory found"
echo ""

# Check project logs directory
echo "📄 Project Log Files:"
echo "--------------------"
if [ -d "/opt/reactproject/matt-automated-testing-tool/logs" ]; then
    ls -la /opt/reactproject/matt-automated-testing-tool/logs/
else
    echo "No project logs directory found"
fi
echo ""

# Try to get logs for matt-production
echo "📋 Matt Production Logs (last 50 lines):"
echo "----------------------------------------"
pm2 logs matt-production --lines 50 --nostream 2>/dev/null || echo "No logs available for matt-production"
echo ""

# Check if application directory exists
echo "🔍 Application Directory Check:"
echo "-------------------------------"
if [ -d "/opt/reactproject/matt-automated-testing-tool" ]; then
    echo "✅ Application directory exists"
    cd /opt/reactproject/matt-automated-testing-tool
    
    # Check if dist exists
    if [ -f "dist/index.js" ]; then
        echo "✅ Build output exists"
    else
        echo "❌ Build output missing (dist/index.js)"
    fi
    
    # Check if .env exists
    if [ -f ".env" ]; then
        echo "✅ .env file exists"
        echo "Environment settings:"
        grep -E "^(NODE_ENV|PORT|HOST)=" .env
    else
        echo "❌ .env file missing"
    fi
    
    # Check ecosystem.config.cjs
    if [ -f "ecosystem.config.cjs" ]; then
        echo "✅ ecosystem.config.cjs exists"
    else
        echo "❌ ecosystem.config.cjs missing"
    fi
else
    echo "❌ Application directory not found at /opt/reactproject/matt-automated-testing-tool"
fi
echo ""

# Check port usage
echo "🔌 Port Usage Check:"
echo "-------------------"
echo "Port 5000:"
lsof -i :5000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :5000 || echo "Nothing on port 5000"
echo ""
echo "Port 3000:"
lsof -i :3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 || echo "Nothing on port 3000"
echo ""

# Check Node processes
echo "🟢 Node.js Processes:"
echo "--------------------"
ps aux | grep node | grep -v grep || echo "No Node.js processes running"
echo ""

# Summary
echo "📊 SUMMARY:"
echo "==========="
echo ""

# Check key indicators
if pm2 list 2>/dev/null | grep -q "matt-production"; then
    echo "✅ PM2 process exists"
    STATUS=$(pm2 describe matt-production 2>/dev/null | grep "status" | awk '{print $4}')
    echo "   Status: $STATUS"
else
    echo "❌ PM2 process 'matt-production' not found"
    echo ""
    echo "🔧 To start the application:"
    echo "   cd /opt/reactproject/matt-automated-testing-tool"
    echo "   pm2 start ecosystem.config.cjs --env production"
fi

echo ""
echo "💡 Useful commands:"
echo "   pm2 start ecosystem.config.cjs --env production  # Start app"
echo "   pm2 logs matt-production --lines 100            # View logs"
echo "   pm2 restart matt-production                      # Restart app"
echo "   pm2 stop matt-production                         # Stop app"
echo "   pm2 delete matt-production                       # Remove app"
echo ""