/**
 * Comprehensive Deployment Logger
 * Advanced logging system with categorization, real-time monitoring, and error tracking
 */

import fs from 'fs';
import path from 'path';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category: 'API' | 'DATABASE' | 'SECURITY' | 'PERFORMANCE' | 'WORKFLOW' | 'UI' | 'TEST' | 'DEPLOYMENT' | 'SYSTEM';
  component: string;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  errorStack?: string;
}

export interface LogConfiguration {
  enabled: boolean;
  level: LogEntry['level'];
  categories: LogEntry['category'][];
  outputs: ('console' | 'file' | 'database')[];
  fileRotation: {
    enabled: boolean;
    maxSize: number; // in MB
    maxFiles: number;
    rotateDaily: boolean;
  };
  realTimeMonitoring: {
    enabled: boolean;
    alertThresholds: {
      errorRate: number; // errors per minute
      slowRequests: number; // requests taking longer than N ms
      memoryUsage: number; // percentage
    };
  };
  performance: {
    trackSlowQueries: boolean;
    slowQueryThreshold: number; // in ms
    trackApiResponseTimes: boolean;
    trackMemoryUsage: boolean;
  };
}

class ComprehensiveLogger {
  private config: LogConfiguration;
  private logBuffer: LogEntry[] = [];
  private metricsBuffer: {
    apiCalls: number;
    errors: number;
    slowQueries: number;
    memoryAlerts: number;
    lastReset: Date;
  } = {
    apiCalls: 0,
    errors: 0,
    slowQueries: 0,
    memoryAlerts: 0,
    lastReset: new Date()
  };

  constructor(config: Partial<LogConfiguration> = {}) {
    this.config = {
      enabled: true,
      level: 'info',
      categories: ['API', 'DATABASE', 'SECURITY', 'PERFORMANCE', 'WORKFLOW', 'UI', 'TEST', 'DEPLOYMENT', 'SYSTEM'],
      outputs: ['console', 'file'],
      fileRotation: {
        enabled: true,
        maxSize: 10, // 10MB
        maxFiles: 5,
        rotateDaily: true
      },
      realTimeMonitoring: {
        enabled: true,
        alertThresholds: {
          errorRate: 10, // 10 errors per minute
          slowRequests: 5, // 5 slow requests per minute
          memoryUsage: 85 // 85% memory usage
        }
      },
      performance: {
        trackSlowQueries: true,
        slowQueryThreshold: 1000, // 1 second
        trackApiResponseTimes: true,
        trackMemoryUsage: true
      },
      ...config
    };

    this.initializeLogging();
    this.startRealTimeMonitoring();
  }

  private initializeLogging() {
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Log system initialization
    this.log('info', 'SYSTEM', 'Logger', 'Comprehensive logging system initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    });

    // Setup periodic log flushing
    setInterval(() => {
      this.flushLogs();
    }, 5000); // Flush every 5 seconds

    // Setup memory monitoring
    if (this.config.performance.trackMemoryUsage) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // Check every 30 seconds
    }
  }

  private startRealTimeMonitoring() {
    if (!this.config.realTimeMonitoring.enabled) return;

    // Reset metrics every minute
    setInterval(() => {
      this.resetMetrics();
    }, 60000);

    // Check thresholds every 10 seconds
    setInterval(() => {
      this.checkAlertThresholds();
    }, 10000);
  }

  public log(
    level: LogEntry['level'],
    category: LogEntry['category'],
    component: string,
    message: string,
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ) {
    if (!this.config.enabled) return;
    if (!this.shouldLog(level, category)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      component,
      message,
      context,
      requestId,
      userId
    };

    // Add to buffer
    this.logBuffer.push(entry);

    // Update metrics
    this.updateMetrics(entry);

    // Console output if enabled
    if (this.config.outputs.includes('console')) {
      this.outputToConsole(entry);
    }

    // Immediate file write for critical errors
    if (level === 'critical' || level === 'error') {
      this.flushLogs();
    }
  }

  // Specialized logging methods
  public apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId: string,
    userId?: string,
    context?: Record<string, any>
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;

    this.log(level, 'API', 'HTTP', message, {
      method,
      url,
      statusCode,
      duration,
      ...context
    }, requestId, userId);

