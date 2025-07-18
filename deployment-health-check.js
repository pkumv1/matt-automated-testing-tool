#!/usr/bin/env node

/**
 * MATT Deployment Health Check Script
 * Comprehensive health check for production deployment
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DeploymentHealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: [],
      overall: 'unknown',
      recommendations: []
    };
  }

  async runAllChecks() {
    console.log('🔍 Starting MATT Deployment Health Check...\n');
    
    try {
      await this.checkEnvironmentVariables();
      await this.checkFileSystem();
      await this.checkDependencies();
      await this.checkDatabase();
      await this.checkApplicationHealth();
      await this.checkSystemResources();
      await this.checkLogs();
      await this.checkPM2Status();
      await this.checkNginxStatus();
      await this.checkSSL();
      await this.checkPublicAccess();
      
      this.generateOverallStatus();
      this.generateRecommendations();
      this.displayResults();
      
      return this.results;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.results.overall = 'failed';
      this.results.error = error.message;
      return this.results;
    }
  }

  addCheck(name, status, message, details = {}) {
    const check = {
      name,
      status, // 'pass', 'fail', 'warn', 'skip'
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.checks.push(check);
    
    const statusIcon = {
      'pass': '✅',
      'fail': '❌',
      'warn': '⚠️',
      'skip': '⏭️'
    };
    
    console.log(`${statusIcon[status]} ${name}: ${message}`);
    
    if (details && Object.keys(details).length > 0) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  async checkEnvironmentVariables() {
    console.log('\n📋 Checking Environment Variables...');
    
    const requiredVars = [
      'NODE_ENV',
      'PORT',
      'DATABASE_URL',
      'ANTHROPIC_API_KEY',
      'SESSION_SECRET'
    ];
    
    const missingVars = [];
    const presentVars = [];
    
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        presentVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    }
    
    if (missingVars.length === 0) {
      this.addCheck('Environment Variables', 'pass', 'All required variables present', {
        present: presentVars,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT
      });
    } else {
      this.addCheck('Environment Variables', 'fail', `Missing: ${missingVars.join(', ')}`, {
        missing: missingVars,
        present: presentVars
      });
    }
  }

  async checkFileSystem() {
    console.log('\n📁 Checking File System...');
    
    const requiredDirs = [
      'dist',
      'logs',
      'uploads',
      'node_modules'
    ];
    
    const requiredFiles = [
      'package.json',
      'dist/index.js',
      'dist/public/index.html'
    ];
    
    let allDirsExist = true;
    let allFilesExist = true;
    const missingDirs = [];
    const missingFiles = [];
    
    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        missingDirs.push(dir);
        allDirsExist = false;
      }
    }
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
        allFilesExist = false;
      }
    }
    
    if (allDirsExist && allFilesExist) {
      this.addCheck('File System', 'pass', 'All required directories and files exist');
    } else {
      const status = missingFiles.includes('dist/index.js') ? 'fail' : 'warn';
      this.addCheck('File System', status, 'Missing files or directories', {
        missingDirs,
        missingFiles
      });
    }
  }

  async checkDependencies() {
    console.log('\n📦 Checking Dependencies...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const nodeModulesExists = fs.existsSync('node_modules');
      
      if (!nodeModulesExists) {
        this.addCheck('Dependencies', 'fail', 'node_modules directory missing');
        return;
      }
      
      // Check if package-lock.json exists
      const lockFileExists = fs.existsSync('package-lock.json');
      
      this.addCheck('Dependencies', 'pass', 'Dependencies installed', {
        nodeModulesExists,
        lockFileExists,
        packageCount: Object.keys(packageJson.dependencies || {}).length
      });
    } catch (error) {
      this.addCheck('Dependencies', 'fail', 'Failed to check dependencies', {
        error: error.message
      });
    }
  }

  async checkDatabase() {
    console.log('\n🗄️  Checking Database...');
    
    if (!process.env.DATABASE_URL) {
      this.addCheck('Database', 'fail', 'DATABASE_URL not configured');
      return;
    }
    
    try {
      // Simple connection test using node-postgres
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 5000
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW(), current_database()');
      client.release();
      await pool.end();
      
      this.addCheck('Database', 'pass', 'Database connection successful', {
        database: result.rows[0].current_database,
        timestamp: result.rows[0].now
      });
    } catch (error) {
      this.addCheck('Database', 'fail', 'Database connection failed', {
        error: error.message,
        code: error.code
      });
    }
  }

  async checkApplicationHealth() {
    console.log('\n🏥 Checking Application Health...');
    
    const port = process.env.PORT || 3000;
    const url = `http://localhost:${port}/health`;
    
    try {
      const response = await this.makeHttpRequest(url);
      
      if (response.statusCode === 200) {
        this.addCheck('Application Health', 'pass', 'Health endpoint responding', {
          statusCode: response.statusCode,
          port,
          responseTime: response.responseTime
        });
      } else {
        this.addCheck('Application Health', 'fail', `Health endpoint returned ${response.statusCode}`, {
          statusCode: response.statusCode,
          port
        });
      }
    } catch (error) {
      this.addCheck('Application Health', 'fail', 'Health endpoint not accessible', {
        error: error.message,
        port
      });
    }
  }

  async checkSystemResources() {
    console.log('\n💻 Checking System Resources...');
    
    try {
      const memoryUsage = process.memoryUsage();
      const memoryMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      };
      
      const uptime = Math.round(process.uptime());
      const pid = process.pid;
      
      // Check disk space
      const { stdout: diskOutput } = await execAsync('df -h . 2>/dev/null || echo "disk check failed"');
      
      this.addCheck('System Resources', 'pass', 'System resources checked', {
        memory: memoryMB,
        uptime: `${uptime} seconds`,
        pid,
        diskSpace: diskOutput.trim()
      });
    } catch (error) {
      this.addCheck('System Resources', 'warn', 'Could not check all system resources', {
        error: error.message
      });
    }
  }

  async checkLogs() {
    console.log('\n📝 Checking Logs...');
    
    const logDir = 'logs';
    const today = new Date().toISOString().split('T')[0];
    
    try {
      if (!fs.existsSync(logDir)) {
        this.addCheck('Logs', 'warn', 'Log directory does not exist');
        return;
      }
      
      const logFiles = fs.readdirSync(logDir);
      const todayLogs = logFiles.filter(f => f.includes(today));
      
      // Check log file sizes
      const logSizes = {};
      for (const file of logFiles) {
        const stats = fs.statSync(path.join(logDir, file));
        logSizes[file] = Math.round(stats.size / 1024) + 'KB';
      }
      
      this.addCheck('Logs', 'pass', 'Log directory accessible', {
        totalFiles: logFiles.length,
        todayLogs: todayLogs.length,
        logSizes
      });
    } catch (error) {
      this.addCheck('Logs', 'fail', 'Log directory check failed', {
        error: error.message
      });
    }
  }

  async checkPM2Status() {
    console.log('\n🔧 Checking PM2 Status...');
    
    try {
      const { stdout } = await execAsync('pm2 jlist 2>/dev/null');
      const processes = JSON.parse(stdout);
      const mattProcess = processes.find(p => p.name === 'matt-production');
      
      if (mattProcess) {
        const isOnline = mattProcess.pm2_env.status === 'online';
        this.addCheck('PM2 Status', isOnline ? 'pass' : 'fail', 
          `MATT process is ${mattProcess.pm2_env.status}`, {
          pid: mattProcess.pid,
          uptime: mattProcess.pm2_env.pm_uptime,
          restarts: mattProcess.pm2_env.restart_time,
          memory: Math.round(mattProcess.monit.memory / 1024 / 1024) + 'MB'
        });
      } else {
        this.addCheck('PM2 Status', 'fail', 'MATT process not found in PM2');
      }
    } catch (error) {
      this.addCheck('PM2 Status', 'skip', 'PM2 not available or not accessible', {
        error: error.message
      });
    }
  }

  async checkNginxStatus() {
    console.log('\n🌐 Checking Nginx Status...');
    
    try {
      const { stdout } = await execAsync('nginx -t 2>&1');
      const isValid = stdout.includes('syntax is ok') && stdout.includes('test is successful');
      
      this.addCheck('Nginx Config', isValid ? 'pass' : 'fail', 
        isValid ? 'Nginx configuration valid' : 'Nginx configuration invalid', {
        output: stdout.trim()
      });
      
      // Check if nginx is running
      const { stdout: statusOutput } = await execAsync('systemctl is-active nginx 2>/dev/null || echo "inactive"');
      const isRunning = statusOutput.trim() === 'active';
      
      this.addCheck('Nginx Service', isRunning ? 'pass' : 'fail', 
        `Nginx is ${isRunning ? 'running' : 'not running'}`);
    } catch (error) {
      this.addCheck('Nginx Status', 'skip', 'Cannot check nginx status', {
        error: error.message
      });
    }
  }

  async checkSSL() {
    console.log('\n🔒 Checking SSL Certificate...');
    
    try {
      const domain = 'demo.mars-techs.ai';
      const { stdout } = await execAsync(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "ssl check failed"`);
      
      if (stdout.includes('notAfter')) {
        this.addCheck('SSL Certificate', 'pass', 'SSL certificate information retrieved', {
          certificateInfo: stdout.trim()
        });
      } else {
        this.addCheck('SSL Certificate', 'warn', 'Could not retrieve SSL certificate information');
      }
    } catch (error) {
      this.addCheck('SSL Certificate', 'skip', 'SSL check not available', {
        error: error.message
      });
    }
  }

  async checkPublicAccess() {
    console.log('\n🌍 Checking Public Access...');
    
    try {
      const domain = 'demo.mars-techs.ai';
      const url = `https://${domain}/health`;
      
      const response = await this.makeHttpsRequest(url);
      
      if (response.statusCode === 200) {
        this.addCheck('Public Access', 'pass', 'Public site accessible', {
          domain,
          statusCode: response.statusCode,
          responseTime: response.responseTime
        });
      } else {
        this.addCheck('Public Access', 'fail', `Public site returned ${response.statusCode}`, {
          domain,
          statusCode: response.statusCode
        });
      }
    } catch (error) {
      this.addCheck('Public Access', 'fail', 'Public site not accessible', {
        error: error.message
      });
    }
  }

  async makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const req = http.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          responseTime
        });
      });
      
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Request timeout')));
    });
  }

  async makeHttpsRequest(url) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const req = https.get(url, (res) => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          responseTime
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Request timeout')));
    });
  }

  generateOverallStatus() {
    const checks = this.results.checks;
    const failedChecks = checks.filter(c => c.status === 'fail');
    const warnChecks = checks.filter(c => c.status === 'warn');
    const passedChecks = checks.filter(c => c.status === 'pass');
    
    if (failedChecks.length === 0) {
      this.results.overall = warnChecks.length > 0 ? 'healthy_with_warnings' : 'healthy';
    } else {
      this.results.overall = 'unhealthy';
    }
    
    this.results.summary = {
      total: checks.length,
      passed: passedChecks.length,
      warnings: warnChecks.length,
      failed: failedChecks.length,
      skipped: checks.filter(c => c.status === 'skip').length
    };
  }

  generateRecommendations() {
    const failedChecks = this.results.checks.filter(c => c.status === 'fail');
    const warnChecks = this.results.checks.filter(c => c.status === 'warn');
    
    if (failedChecks.length === 0 && warnChecks.length === 0) {
      this.results.recommendations.push('✅ All checks passed! Your deployment is healthy.');
      return;
    }
    
    this.results.recommendations.push('🔧 Recommendations to improve deployment health:');
    
    for (const check of failedChecks) {
      switch (check.name) {
        case 'Environment Variables':
          this.results.recommendations.push(`• Fix missing environment variables: ${check.details.missing?.join(', ')}`);
          break;
        case 'File System':
          this.results.recommendations.push('• Run "npm run build" to create missing build files');
          break;
        case 'Database':
          this.results.recommendations.push('• Check database connection and ensure PostgreSQL is running');
          break;
        case 'Application Health':
          this.results.recommendations.push('• Restart the application: pm2 restart matt-production');
          break;
        case 'PM2 Status':
          this.results.recommendations.push('• Start the application: pm2 start ecosystem.config.js --env production');
          break;
        case 'Public Access':
          this.results.recommendations.push('• Check nginx configuration and restart: sudo systemctl restart nginx');
          break;
        default:
          this.results.recommendations.push(`• Fix ${check.name}: ${check.message}`);
      }
    }
    
    for (const check of warnChecks) {
      switch (check.name) {
        case 'Logs':
          this.results.recommendations.push('• Consider setting up log rotation');
          break;
        case 'SSL Certificate':
          this.results.recommendations.push('• Verify SSL certificate is properly configured');
          break;
        default:
          this.results.recommendations.push(`• Review ${check.name}: ${check.message}`);
      }
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT HEALTH CHECK RESULTS');
    console.log('='.repeat(60));
    
    const statusIcon = {
      'healthy': '✅',
      'healthy_with_warnings': '⚠️',
      'unhealthy': '❌',
      'unknown': '❓'
    };
    
    console.log(`\n${statusIcon[this.results.overall]} Overall Status: ${this.results.overall.toUpperCase()}`);
    console.log(`📈 Summary: ${this.results.summary.passed} passed, ${this.results.summary.warnings} warnings, ${this.results.summary.failed} failed`);
    
    if (this.results.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      this.results.recommendations.forEach(rec => console.log(rec));
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
if (require.main === module) {
  const checker = new DeploymentHealthChecker();
  checker.runAllChecks().then(results => {
    // Save results to file
    const resultsFile = `health-check-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsFile}`);
    
    // Exit with appropriate code
    process.exit(results.overall === 'healthy' ? 0 : 1);
  }).catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentHealthChecker;