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
        enableConsoleLogging: false, // In production, rely on file logs
        logRetentionDays: 90,
        maxLogFileSize: '100MB'
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
}`;