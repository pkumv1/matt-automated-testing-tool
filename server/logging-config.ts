import { ENV } from './config';

export interface LoggingConfig {
  level: string;
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
  enablePerformanceLogging: boolean;
  enableDebugMode: boolean;
  enableHttpRequestLogging: boolean;
  enableDatabaseQueryLogging: boolean;
  enableServiceCallLogging: boolean;
  logRetentionDays: number;
  maxLogFileSize: string;
  enableErrorTracking: boolean;
  enableMetrics: boolean;
  enableStartupLogging: boolean;
  enableDeploymentLogging: boolean;
  enablePortConflictLogging: boolean;
  enableHealthCheckLogging: boolean;
  enableProcessMonitoring: boolean;
  enableNetworkLogging: boolean;
  sensitiveFieldsToRedact: string[];
  slowRequestThreshold: number;
  verySlowRequestThreshold: number;
  slowDatabaseQueryThreshold: number;
  verySlowDatabaseQueryThreshold: number;
}

export function getLoggingConfig(): LoggingConfig {
  const baseConfig: LoggingConfig = {
    level: ENV.LOG_LEVEL || 'info',
    enableFileLogging: true,
    enableConsoleLogging: true,
    enablePerformanceLogging: true,
    enableDebugMode: ENV.NODE_ENV === 'development',
    enableHttpRequestLogging: true,
    enableDatabaseQueryLogging: ENV.NODE_ENV === 'development',
    enableServiceCallLogging: true,
    logRetentionDays: 30,
    maxLogFileSize: '50MB',
    enableErrorTracking: true,
    enableMetrics: true,
    enableStartupLogging: true,
    enableDeploymentLogging: true,
    enablePortConflictLogging: true,
    enableHealthCheckLogging: true,
    enableProcessMonitoring: true,
    enableNetworkLogging: true,
    sensitiveFieldsToRedact: [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      'session',
      'apiToken',
      'accessToken',
      'refreshToken',
      'anthropicApiKey',
      'githubToken',
      'jiraApiToken',
      'sessionSecret',
      'databaseUrl'
    ],
    slowRequestThreshold: 1000,
    verySlowRequestThreshold: 3000,
    slowDatabaseQueryThreshold: 100,
    verySlowDatabaseQueryThreshold: 500
  };

  // Environment-specific overrides
  switch (ENV.NODE_ENV) {
    case 'production':
      return {
        ...baseConfig,
        level: ENV.LOG_LEVEL || 'info',
        enableDebugMode: false,
        enableDatabaseQueryLogging: false,
        enableConsoleLogging: true, // Keep console logging for deployment debugging
        logRetentionDays: 90,
        maxLogFileSize: '100MB',
        enableStartupLogging: true,
        enableDeploymentLogging: true,
        enablePortConflictLogging: true,
        enableHealthCheckLogging: true,
        enableProcessMonitoring: true,
        enableNetworkLogging: true
      };

    case 'development':
      return {
        ...baseConfig,
        level: ENV.LOG_LEVEL || 'debug',
        enableDebugMode: true,
        enableDatabaseQueryLogging: true,
        enableConsoleLogging: true,
        logRetentionDays: 7,
        maxLogFileSize: '10MB'
      };

    case 'test':
      return {
        ...baseConfig,
        level: 'warn',
        enableFileLogging: false,
        enableConsoleLogging: false,
        enablePerformanceLogging: false,
        enableHttpRequestLogging: false,
        enableDatabaseQueryLogging: false,
        enableServiceCallLogging: false
      };

    default:
      return baseConfig;
  }
}

export function createProductionLoggingRecommendations(): string[] {
  return [
    '🚀 Production Logging Recommendations:',
    '',
    '1. Log Monitoring Setup:',
    '   - Set up log rotation: logrotate /opt/reactproject/matt-automated-testing-tool/logs/*.log',
    '   - Monitor disk space: df -h /opt/reactproject/matt-automated-testing-tool/logs/',
    '   - Set up log alerts for ERROR and FATAL levels',
    '',
    '2. Performance Monitoring:',
    '   - Monitor slow requests (>1s): grep "SLOW" logs/app-*.log',
    '   - Monitor database queries (>100ms): grep "DATABASE.*ms" logs/app-*.log',
    '   - Monitor error rates: grep "ERROR" logs/error-*.log | wc -l',
    '',
    '3. Security Monitoring:',
    '   - Monitor authentication failures: grep "auth" logs/app-*.log',
    '   - Monitor unusual request patterns: grep "HTTP_REQUEST" logs/app-*.log',
    '   - Monitor file upload attempts: grep "upload" logs/app-*.log',
    '',
    '4. System Health:',
    '   - Monitor memory usage: grep "memoryUsage" logs/app-*.log',
    '   - Monitor database connections: grep "DATABASE" logs/app-*.log',
    '   - Monitor startup/shutdown: grep "STARTUP\\|SHUTDOWN" logs/app-*.log',
    '',
    '5. Automated Alerts:',
    '   - Set up email alerts for FATAL errors',
    '   - Monitor 502/503 errors in nginx logs',
    '   - Set up disk space alerts for log directory',
    '',
    '6. Log Analysis Commands:',
    '   - Real-time error monitoring: tail -f logs/error-*.log',
    '   - Request analysis: grep "HTTP_REQUEST" logs/app-*.log | tail -100',
    '   - Performance analysis: grep "SLOW" logs/app-*.log | tail -50',
    '   - Database issues: grep "DATABASE_ERROR" logs/app-*.log'
  ];
}

