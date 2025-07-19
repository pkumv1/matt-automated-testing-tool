import { logger } from "./server/logger";

/**
 * Enhanced Logging Configuration for MATT Application
 * Enables detailed logging for debugging and troubleshooting
 */

export interface DetailedLoggingConfig {
  enabled: boolean;
  level: 'debug' | 'info' | 'warn' | 'error';
  categories: {
    api: boolean;
    database: boolean;
    performance: boolean;
    security: boolean;
    workflow: boolean;
    ui: boolean;
    tests: boolean;
  };
  outputFormats: ('console' | 'file' | 'json')[];
  retentionDays: number;
}

export const detailedLoggingConfig: DetailedLoggingConfig = {
  enabled: true,
  level: 'debug',
  categories: {
    api: true,
    database: true,
    performance: true,
    security: true,
    workflow: true,
    ui: true,
    tests: true
  },
  outputFormats: ['console', 'file', 'json'],
  retentionDays: 7
};

/**
 * Enhanced logging functions for different categories
 */
export class EnhancedLogger {
  
  static logAPIRequest(method: string, url: string, userId?: string, requestId?: string) {
    if (!detailedLoggingConfig.categories.api) return;
    
    logger.info('API Request', {
      method,
      url,
      userId,
      requestId,
      timestamp: new Date().toISOString(),
      category: 'API'
    }, 'API_REQUEST');
  }
  
  static logAPIResponse(method: string, url: string, statusCode: number, responseTime: number, userId?: string, requestId?: string) {
    if (!detailedLoggingConfig.categories.api) return;
    
    const logLevel = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    logger[logLevel]('API Response', {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      requestId,
      timestamp: new Date().toISOString(),
      category: 'API'
    }, 'API_RESPONSE');
  }
  
  static logDatabaseOperation(operation: string, table: string, duration: number, recordCount?: number, error?: any) {
    if (!detailedLoggingConfig.categories.database) return;
    
    const logLevel = error ? 'error' : duration > 1000 ? 'warn' : 'debug';
    logger[logLevel]('Database Operation', {
      operation,
      table,
      duration,
      recordCount,
      error: error?.message,
      timestamp: new Date().toISOString(),
      category: 'DATABASE'
    }, 'DB_OPERATION');
  }
  
  static logPerformanceMetric(metric: string, value: number, unit: string, context?: any) {
    if (!detailedLoggingConfig.categories.performance) return;
    
    const logLevel = metric.includes('slow') || value > 5000 ? 'warn' : 'debug';
    logger[logLevel]('Performance Metric', {
      metric,
      value,
      unit,
      context,
      timestamp: new Date().toISOString(),
      category: 'PERFORMANCE'
    }, 'PERFORMANCE');
  }
  
  static logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) {
    if (!detailedLoggingConfig.categories.security) return;
    
    const logLevel = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
    logger[logLevel]('Security Event', {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
      category: 'SECURITY'
    }, 'SECURITY');
  }
  
  static logWorkflowStep(projectId: number, step: string, status: 'started' | 'completed' | 'failed', duration?: number, details?: any) {
    if (!detailedLoggingConfig.categories.workflow) return;
    
    const logLevel = status === 'failed' ? 'error' : 'info';
    logger[logLevel]('Workflow Step', {
      projectId,
      step,
      status,
      duration,
      details,
      timestamp: new Date().toISOString(),
      category: 'WORKFLOW'
    }, 'WORKFLOW');
  }
  
  static logUIEvent(component: string, action: string, userId?: string, data?: any) {
    if (!detailedLoggingConfig.categories.ui) return;
    
    logger.debug('UI Event', {
      component,
      action,
      userId,
      data,
      timestamp: new Date().toISOString(),
      category: 'UI'
    }, 'UI_EVENT');
  }
  
  static logTestExecution(testId: string, testName: string, status: 'started' | 'passed' | 'failed', duration?: number, error?: any) {
    if (!detailedLoggingConfig.categories.tests) return;
    
    const logLevel = status === 'failed' ? 'error' : 'info';
    logger[logLevel]('Test Execution', {
      testId,
      testName,
      status,
      duration,
      error: error?.message,
      timestamp: new Date().toISOString(),
      category: 'TESTS'
    }, 'TEST_EXECUTION');
  }
  
  /**
   * Log system startup with comprehensive environment information
   */
  static logSystemStartup() {
    logger.info('System Startup', {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      memory: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        DATABASE_CONFIGURED: !!process.env.DATABASE_URL,
        AI_SERVICE_CONFIGURED: !!process.env.ANTHROPIC_API_KEY
      },
      loggingConfig: detailedLoggingConfig,
      timestamp: new Date().toISOString(),
      category: 'SYSTEM'
    }, 'SYSTEM_STARTUP');
  }
  
  /**
   * Log error with full context and stack trace
   */
  static logError(error: Error, context?: any, category: string = 'ERROR') {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString(),
      category: category.toUpperCase()
    }, category.toUpperCase());
  }
  
  /**
   * Log memory usage and performance warnings
   */
  static logMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memInfo = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      rss: Math.round(memUsage.rss / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
    };
    
    const logLevel = memInfo.heapUsed > 500 ? 'warn' : 'debug';
    logger[logLevel]('Memory Usage', {
      ...memInfo,
      timestamp: new Date().toISOString(),
      category: 'PERFORMANCE'
    }, 'MEMORY_USAGE');
  }
}

/**
 * Initialize enhanced logging on application startup
 */
export function initializeEnhancedLogging() {
  console.log('🔍 Enhanced Logging Enabled');
  console.log(`📊 Log Level: ${detailedLoggingConfig.level.toUpperCase()}`);
  console.log(`📁 Categories: ${Object.entries(detailedLoggingConfig.categories)
    .filter(([, enabled]) => enabled)
    .map(([category]) => category.toUpperCase())
    .join(', ')}`);
  console.log(`💾 Output Formats: ${detailedLoggingConfig.outputFormats.join(', ')}`);
  console.log(`🗂️ Retention: ${detailedLoggingConfig.retentionDays} days`);
  
  EnhancedLogger.logSystemStartup();
  
  // Set up periodic memory monitoring
  setInterval(() => {
    EnhancedLogger.logMemoryUsage();
  }, 60000); // Every minute
  
  // Set up global error handlers
  process.on('uncaughtException', (error) => {
    EnhancedLogger.logError(error, { type: 'uncaughtException' }, 'CRITICAL');
    console.error('Uncaught Exception:', error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    EnhancedLogger.logError(
      new Error(`Unhandled Rejection: ${reason}`), 
      { promise }, 
      'CRITICAL'
    );
    console.error('Unhandled Rejection:', reason);
  });
  
  logger.info('Enhanced logging initialized successfully', {
    config: detailedLoggingConfig,
    timestamp: new Date().toISOString()
  }, 'ENHANCED_LOGGING');
}

export default EnhancedLogger;