import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { ENV, validateEnvironment, initializeDirectories, checkServiceConnections } from "./config";
import { logger } from "./logger";
import { requestLogger, errorLogger, slowQueryLogger } from "./middleware/logging";

// Print startup banner
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     MATT - Modern Automated Testing Tool                     ║
║     Version 1.0.0                                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

// Log startup
logger.info('🚀 Starting MATT application', {
  environment: ENV.NODE_ENV,
  nodeVersion: process.version,
  pid: process.pid
});

// Validate environment and initialize
if (!validateEnvironment()) {
  logger.error('⛔ Application startup failed due to environment configuration issues');
  process.exit(1);
}

// Check service connections
checkServiceConnections();

// Initialize required directories
initializeDirectories();

const app = express();

// Session configuration
app.use(session({
  secret: ENV.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: ENV.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json({ limit: ENV.MAX_FILE_SIZE }));
app.use(express.urlencoded({ extended: false, limit: ENV.MAX_FILE_SIZE }));

// Add comprehensive logging middleware
app.use(requestLogger);
app.use(slowQueryLogger(1000)); // Log requests taking more than 1 second

// Health check endpoint with database status
app.get("/health", async (req, res) => {
  try {
    // Import db health check if available
    const { checkDatabaseHealth } = await import("./db");
    const dbHealth = typeof checkDatabaseHealth === 'function' ? await checkDatabaseHealth() : { status: 'unknown' };
    
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: dbHealth,
        ai: !!ENV.ANTHROPIC_API_KEY
      }
    });
  } catch (error) {
    res.json({ 
      status: "degraded", 
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
      error: "Database check failed"
    });
  }
});

(async () => {
  try {
    logger.info('📦 Registering routes...');
    const server = await registerRoutes(app);

    // Add error logging middleware
    app.use(errorLogger);

    // Global error handler with comprehensive logging
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      const requestId = (req as any).requestId || 'unknown';

      // Log error with full context
      logger.logError(`Request ${requestId} failed`, err);
      
      // Database-specific errors
      if (err.code && typeof err.code === 'string') {
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
      await setupVite(app, server);
      logger.info("🔧 Development mode: Vite middleware active");
    } else {
      serveStatic(app);
      logger.info("📦 Production mode: Serving static files");
    }

    // Start the server
    const port = ENV.PORT;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logger.info('✅ Server started successfully', {
        port,
        environment: ENV.NODE_ENV,
        urls: {
          local: `http://localhost:${port}`,
          network: `http://0.0.0.0:${port}`,
          health: `http://localhost:${port}/health`
        }
      });

      console.log(`
🚀 MATT is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Local:      http://localhost:${port}
🌐 Network:    http://0.0.0.0:${port}
🌐 Health:     http://localhost:${port}/health
📁 Logs:       ./logs/app-${new Date().toISOString().split('T')[0]}.log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment:  ${ENV.NODE_ENV}
Database:     ${ENV.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}
AI Service:   ${ENV.ANTHROPIC_API_KEY ? '✅ Ready' : '❌ Not configured'}

Press Ctrl+C to stop the server
      `);
    });
  } catch (error) {
    logger.logError('❌ Failed to start application', error);
    process.exit(1);
  }
})();

// Graceful shutdown with logging
process.on('SIGTERM', () => {
  logger.info('📦 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('📦 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Log process events
process.on('warning', (warning) => {
  logger.warn('Process warning', { warning });
});