    // Track slow requests
    if (this.config.performance.trackApiResponseTimes && duration > 1000) {
      this.metricsBuffer.slowQueries++;
      this.log('warn', 'PERFORMANCE', 'HTTP', `Slow request detected: ${method} ${url}`, {
        duration,
        threshold: 1000
      }, requestId);
    }
  }

  public databaseQuery(
    query: string,
    duration: number,
    rowCount?: number,
    error?: Error,
    requestId?: string
  ) {
    const level = error ? 'error' : duration > this.config.performance.slowQueryThreshold ? 'warn' : 'debug';
    const message = error ? `Database query failed: ${error.message}` : `Database query executed (${duration}ms)`;

    this.log(level, 'DATABASE', 'Query', message, {
      query: query.substring(0, 100), // Truncate long queries
      duration,
      rowCount,
      error: error?.message,
      stack: error?.stack
    }, requestId);

    if (this.config.performance.trackSlowQueries && duration > this.config.performance.slowQueryThreshold) {
      this.metricsBuffer.slowQueries++;
    }
  }

  public securityEvent(
    eventType: 'auth_failure' | 'suspicious_activity' | 'access_denied' | 'data_breach' | 'injection_attempt',
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    userId?: string,
    requestId?: string
  ) {
    const level = severity === 'critical' ? 'critical' : severity === 'high' ? 'error' : 'warn';
    
    this.log(level, 'SECURITY', 'Security', `Security event: ${eventType}`, {
      eventType,
      severity,
      ...details
    }, requestId, userId);
  }

  public workflowStep(
    projectId: number,
    step: string,
    status: 'started' | 'completed' | 'failed',
    duration?: number,
    context?: Record<string, any>
  ) {
    const level = status === 'failed' ? 'error' : 'info';
    const message = `Workflow ${step} ${status} for project ${projectId}`;

    this.log(level, 'WORKFLOW', 'Workflow', message, {
      projectId,
      step,
      status,
      duration,
      ...context
    });
  }

  public testExecution(
    projectId: number,
    testSuite: string,
    testCount: number,
    passed: number,
    failed: number,
    duration: number,
    context?: Record<string, any>
  ) {
    const level = failed > 0 ? 'warn' : 'info';
    const message = `Test execution completed: ${passed}/${testCount} passed (${duration}ms)`;

    this.log(level, 'TEST', 'TestRunner', message, {
      projectId,
      testSuite,
      testCount,
      passed,
      failed,
      successRate: Math.round((passed / testCount) * 100),
      duration,
      ...context
    });
  }

  public performanceMetric(
    metric: string,
    value: number,
    unit: string,
    threshold?: number,
    context?: Record<string, any>
  ) {
    const level = threshold && value > threshold ? 'warn' : 'info';
    const message = `Performance metric: ${metric} = ${value}${unit}`;

    this.log(level, 'PERFORMANCE', 'Metrics', message, {
      metric,
      value,
      unit,
      threshold,
      exceeded: threshold ? value > threshold : false,
      ...context
    });
  }

  public deploymentEvent(
    event: 'start' | 'success' | 'failure' | 'rollback',
    version: string,
    environment: string,
    duration?: number,
    context?: Record<string, any>
  ) {
    const level = event === 'failure' ? 'error' : event === 'rollback' ? 'warn' : 'info';
    const message = `Deployment ${event}: ${version} to ${environment}`;

    this.log(level, 'DEPLOYMENT', 'Deploy', message, {
      event,
      version,
      environment,
      duration,
      ...context
    });
  }

  private shouldLog(level: LogEntry['level'], category: LogEntry['category']): boolean {
    const levelPriority = { debug: 0, info: 1, warn: 2, error: 3, critical: 4 };
    const configPriority = levelPriority[this.config.level];
    const logPriority = levelPriority[level];

    return logPriority >= configPriority && this.config.categories.includes(category);
  }

  private updateMetrics(entry: LogEntry) {
    if (entry.category === 'API') {
      this.metricsBuffer.apiCalls++;
    }
    if (entry.level === 'error' || entry.level === 'critical') {
      this.metricsBuffer.errors++;
    }
  }

  private checkMemoryUsage() {
    const used = process.memoryUsage();
    const totalMB = Math.round(used.heapUsed / 1024 / 1024);
    const percentage = (used.heapUsed / used.heapTotal) * 100;

    if (percentage > this.config.realTimeMonitoring.alertThresholds.memoryUsage) {
      this.metricsBuffer.memoryAlerts++;
      this.log('warn', 'SYSTEM', 'Memory', `High memory usage detected: ${totalMB}MB (${percentage.toFixed(1)}%)`, {
        heapUsed: used.heapUsed,
        heapTotal: used.heapTotal,
        percentage: percentage.toFixed(1)
      });
    }

    this.performanceMetric('memory_usage_mb', totalMB, 'MB', undefined, {
      heapUsed: used.heapUsed,
      heapTotal: used.heapTotal,
      percentage: percentage.toFixed(1)
    });
  }

  private checkAlertThresholds() {
    const { alertThresholds } = this.config.realTimeMonitoring;
    const minutesSinceReset = (Date.now() - this.metricsBuffer.lastReset.getTime()) / 60000;

    // Check error rate
    const errorRate = this.metricsBuffer.errors / Math.max(minutesSinceReset, 1);
    if (errorRate > alertThresholds.errorRate) {
      this.log('critical', 'SYSTEM', 'Monitoring', `High error rate detected: ${errorRate.toFixed(1)} errors/minute`, {
        errorRate,
        threshold: alertThresholds.errorRate,
        errors: this.metricsBuffer.errors,
        duration: minutesSinceReset
      });
    }

    // Check slow request rate
    const slowRequestRate = this.metricsBuffer.slowQueries / Math.max(minutesSinceReset, 1);
    if (slowRequestRate > alertThresholds.slowRequests) {
      this.log('warn', 'PERFORMANCE', 'Monitoring', `High slow request rate: ${slowRequestRate.toFixed(1)} slow requests/minute`, {
        slowRequestRate,
        threshold: alertThresholds.slowRequests,
        slowQueries: this.metricsBuffer.slowQueries,
        duration: minutesSinceReset
      });
    }
  }

  private resetMetrics() {
    this.metricsBuffer = {
      apiCalls: 0,
      errors: 0,
      slowQueries: 0,
      memoryAlerts: 0,
      lastReset: new Date()
    };
  }

  private outputToConsole(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.toUpperCase().padEnd(8);
    const category = entry.category.padEnd(12);
    const component = entry.component.padEnd(15);
    
    const colorize = (text: string, color: string) => {
      const colors = {
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        green: '\x1b[32m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        reset: '\x1b[0m'
      };
      return `${colors[color as keyof typeof colors] || ''}${text}${colors.reset}`;
    };

    let logColor = 'reset';
    switch (entry.level) {
      case 'error':
      case 'critical':
        logColor = 'red';
        break;
      case 'warn':
        logColor = 'yellow';
        break;
      case 'info':
        logColor = 'green';
        break;
      case 'debug':
        logColor = 'blue';
        break;
    }

    const logLine = `${colorize(timestamp, 'cyan')} ${colorize(level, logColor)} ${colorize(category, 'magenta')} ${component} ${entry.message}`;
    console.log(logLine);

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log(colorize('  Context:', 'cyan'), JSON.stringify(entry.context, null, 2));
    }
  }

  private flushLogs() {
    if (this.logBuffer.length === 0) return;
    if (!this.config.outputs.includes('file')) return;

    const logsDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);

    const logLines = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';

    try {
      fs.appendFileSync(logFile, logLines);
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to write logs to file:', error);
    }

    // Check file rotation
    if (this.config.fileRotation.enabled) {
      this.checkFileRotation(logFile);
    }
  }

  private checkFileRotation(logFile: string) {
    try {
      const stats = fs.statSync(logFile);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > this.config.fileRotation.maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(logFile, rotatedFile);

        // Clean up old log files
        this.cleanupOldLogFiles();
      }
    } catch (error) {
      console.error('Error checking file rotation:', error);
    }
  }

  private cleanupOldLogFiles() {
    const logsDir = path.join(process.cwd(), 'logs');
    try {
      const files = fs.readdirSync(logsDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(logsDir, file),
          stats: fs.statSync(path.join(logsDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      // Keep only the latest files
      const filesToDelete = files.slice(this.config.fileRotation.maxFiles);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
      });
    } catch (error) {
      console.error('Error cleaning up old log files:', error);
    }
  }

  public getLogStats() {
    return {
      ...this.metricsBuffer,
      bufferSize: this.logBuffer.length,
      config: this.config,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  public exportLogs(startDate?: Date, endDate?: Date, categories?: LogEntry['category'][]) {
    // Implementation for exporting logs with filters
    // This would read from log files and return filtered results
    return {
      message: 'Log export functionality - implementation depends on storage backend'
    };
  }
}

// Global logger instance
export const logger = new ComprehensiveLogger();

// Export middleware for Express.js
export function createLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    req.requestId = requestId;
    req.startTime = startTime;

    // Log request
    logger.log('info', 'API', 'HTTP', `${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }, requestId);

    // Intercept response
    const originalSend = res.send;
    res.send = function(data: any) {
      const duration = Date.now() - startTime;
      logger.apiRequest(req.method, req.url, res.statusCode, duration, requestId, req.user?.id);
      return originalSend.call(this, data);
    };

    next();
  };
}

export default logger;