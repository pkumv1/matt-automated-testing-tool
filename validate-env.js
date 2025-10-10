// validate-env.js - Environment Variable Validator
// Run this before build/deploy to ensure all required variables are set

const fs = require('fs');
const path = require('path');

function validateEnv() {
  console.log('\n🔍 Validating environment configuration...\n');

  // Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('\n💡 To fix this, run: npm run setup\n');
    console.log('Or manually create .env file with required variables.');
    process.exit(1);
  }

  console.log('✅ .env file found');

  // Load environment variables
  require('dotenv').config();

  // Define required variables
  const required = [
    'DATABASE_URL',
    'ANTHROPIC_API_KEY', 
    'SESSION_SECRET',
    'PORT'
  ];

  const optional = [
    'NODE_ENV',
    'HOST',
    'CONFIG_PATH',
    'MAX_FILE_SIZE'
  ];

  // Check for missing required variables
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables:\n`);
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\n💡 Add these variables to your .env file\n');
    process.exit(1);
  }

  console.log('✅ All required variables present');

  // Validate specific variables
  
  // 1. Validate PORT
  const port = parseInt(process.env.PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`❌ Invalid PORT: ${process.env.PORT}`);
    console.log('   PORT must be a number between 1 and 65535');
    process.exit(1);
  }

  // Warn if PORT is not 3000 in production
  if (process.env.NODE_ENV === 'production' && port !== 3000) {
    console.warn('\n⚠️  WARNING: PORT should be 3000 in production for nginx compatibility');
    console.warn(`   Current PORT: ${port}`);
    console.warn('   This may cause 502 Gateway errors on demo.mars-techs.ai\n');
  } else {
    console.log(`✅ PORT: ${port}${port === 3000 ? ' (production ready)' : ''}`);
  }

  // 2. Validate DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('❌ Invalid DATABASE_URL format');
    console.log('   Must start with postgresql:// or postgres://');
    process.exit(1);
  }

  // Check for unencoded special characters in password
  const passwordPattern = /postgresql:\/\/[^:]+:([^@]+)@/;
  const match = dbUrl.match(passwordPattern);
  
  if (match) {
    const password = match[1];
    const specialChars = {
      '@': '%40',
      '#': '%23',
      '$': '%24',
      '&': '%26',
      '=': '%3D',
      '+': '%2B',
      ' ': '%20'
    };
    
    const unencoded = Object.keys(specialChars).filter(char => 
      password.includes(char) && !password.includes(specialChars[char])
    );
    
    if (unencoded.length > 0) {
      console.error('\n❌ DATABASE_URL contains unencoded special characters in password');
      console.error(`   Found: ${unencoded.join(', ')}`);
      console.log('\n💡 URL encoding map:');
      unencoded.forEach(char => {
        console.log(`   ${char} → ${specialChars[char]}`);
      });
      console.log('\n   Example: pass@word → pass%40word\n');
      process.exit(1);
    }
  }

  console.log('✅ DATABASE_URL format valid');

  // 3. Validate ANTHROPIC_API_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey.startsWith('sk-ant-')) {
    console.warn('\n⚠️  WARNING: ANTHROPIC_API_KEY format may be incorrect');
    console.warn('   Expected format: sk-ant-xxxxx\n');
  } else {
    console.log('✅ ANTHROPIC_API_KEY format valid');
  }

  // 4. Validate SESSION_SECRET
  const sessionSecret = process.env.SESSION_SECRET;
  if (sessionSecret.length < 32) {
    console.warn('\n⚠️  WARNING: SESSION_SECRET is too short');
    console.warn('   Recommended length: at least 32 characters');
    console.warn(`   Current length: ${sessionSecret.length} characters\n`);
  } else {
    console.log('✅ SESSION_SECRET length adequate');
  }

  // Display optional variables status
  console.log('\n📋 Optional variables:');
  optional.forEach(key => {
    const value = process.env[key];
    if (value) {
      console.log(`   ✓ ${key}: ${key === 'CONFIG_PATH' ? value : 'set'}`);
    } else {
      console.log(`   ○ ${key}: not set (using default)`);
    }
  });

  // Summary
  console.log('\n✨ Environment validation complete!\n');
  console.log('Configuration summary:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   HOST: ${process.env.HOST || '0.0.0.0'}`);
  console.log(`   Database: Configured`);
  console.log(`   AI Service: Configured`);
  console.log('');

  return true;
}

// Run validation if called directly
if (require.main === module) {
  try {
    validateEnv();
  } catch (error) {
    console.error('\n💥 Validation failed:', error.message);
    process.exit(1);
  }
}

module.exports = { validateEnv };
