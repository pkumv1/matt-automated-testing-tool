#!/bin/bash

# MATT Connection Diagnostic Script
# Diagnoses why localhost:5000/health is not accessible

echo "🔍 MATT Connection Diagnostic Script"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in MATT project directory"
    echo "Please run from: /opt/reactproject/matt-automated-testing-tool"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# 1. Check if PM2 is running
echo "1️⃣ Checking PM2 processes..."
echo "------------------------------"
pm2 list 2>/dev/null || echo "❌ PM2 not installed or not running"
echo ""

# 2. Check PM2 process details
echo "2️⃣ PM2 Process Details..."
echo "-------------------------"
pm2 describe matt-production 2>/dev/null || echo "❌ matt-production process not found"
echo ""

# 3. Check what's running on port 5000
echo "3️⃣ Checking Port 5000..."
echo "------------------------"
if command -v netstat &> /dev/null; then
    netstat -tlnp 2>/dev/null | grep :5000 || echo "❌ Nothing listening on port 5000"
else
    lsof -i :5000 2>/dev/null || echo "❌ Nothing listening on port 5000"
fi
echo ""

# 4. Check all Node processes
echo "4️⃣ Node.js Processes..."
echo "-----------------------"
ps aux | grep node | grep -v grep || echo "❌ No Node.js processes running"
echo ""

# 5. Check if dist/index.js exists
echo "5️⃣ Checking Build Output..."
echo "---------------------------"
if [ -f "dist/index.js" ]; then
    echo "✅ dist/index.js exists ($(stat -c%s dist/index.js 2>/dev/null || stat -f%z dist/index.js 2>/dev/null) bytes)"
    echo "Last modified: $(stat -c%y dist/index.js 2>/dev/null || stat -f "%Sm" dist/index.js 2>/dev/null)"
else
    echo "❌ dist/index.js not found - build may have failed"
fi
echo ""

# 6. Check .env file
echo "6️⃣ Checking .env File..."
echo "------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "PORT: $(grep "^PORT=" .env | cut -d'=' -f2)"
    echo "NODE_ENV: $(grep "^NODE_ENV=" .env | cut -d'=' -f2)"
    echo "DATABASE_URL: $(grep "^DATABASE_URL=" .env | cut -d'=' -f2 | sed 's/:[^@]*@/:****@/')"
    echo "ANTHROPIC_API_KEY: $(grep "^ANTHROPIC_API_KEY=" .env | cut -d'=' -f2 | cut -c1-20)..."
else
    echo "❌ .env file not found"
fi
echo ""

# 7. Test starting the app directly
echo "7️⃣ Testing Direct Node Start..."
echo "-------------------------------"
if [ -f "dist/index.js" ]; then
    echo "Starting application directly (5 second timeout)..."
    timeout 5 node dist/index.js 2>&1 | head -20 || echo "❌ Direct start failed or timed out"
else
    echo "❌ Cannot test - dist/index.js not found"
fi
echo ""

# 8. Check recent PM2 logs
echo "8️⃣ Recent PM2 Logs..."
echo "---------------------"
if pm2 list 2>/dev/null | grep -q "matt-production"; then
    pm2 logs matt-production --lines 15 --nostream 2>/dev/null || echo "❌ No logs available"
else
    echo "❌ PM2 process not running"
fi
echo ""

# 9. Check firewall rules
echo "9️⃣ Checking Firewall..."
echo "----------------------"
if command -v ufw &> /dev/null; then
    sudo ufw status 2>/dev/null | grep -E "5000|ALLOW" || echo "⚠️  No firewall rules for port 5000"
else
    echo "⚠️  ufw not available - check firewall manually"
fi

if command -v iptables &> /dev/null; then
    sudo iptables -L INPUT -n 2>/dev/null | grep -E "5000|ACCEPT" || echo "⚠️  No iptables rules for port 5000"
else
    echo "⚠️  iptables not available"
fi
echo ""

# 10. Test localhost connectivity
echo "🔟 Testing Localhost Connectivity..."
echo "-----------------------------------"
# Test with curl
if command -v curl &> /dev/null; then
    echo "Testing with curl..."
    curl -v http://localhost:5000/health --max-time 5 2>&1 | grep -E "Connected to|HTTP|curl:" || echo "❌ curl failed"
else
    echo "⚠️  curl not available"
fi
echo ""

# Test with wget
if command -v wget &> /dev/null; then
    echo "Testing with wget..."
    wget -O- http://localhost:5000/health --timeout=5 2>&1 | head -10 || echo "❌ wget failed"
else
    echo "⚠️  wget not available"
fi
echo ""

# 11. Check alternative ports
echo "1️⃣1️⃣ Checking Alternative Ports..."
echo "----------------------------------"
for port in 3000 3001 5001 8080; do
    if lsof -i :$port 2>/dev/null | grep -q LISTEN; then
        echo "⚠️  Port $port is in use - might be running there instead"
    fi
done
echo ""

# 12. Database connectivity
echo "1️⃣2️⃣ Testing Database Connection..."
echo "-----------------------------------"
if [ -f ".env" ] && command -v psql &> /dev/null; then
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2)
    if [ -n "$DB_URL" ]; then
        echo "Testing: $(echo "$DB_URL" | sed 's/:[^@]*@/:****@/')"
        timeout 5 psql "$DB_URL" -c "SELECT 1;" &>/dev/null && echo "✅ Database connection OK" || echo "❌ Database connection failed"
    else
        echo "❌ DATABASE_URL not found in .env"
    fi
else
    echo "⚠️  Cannot test database (psql not available or .env missing)"
fi
echo ""

# Summary and recommendations
echo "📊 DIAGNOSTIC SUMMARY"
echo "===================="
echo ""

# Check key issues
ISSUES=()
if ! pm2 list 2>/dev/null | grep -q "matt-production"; then
    ISSUES+=("PM2 process not running")
fi
if ! lsof -i :5000 2>/dev/null | grep -q LISTEN; then
    ISSUES+=("Nothing listening on port 5000")
fi
if [ ! -f "dist/index.js" ]; then
    ISSUES+=("Build output missing")
fi
if [ ! -f ".env" ]; then
    ISSUES+=("Environment file missing")
fi

if [ ${#ISSUES[@]} -eq 0 ]; then
    echo "✅ No obvious issues found"
    echo ""
    echo "Try these debugging steps:"
    echo "1. Check nginx configuration: sudo nginx -t"
    echo "2. Check system logs: sudo journalctl -xe"
    echo "3. Try accessing from outside: curl http://YOUR_SERVER_IP:5000/health"
else
    echo "❌ Issues found:"
    for issue in "${ISSUES[@]}"; do
        echo "   - $issue"
    done
    echo ""
    echo "🔧 Recommended fixes:"
    if [[ " ${ISSUES[@]} " =~ "PM2 process not running" ]]; then
        echo "1. Start PM2: pm2 start ecosystem.config.cjs --env production"
    fi
    if [[ " ${ISSUES[@]} " =~ "Build output missing" ]]; then
        echo "2. Rebuild: npm run build"
    fi
    if [[ " ${ISSUES[@]} " =~ "Environment file missing" ]]; then
        echo "3. Create .env: ./setup-production-env.sh"
    fi
fi

echo ""
echo "💡 Quick fix command:"
echo "   ./fix-env-variables.sh"
echo ""