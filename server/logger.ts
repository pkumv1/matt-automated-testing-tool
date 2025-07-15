import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Create separate log files for different levels
const logFiles = {
  all: path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`),
  error: path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`),
  debug: path.join(logDir, `debug-${new Date().toISOString().split('T')[0]}.log`),
  performance: path.join(logDir, `performance-${new Date().toISOString().split('T')[0]}.log`)
};

export type LogLevel = 'INFO' | 'ERROR' | 'DEBUG' | 'WARN' | 'TRACE' | 'FATAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: any;
  context?: string;
  requestId?: string;
  duration?: number;
  stack?: string;
}

// Enhanced log function with better formatting and context
export function log(level: LogLevel, message: string, data?: any, context?: string) {
  const timestamp = new Date().toISOString();
  const logEntry: LogEntry = {
    timestamp,
    level,
    message,
    context,
    data: data || {}
  };
  
  // Extract stack trace for errors
  if (data instanceof Error) {
    logEntry.error = {
      message: data.message,
      stack: data.stack,
      code: (data as any).code,
      name: data.name
    };
  }
  
  // Console output with colors and better formatting
  const colors = {
    INFO: '\x1b[36m',   // Cyan
    WARN: '\x1b[33m',   // Yellow
    ERROR: '\x1b[31m',  // Red
    DEBUG: '\x1b[35m',  // Magenta
    TRACE: '\x1b[37m',  // White
    FATAL: '\x1b[41m',  // Red background
  };
  const reset = '\x1b[0m';
  
  // Format console output
  let consoleMessage = `${colors[level]}[${timestamp}] [${level}]${reset}`;
  if (context) {
    consoleMessage += ` [${context}]`;
  }
  consoleMessage += ` ${message}`;
  
  // Pretty print data if present
  if (data && Object.keys(data).length > 0) {
    const dataStr = util.inspect(data, { 
      colors: true, 
      depth: 4, 
      breakLength: 120,
      compact: false 
    });
    consoleMessage += '\n' + dataStr;
  }
  
  console.log(consoleMessage);
  
  // File output - write to multiple files based on level
  try {
    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Always write to the main log
    fs.appendFileSync(logFiles.all, logLine);
    
    // Write errors to separate error log
    if (['ERROR', 'FATAL'].includes(level)) {
      fs.appendFileSync(logFiles.error, logLine);
    }
    
    // Write debug and trace to debug log
    if (['DEBUG', 'TRACE'].includes(level)) {
      fs.appendFileSync(logFiles.debug, logLine);
    }
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

// Performance logging
export function logPerformance(operation: string, duration: number, metadata?: any) {
  const perfEntry = {
    timestamp: new Date().toISOString(),
    operation,
    duration,
    metadata
  };
  
  // Log to console if duration is concerning
  if (duration > 1000) {
    console.warn(`\x1b[33m[PERFORMANCE] ${operation} took ${duration}ms\x1b[0m`, metadata || '');
  }
  
  try {
    fs.appendFileSync(logFiles.performance, JSON.stringify(perfEntry) + '\n');
  } catch (err) {
    console.error('Failed to write to performance log:', err);
  }
}

export const logger = {
  info: (message: string, data?: any, context?: string) => log('INFO', message, data, context),
  error: (message: string, data?: any, context?: string) => log('ERROR', message, data, context),
  debug: (message: string, data?: any, context?: string) => log('DEBUG', message, data, context),
  warn: (message: string, data?: any, context?: string) => log('WARN', message, data, context),
  trace: (message: string, data?: any, context?: string) => log('TRACE', message, data, context),
  fatal: (message: string, data?: any, context?: string) => {
    log('FATAL', message, data, context);
    // Fatal errors should typically exit the process
    process.exit(1);
  },
  
  // Special method for logging errors with stack traces
  logError: (message: string, error: any, context?: string) => {
    log('ERROR', message, {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      ...(error.response && { response: error.response }),
      ...(error.request && { requestUrl: error.request?.url }),
      ...error
    }, context);
  },
  
  // Performance logging
  performance: logPerformance,
  
  // Start a timer for performance measurement
  startTimer: (operation: string): { end: (metadata?: any) => void } => {
    const start = Date.now();
    return {
      end: (metadata?: any) => {
        const duration = Date.now() - start;
        logPerformance(operation, duration, metadata);
      }
    };
  },
  
  // Log method entry/exit for debugging
  methodEntry: (className: string, methodName: string, args?: any) => {
    log('TRACE', `Entering ${className}.${methodName}`, args, className);
  },
  
  methodExit: (className: string, methodName: string, result?: any) => {
    log('TRACE', `Exiting ${className}.${methodName}`, result, className);
  },
  
  // Get current log files for debugging
  getLogFiles: () => logFiles
};

// Enhanced error handlers with more context
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught Exception - Application will terminate', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    processInfo: {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      versions: process.versions
    }
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { 
    reason, 
    promise: util.inspect(promise),
    stack: reason instanceof Error ? reason.stack : 'No stack trace available'
  });
});

// Log process warnings
process.on('warning', (warning) => {
  logger.warn('Process Warning', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack
  });
});

// Log when the process is about to exit
process.on('exit', (code) => {
  logger.info(`Process exiting with code ${code}`, {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

export default logger;