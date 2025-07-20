import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import os from "os";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { ENV, validateEnvironment, initializeDirectories, checkServiceConnections } from "./config";
import { logger } from "./logger";
import { requestLogger, errorLogger } from "./middleware/logging";
import { initializeEnhancedLogging, EnhancedLogger } from "../enhanced-logging-config";
import { logger as comprehensiveLogger, createLoggingMiddleware } from "../comprehensive-deployment-logger";
import { 
  runStartupDiagnostics, 
  logPortBinding, 
  logDatabaseConnection,
  logMiddlewareSetup,
  logStartupComplete,
  logStartupError 
} from "./startup-diagnostics";

// Print startup banner with more details
const startupTime = new Date().toISOString();
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     MATT - Modern Automated Testing Tool                     ║
║     Version 1.0.0                                           ║
║     Started at: ${startupTime}                  ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);


// Main async function to handle startup
async function startApplication() {
  try {
    // Initialize enhanced logging first
    initializeEnhancedLogging();

    // Log startup with comprehensive system info
    logger.info('🚀 Starting MATT application', {
      environment: ENV.NODE_ENV,
      nodeVersion: process.version,
      pid: process.pid,
      platform: process.platform,
      arch: process.arch,
      cpus: os.cpus().length,
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
      workingDirectory: process.cwd(),
      execPath: process.execPath,
      argv: process.argv,
      env: {
        NODE_ENV: ENV.NODE_ENV,
        PORT: ENV.PORT,
        DATABASE_CONFIGURED: !!ENV.DATABASE_URL,
        AI_SERVICE_CONFIGURED: !!ENV.ANTHROPIC_API_KEY,
        SESSION_SECRET_CONFIGURED: !!ENV.SESSION_SECRET
      }
    }, 'STARTUP');

// Validate environment and initialize
logger.debug('Validating environment configuration', {}, 'STARTUP');
if (!validateEnvironment()) {
  logger.fatal('⛔ Application startup failed due to environment configuration issues', {
    missingVars: Object.entries(ENV).filter(([key, value]) => !value && key !== 'NODE_ENV').map(([key]) => key)
  }, 'STARTUP');
}

// Check service connections with detailed logging
logger.info('Checking service connections', {}, 'STARTUP');
checkServiceConnections();

// Initialize required directories
logger.info('Initializing required directories', {}, 'STARTUP');
initializeDirectories();

// Run comprehensive startup diagnostics
await runStartupDiagnostics();

// Create Express app
const app = express();

// Log middleware setup
logger.debug('Setting up Express middleware', {}, 'STARTUP');

// Session configuration with logging
const sessionConfig = {
  secret: ENV.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: ENV.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

logger.debug('Session configuration', {
  secure: sessionConfig.cookie.secure,
  httpOnly: sessionConfig.cookie.httpOnly,
  maxAge: sessionConfig.cookie.maxAge
}, 'STARTUP');

app.use(session(sessionConfig));
logMiddlewareSetup('express-session', { secure: sessionConfig.cookie.secure });

// Body parser configuration with limits
app.use(express.json({ limit: ENV.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: false, limit: ENV.MAX_FILE_SIZE }));
logMiddlewareSetup('body-parser', { limit: ENV.MAX_FILE_SIZE });

logger.info('Middleware configured', {
  maxFileSize: ENV.MAX_FILE_SIZE,
  jsonLimit: ENV.MAX_FILE_SIZE,
  urlencodedLimit: ENV.MAX_FILE_SIZE
}, 'STARTUP');

// Add comprehensive deployment logging middleware
app.use(createLoggingMiddleware());
comprehensiveLogger.log('info', 'SYSTEM', 'Server', 'Comprehensive deployment logging enabled', {
  environment: ENV.NODE_ENV,
  port: ENV.PORT,
  timestamp: new Date().toISOString()
});

// Add comprehensive logging middleware
app.use(requestLogger);

// Health check endpoint with detailed status
app.get("/health", async (req, res) => {
  const healthTimer = logger.startTimer('HEALTH_CHECK');
  
  try {
    // Import db health check if available
    let dbHealth: any = { status: 'unknown', error: null, details: null };
    try {
      const { checkDatabaseHealth } = await import("./db");
      if (typeof checkDatabaseHealth === 'function') {
        const dbResult = await checkDatabaseHealth();
        dbHealth = { ...dbResult, error: dbResult.status === 'error' ? dbResult.details?.error || 'Database error' : null };
      }
    } catch (dbError: any) {
      logger.error('Database health check failed', { error: dbError.message }, 'HEALTH');
      dbHealth = { status: 'error', error: dbError.message, details: null };
    }
    
    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
      uptime: process.uptime(),
      uptimeHuman: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      memory: process.memoryUsage(),
      memoryHuman: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`
      },
      cpu: process.cpuUsage(),
      services: {
        database: dbHealth,
        ai: !!ENV.ANTHROPIC_API_KEY ? { status: 'configured' } : { status: 'not configured' }
      },
      version: '1.0.0',
      pid: process.pid,
      logFiles: logger.getLogFiles()
    };
    
    logger.debug('Health check completed', { 
      status: healthStatus.status,
      dbStatus: dbHealth.status 
    }, 'HEALTH');
    
    healthTimer.end({ status: healthStatus.status });
    res.json(healthStatus);
  } catch (error: any) {
    healthTimer.end({ status: 'error', error: error.message });
    logger.error('Health check failed', { error: error.message }, 'HEALTH');
    
    res.status(503).json({ 
      status: "error", 
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
      error: "Health check failed",
      message: error.message
    });
  }
});

(async () => {
  const appStartTimer = logger.startTimer('APP_INITIALIZATION');
  
  try {
    logger.info('📦 Registering routes...', {}, 'STARTUP');
    const routeTimer = logger.startTimer('ROUTE_REGISTRATION');
    
    const server = await registerRoutes(app);
    
    routeTimer.end({ success: true });
    logger.info('✅ Routes registered successfully', {}, 'STARTUP');

    // Add error logging middleware after routes
    app.use(errorLogger);

    // Global error handler with comprehensive logging
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const requestId = (req as any).requestId || 'unknown';

      // Log error with full context
      logger.logError(`Request ${requestId} failed`, err, 'EXPRESS_ERROR_HANDLER');
      
      // Log additional error details
      logger.debug('Error handler details', {
        requestId,
        url: req.url,
        method: req.method,
        headers: req.headers,
        query: req.query,
        params: req.params,
        errorName: err.name,
        errorCode: err.code,
        errorStack: ENV.NODE_ENV === 'development' ? err.stack : undefined
      }, 'EXPRESS_ERROR_HANDLER');
      
      // Database-specific errors
      if (err.code && typeof err.code === 'string') {
        logger.warn('Database error detected', {
          code: err.code,
          detail: err.detail,
          table: err.table,
          constraint: err.constraint
        }, 'DATABASE_ERROR');
        
        if (err.code.startsWith('22')) {
          return res.status(400).json({ 
            message: "Invalid data format",
            code: err.code,
            requestId
          });
        }
        if (err.code === '23505') {
          return res.status(409).json({ 
            message: "Duplicate entry",
            code: err.code,
            requestId
          });
        }
      }

      res.status(status).json({ 
        message,
        requestId,
        ...(ENV.NODE_ENV === 'development' && { 
          stack: err.stack,
          code: err.code,
          details: err 
        })
      });
    });

    // Setup Vite in development, serve static files in production
    if (app.get("env") === "development") {
      logger.info('Setting up Vite development server', {}, 'STARTUP');
      const viteTimer = logger.startTimer('VITE_SETUP');
      
      await setupVite(app, server);
      
      viteTimer.end({ success: true });
      logger.info("🔧 Development mode: Vite middleware active", {}, 'STARTUP');
    } else {
      logger.info('Setting up static file serving for production', {}, 'STARTUP');
      serveStatic(app);
      logger.info("📦 Production mode: Serving static files", {}, 'STARTUP');
    }

    // Start the server
    const port = ENV.PORT;
    const host = ENV.HOST || "0.0.0.0";
    logger.info('Starting HTTP server', { port, host }, 'STARTUP');
    logPortBinding(port, host);
    
    server.listen(port, host, () => {
      appStartTimer.end({ success: true, port });
      
      logger.info('✅ Server started successfully', {
        port,
        environment: ENV.NODE_ENV,
        urls: {
          local: `http://localhost:${port}`,
          network: `http://0.0.0.0:${port}`,
          health: `http://localhost:${port}/health`
        },
        processInfo: {
          pid: process.pid,
          memory: process.memoryUsage(),
          uptime: process.uptime()
        }
      }, 'STARTUP');

      console.log(`
🚀 MATT is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Local:      http://localhost:${port}
🌐 Network:    http://0.0.0.0:${port}
🌐 Health:     http://localhost:${port}/health
📁 Logs:       ${logger.getLogFiles().all}
📁 Error Log:  ${logger.getLogFiles().error}
📁 Debug Log:  ${logger.getLogFiles().debug}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment:  ${ENV.NODE_ENV}
Database:     ${ENV.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}
AI Service:   ${ENV.ANTHROPIC_API_KEY ? '✅ Ready' : '❌ Not configured'}
Process ID:   ${process.pid}

Press Ctrl+C to stop the server
      `);
    });
    
    // Handle server errors
    server.on('error', (error: any) => {
      logger.logError('Server error occurred', error, 'SERVER_ERROR');
      
      if (error.code === 'EADDRINUSE') {
        logger.fatal(`Port ${port} is already in use`, { port }, 'STARTUP');
      } else if (error.code === 'EACCES') {
        logger.fatal(`Permission denied to bind to port ${port}`, { port }, 'STARTUP');
      } else {
        logger.fatal('Failed to start server', { error: error.message }, 'STARTUP');
      }
    });
    
  } catch (error: any) {
    appStartTimer.end({ success: false, error: error.message });
    logger.logError('❌ Failed to start application', error, 'STARTUP');
    logger.fatal('Application startup failed', {
      error: error.message,
      stack: error.stack
    }, 'STARTUP');
  }
})();

