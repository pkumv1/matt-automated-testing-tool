#!/bin/bash
# MATT Deployment Diagnostics Script
# Save this as: /opt/reactproject/matt-automated-testing-tool/deployment-diagnostics.sh

APP_DIR="/opt/reactproject/matt-automated-testing-tool"
LOG_DIR="$APP_DIR/logs"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=== MATT Deployment Diagnostics - $TIMESTAMP ==="
echo

echo "🔍 System Information:"
echo "OS: $(uname -a)"
echo "Node.js: $(node --version 2>/dev/null || echo 'Node.js not found')"
echo "NPM: $(npm --version 2>/dev/null || echo 'NPM not found')"
echo "PM2: $(pm2 --version 2>/dev/null || echo 'PM2 not found')"
echo "Nginx: $(nginx -v 2>&1 | grep version || echo 'Nginx not found')"
echo

echo "📁 Directory Structure:"
echo "App Directory exists: $([ -d "$APP_DIR" ] && echo 'YES' || echo 'NO')"
echo "Logs Directory exists: $([ -d "$LOG_DIR" ] && echo 'YES' || echo 'NO')"
echo "Dist Directory exists: $([ -d "$APP_DIR/dist" ] && echo 'YES' || echo 'NO')"
echo "Node Modules exists: $([ -d "$APP_DIR/node_modules" ] && echo 'YES' || echo 'NO')"
echo

echo "🔧 File Permissions:"
ls -la "$APP_DIR" | head -10
echo

echo "📦 Package Information:"
if [ -f "$APP_DIR/package.json" ]; then
  echo "Package.json exists: YES"
  grep '"name"\|"version"\|"scripts"' "$APP_DIR/package.json" || echo "Could not read package.json"
else
  echo "Package.json exists: NO"
fi
echo

echo "🌐 Network & Ports:"
echo "Port 5000 in use: $(ss -tlnp | grep :5000 && echo 'YES' || echo 'NO')"
echo "Port 80 in use: $(ss -tlnp | grep :80 && echo 'YES' || echo 'NO')"
echo "Port 443 in use: $(ss -tlnp | grep :443 && echo 'YES' || echo 'NO')"
echo "Network interfaces:"
ip addr show | grep inet | grep -v 127.0.0.1 | grep -v ::1
echo

echo "🗄️ Database Status:"
if command -v psql > /dev/null; then
  echo "PostgreSQL client: Available"
  echo "Database connection test:"
  PGPASSWORD=${DB_PASSWORD:-'defaultpassword'} psql -h localhost -U postgres -d testdb -c "SELECT version();" 2>&1 | head -3
else
  echo "PostgreSQL client: Not available"
fi
echo

echo "🔄 Process Status:"
echo "Running Node processes:"
ps aux | grep node | grep -v grep || echo "No Node.js processes found"
echo
echo "PM2 processes:"
pm2 list 2>/dev/null || echo "PM2 not running or not installed"
echo

echo "📊 Resource Usage:"
echo "Memory: $(free -h | grep Mem)"
echo "Disk Space: $(df -h $APP_DIR)"
echo "CPU Load: $(uptime)"
echo

echo "🚨 Recent Errors:"
if [ -f "$LOG_DIR/error-$DATE.log" ]; then
  echo "Last 5 errors from today:"
  tail -5 "$LOG_DIR/error-$DATE.log"
else
  echo "No error log found for today"
fi
echo

echo "🔍 Application Status:"
if [ -f "$LOG_DIR/app-$DATE.log" ]; then
  echo "Last startup attempt:"
  grep "STARTUP\|Starting\|listen" "$LOG_DIR/app-$DATE.log" | tail -5
  echo
  echo "Port conflicts:"
  grep "EADDRINUSE\|address already in use" "$LOG_DIR/app-$DATE.log" | tail -3
else
  echo "No application log found for today"
fi
echo

echo "🌐 Health Check:"
echo "Local health check:"
curl -s http://localhost:5000/health | head -3 2>/dev/null || echo "Health endpoint not responding"
echo

echo "=== Deployment Recommendations ==="
echo "1. Check if another process is using port 5000"
echo "2. Verify all dependencies are installed: cd $APP_DIR && npm install"
echo "3. Rebuild application: cd $APP_DIR && npm run build"
echo "4. Check database connectivity and credentials"
echo "5. Verify environment variables are set correctly"
echo "6. Check nginx configuration and reload if needed"
echo "7. Monitor logs in real-time: tail -f $LOG_DIR/app-*.log"
echo

echo "=== End of Diagnostics ==="