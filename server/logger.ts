import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);

export type LogLevel = 'INFO' | 'ERROR' | 'DEBUG' | 'WARN';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  error?: any;
}

export function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry: LogEntry = {
    timestamp,
    level,
    message,
    data: data || {}
  };
  
  // Console output with colors
  const colors = {
    INFO: '\x1b[36m',   // Cyan
    WARN: '\x1b[33m',   // Yellow
    ERROR: '\x1b[31m',  // Red
    DEBUG: '\x1b[35m',  // Magenta
  };
  const reset = '\x1b[0m';
  
  console.log(`${colors[level]}[${timestamp}] [${level}]${reset} ${message}`, data || '');
  
  // File output
  try {
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}

export const logger = {
  info: (message: string, data?: any) => log('INFO', message, data),
  error: (message: string, data?: any) => log('ERROR', message, data),
  debug: (message: string, data?: any) => log('DEBUG', message, data),
  warn: (message: string, data?: any) => log('WARN', message, data),
  
  // Special method for logging errors with stack traces
  logError: (message: string, error: any) => {
    log('ERROR', message, {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      ...error
    });
  }
};

// Log unhandled errors
process.on('uncaughtException', (error) => {
  logger.logError('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

export default logger;
