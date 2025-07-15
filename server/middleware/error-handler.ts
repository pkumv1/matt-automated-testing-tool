import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { ZodError } from 'zod';

// Extended error interface
interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Error response helper
export function sendErrorResponse(res: Response, error: any, defaultMessage: string = 'Internal server error') {
  logger.error(`API Error: ${error.message || defaultMessage}`, {
    error: error.stack || error,
    statusCode: error.statusCode || 500
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid request data',
      details: error.errors
    });
  }

  // Handle known app errors
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      error: error.code || 'error',
      message: error.message || defaultMessage,
      details: error.details
    });
  }

  // Handle generic errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: 'internal_server_error',
    message: isDevelopment ? error.message : defaultMessage,
    stack: isDevelopment ? error.stack : undefined
  });
}

// Async route handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      sendErrorResponse(res, error, 'Request failed');
    });
  };
}

// Global error handler middleware
export function globalErrorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  // Log error
  logger.error(`Unhandled error in ${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
    url: req.url,
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // Don't send response if already sent
  if (res.headersSent) {
    return next(err);
  }

  sendErrorResponse(res, err);
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.path} not found`
  });
}

// Request timeout middleware
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'request_timeout',
          message: 'Request timeout'
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

// Validation error factory
export function validationError(message: string, details?: any): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = 400;
  error.code = 'validation_error';
  error.details = details;
  return error;
}

// Not found error factory
export function notFoundError(resource: string): AppError {
  const error = new Error(`${resource} not found`) as AppError;
  error.statusCode = 404;
  error.code = 'not_found';
  return error;
}

// Conflict error factory
export function conflictError(message: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = 409;
  error.code = 'conflict';
  return error;
}

// Unauthorized error factory
export function unauthorizedError(message: string = 'Unauthorized'): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = 401;
  error.code = 'unauthorized';
  return error;
}

// Forbidden error factory
export function forbiddenError(message: string = 'Forbidden'): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = 403;
  error.code = 'forbidden';
  return error;
}