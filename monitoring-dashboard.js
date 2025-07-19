#!/usr/bin/env node

/**
 * Real-time Monitoring Dashboard for MATT Application
 * Provides comprehensive logging and system monitoring
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MonitoringDashboard {
  constructor() {
    this.logDir = './logs';
    this.isRunning = false;
    this.watchers = new Map();
    this.metrics = {
      errors: 0,
      warnings: 0,
      requests: 0,
      slowQueries: 0,
      memoryUsage: 0,
      lastUpdate: new Date()
    };
  }

  async start() {
    console.log('🔍 Starting MATT Application Monitoring Dashboard...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    this.isRunning = true;
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
      console.log('📁 Created logs directory');
    }
    
    // Start monitoring components
    this.startLogWatching();
    this.startMetricsCollection();
    this.startHealthChecking();
    this.displayDashboard();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  startLogWatching() {
    const logFiles = [
      'app-*.log',
      'error-*.log',
      'performance-*.log',
      'api-*.log',
      'database-*.log'
    ];

    logFiles.forEach(pattern => {
      try {
        const files = this.findLogFiles(pattern);
        files.forEach(file => this.watchLogFile(file));
      } catch (error) {
        console.warn(`⚠️ Could not watch log pattern ${pattern}:`, error.message);
      }
    });
  }

  findLogFiles(pattern) {
    try {
      const files = fs.readdirSync(this.logDir);
      const regex = new RegExp(pattern.replace('*', '.*'));
      return files
        .filter(file => regex.test(file))
        .map(file => path.join(this.logDir, file));
    } catch {
      return [];
    }
  }

  watchLogFile(filePath) {
    if (this.watchers.has(filePath)) return;

    try {
      const watcher = fs.watchFile(filePath, { interval: 1000 }, () => {
        this.processLogFile(filePath);
      });
      
      this.watchers.set(filePath, watcher);
      console.log(`👁️ Watching log file: ${path.basename(filePath)}`);
    } catch (error) {
      console.warn(`⚠️ Could not watch file ${filePath}:`, error.message);
    }
  }

  processLogFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').slice(-50); // Last 50 lines
      
      lines.forEach(line => {
        if (line.includes('ERROR') || line.includes('FATAL')) {
          this.metrics.errors++;
          this.logAlert('🔴 ERROR', line);
        } else if (line.includes('WARN')) {
          this.metrics.warnings++;
          this.logAlert('🟡 WARNING', line);
        } else if (line.includes('HTTP_REQUEST')) {
          this.metrics.requests++;
        } else if (line.includes('SLOW') || line.includes('slow')) {
          this.metrics.slowQueries++;
          this.logAlert('🐌 SLOW OPERATION', line);
        }
      });
      
      this.metrics.lastUpdate = new Date();
    } catch (error) {
      console.warn(`⚠️ Error processing log file ${filePath}:`, error.message);
    }
  }

  startMetricsCollection() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 5000); // Every 5 seconds
  }

  collectSystemMetrics() {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.metrics.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      // Check application health
      this.checkApplicationHealth();
    } catch (error) {
      console.warn('⚠️ Error collecting metrics:', error.message);
    }
  }

  async checkApplicationHealth() {
    try {
      // Simple HTTP check if application is running
      const { spawn } = require('child_process');
      const healthCheck = spawn('node', ['-e', `
        const http = require('http');
        const req = http.get('http://localhost:5000/health', (res) => {
          console.log('HEALTH_OK');
          process.exit(0);
        });
        req.on('error', () => {
          console.log('HEALTH_ERROR');
          process.exit(1);
        });
        setTimeout(() => {
          req.destroy();
          console.log('HEALTH_TIMEOUT');
          process.exit(1);
        }, 3000);
      `], { stdio: 'pipe' });
      
      healthCheck.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output === 'HEALTH_OK') {
          this.metrics.healthStatus = '✅ Healthy';
        } else if (output === 'HEALTH_ERROR') {
          this.metrics.healthStatus = '❌ Error';
        } else if (output === 'HEALTH_TIMEOUT') {
          this.metrics.healthStatus = '⏰ Timeout';
        }
      });
    } catch (error) {
      this.metrics.healthStatus = '❓ Unknown';
    }
  }

  startHealthChecking() {
    setInterval(() => {
      this.checkApplicationHealth();
    }, 30000); // Every 30 seconds
  }

  logAlert(level, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level}: ${message.substring(0, 100)}...`);
  }

  displayDashboard() {
    // Clear screen and show dashboard every 10 seconds
    setInterval(() => {
      if (!this.isRunning) return;
      
      console.clear();
      this.renderDashboard();
    }, 10000);
    
    // Initial render
    setTimeout(() => this.renderDashboard(), 1000);
  }

  renderDashboard() {
    const uptime = Math.floor(process.uptime());
    const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;
    
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║     🔍 MATT Application - Real-time Monitoring Dashboard    ║');
    console.log('║                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  📊 System Status                                           ║`);
    console.log(`║     Application Health: ${(this.metrics.healthStatus || '❓ Checking').padEnd(32)} ║`);
    console.log(`║     Memory Usage: ${this.metrics.memoryUsage}MB${' '.repeat(42 - this.metrics.memoryUsage.toString().length)} ║`);
    console.log(`║     Uptime: ${uptimeStr.padEnd(49)} ║`);
    console.log(`║                                                              ║`);
    console.log(`║  📈 Application Metrics                                      ║`);
    console.log(`║     Total Requests: ${this.metrics.requests.toString().padEnd(41)} ║`);
    console.log(`║     Errors: ${this.metrics.errors.toString().padEnd(49)} ║`);
    console.log(`║     Warnings: ${this.metrics.warnings.toString().padEnd(47)} ║`);
    console.log(`║     Slow Operations: ${this.metrics.slowQueries.toString().padEnd(40)} ║`);
    console.log(`║                                                              ║`);
    console.log(`║  🕐 Last Update: ${this.metrics.lastUpdate.toLocaleTimeString().padEnd(37)} ║`);
    console.log(`║                                                              ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  📁 Active Log Monitoring                                    ║');
    console.log(`║     Watching ${this.watchers.size} log files${' '.repeat(39 - this.watchers.size.toString().length)} ║`);
    for (const filePath of this.watchers.keys()) {
      const fileName = path.basename(filePath);
      console.log(`║     • ${fileName.padEnd(54)} ║`);
    }
    console.log('║                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log('║  🎛️ Available Commands                                       ║');
    console.log('║     Ctrl+C - Stop monitoring                                ║');
    console.log('║     ./check-logging-status.sh - Detailed log analysis      ║');
    console.log('║     npm run logs:tail - Live application logs              ║');
    console.log('║     npm run logs:errors - Error logs                       ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Show recent alerts
    if (this.metrics.errors > 0 || this.metrics.warnings > 0) {
      console.log('⚠️ Recent Issues Detected - Check logs for details');
      console.log('📋 Run: ./check-logging-status.sh for comprehensive analysis');
      console.log('');
    }
  }

  stop() {
    console.log('\n⏹️ Stopping monitoring dashboard...');
    this.isRunning = false;
    
    // Stop all file watchers
    for (const [filePath, watcher] of this.watchers) {
      fs.unwatchFile(filePath);
      console.log(`👁️ Stopped watching: ${path.basename(filePath)}`);
    }
    
    console.log('✅ Monitoring dashboard stopped');
    process.exit(0);
  }
}

// Main execution
async function main() {
  const monitor = new MonitoringDashboard();
  
  try {
    await monitor.start();
  } catch (error) {
    console.error('💥 Monitoring dashboard failed to start:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 MATT Application Monitoring Dashboard

Usage: node monitoring-dashboard.js [options]

Options:
  --help, -h    Show this help message
  
The dashboard will monitor:
  • Application logs in real-time
  • System metrics (memory, health)
  • Error and warning detection
  • Performance monitoring
  
Press Ctrl+C to stop monitoring.
    `);
    process.exit(0);
  }
  
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = MonitoringDashboard;