// Graceful shutdown with detailed logging
process.on('SIGTERM', () => {
  logger.info('📦 SIGTERM received, initiating graceful shutdown...', {
    uptime: process.uptime(),
    memory: process.memoryUsage()
  }, 'SHUTDOWN');
  
  // Cleanup timeouts
  if (typeof (global as any).cleanupTimeouts === 'function') {
    (global as any).cleanupTimeouts();
  }
  
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('📦 SIGINT received, initiating graceful shutdown...', {
    uptime: process.uptime(),
    memory: process.memoryUsage()
  }, 'SHUTDOWN');
  
  // Cleanup timeouts
  if (typeof (global as any).cleanupTimeouts === 'function') {
    (global as any).cleanupTimeouts();
  }
  
  process.exit(0);
});

// Log process events
process.on('warning', (warning) => {
  logger.warn('Process warning detected', { 
    name: warning.name,
    message: warning.message,
    stack: warning.stack 
  }, 'PROCESS_WARNING');
});

// Monitor memory usage
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  
  if (heapUsedMB > 500) {
    logger.warn('High memory usage detected', {
      heapUsed: `${heapUsedMB}MB`,
      heapTotal: `${heapTotalMB}MB`,
      rss: `${rssMB}MB`,
      heapPercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    }, 'MEMORY_MONITOR');
  }
  
  // Log to performance file
  logger.performance('MEMORY_USAGE', heapUsedMB, {
    heapTotal: heapTotalMB,
    rss: rssMB,
    external: Math.round(memUsage.external / 1024 / 1024),
    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024)
  });
}, 60000); // Check every minute

  } catch (error: any) {
    logger.logError('💥 Critical application startup failure', error, 'STARTUP_FAILURE');
    
    // Log comprehensive error information for debugging
    logger.fatal('Application failed to initialize', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      port: ENV.PORT,
      environment: ENV.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      processUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }, 'STARTUP_FAILURE');
    
    // Log specific deployment troubleshooting information
    if (error.code === 'EADDRINUSE') {
      logger.fatal('🚨 PORT CONFLICT: Another process is using the port', {
        port: ENV.PORT,
        troubleshooting: [
          `Check what's using port ${ENV.PORT}: lsof -i :${ENV.PORT} or ss -tlnp | grep :${ENV.PORT}`,
          `Kill the process: sudo kill -9 <PID>`,
          `Check PM2 processes: pm2 list`,
          `Stop all PM2 processes: pm2 delete all`,
          `Try a different port: PORT=3001 npm start`
        ]
      }, 'PORT_CONFLICT');
    } else if (error.code === 'ENOTFOUND' || error.message.includes('database')) {
      logger.fatal('🚨 DATABASE CONNECTION FAILED', {
        databaseUrl: ENV.DATABASE_URL ? 'configured' : 'not configured',
        troubleshooting: [
          'Check if PostgreSQL is running: sudo systemctl status postgresql',
          'Test database connection: psql -h localhost -U postgres -d testdb',
          'Check database logs: journalctl -u postgresql -n 20',
          'Verify database credentials in .env file',
          'Ensure database exists: createdb testdb'
        ]
      }, 'DATABASE_FAILURE');
    } else if (error.code === 'ENOENT') {
      logger.fatal('🚨 FILE/DIRECTORY NOT FOUND', {
        path: error.path,
        troubleshooting: [
          'Check if dist directory exists: ls -la dist/',
          'Build the application: npm run build',
          'Check file permissions: ls -la logs/',
          'Verify working directory: pwd'
        ]
      }, 'FILE_NOT_FOUND');
    }
    
    // Output to console for immediate visibility
    console.error(`
    ╔══════════════════════════════════════════════════════════════╗
    ║                     🚨 STARTUP FAILURE 🚨                     ║
    ║                                                              ║
    ║  The MATT application failed to start. Check the logs for   ║
    ║  detailed error information and troubleshooting steps.      ║
    ║                                                              ║
    ║  Error: ${error.message}                                     ║
    ║  Code: ${error.code || 'Unknown'}                           ║
    ║  Timestamp: ${new Date().toISOString()}                     ║
    ║                                                              ║
    ║  Logs available at:                                         ║
    ║  • Error log: logs/error-${new Date().toISOString().split('T')[0]}.log       ║
    ║  • App log: logs/app-${new Date().toISOString().split('T')[0]}.log           ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
    `);
    
    throw error; // Re-throw to be caught by the outer handler
  }
}

