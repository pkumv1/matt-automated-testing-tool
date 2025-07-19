import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { ENV } from '../config';
import { EnhancedLogger } from '../../enhanced-logging-config';

// Extended Request interface to track timing and context
interface ExtendedRequest extends Request {
  startTime?: number;
  requestId?: string;
  context?: {
    userId?: string;
    projectId?: string;
    operationType?: string;
  };
}

// Generate unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Sanitize sensitive data
function sanitizeData(data: any, fields: string[] = ['password', 'token', 'apiKey', 'secret']): any {
  if (!data) return data;
  
  const sanitized = { ...data };
  fields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key], fields);
    }
  });
  
  return sanitized;
}

export function requestLogger(req: ExtendedRequest, res: Response, next: NextFunction) {
  const timer = logger.startTimer(`HTTP_${req.method}_${req.path}`);
  const startTime = Date.now();
  req.startTime = startTime;
  req.requestId = generateRequestId();
  
  // Enhanced logging for API requests
  EnhancedLogger.logAPIRequest(req.method, req.originalUrl, req.context?.userId, req.requestId);
  
  // Extract context from request
  req.context = {
    userId: (req as any).user?.id,
    projectId: req.params.id || req.body?.projectId,
    operationType: req.path.includes('/analyze') ? 'analysis' : 
                   req.path.includes('/test') ? 'testing' : 
                   req.path.includes('/generate') ? 'generation' : 'general'
  };
  
  // Detailed request logging
  logger.info(`→ ${req.method} ${req.path}`, {
    method: req.method,
    url: req.url,
    path: req.path,
    params: req.params,
    query: req.query,
    body: sanitizeData(req.body),
    headers: sanitizeData({
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length'],
      'authorization': req.headers.authorization ? '[PRESENT]' : '[ABSENT]',
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip']
    }),
    ip: req.ip || req.connection.remoteAddress,
    requestId: req.requestId,
    context: req.context,
    protocol: req.protocol,
    secure: req.secure,
    xhr: req.xhr
  }, 'HTTP_REQUEST');
  
  // Track response size
  let responseSize = 0;
  const originalWrite = res.write;
  const originalEnd = res.end;
  
  res.write = function(chunk: any, ...args: any[]): any {
    if (chunk) {
      responseSize += Buffer.byteLength(chunk);
    }
    return originalWrite.apply(res, [chunk, ...args]);
  };
  
  res.end = function(chunk: any, ...args: any[]): any {
    if (chunk) {
      responseSize += Buffer.byteLength(chunk);
    }
    return originalEnd.apply(res, [chunk, ...args]);
  };
  
  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Override send method
  res.send = function(data: any) {
    res.locals.responseBody = data;
    logResponse();
    return originalSend.call(this, data);
  };
  
  // Override json method  
  res.json = function(data: any) {
    res.locals.responseBody = data;
    logResponse();
    return originalJson.call(this, data);
  };
  
  // Enhanced response logging
  function logResponse() {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    const isServerError = res.statusCode >= 500;
    
    // End performance timer
    timer.end({
      statusCode: res.statusCode,
      responseSize,
      requestId: req.requestId
    });
    
    const logData: any = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      durationMs: duration,
      requestId: req.requestId,
      responseSize,
      context: req.context,
      headers: {
        'content-type': res.get('content-type'),
        'content-length': res.get('content-length') || responseSize
      }
    };
    
    // Add response body for errors (sanitized)
    if (isError && res.locals.responseBody) {
      logData.errorResponse = ENV.NODE_ENV === 'development' ? 
        res.locals.responseBody : 
        { message: res.locals.responseBody.message || 'Error occurred' };
    }
    
    // Add memory usage for server errors
    if (isServerError) {
      logData.serverMetrics = {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage()
      };
    }
    
    const message = `← ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
    
    // Enhanced logging for API responses
    EnhancedLogger.logAPIResponse(req.method, req.originalUrl, res.statusCode, duration, req.context?.userId, req.requestId);
    
    // Performance logging
    if (duration > 1000) {
      EnhancedLogger.logPerformanceMetric('slow_request', duration, 'ms', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode
      });
    }
    
    if (isServerError) {
      logger.error(`${message} [SERVER ERROR]`, logData, 'HTTP_RESPONSE');
    } else if (isError) {
      logger.warn(`${message} [CLIENT ERROR]`, logData, 'HTTP_RESPONSE');
    } else if (duration > 3000) {
      logger.warn(`${message} [VERY SLOW]`, logData, 'HTTP_RESPONSE');
    } else if (duration > 1000) {
      logger.info(`${message} [SLOW]`, logData, 'HTTP_RESPONSE');
    } else {
      logger.info(message, logData, 'HTTP_RESPONSE');
    }
    
    // Log to performance file if slow
    if (duration > 500) {
      logger.performance(`HTTP_REQUEST_${req.method}_${req.path}`, duration, {
        requestId: req.requestId,
        statusCode: res.statusCode,
        responseSize
      });
    }
  }
  
  // Handle response finish event for cases where send/json aren't called
  res.on('finish', () => {
    if (!res.locals.logged) {
      logResponse();
      res.locals.logged = true;
    }
  });
  
  // Handle response close event (client disconnect)
  res.on('close', () => {
    if (!res.locals.logged && !res.finished) {
      logger.warn(`Client disconnected: ${req.method} ${req.path}`, {
        requestId: req.requestId,
        duration: Date.now() - startTime
      }, 'HTTP_DISCONNECT');
    }
  });
  
  next();
}

// Enhanced error logging middleware
export function errorLogger(err: any, req: ExtendedRequest, res: Response, next: NextFunction) {
  const errorData = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    params: req.params,
    body: sanitizeData(req.body),
    headers: sanitizeData(req.headers),
    errorType: err.constructor.name,
    statusCode: err.statusCode || err.status || 500,
    code: err.code,
    syscall: err.syscall,
    errno: err.errno,
    sql: err.sql ? '[SQL QUERY REDACTED]' : undefined,
    sqlMessage: err.sqlMessage,
    context: req.context
  };
  
  logger.logError(`Error in ${req.method} ${req.path}: ${err.message}`, err, 'EXPRESS_ERROR');
  logger.debug('Error details', errorData, 'EXPRESS_ERROR_DETAILS');
  
  next(err);
}

// Database query logger
export function databaseQueryLogger(query: string, params: any[], duration: number) {
  const logData = {
    query: ENV.NODE_ENV === 'development' ? query : query.substring(0, 100) + '...',
    params: ENV.NODE_ENV === 'development' ? params : '[REDACTED]',
    duration: `${duration}ms`,
    slow: duration > 100
  };
  
  if (duration > 500) {
    logger.error('Very slow database query', logData, 'DATABASE');
  } else if (duration > 100) {
    logger.warn('Slow database query', logData, 'DATABASE');
  } else {
    logger.debug('Database query executed', logData, 'DATABASE');
  }
  
  if (duration > 50) {
    logger.performance('DATABASE_QUERY', duration, { query: query.substring(0, 50) });
  }
}

// Service call logger
export function serviceCallLogger(service: string, method: string, duration: number, success: boolean, error?: any) {
  const logData = {
    service,
    method,
    duration: `${duration}ms`,
    success,
    error: error ? {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode
    } : undefined
  };
  
  const message = `${service}.${method} completed in ${duration}ms`;
  
  if (!success) {
    logger.error(`${message} [FAILED]`, logData, 'SERVICE_CALL');
  } else if (duration > 2000) {
    logger.warn(`${message} [SLOW]`, logData, 'SERVICE_CALL');
  } else {
    logger.debug(message, logData, 'SERVICE_CALL');
  }
  
  logger.performance(`SERVICE_${service}_${method}`, duration, { success });
}