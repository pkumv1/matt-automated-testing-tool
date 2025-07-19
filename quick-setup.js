#!/usr/bin/env node

// Quick setup script for MATT - automatically configures environment and database
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║              MATT - Quick Setup Script                      ║
╚══════════════════════════════════════════════════════════════╝
`);

// Color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const color = colors[type] || colors.reset;
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) { log(`✓ ${message}`, 'green'); }
function error(message) { log(`✗ ${message}`, 'red'); }
function warning(message) { log(`⚠ ${message}`, 'yellow'); }
function info(message) { log(`ℹ ${message}`, 'blue'); }

try {
  // Step 1: Check if .env exists
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      warning('.env file not found. Creating from .env.example...');
      fs.copyFileSync(envExamplePath, envPath);
      success('Created .env file from .env.example');
    } else {
      error('.env.example not found!');
      process.exit(1);
    }
  } else {
    success('Found existing .env file');
  }

  // Step 2: Read and parse .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2];
    }
  });

  // Step 3: Update environment variables
  let envUpdated = false;

  // Generate random session secret if needed
  if (!envVars.SESSION_SECRET || envVars.SESSION_SECRET === 'your-secret-change-this-in-production') {
    const newSecret = crypto.randomBytes(32).toString('base64');
    envVars.SESSION_SECRET = newSecret;
    envUpdated = true;
    success('Generated random SESSION_SECRET');
  }

  // Set NODE_ENV if not set
  if (!envVars.NODE_ENV) {
    envVars.NODE_ENV = 'development';
    envUpdated = true;
    success('Set NODE_ENV to development');
  }

  // Check DATABASE_URL
  if (!envVars.DATABASE_URL || envVars.DATABASE_URL === 'postgresql://postgres:post123@localhost:5432/postgres') {
    warning('DATABASE_URL needs configuration');
    
    // Try common PostgreSQL configurations
    const testUrls = [
      'postgresql://postgres:postgres@localhost:5432/postgres',
      'postgresql://postgres:@localhost:5432/postgres',
      'postgresql://postgres:password@localhost:5432/postgres',
      'postgresql://postgres:admin@localhost:5432/postgres'
    ];

    let workingUrl = null;
    
    info('Testing PostgreSQL connections...');
    
    for (const url of testUrls) {
      try {
        info(`Testing: ${url.replace(/:.*@/, ':****@')}`);
        
        // Try to connect using node-postgres
        const { Client } = require('pg');
        const client = new Client({ connectionString: url });
        
        await new Promise((resolve, reject) => {
          client.connect((err) => {
            if (err) {
              reject(err);
            } else {
              client.end();
              resolve();
            }
          });
        });
        
        workingUrl = url;
        success('Connection successful!');
        break;
      } catch (err) {
        // Continue to next URL
      }
    }

    if (workingUrl) {
      // Try to create matt_database
      try {
        const { Client } = require('pg');
        const client = new Client({ connectionString: workingUrl });
        await new Promise((resolve, reject) => {
          client.connect((err) => {
            if (err) reject(err);
            else {
              client.query('CREATE DATABASE matt_database;', (err) => {
                client.end();
                if (err && !err.message.includes('already exists')) {
                  warning('Could not create matt_database, using default database');
                } else {
                  info('Database matt_database is ready');
                }
                resolve();
              });
            }
          });
        });
        
        // Update URL to use matt_database
        const newUrl = workingUrl.replace(/\/[^\/]*$/, '/matt_database');
        envVars.DATABASE_URL = newUrl;
        envUpdated = true;
        success('Updated DATABASE_URL');
      } catch (err) {
        envVars.DATABASE_URL = workingUrl;
        envUpdated = true;
        warning('Using default postgres database');
      }
    } else {
      warning('Could not connect to PostgreSQL. Application will use in-memory storage.');
      info('To fix this:');
      info('• Install PostgreSQL: https://postgresql.org/download/');
      info('• Start PostgreSQL service');
      info('• Create user: createuser -s postgres');
      info('• Set password: psql -c "ALTER USER postgres PASSWORD \'postgres\';"');
    }
  } else {
    // Test existing DATABASE_URL
    try {
      info('Testing existing DATABASE_URL...');
      const { Client } = require('pg');
      const client = new Client({ connectionString: envVars.DATABASE_URL });
      
      await new Promise((resolve, reject) => {
        client.connect((err) => {
          if (err) {
            reject(err);
          } else {
            client.end();
            resolve();
          }
        });
      });
      
      success('Database connection successful');
    } catch (err) {
      warning('Cannot connect to database with current DATABASE_URL');
      warning('Application will use in-memory storage fallback');
    }
  }

  // Check ANTHROPIC_API_KEY
  if (!envVars.ANTHROPIC_API_KEY || envVars.ANTHROPIC_API_KEY === 'sk-ant-api03-xxxxx') {
    warning('ANTHROPIC_API_KEY needs to be set');
    info('Get your API key from: https://console.anthropic.com/');
    info('Then update ANTHROPIC_API_KEY in .env file');
  }

  // Step 4: Write updated .env file
  if (envUpdated) {
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envPath, newEnvContent);
    success('Updated .env file');
  }

  // Step 5: Install dependencies if needed
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    info('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    success('Dependencies installed');
  }

  // Step 6: Set up database schema (if DATABASE_URL is available)
  if (envVars.DATABASE_URL && envVars.DATABASE_URL !== '') {
    try {
      info('Setting up database schema...');
      execSync('npm run db:push', { stdio: 'pipe' });
      success('Database schema created');

      // Apply performance indexes
      if (fs.existsSync('database-performance-indexes.sql')) {
        try {
          const { Client } = require('pg');
          const client = new Client({ connectionString: envVars.DATABASE_URL });
          const sql = fs.readFileSync('database-performance-indexes.sql', 'utf8');
          
          await new Promise((resolve, reject) => {
            client.connect((err) => {
              if (err) reject(err);
              else {
                client.query(sql, (err) => {
                  client.end();
                  if (err) {
                    warning('Could not apply performance indexes (may already exist)');
                  } else {
                    success('Applied performance indexes');
                  }
                  resolve();
                });
              }
            });
          });
        } catch (err) {
          warning('Could not apply performance indexes');
        }
      }

    } catch (err) {
      warning('Could not set up database schema');
      warning('Database operations will use in-memory storage');
    }
  }

  // Step 7: Final status
  console.log('\n');
  success('Setup completed!');
  console.log('\n');
  info('Next steps:');
  info('• Run: npm run dev (for development)');
  info('• Run: npm run build && npm start (for production)');
  info('• Check storage health: GET /api/health/storage');
  
  if (!envVars.ANTHROPIC_API_KEY || envVars.ANTHROPIC_API_KEY === 'sk-ant-api03-xxxxx') {
    console.log('\n');
    warning('Remember to set ANTHROPIC_API_KEY in .env for AI features');
  }

} catch (err) {
  error(`Setup failed: ${err.message}`);
  process.exit(1);
}