// Start the application with enhanced error handling for deployment
startApplication().catch((error) => {
  console.error('💥 Failed to start application:', error);
  
  // Log to startup diagnostics if available
  try {
    logStartupError(error);
  } catch (logError) {
    console.error('Failed to log startup error:', logError);
  }
  
  // Generate deployment diagnostics
  console.error(`
═══════════════════════════════════════════════════════════════════
📋 DEPLOYMENT DIAGNOSTICS
═══════════════════════════════════════════════════════════════════

🚨 STARTUP FAILURE DETECTED
Error: ${error.message}
Code: ${error.code || 'Unknown'}
Time: ${new Date().toISOString()}

📋 IMMEDIATE CHECKS TO PERFORM:

1. Port Status:
   lsof -i :${ENV.PORT} || ss -tlnp | grep :${ENV.PORT}

2. Process Management:
   pm2 list
   ps aux | grep node

3. Database Connection:
   systemctl status postgresql
   psql -h localhost -U postgres -d testdb -c "SELECT version();"

4. File System:
   ls -la /opt/reactproject/matt-automated-testing-tool/
   ls -la dist/
   ls -la logs/

5. Dependencies:
   cd /opt/reactproject/matt-automated-testing-tool
   npm list --depth=0

6. Environment:
   env | grep -E "(NODE_ENV|PORT|DATABASE_URL)"

7. Build Status:
   npm run build

📁 LOG LOCATIONS:
   • Error: logs/error-${new Date().toISOString().split('T')[0]}.log
   • App: logs/app-${new Date().toISOString().split('T')[0]}.log
   • Debug: logs/debug-${new Date().toISOString().split('T')[0]}.log

🔧 COMMON SOLUTIONS:
   • Port conflict: sudo kill -9 $(lsof -t -i:${ENV.PORT})
   • PM2 cleanup: pm2 delete all && pm2 flush
   • Rebuild: rm -rf dist node_modules && npm install && npm run build
   • Permissions: sudo chown -R $USER:www-data /opt/reactproject/matt-automated-testing-tool/

═══════════════════════════════════════════════════════════════════
  `);
  
  // Exit with failure code for process managers
  process.exit(1);
});
// Export createServer function for testing
export async function createServer() {
  const app = express();
  
  app.use(session({
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: ENV.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  app.use(requestLogger);
  registerRoutes(app);
  app.use(errorLogger);

  const server = app.listen(0); // Use port 0 for testing
  return { app, server };
}
