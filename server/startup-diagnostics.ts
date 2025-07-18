import os from 'os';
import fs from 'fs';
import path from 'path';
import { ENV } from './config';
import { logger } from './logger';

export interface DiagnosticInfo {
  timestamp: string;
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    cpus: number;
    totalMemory: string;
    freeMemory: string;
    uptime: string;
    loadAverage: number[];
  };
  process: {
    pid: number;
    ppid: number;
    execPath: string;
    cwd: string;
    argv: string[];
    env: Record<string, any>;
    memoryUsage: NodeJS.MemoryUsage;
    versions: NodeJS.ProcessVersions;
  };
  application: {
    name: string;
    version: string;
    environment: string;
    port: number;
    host: string;
  };
  dependencies: {
    installed: boolean;
    nodeModulesSize?: string;
    packageCount?: number;
  };
  directories: {
    dist: boolean;
    logs: boolean;
    uploads: boolean;
    config: boolean;
  };
  configuration: {
    database: boolean;
    ai: boolean;
    session: boolean;
    integrations: {
      github: boolean;
      googleDrive: boolean;
      jira: boolean;
    };
  };
  network: {
    hostname: string;
    interfaces: Record<string, any>;
  };
}

export async function runStartupDiagnostics(): Promise<DiagnosticInfo> {
  logger.info('🔍 Running comprehensive startup diagnostics...', {}, 'DIAGNOSTICS');
  
  const diagnostics: DiagnosticInfo = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`,
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)}GB`,
      uptime: `${Math.round(os.uptime() / 60)} minutes`,
      loadAverage: os.loadavg()
    },
    process: {
      pid: process.pid,
      ppid: process.ppid,
      execPath: process.execPath,
      cwd: process.cwd(),
      argv: process.argv,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HOST: process.env.HOST,
        DATABASE_URL: process.env.DATABASE_URL ? '***REDACTED***' : undefined,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '***REDACTED***' : undefined,
        SESSION_SECRET: process.env.SESSION_SECRET ? '***REDACTED***' : undefined,
        LOG_LEVEL: process.env.LOG_LEVEL,
        PWD: process.env.PWD,
        USER: process.env.USER,
        HOME: process.env.HOME
      },
      memoryUsage: process.memoryUsage(),
      versions: process.versions
    },
    application: {
      name: 'MATT - Modern Automated Testing Tool',
      version: '1.0.0',
      environment: ENV.NODE_ENV,
      port: ENV.PORT,
      host: ENV.HOST || 'localhost'
    },
    dependencies: {
      installed: false,
      nodeModulesSize: undefined,
      packageCount: undefined
    },
    directories: {
      dist: false,
      logs: false,
      uploads: false,
      config: false
    },
    configuration: {
      database: !!ENV.DATABASE_URL,
      ai: !!ENV.ANTHROPIC_API_KEY,
      session: !!ENV.SESSION_SECRET,
      integrations: {
        github: !!ENV.GITHUB_TOKEN,
        googleDrive: !!(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET),
        jira: !!ENV.JIRA_API_TOKEN
      }
    },
    network: {
      hostname: os.hostname(),
      interfaces: {}
    }
  };

  // Check node_modules
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      diagnostics.dependencies.installed = true;
      
      // Count packages
      const packages = fs.readdirSync(nodeModulesPath);
      diagnostics.dependencies.packageCount = packages.length;
      
      // Get size (simplified - just check if it exists)
      diagnostics.dependencies.nodeModulesSize = 'Present';
    }
  } catch (error) {
    logger.error('Failed to check node_modules', { error }, 'DIAGNOSTICS');
  }

  // Check required directories
  const directoriesToCheck = {
    dist: path.join(process.cwd(), 'dist'),
    logs: path.join(process.cwd(), 'logs'),
    uploads: path.join(process.cwd(), 'uploads'),
    config: path.join(process.cwd(), 'config')
  };

  for (const [key, dirPath] of Object.entries(directoriesToCheck)) {
    try {
      diagnostics.directories[key as keyof typeof diagnostics.directories] = fs.existsSync(dirPath);
      if (!fs.existsSync(dirPath) && key !== 'dist') {
        logger.info(`Creating missing directory: ${key}`, { path: dirPath }, 'DIAGNOSTICS');
        fs.mkdirSync(dirPath, { recursive: true });
        diagnostics.directories[key as keyof typeof diagnostics.directories] = true;
      }
    } catch (error) {
      logger.error(`Failed to check/create directory: ${key}`, { error, path: dirPath }, 'DIAGNOSTICS');
    }
  }

  // Get network interfaces
  try {
    const interfaces = os.networkInterfaces();
    for (const [name, addresses] of Object.entries(interfaces)) {
      if (addresses) {
        diagnostics.network.interfaces[name] = addresses
          .filter(addr => addr.family === 'IPv4' && !addr.internal)
          .map(addr => addr.address);
      }
    }
  } catch (error) {
    logger.error('Failed to get network interfaces', { error }, 'DIAGNOSTICS');
  }

  // Log diagnostics summary
  logger.info('📊 Diagnostics Summary', {
    system: diagnostics.system,
    directories: diagnostics.directories,
    configuration: diagnostics.configuration,
    dependencies: {
      installed: diagnostics.dependencies.installed,
      packageCount: diagnostics.dependencies.packageCount
    }
  }, 'DIAGNOSTICS');

  // Warnings
  if (!diagnostics.configuration.database) {
    logger.warn('⚠️ Database not configured - application may not function properly', {}, 'DIAGNOSTICS');
  }

  if (!diagnostics.configuration.ai) {
    logger.warn('⚠️ AI service not configured - test generation will not work', {}, 'DIAGNOSTICS');
  }

  if (!diagnostics.dependencies.installed) {
    logger.error('❌ Dependencies not installed - run "npm install"', {}, 'DIAGNOSTICS');
  }

  if (!diagnostics.directories.dist && ENV.NODE_ENV === 'production') {
    logger.error('❌ Build output not found - run "npm run build"', {}, 'DIAGNOSTICS');
  }

  return diagnostics;
}

export function logPortBinding(port: number, host: string) {
  logger.info('🔌 Attempting to bind to port', {
    port,
    host,
    url: `http://${host}:${port}`
  }, 'PORT_BINDING');
}

export function logDatabaseConnection(url: string) {
  const sanitizedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  logger.info('🗄️ Connecting to database', {
    url: sanitizedUrl,
    type: 'PostgreSQL'
  }, 'DATABASE');
}

export function logRouteRegistration(method: string, path: string) {
  logger.debug(`Route registered: ${method} ${path}`, {
    method,
    path
  }, 'ROUTES');
}

export function logMiddlewareSetup(name: string, config?: any) {
  logger.debug(`Middleware configured: ${name}`, {
    middleware: name,
    config: config || {}
  }, 'MIDDLEWARE');
}

export function logStartupComplete(port: number, duration: number) {
  logger.info('🎉 Application startup complete', {
    port,
    duration: `${duration}ms`,
    status: 'ready',
    healthCheck: `http://localhost:${port}/health`
  }, 'STARTUP_COMPLETE');
}

export function logStartupError(error: any) {
  logger.fatal('💥 Startup failed', {
    error: error.message,
    code: error.code,
    stack: error.stack
  }, 'STARTUP_ERROR');
}