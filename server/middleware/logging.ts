import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

// Extended Request interface to track timing
interface TimedRequest extends Request {
  startTime?: number;
  requestId?: string;
}

// Generate unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function requestLogger(req: TimedRequest, res: Response, next: NextFunction) {
  const startTime = Date.now();
  req.startTime = startTime;
  req.requestId = generateRequestId();
  
  // Log request details
  logger.info(`→ ${req.method} ${req.path}`, {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'content-length': req.headers['content-length']
    },
    ip: req.ip,
    requestId: req.requestId
  });
  
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
  
  // Log response details
  function logResponse() {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
      responseSize: res.get('content-length') || 0
    };
    
    // Add response body for errors
    if (isError && res.locals.responseBody) {
      logData['errorResponse'] = res.locals.responseBody;
    }
    
    const message = `← ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
    
    if (isError) {
      logger.error(message, logData);
    } else if (duration > 1000) {
      logger.warn(`${message} (SLOW)`, logData);
    } else {
      logger.info(message, logData);
    }
  }
  
  next();
}

// Error logging middleware
export function errorLogger(err: any, req: Request, res: Response, next: NextFunction) {
  logger.logError(`Error in ${req.method} ${req.path}`, err);
  next(err);
}

// Log slow queries
export function slowQueryLogger(threshold: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > threshold) {
        logger.warn(`Slow request detected: ${req.method} ${req.path}`, {
          duration: `${duration}ms`,
          threshold: `${threshold}ms`
        });
      }
    });
    next();
  };
}
