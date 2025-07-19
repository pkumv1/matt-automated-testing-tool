#!/bin/bash

# Comprehensive diagnostic script to find why application won't start

echo "🔍 MATT Application Failure Diagnosis"
echo "====================================="
echo "Started at: $(date)"
echo ""

# Function to check and report
check_status() {
    if [ $1 -eq 0 ]; then
        echo "✅ $2"
    else
        echo "❌ $2"
        ISSUES+=("$2")
    fi
}

ISSUES=()

# 1. Check if we're in the right directory
echo "1️⃣ Directory Check:"
echo "-------------------"
if [ -f "/opt/reactproject/matt-automated-testing-tool/package.json" ]; then
    echo "✅ Found application directory"
    cd /opt/reactproject/matt-automated-testing-tool
    echo "📁 Working directory: $(pwd)"
else
    echo "❌ Application directory not found at /opt/reactproject/matt-automated-testing-tool"
    echo "Please ensure the application is deployed to the correct location"
    exit 1
fi
echo ""

# 2. Check Git status
echo "2️⃣ Git Status:"
echo "--------------"
if [ -d ".git" ]; then
    echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "Last commit: $(git log -1 --oneline 2>/dev/null || echo 'unknown')"
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        echo "⚠️  Uncommitted changes detected:"
        git status --short
    else
        echo "✅ Working directory clean"
    fi
else
    echo "❌ Not a git repository"
fi
echo ""

# 3. Check Node.js and npm
echo "3️⃣ Node.js Environment:"
echo "-----------------------"
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Node.js not found"
    ISSUES+=("Node.js not installed")
fi

NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ npm version: $NPM_VERSION"
else
    echo "❌ npm not found"
    ISSUES+=("npm not installed")
fi

