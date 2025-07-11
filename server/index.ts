import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ENV, validateEnvironment, initializeDirectories, checkServiceConnections } from "./config";

// Print startup banner
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     MATT - Modern Automated Testing Tool                     ║
║     Version 1.0.0                                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

// Validate environment and initialize
if (!validateEnvironment()) {
  console.error('\n⛔ Application startup failed due to environment configuration issues.');
  console.error('Please fix the issues above and restart the application.\n');
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

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
    services: {
      database: !!ENV.DATABASE_URL,
      ai: !!ENV.ANTHROPIC_API_KEY
    }
  });
});

(async () => {
  try {
    const server = await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`❌ Error: ${message}`, err.stack);
      
      res.status(status).json({ 
        message,
        ...(ENV.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Setup Vite in development, serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Development mode: Vite middleware active");
    } else {
      serveStatic(app);
      log("Production mode: Serving static files");
    }

    // Start the server
    const port = ENV.PORT;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      console.log(`
🚀 MATT is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Local:      http://localhost:${port}
🌐 Network:    http://0.0.0.0:${port}
🌐 Health:     http://localhost:${port}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Environment:  ${ENV.NODE_ENV}
Database:     ${ENV.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}
AI Service:   ${ENV.ANTHROPIC_API_KEY ? '✅ Ready' : '❌ Not configured'}

Press Ctrl+C to stop the server
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n📦 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📦 SIGINT received, shutting down gracefully...');
  process.exit(0);
});