export function validateLoggingSetup(): { isValid: boolean; warnings: string[]; errors: string[] } {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check log directory permissions
  try {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      warnings.push('Log directory does not exist - will be created automatically');
    }
    
    // Check if we can write to logs directory
    const testFile = path.join(logDir, 'test-write.log');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      errors.push('Cannot write to logs directory - check permissions');
    }
  } catch (error) {
    warnings.push('Could not validate log directory setup');
  }

  // Check environment variables
  if (!ENV.LOG_LEVEL) {
    warnings.push('LOG_LEVEL not set - using default level');
  }

  // Check for production logging setup
  if (ENV.NODE_ENV === 'production') {
    if (ENV.LOG_LEVEL === 'debug') {
      warnings.push('Debug logging enabled in production - may impact performance');
    }
    
    if (!ENV.LOG_FILE) {
      warnings.push('LOG_FILE not specified - using default log files');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
}

export function getLogPaths(): { [key: string]: string } {
  const logDir = process.env.LOG_DIR || './logs';
  const date = new Date().toISOString().split('T')[0];
  
  return {
    app: `${logDir}/app-${date}.log`,
    error: `${logDir}/error-${date}.log`,
    debug: `${logDir}/debug-${date}.log`,
    performance: `${logDir}/performance-${date}.log`,
    access: `${logDir}/access-${date}.log`,
    database: `${logDir}/database-${date}.log`,
    security: `${logDir}/security-${date}.log`
  };
}

export function createLogMonitoringScript(): string {
  return `#!/bin/bash
# MATT Log Monitoring Script
# Save this as: /opt/reactproject/matt-automated-testing-tool/monitor-logs.sh

LOG_DIR="/opt/reactproject/matt-automated-testing-tool/logs"
DATE=$(date +%Y-%m-%d)

echo "=== MATT Log Monitoring Report - $DATE ==="
echo

echo "📊 Log File Sizes:"
ls -lh $LOG_DIR/*.log 2>/dev/null || echo "No log files found"
echo

echo "🔴 Recent Errors (last 10):"
tail -10 $LOG_DIR/error-*.log 2>/dev/null || echo "No error logs found"
echo

echo "⚠️  Recent Warnings (last 5):"
grep "WARN" $LOG_DIR/app-*.log 2>/dev/null | tail -5 || echo "No warnings found"
echo

echo "🐌 Slow Requests (>1s in last hour):"
grep "SLOW" $LOG_DIR/app-*.log 2>/dev/null | grep "$(date '+%Y-%m-%d %H')" || echo "No slow requests found"
echo

echo "🗄️  Database Issues (last 5):"
grep "DATABASE_ERROR" $LOG_DIR/app-*.log 2>/dev/null | tail -5 || echo "No database errors found"
echo

echo "💾 Disk Space:"
df -h $LOG_DIR
echo

echo "🔧 System Resources:"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
echo

echo "📈 Request Stats (last hour):"
grep "HTTP_RESPONSE" $LOG_DIR/app-*.log 2>/dev/null | grep "$(date '+%Y-%m-%d %H')" | wc -l | xargs echo "Total requests:"
grep "HTTP_RESPONSE.*\\[ERROR\\]" $LOG_DIR/app-*.log 2>/dev/null | grep "$(date '+%Y-%m-%d %H')" | wc -l | xargs echo "Error responses:"
echo

echo "=== End of Report ==="
`;
}

export function createDeploymentDiagnosticsScript(): string {
  return `#!/bin/bash
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
  grep '"name"\\|"version"\\|"scripts"' "$APP_DIR/package.json" || echo "Could not read package.json"
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
  PGPASSWORD=\${DB_PASSWORD:-'defaultpassword'} psql -h localhost -U postgres -d testdb -c "SELECT version();" 2>&1 | head -3
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
  grep "STARTUP\\|Starting\\|listen" "$LOG_DIR/app-$DATE.log" | tail -5
  echo
  echo "Port conflicts:"
  grep "EADDRINUSE\\|address already in use" "$LOG_DIR/app-$DATE.log" | tail -3
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
`;
}

export function createStartupFailureDetection(): string[] {
  return [
    '🚨 Startup Failure Detection Guide:',
    '',
    '1. Port Conflicts (EADDRINUSE):',
    '   - Find process: lsof -i :5000 or ss -tlnp | grep :5000',
    '   - Kill process: sudo kill -9 <PID>',
    '   - Check PM2: pm2 list, pm2 delete all',
    '',
    '2. Missing Dependencies:',
    '   - Check: ls -la node_modules/ | wc -l',
    '   - Fix: rm -rf node_modules package-lock.json && npm install',
    '   - Verify: npm list --depth=0',
    '',
    '3. Database Connection Issues:',
    '   - Test connection: psql -h localhost -U postgres -d testdb',
    '   - Check service: sudo systemctl status postgresql',
    '   - Check logs: journalctl -u postgresql -n 20',
    '',
    '4. Build Issues:',
    '   - Clean build: rm -rf dist && npm run build',
    '   - Check TypeScript: npx tsc --noEmit',
    '   - Verify output: ls -la dist/',
    '',
    '5. Permission Issues:',
    '   - Check ownership: ls -la /opt/reactproject/matt-automated-testing-tool/',
    '   - Fix permissions: sudo chown -R \$USER:www-data /opt/reactproject/matt-automated-testing-tool/',
    '   - Log permissions: sudo chmod 755 logs/ && sudo chmod 644 logs/*.log',
    '',
    '6. Environment Variables:',
    '   - Check .env file: cat .env | grep -v "PASSWORD\\|SECRET"',
    '   - Verify NODE_ENV: echo \$NODE_ENV',
    '   - Check paths: echo \$PATH',
    '',
    '7. Memory/Resource Issues:',
    '   - Check memory: free -h',
    '   - Check disk space: df -h',
    '   - Check inodes: df -i',
    '',
    '8. Nginx Configuration:',
    '   - Test config: sudo nginx -t',
    '   - Check upstream: curl -I http://localhost:5000',
    '   - Restart nginx: sudo systemctl restart nginx'
  ];
}

export function createProductionHealthMonitoring(): string {
  return `#!/bin/bash
# MATT Production Health Monitoring
# Save this as: /opt/reactproject/matt-automated-testing-tool/health-monitor.sh
# Add to crontab: */5 * * * * /opt/reactproject/matt-automated-testing-tool/health-monitor.sh

APP_DIR="/opt/reactproject/matt-automated-testing-tool"
LOG_DIR="$APP_DIR/logs"
HEALTH_LOG="$LOG_DIR/health-monitor.log"
ALERT_EMAIL="admin@mars-techs.ai"  # Change this to your admin email

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log_alert() {
  echo "[\$(timestamp)] ALERT: \$1" >> "\$HEALTH_LOG"
  # Uncomment to send email alerts:
  # echo "\$1" | mail -s "MATT Health Alert" "\$ALERT_EMAIL"
}

log_info() {
  echo "[\$(timestamp)] INFO: \$1" >> "\$HEALTH_LOG"
}

# Check if application is responding
if ! curl -s -f http://localhost:5000/health > /dev/null; then
  log_alert "Application health check failed - service may be down"
  
  # Try to restart if PM2 is being used
  if command -v pm2 > /dev/null; then
    log_info "Attempting to restart application via PM2"
    pm2 restart matt-app 2>> "\$HEALTH_LOG"
  fi
else
  log_info "Application health check passed"
fi

# Check disk space (alert if >90% full)
DISK_USAGE=\$(df "$APP_DIR" | awk 'NR==2 {print \$5}' | sed 's/%//')
if [ "\$DISK_USAGE" -gt 90 ]; then
  log_alert "Disk space critical: \${DISK_USAGE}% used"
fi

# Check memory usage (alert if >90% used)
MEMORY_USAGE=\$(free | awk 'NR==2{printf "%.0f", \$3*100/\$2}')
if [ "\$MEMORY_USAGE" -gt 90 ]; then
  log_alert "Memory usage critical: \${MEMORY_USAGE}% used"
fi

# Check for recent errors
ERROR_COUNT=\$(grep "\$(date '+%Y-%m-%d %H')" "$LOG_DIR/error-*.log" 2>/dev/null | wc -l)
if [ "\$ERROR_COUNT" -gt 10 ]; then
  log_alert "High error rate detected: \$ERROR_COUNT errors in the last hour"
fi

# Check log rotation (alert if log files >100MB)
for logfile in "$LOG_DIR"/*.log; do
  if [ -f "\$logfile" ]; then
    SIZE=\$(stat -f%z "\$logfile" 2>/dev/null || stat -c%s "\$logfile" 2>/dev/null || echo 0)
    if [ "\$SIZE" -gt 104857600 ]; then  # 100MB
      log_alert "Log file \$logfile is large (\$((\$SIZE/1024/1024))MB) - consider rotation"
    fi
  fi
done

# Cleanup old health monitor logs (keep last 7 days)
find "$LOG_DIR" -name "health-monitor.log.*" -mtime +7 -delete 2>/dev/null
`;
}