#!/usr/bin/env node

import { logger } from './server/logger.js';
import { ENV } from './server/config.js';
import { checkDatabaseHealth } from './server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     MATT Startup Diagnostics                                 ║
║     Running comprehensive system checks...                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

async function runDiagnostics() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {},
    system: {},
    dependencies: {},
    database: {},
    filesystem: {},
    network: {},
    errors: []
  };

  // 1. Environment Check
  console.log('\n📋 Checking Environment Variables...');
  diagnostics.environment = {
    NODE_ENV: ENV.NODE_ENV || 'not set',
    PORT: ENV.PORT || 'not set',
    DATABASE_URL: ENV.DATABASE_URL ? '✅ Set' : '❌ Not set',
    ANTHROPIC_API_KEY: ENV.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set',
    SESSION_SECRET: ENV.SESSION_SECRET ? '✅ Set' : '❌ Not set',
    MAX_FILE_SIZE: ENV.MAX_FILE_SIZE || 'not set'
  };

  // 2. System Information
  console.log('\n💻 System Information...');
  diagnostics.system = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    npmVersion: process.env.npm_version || 'unknown',
    memory: {
      total: `${Math.round(require('os').totalmem() / 1024 / 1024 / 1024)}GB`,
      free: `${Math.round(require('os').freemem() / 1024 / 1024 / 1024)}GB`,
      used: `${Math.round((require('os').totalmem() - require('os').freemem()) / 1024 / 1024 / 1024)}GB`
    },
    cpus: require('os').cpus().length,
    loadAverage: require('os').loadavg(),
    uptime: require('os').uptime(),
    user: require('os').userInfo().username,
    hostname: require('os').hostname()
  };

  // 3. Check Dependencies
  console.log('\n📦 Checking Dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    diagnostics.dependencies = {
      totalDependencies: Object.keys(packageJson.dependencies || {}).length,
      totalDevDependencies: Object.keys(packageJson.devDependencies || {}).length,
      criticalDependencies: {
        express: packageJson.dependencies.express || 'not found',
        '@langchain/langgraph': packageJson.dependencies['@langchain/langgraph'] || 'not found',
        '@anthropic-ai/sdk': packageJson.dependencies['@anthropic-ai/sdk'] || 'not found',
        'drizzle-orm': packageJson.dependencies['drizzle-orm'] || 'not found',
        react: packageJson.dependencies.react || 'not found',
        vite: packageJson.devDependencies.vite || 'not found'
      }
    };

    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    diagnostics.dependencies.nodeModulesExists = fs.existsSync(nodeModulesPath);
    
    if (diagnostics.dependencies.nodeModulesExists) {
      const nodeModulesDirs = fs.readdirSync(nodeModulesPath);
      diagnostics.dependencies.installedPackages = nodeModulesDirs.length;
    }
  } catch (error) {
    diagnostics.errors.push({
      category: 'dependencies',
      message: error.message
    });
  }

  // 4. Database Connection
  console.log('\n🗄️  Checking Database Connection...');
  if (ENV.DATABASE_URL) {
    try {
      const dbHealth = await checkDatabaseHealth();
      diagnostics.database = dbHealth;
    } catch (error) {
      diagnostics.database = {
        status: 'error',
        error: error.message,
        details: error.stack
      };
      diagnostics.errors.push({
        category: 'database',
        message: error.message
      });
    }
  } else {
    diagnostics.database = {
      status: 'not configured',
      message: 'DATABASE_URL environment variable not set'
    };
  }

  // 5. File System Checks
  console.log('\n📁 Checking File System...');
  const requiredDirs = ['logs', 'dist', 'client', 'server', 'shared'];
  diagnostics.filesystem = {
    workingDirectory: process.cwd(),
    requiredDirectories: {}
  };

  for (const dir of requiredDirs) {
    const dirPath = path.join(__dirname, dir);
    diagnostics.filesystem.requiredDirectories[dir] = {
      exists: fs.existsSync(dirPath),
      path: dirPath
    };
  }

  // Check write permissions for logs directory
  const logsDir = path.join(__dirname, 'logs');
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(logsDir, 'test.tmp'), 'test');
    fs.unlinkSync(path.join(logsDir, 'test.tmp'));
    diagnostics.filesystem.logsWritable = true;
  } catch (error) {
    diagnostics.filesystem.logsWritable = false;
    diagnostics.filesystem.logsError = error.message;
    diagnostics.errors.push({
      category: 'filesystem',
      message: `Cannot write to logs directory: ${error.message}`
    });
  }

  // 6. Network Checks
  console.log('\n🌐 Checking Network...');
  diagnostics.network = {
    port: ENV.PORT,
    portAvailable: true
  };

  // Check if port is available
  try {
    const net = require('net');
    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          diagnostics.network.portAvailable = false;
          diagnostics.network.portError = `Port ${ENV.PORT} is already in use`;
          diagnostics.errors.push({
            category: 'network',
            message: `Port ${ENV.PORT} is already in use`
          });
        }
        reject(err);
      });
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      server.listen(ENV.PORT);
    });
  } catch (error) {
    // Port check failed
  }

  // 7. Build Status Check
  console.log('\n🏗️  Checking Build Status...');
  const distPath = path.join(__dirname, 'dist');
  diagnostics.build = {
    distExists: fs.existsSync(distPath),
    distFiles: 0
  };

  if (diagnostics.build.distExists) {
    try {
      const distFiles = fs.readdirSync(distPath);
      diagnostics.build.distFiles = distFiles.length;
      diagnostics.build.hasServerBundle = distFiles.some(f => f.includes('index.js'));
      diagnostics.build.hasClientBundle = distFiles.some(f => f.includes('.html'));
    } catch (error) {
      diagnostics.build.error = error.message;
    }
  }

  // Summary
  console.log('\n📊 Diagnostic Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const issues = [];
  
  // Check for critical issues
  if (!diagnostics.environment.DATABASE_URL.includes('✅')) {
    issues.push('❌ Database URL not configured');
  }
  if (!diagnostics.dependencies.nodeModulesExists) {
    issues.push('❌ Node modules not installed (run npm install)');
  }
  if (!diagnostics.network.portAvailable) {
    issues.push(`❌ Port ${ENV.PORT} is already in use`);
  }
  if (!diagnostics.filesystem.logsWritable) {
    issues.push('❌ Cannot write to logs directory');
  }
  if (ENV.NODE_ENV === 'production' && !diagnostics.build.distExists) {
    issues.push('❌ Production build not found (run npm run build)');
  }
  if (diagnostics.database.status === 'error') {
    issues.push('❌ Database connection failed');
  }

  if (issues.length === 0) {
    console.log('✅ All systems operational!');
  } else {
    console.log('⚠️  Issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Write diagnostic report
  const reportPath = path.join(__dirname, 'logs', `diagnostic-${Date.now()}.json`);
  try {
    fs.writeFileSync(reportPath, JSON.stringify(diagnostics, null, 2));
    console.log(`\n📄 Full diagnostic report saved to: ${reportPath}`);
  } catch (error) {
    console.error('Failed to save diagnostic report:', error.message);
  }

  // Log to logger as well
  logger.info('Startup diagnostics completed', diagnostics, 'DIAGNOSTICS');

  return diagnostics;
}

// Run diagnostics
runDiagnostics()
  .then(diagnostics => {
    const hasErrors = diagnostics.errors.length > 0;
    process.exit(hasErrors ? 1 : 0);
  })
  .catch(error => {
    console.error('Diagnostic script failed:', error);
    logger.error('Diagnostic script failed', { error: error.message }, 'DIAGNOSTICS');
    process.exit(1);
  });