PM2_VERSION=$(pm2 --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ PM2 version: $PM2_VERSION"
else
    echo "❌ PM2 not found"
    ISSUES+=("PM2 not installed")
fi
echo ""

# 4. Check dependencies
echo "4️⃣ Dependencies Check:"
echo "---------------------"
if [ -d "node_modules" ]; then
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo "✅ node_modules exists (${MODULE_COUNT} packages)"
    
    # Check if key dependencies exist
    DEPS=("express" "dotenv" "drizzle-orm" "vite")
    for dep in "${DEPS[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            echo "  ✅ $dep installed"
        else
            echo "  ❌ $dep missing"
            ISSUES+=("Missing dependency: $dep")
        fi
    done
else
    echo "❌ node_modules directory not found"
    ISSUES+=("Dependencies not installed")
fi
echo ""

# 5. Check build output
echo "5️⃣ Build Output Check:"
echo "---------------------"
if [ -f "dist/index.js" ]; then
    echo "✅ dist/index.js exists ($(stat -c%s dist/index.js 2>/dev/null || stat -f%z dist/index.js 2>/dev/null || echo 'unknown size') bytes)"
    echo "  Last modified: $(stat -c%y dist/index.js 2>/dev/null || stat -f "%Sm" dist/index.js 2>/dev/null || echo 'unknown')"
    
    # Check if it's a valid JS file
    if head -1 dist/index.js | grep -q "^import\|^const\|^var\|^//" 2>/dev/null; then
        echo "  ✅ Looks like valid JavaScript"
    else
        echo "  ⚠️  File might be corrupted"
    fi
else
    echo "❌ dist/index.js not found - application not built"
    ISSUES+=("Application not built")
fi
echo ""

# 6. Check environment configuration
echo "6️⃣ Environment Configuration:"
echo "-----------------------------"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    
    # Check required variables
    REQUIRED_VARS=("NODE_ENV" "PORT" "HOST" "DATABASE_URL" "ANTHROPIC_API_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env; then
            VALUE=$(grep "^$var=" .env | cut -d'=' -f2)
            if [ -n "$VALUE" ]; then
                if [[ "$var" == "DATABASE_URL" || "$var" == "ANTHROPIC_API_KEY" ]]; then
                    echo "  ✅ $var is set (hidden for security)"
                else
                    echo "  ✅ $var = $VALUE"
                fi
            else
                echo "  ❌ $var is empty"
                ISSUES+=("$var is empty in .env")
            fi
        else
            echo "  ❌ $var not found"
            ISSUES+=("$var missing from .env")
        fi
    done
else
    echo "❌ .env file not found"
    ISSUES+=(".env file missing")
fi
echo ""

# 7. Check PM2 ecosystem config
echo "7️⃣ PM2 Configuration:"
echo "--------------------"
if [ -f "ecosystem.config.cjs" ]; then
    echo "✅ ecosystem.config.cjs exists"
    
    # Check if it's valid CommonJS
    if grep -q "module.exports" ecosystem.config.cjs; then
        echo "  ✅ Valid CommonJS format"
    else
        echo "  ❌ Invalid format - missing module.exports"
        ISSUES+=("ecosystem.config.cjs invalid format")
    fi
else
    echo "❌ ecosystem.config.cjs not found"
    ISSUES+=("ecosystem.config.cjs missing")
fi
echo ""

# 8. Test database connection
echo "8️⃣ Database Connection Test:"
echo "----------------------------"
if [ -f ".env" ] && command -v psql &> /dev/null; then
    DB_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2)
    if [ -n "$DB_URL" ]; then
        echo "Testing database connection..."
        if timeout 5 psql "$DB_URL" -c "SELECT 1;" &>/dev/null; then
            echo "✅ Database connection successful"
        else
            echo "❌ Database connection failed"
            ISSUES+=("Cannot connect to database")
            
            # Try with localhost
            DB_URL_LOCAL=$(echo "$DB_URL" | sed 's/@[^:]*:/@localhost:/')
            if [ "$DB_URL" != "$DB_URL_LOCAL" ]; then
                echo "  Testing with localhost..."
                if timeout 5 psql "$DB_URL_LOCAL" -c "SELECT 1;" &>/dev/null; then
                    echo "  ✅ Works with localhost - update DATABASE_URL"
                    ISSUES+=("DATABASE_URL needs 'localhost' instead of current host")
                fi
            fi
        fi
    fi
else
    echo "⚠️  Cannot test database (psql not available or .env missing)"
fi
echo ""

# 9. Try to start the application directly
echo "9️⃣ Direct Start Test:"
echo "--------------------"
if [ -f "dist/index.js" ] && [ -f ".env" ]; then
    echo "Attempting to start application directly (10 second timeout)..."
    echo "---"
    timeout 10 node dist/index.js 2>&1 | tee /tmp/matt-start-test.log | head -30
    echo "---"
    
    # Analyze the output
    if grep -q "listen EADDRINUSE" /tmp/matt-start-test.log 2>/dev/null; then
        echo "❌ Port already in use"
        ISSUES+=("Port already in use")
    elif grep -q "DATABASE_URL must be set" /tmp/matt-start-test.log 2>/dev/null; then
        echo "❌ DATABASE_URL not being loaded"
        ISSUES+=("Environment variables not loading")
    elif grep -q "Cannot find module" /tmp/matt-start-test.log 2>/dev/null; then
        echo "❌ Missing dependencies"
        MISSING_MODULE=$(grep "Cannot find module" /tmp/matt-start-test.log | head -1)
        echo "  $MISSING_MODULE"
        ISSUES+=("Missing module dependencies")
    elif grep -q "Server.*running\|started.*successfully" /tmp/matt-start-test.log 2>/dev/null; then
        echo "✅ Application can start successfully"
    else
        echo "❌ Application failed to start (check output above)"
        ISSUES+=("Application startup failed")
    fi
    
    rm -f /tmp/matt-start-test.log
else
    echo "⚠️  Cannot test - missing dist/index.js or .env"
fi
echo ""

# 10. Check PM2 logs
echo "🔟 PM2 Log Analysis:"
echo "-------------------"
LOG_DIR="/opt/reactproject/matt-automated-testing-tool/logs"
PM2_LOG_DIR="$HOME/.pm2/logs"

echo "Checking project logs directory..."
if [ -d "$LOG_DIR" ]; then
    echo "📁 Project logs:"
    ls -la "$LOG_DIR"/*.log 2>/dev/null || echo "  No log files found"
    
    # Check for recent errors
    if [ -f "$LOG_DIR/pm2-error.log" ]; then
        echo ""
        echo "Recent errors from pm2-error.log:"
        tail -20 "$LOG_DIR/pm2-error.log" 2>/dev/null || echo "  Cannot read error log"
    fi
else
    echo "❌ Project logs directory not found"
fi

echo ""
echo "Checking PM2 logs directory..."
if [ -d "$PM2_LOG_DIR" ]; then
    echo "📁 PM2 logs:"
    ls -la "$PM2_LOG_DIR"/matt-production*.log 2>/dev/null || echo "  No matt-production logs found"
fi
echo ""

# 11. Port availability
echo "1️⃣1️⃣ Port Availability:"
echo "----------------------"
for port in 3000 5000; do
    echo "Port $port:"
    if lsof -i :$port 2>/dev/null | grep -q LISTEN; then
        echo "  ❌ Port $port is in use by:"
        lsof -i :$port 2>/dev/null | grep LISTEN
        ISSUES+=("Port $port already in use")
    else
        echo "  ✅ Port $port is available"
    fi
done
echo ""

# Summary and recommendations
echo "📊 DIAGNOSIS SUMMARY"
echo "==================="
echo ""

if [ ${#ISSUES[@]} -eq 0 ]; then
    echo "✅ No obvious issues found"
    echo ""
    echo "Try starting the application:"
    echo "  pm2 start ecosystem.config.cjs --env production"
else
    echo "❌ Issues found:"
    for issue in "${ISSUES[@]}"; do
        echo "  • $issue"
    done
    echo ""
    echo "🔧 RECOMMENDED FIXES:"
    echo "--------------------"
    
    if [[ " ${ISSUES[@]} " =~ "Dependencies not installed" ]]; then
        echo "1. Install dependencies:"
        echo "   npm install"
        echo ""
    fi
    
    if [[ " ${ISSUES[@]} " =~ "Application not built" ]]; then
        echo "2. Build the application:"
        echo "   npm run build"
        echo ""
    fi
    
    if [[ " ${ISSUES[@]} " =~ ".env file missing" ]] || [[ " ${ISSUES[@]} " =~ "missing from .env" ]]; then
        echo "3. Set up environment:"
        echo "   export DATABASE_URL=\"postgresql://postgres:post123@localhost:5432/postgres\""
        echo "   export ANTHROPIC_API_KEY=\"sk-ant-api03-...\""
        echo "   ./setup-production-env.sh"
        echo ""
    fi
    
    if [[ " ${ISSUES[@]} " =~ "Port already in use" ]]; then
        echo "4. Kill processes on ports:"
        echo "   lsof -ti :5000 | xargs kill -9"
        echo "   lsof -ti :3000 | xargs kill -9"
        echo ""
    fi
    
    if [[ " ${ISSUES[@]} " =~ "Cannot connect to database" ]]; then
        echo "5. Fix database connection:"
        echo "   • Check PostgreSQL is running: systemctl status postgresql"
        echo "   • Update DATABASE_URL to use 'localhost' instead of 'host'"
        echo "   • Verify database exists and credentials are correct"
        echo ""
    fi
fi

echo "💡 Quick fix command:"
echo "   ./fix-env-variables.sh"
echo ""
echo "📋 After fixing, start with:"
echo "   pm2 start ecosystem.config.cjs --env production"
echo "   pm2 logs matt-production"
echo ""