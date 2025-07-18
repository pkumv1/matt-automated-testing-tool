#!/bin/bash

# MATT 502 Error Troubleshooting Script
# Run this on the server to diagnose the 502 gateway error

echo "🔍 MATT 502 Error Troubleshooting Script"
echo "======================================="
echo ""

# Check current directory
echo "📁 Current Directory:"
pwd
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in MATT project directory"
    echo "Please run this script from: /opt/reactproject/matt-automated-testing-tool"
    exit 1
fi

echo "✅ In MATT project directory"
echo ""

# 1. Check PM2 Status
echo "🔧 Step 1: Checking PM2 Status"
echo "--------------------------------"
pm2 list 2>/dev/null || echo "PM2 not available"
echo ""

# 2. Check specific MATT process
echo "🔍 Step 2: Checking MATT Process"
echo "--------------------------------"
pm2 describe matt-production 2>/dev/null || echo "MATT process not found in PM2"
echo ""

# 3. Check PM2 Logs
echo "📝 Step 3: Recent PM2 Logs (last 20 lines)"
echo "--------------------------------------------"
pm2 logs matt-production --lines 20 --nostream 2>/dev/null || echo "Cannot access PM2 logs"
echo ""

# 4. Check if port 3000 is in use
echo "🔌 Step 4: Port 3000 Status"
echo "----------------------------"
netstat -tlnp | grep :3000 || echo "Port 3000 is not in use"
echo ""

# 5. Check Node.js processes
echo "🟢 Step 5: Node.js Processes"
echo "-----------------------------"
ps aux | grep node | grep -v grep || echo "No Node.js processes found"
echo ""

# 6. Check environment variables
echo "🌍 Step 6: Environment Variables"
echo "--------------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "PORT: $(grep PORT .env | cut -d'=' -f2)"
    echo "NODE_ENV: $(grep NODE_ENV .env | cut -d'=' -f2)"
    echo "DATABASE_URL: $(grep DATABASE_URL .env | cut -d'=' -f2 | sed 's/:[^@]*@/:****@/')"
else
    echo "❌ .env file not found"
fi
echo ""

# 7. Check build output
echo "📦 Step 7: Build Output"
echo "----------------------"
if [ -d "dist" ]; then
    echo "✅ dist directory exists"
    ls -la dist/
    echo ""
    if [ -f "dist/index.js" ]; then
        echo "✅ dist/index.js exists ($(stat -c%s dist/index.js) bytes)"
    else
        echo "❌ dist/index.js missing"
    fi
    echo ""
    if [ -d "dist/public" ]; then
        echo "✅ dist/public directory exists"
        ls -la dist/public/ | head -5
    else
        echo "❌ dist/public directory missing"
    fi
else
    echo "❌ dist directory not found"
fi
echo ""

# 8. Check database connection
echo "🗄️  Step 8: Database Connection Test"
echo "------------------------------------"
if command -v psql &> /dev/null && [ -n "$(grep DATABASE_URL .env)" ]; then
    DATABASE_URL=$(grep DATABASE_URL .env | cut -d'=' -f2)
    echo "Testing database connection..."
    timeout 5 psql "$DATABASE_URL" -c "SELECT 1;" 2>/dev/null && echo "✅ Database connection successful" || echo "❌ Database connection failed"
else
    echo "⚠️  psql not available or DATABASE_URL not set"
fi
echo ""

# 9. Check application health directly
echo "🏥 Step 9: Application Health Check"
echo "-----------------------------------"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo "✅ Application responding on port 3000"
    curl -s http://localhost:3000/health | head -5
else
    echo "❌ Application not responding on port 3000"
fi
echo ""

# 10. Check Nginx status
echo "🌐 Step 10: Nginx Status"
echo "------------------------"
if command -v nginx &> /dev/null; then
    echo "Nginx configuration test:"
    nginx -t 2>&1
    echo ""
    echo "Nginx service status:"
    systemctl status nginx --no-pager -l | head -10
else
    echo "⚠️  Nginx not available"
fi
echo ""

# 11. Check disk space
echo "💾 Step 11: Disk Space"
echo "----------------------"
df -h . | head -2
echo ""

# 12. Check system resources
echo "💻 Step 12: System Resources"
echo "-----------------------------"
echo "Memory usage:"
free -h
echo ""
echo "CPU Load:"
uptime
echo ""

# 13. Check recent logs
echo "📋 Step 13: Recent Application Logs"
echo "------------------------------------"
if [ -d "logs" ]; then
    echo "Log directory contents:"
    ls -la logs/
    echo ""
    echo "Recent error logs:"
    find logs/ -name "error-*.log" -exec tail -5 {} \; 2>/dev/null || echo "No error logs found"
    echo ""
    echo "Recent application logs:"
    find logs/ -name "app-*.log" -exec tail -5 {} \; 2>/dev/null || echo "No application logs found"
else
    echo "❌ logs directory not found"
fi
echo ""

# 14. Test application startup manually
echo "🚀 Step 14: Manual Application Test"
echo "------------------------------------"
echo "Attempting to start application manually (timeout 10s)..."
timeout 10s node dist/index.js 2>&1 | head -10 || echo "Manual start failed or timed out"
echo ""

# 15. Check if another process is using port 3000
echo "🔍 Step 15: Port 3000 Process Check"
echo "-----------------------------------"
lsof -i :3000 2>/dev/null || echo "No process using port 3000"
echo ""

# Summary and recommendations
echo "📊 TROUBLESHOOTING SUMMARY"
echo "=========================="
echo ""
echo "Based on the above checks, here are the most likely causes:"
echo ""
echo "1. If PM2 process is not running:"
echo "   → Run: pm2 start ecosystem.config.js --env production"
echo ""
echo "2. If build files are missing:"
echo "   → Run: npm run build"
echo ""
echo "3. If database connection failed:"
echo "   → Check PostgreSQL service: systemctl status postgresql"
echo "   → Verify DATABASE_URL in .env file"
echo ""
echo "4. If port 3000 is not responding:"
echo "   → Check application logs: pm2 logs matt-production"
echo "   → Check if another process is using port 3000"
echo ""
echo "5. If Nginx configuration is wrong:"
echo "   → Check nginx config: nginx -t"
echo "   → Restart nginx: systemctl restart nginx"
echo ""
echo "Next steps:"
echo "1. Run: node deployment-health-check.js"
echo "2. Check: pm2 logs matt-production --lines 100"
echo "3. Test: curl http://localhost:3000/health"
echo "4. Verify: curl https://demo.mars-techs.ai/health"
echo ""
echo "🔧 For immediate fix, try:"
echo "   git pull origin main"
echo "   npm install"
echo "   npm run build"
echo "   pm2 restart matt-production"
echo ""