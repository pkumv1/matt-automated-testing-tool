// Environment configuration for MATT application
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Handle ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables synchronously
function loadEnvironmentVariables() {
  const envPath = path.resolve(process.cwd(), '.env');
  
  // Always try to load .env file first, then fall back to system environment variables
  console.log(`🔧 Loading environment variables in ${process.env.NODE_ENV || 'development'} mode`);
  
  // Try to load from .env file regardless of environment
  try {
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath });
      
      if (result.error) {
        console.error('❌ Error parsing .env file:', result.error);
        console.log('⚠️  Using system environment variables instead');
      } else {
        console.log('✓ Loaded environment variables from .env file:', envPath);
        // In production, validate that critical variables are set
        if (process.env.NODE_ENV === 'production') {
          const criticalVars = ['DATABASE_URL', 'ANTHROPIC_API_KEY'];
          const missing = criticalVars.filter(key => !process.env[key]);
          if (missing.length > 0) {
            console.error('❌ Critical environment variables missing from .env:', missing);
          } else {
            console.log('✓ All critical environment variables loaded from .env file');
          }
        }
      }
    } else {
      console.log('⚠️  No .env file found at:', envPath);
      
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️  Production mode: Relying on system environment variables');
        const criticalVars = ['DATABASE_URL', 'ANTHROPIC_API_KEY'];
        const missing = criticalVars.filter(key => !process.env[key]);
        if (missing.length > 0) {
          console.error('❌ Critical environment variables missing from system:', missing);
          console.error('💡 Create .env file or set system environment variables');
        }
      } else {
        console.log('💡 Tip: Copy .env.example to .env and update with your values');
      }
    }
  } catch (error) {
    console.error('❌ Error loading environment variables:', error);
    console.log('⚠️  Continuing with system environment variables');
  }
}

// Load environment variables immediately
loadEnvironmentVariables();

// Helper function to validate and decode database URL
function validateDatabaseUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Check if URL needs decoding (contains encoded characters like %40)
    if (url.includes('%')) {
      // Decode the entire URL
      const decodedUrl = decodeURIComponent(url);
      console.log('✓ Decoded database URL successfully');
      return decodedUrl;
    }
    
    // Validate basic PostgreSQL URL format - allow various formats
    const urlPattern = /^postgresql:\/\/[^:]+:[^@]*@[^:]+:\d+\/\w+$/;
    if (!urlPattern.test(url)) {
      console.warn('⚠️  Database URL format validation failed. URL format:', url.replace(/:([^@]+)@/, ':****@'));
      console.warn('   Expected format: postgresql://user:password@host:port/database');
      console.warn('   Your format appears to be: postgresql://postgres:post123@host:5432/postgres');
    } else {
      console.log('✓ Database URL format validated successfully');
    }
    
    return url;
  } catch (error) {
    console.error('❌ Error processing database URL:', error);
    return url;
  }
}

export const ENV = {
  // Database - with validation and decoding
  DATABASE_URL: validateDatabaseUrl(process.env.DATABASE_URL || ''),
  
  // AI Services
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  
  // Application - Hardcoded for consistent deployment
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: 5000, // Hardcoded to ensure consistent port
  HOST: '0.0.0.0', // Hardcoded to ensure app is accessible from all IPs
  
  // Session Security
  SESSION_SECRET: process.env.SESSION_SECRET || 'matt-dev-secret-change-in-production',
  
  // Configuration Path
  CONFIG_PATH: process.env.CONFIG_PATH || './config/settings.json',
  
  // File Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '50MB',
  
  // Optional Integrations
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || '',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || ''
};

// Validation function with detailed error messages
export function validateEnvironment() {
  console.log('\n🔍 Validating environment configuration...');
  
  const required: Array<{key: keyof typeof ENV, message: string}> = [
    { key: 'DATABASE_URL', message: 'Database connection URL (postgresql://...)' },
    { key: 'ANTHROPIC_API_KEY', message: 'Anthropic API key for AI services' }
  ];
  
  const missing = required.filter(item => !ENV[item.key]);
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(item => {
      console.error(`   - ${item.key}: ${item.message}`);
    });
    console.error('\n📋 Please ensure these variables are set in your .env file or system environment.');
    console.error('💡 See .env.example for the correct format.\n');
    return false;
  }
  
  // Validate DATABASE_URL format
  if (ENV.DATABASE_URL && !ENV.DATABASE_URL.startsWith('postgresql://')) {
    console.error('❌ Invalid DATABASE_URL format. Must start with postgresql://');
    return false;
  }
  
  // Validate ANTHROPIC_API_KEY format
  if (ENV.ANTHROPIC_API_KEY && !ENV.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    console.warn('⚠️  ANTHROPIC_API_KEY may be invalid. Expected format: sk-ant-...');
  }
  
  // Security warnings
  if (ENV.NODE_ENV === 'production') {
    if (ENV.SESSION_SECRET === 'matt-dev-secret-change-in-production') {
      console.error('❌ CRITICAL: Using default session secret in production!');
      console.error('   This is a security risk. Please set a unique SESSION_SECRET.');
      return false;
    }
  }
  
  console.log('✅ Environment validation passed!\n');
  return true;
}

// Initialize directories
export function initializeDirectories() {
  const dirs = [
    ENV.UPLOAD_DIR,
    'logs',
    'backups',
    path.dirname(ENV.CONFIG_PATH) // Ensure config directory exists
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      } catch (error) {
        console.error(`❌ Failed to create directory ${dir}:`, error);
      }
    }
  });
}

// Load optional configuration file
export function loadConfigFile() {
  if (ENV.CONFIG_PATH && fs.existsSync(ENV.CONFIG_PATH)) {
    try {
      const configContent = fs.readFileSync(ENV.CONFIG_PATH, 'utf-8');
      const config = JSON.parse(configContent);
      console.log(`📄 Loaded configuration from ${ENV.CONFIG_PATH}`);
      return config;
    } catch (error) {
      console.error(`❌ Failed to load config file ${ENV.CONFIG_PATH}:`, error);
    }
  }
  return {};
}

// Export a helper to check if all required services are configured
export function checkServiceConnections() {
  const services = {
    database: !!ENV.DATABASE_URL,
    anthropic: !!ENV.ANTHROPIC_API_KEY,
    googleDrive: !!(ENV.GOOGLE_CLIENT_ID && ENV.GOOGLE_CLIENT_SECRET),
    jira: !!ENV.JIRA_API_TOKEN,
    github: !!ENV.GITHUB_TOKEN
  };
  
  console.log('\n🔌 Service Connections:');
  console.log(`   ✅ Database: ${services.database ? 'Configured' : 'Not configured'}`);
  console.log(`   ✅ Anthropic AI: ${services.anthropic ? 'Configured' : 'Not configured'}`);
  console.log(`   ${services.googleDrive ? '✅' : '⚠️ '} Google Drive: ${services.googleDrive ? 'Configured' : 'Optional - not configured'}`);
  console.log(`   ${services.jira ? '✅' : '⚠️ '} JIRA: ${services.jira ? 'Configured' : 'Optional - not configured'}`);
  console.log(`   ${services.github ? '✅' : '⚠️ '} GitHub: ${services.github ? 'Configured' : 'Optional - not configured'}\n`);
  
  return services;
}