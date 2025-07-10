// Environment configuration for MATT application
import fs from 'fs';

// Load environment variables from .env file if it exists
if (fs.existsSync('.env')) {
  const dotenv = await import('dotenv');
  dotenv.config();
}

export const ENV = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // AI Services
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000'),
  
  // Session Security
  SESSION_SECRET: process.env.SESSION_SECRET || 'matt-dev-secret-change-in-production',
  
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

// Validation function
export function validateEnvironment() {
  const required = ['DATABASE_URL', 'ANTHROPIC_API_KEY'];
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.error('Please check your .env file and ensure all required variables are set.');
    return false;
  }
  
  if (ENV.NODE_ENV === 'production' && ENV.SESSION_SECRET === 'matt-dev-secret-change-in-production') {
    console.warn('⚠️ Using default session secret in production. Please set SESSION_SECRET environment variable.');
  }
  
  return true;
}

// Initialize directories
export function initializeDirectories() {
  const dirs = [
    ENV.UPLOAD_DIR,
    'logs',
    'backups'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}