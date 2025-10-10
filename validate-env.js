#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates all required environment variables before deployment
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Required environment variables
const REQUIRED_VARS = {
  DATABASE_URL: {
    description: 'PostgreSQL connection string',
    example: 'postgresql://user:password@localhost:5432/database',
    validate: (value) => {
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return 'Must start with postgresql:// or postgres://';
      }
      return null;
    }
  },
  ANTHROPIC_API_KEY: {
    description: 'Anthropic API key for AI services',
    example: 'sk-ant-xxxxx',
    validate: (value) => {
      if (!value.startsWith('sk-ant-')) {
        return 'Must start with sk-ant-';
      }
      if (value.length < 20) {
        return 'API key seems too short';
      }
      return null;
    }
  },
  SESSION_SECRET: {
    description: 'Secret key for session encryption',
    example: '64-character random string',
    validate: (value) => {
      if (value.length < 32) {
        return 'Should be at least 32 characters for security';
      }
      return null;
    }
  }
};

// Optional environment variables with defaults
const OPTIONAL_VARS = {
  NODE_ENV: {
    description: 'Node environment',
    default: 'production',
    example: 'production'
  },
  HOST: {
    description: 'Server host',
    default: '0.0.0.0',
    example: '0.0.0.0'
  },
  PORT: {
    description: 'Server port',
    default: '5000',
    example: '5000'
  }
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadEnvFile() {
  const envPath = join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️  No .env file found. Checking system environment variables...', 'yellow');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key.trim()] = value;
        // Set in process.env for validation
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  });
  
  log('✅ Loaded .env file', 'green');
  return true;
}

function validateEnvironment() {
  log('\n🔍 Validating Environment Variables\n', 'cyan');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  log('Required Variables:', 'blue');
  for (const [varName, config] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[varName];
    
    if (!value) {
      log(`  ❌ ${varName}: MISSING`, 'red');
      log(`     Description: ${config.description}`, 'red');
      log(`     Example: ${config.example}\n`, 'yellow');
      hasErrors = true;
    } else {
      const validationError = config.validate ? config.validate(value) : null;
      if (validationError) {
        log(`  ⚠️  ${varName}: ${validationError}`, 'yellow');
        log(`     Current value: ${value.substring(0, 20)}...`, 'yellow');
        log(`     Example: ${config.example}\n`, 'yellow');
        hasWarnings = true;
      } else {
        log(`  ✅ ${varName}: Valid`, 'green');
      }
    }
  }
  
  // Check optional variables
  log('\nOptional Variables:', 'blue');
  for (const [varName, config] of Object.entries(OPTIONAL_VARS)) {
    const value = process.env[varName];
    
    if (!value) {
      log(`  ℹ️  ${varName}: Using default (${config.default})`, 'cyan');
    } else {
      log(`  ✅ ${varName}: ${value}`, 'green');
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  if (hasErrors) {
    log('\n❌ Validation FAILED - Missing required variables', 'red');
    log('\nPlease set all required environment variables and try again.', 'red');
    log('You can:\n', 'yellow');
    log('1. Create a .env file with the required variables', 'yellow');
    log('2. Set them in your system environment', 'yellow');
    log('3. Run: npm run setup (to use the interactive setup wizard)\n', 'yellow');
    return false;
  } else if (hasWarnings) {
    log('\n⚠️  Validation PASSED with warnings', 'yellow');
    log('Please review the warnings above.', 'yellow');
    return true;
  } else {
    log('\n✅ Validation PASSED - All variables are properly configured!', 'green');
    return true;
  }
}

function main() {
  log('='.repeat(60), 'cyan');
  log('MATT Environment Validation', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Load .env file if it exists
  loadEnvFile();
  
  // Validate environment
  const isValid = validateEnvironment();
  
  // Exit with appropriate code
  process.exit(isValid ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateEnvironment, REQUIRED_VARS, OPTIONAL_VARS };
