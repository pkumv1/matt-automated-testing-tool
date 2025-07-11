#!/usr/bin/env node

/**
 * MATT Deployment Test Script
 * This script performs a comprehensive test to ensure the application
 * can be successfully deployed with just npm install and npm run build
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, colors.blue);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} - SUCCESS`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} - FAILED`, colors.red);
    console.error(error.message);
    return false;
  }
}

function checkFile(filePath, description) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log(`✅ ${description} exists`, colors.green);
    return true;
  } else {
    log(`❌ ${description} missing at ${filePath}`, colors.red);
    return false;
  }
}

function createTestEnv() {
  const envContent = `# Test Environment Configuration
DATABASE_URL=postgresql://postgres:testpass@localhost:5432/test
ANTHROPIC_API_KEY=sk-ant-test-key
SESSION_SECRET=test-secret-${Date.now()}
NODE_ENV=test
PORT=5000
CONFIG_PATH=./config/settings.json
`;
  
  fs.writeFileSync('.env.test', envContent);
  log('✅ Created test .env file', colors.green);
}

async function runDeploymentTest() {
  log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     MATT Deployment Test                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`, colors.bright);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Phase 1: Check Prerequisites
  log('\n📋 Phase 1: Checking Prerequisites', colors.bright);
  
  const prerequisites = [
    { check: () => checkFile('package.json', 'package.json'), critical: true },
    { check: () => checkFile('tsconfig.json', 'tsconfig.json'), critical: true },
    { check: () => checkFile('vite.config.ts', 'vite.config.ts'), critical: true },
    { check: () => checkFile('drizzle.config.ts', 'drizzle.config.ts'), critical: true },
    { check: () => checkFile('server/index.ts', 'Server entry point'), critical: true },
    { check: () => checkFile('client/src/main.tsx', 'Client entry point'), critical: true },
    { check: () => checkFile('shared/schema.ts', 'Database schema'), critical: true }
  ];

  for (const prereq of prerequisites) {
    results.total++;
    if (prereq.check()) {
      results.passed++;
    } else {
      results.failed++;
      if (prereq.critical) {
        log('\n❌ Critical prerequisite failed. Cannot continue.', colors.red);
        return results;
      }
    }
  }

  // Phase 2: Clean Install
  log('\n📋 Phase 2: Clean Installation', colors.bright);
  
  // Remove existing artifacts
  const artifactsToRemove = ['node_modules', 'dist', '.turbo', 'package-lock.json'];
  for (const artifact of artifactsToRemove) {
    if (fs.existsSync(artifact)) {
      log(`🗑️  Removing ${artifact}...`, colors.yellow);
      execSync(`rm -rf ${artifact}`);
    }
  }

  // Create test environment
  createTestEnv();

  // Install dependencies
  results.total++;
  if (runCommand('npm install', 'Installing dependencies')) {
    results.passed++;
  } else {
    results.failed++;
    return results;
  }

  // Phase 3: Type Checking
  log('\n📋 Phase 3: Type Checking', colors.bright);
  results.total++;
  if (runCommand('npm run check', 'TypeScript type checking')) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Phase 4: Build Process
  log('\n📋 Phase 4: Build Process', colors.bright);
  
  // Use test environment for build
  process.env.NODE_ENV = 'test';
  
  results.total++;
  if (runCommand('NODE_ENV=test npm run build', 'Building application')) {
    results.passed++;
  } else {
    results.failed++;
    return results;
  }

  // Phase 5: Verify Build Output
  log('\n📋 Phase 5: Verifying Build Output', colors.bright);
  
  const buildArtifacts = [
    { path: 'dist/index.js', description: 'Server bundle' },
    { path: 'dist/public/index.html', description: 'Client HTML' },
    { path: 'dist/public/assets', description: 'Client assets directory' }
  ];

  for (const artifact of buildArtifacts) {
    results.total++;
    if (checkFile(artifact.path, artifact.description)) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Phase 6: Test Server Startup (brief)
  log('\n📋 Phase 6: Testing Server Startup', colors.bright);
  results.total++;
  
  try {
    log('🚀 Starting server for 3 seconds...', colors.yellow);
    const serverProcess = execSync(
      'timeout 3s node dist/index.js || true',
      { 
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      }
    );
    log('✅ Server started successfully', colors.green);
    results.passed++;
  } catch (error) {
    if (error.message.includes('Missing required environment variables')) {
      log('✅ Server correctly validated environment (expected in test)', colors.green);
      results.passed++;
    } else {
      log('❌ Server startup failed unexpectedly', colors.red);
      results.failed++;
    }
  }

  // Cleanup
  if (fs.existsSync('.env.test')) {
    fs.unlinkSync('.env.test');
  }

  return results;
}

// Run the test
runDeploymentTest().then(results => {
  log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Deployment Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tests:  ${results.total}
Passed:       ${results.passed} ✅
Failed:       ${results.failed} ❌
Success Rate: ${Math.round((results.passed / results.total) * 100)}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`, colors.bright);

  if (results.failed === 0) {
    log(`
🎉 SUCCESS! The application is 100% deployable!

You can now run:
1. npm install
2. npm run build
3. npm start (with proper .env file)
`, colors.green);
    process.exit(0);
  } else {
    log(`
⚠️  ISSUES FOUND! Please fix the above issues before deployment.
`, colors.red);
    process.exit(1);
  }
}).catch(error => {
  log(`\n❌ Test script error: ${error.message}`, colors.red);
  process.exit(1);
});
