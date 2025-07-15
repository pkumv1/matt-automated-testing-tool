import { Router } from 'express';
import { db } from '../db';
import { asyncHandler } from '../middleware/error-handler';
import { timeoutManager } from '../utils/timeout-manager';
import os from 'os';

const router = Router();

// Basic health check
router.get('/health', asyncHandler(async (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown'
  };

  res.json(healthData);
}));

// Detailed health check
router.get('/health/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check database connection
  let dbStatus = 'unknown';
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await db.select({ count: 1 }).from('projects').limit(1);
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
  }

  // Check external services
  const anthropicStatus = process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured';

  // System metrics
  const systemMetrics = {
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: os.loadavg()
    },
    memory: {
      process: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      system: {
        free: Math.round(os.freemem() / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        percentage: Math.round((1 - os.freemem() / os.totalmem()) * 100)
      }
    },
    timeouts: timeoutManager.getStats()
  };

  const healthData = {
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: {
      process: process.uptime(),
      system: os.uptime()
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV || 'development'
    },
    services: {
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`
      },
      anthropic: {
        status: anthropicStatus
      }
    },
    metrics: systemMetrics,
    responseTime: `${Date.now() - startTime}ms`
  };

  const statusCode = dbStatus === 'connected' ? 200 : 503;
  res.status(statusCode).json(healthData);
}));

// Liveness probe (for k8s)
router.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe (for k8s)
router.get('/health/ready', asyncHandler(async (req, res) => {
  try {
    // Quick DB check
    await db.select({ count: 1 }).from('agents').limit(1);
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', reason: 'database_unavailable' });
  }
}));

export default router;