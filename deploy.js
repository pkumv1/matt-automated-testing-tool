#!/usr/bin/env node

/**
 * MATT Cross-Platform Production Deployment Script
 * This script helps deploy MATT in production mode on any platform
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function printStatus(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function runCommand(command, description) {
  try {
    printStatus(`${description}...`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    printError(`${description} failed!`);
    return false;
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     MATT - Cross-Platform Deployment Script                  ║
╚══════════════════════════════════════════════════════════════╝
`);

// Check if .env file exists
if (!existsSync('.env')) {
  printError('.env file not found!');
  console.log('Please create a .env file with required variables:');
  console.log('  - DATABASE_URL');
  console.log('  - ANTHROPIC_API_KEY');
  console.log('  - SESSION_SECRET');
  console.log('');
  console.log('You can copy .env.example as a template:');
  console.log('  npm run setup');
  process.exit(1);
}

printStatus('Found .env file');

// Load environment variables
printStatus('Loading environment variables...');
dotenv.config();

// Verify required environment variables
const requiredVars = ['DATABASE_URL', 'ANTHROPIC_API_KEY', 'SESSION_SECRET'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  printError('Missing required environment variables:');
  missingVars.forEach(varName => console.log(`  - ${varName}`));
  process.exit(1);
}

printStatus('All required environment variables are set');

// Check if node_modules exists
if (!existsSync('node_modules')) {
  printWarning('node_modules not found. Installing dependencies...');
  if (!runCommand('npm install', 'Installing dependencies')) {
    process.exit(1);
  }
}

// Build the application
if (!runCommand('npm run build', 'Building the application')) {
  process.exit(1);
}

printStatus('Build completed successfully');

// Check if dist directory exists
if (!existsSync('dist')) {
  printError('Build output directory "dist" not found!');
  process.exit(1);
}

// Initialize database if needed
const initDb = process.argv.includes('--init-db');
if (initDb) {
  if (!runCommand('npm run db:push', 'Initializing database')) {
    process.exit(1);
  }
  printStatus('Database initialized successfully');
}

// Start the application
console.log('');
printStatus('Starting MATT in production mode...');
console.log('');

// Set production environment and start
process.env.NODE_ENV = 'production';

try {
  execSync('npm start', { stdio: 'inherit' });
} catch (error) {
  printError('Failed to start the application');
  process.exit(1);
}