#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     MATT Environment Setup Wizard                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

This wizard will help you create a proper .env file with all
required environment variables.
`);

async function encodePassword(password) {
  // Encode special characters for PostgreSQL URL
  return password
    .replace(/@/g, '%40')
    .replace(/#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/:/g, '%3A')
    .replace(/\//g, '%2F')
    .replace(/\?/g, '%3F')
    .replace(/=/g, '%3D')
    .replace(/&/g, '%26');
}

async function setupEnvironment() {
  const envPath = path.resolve(process.cwd(), '.env');
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('\n⚠️  .env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      process.exit(0);
    }
  }

  console.log('\n📝 Please provide the following information:\n');

  // Database configuration
  console.log('1️⃣  DATABASE CONFIGURATION');
  console.log('   Default: postgresql://localhost:5432/postgres\n');
  
  const dbHost = await question('   Database host (localhost): ') || 'localhost';
  const dbPort = await question('   Database port (5432): ') || '5432';
  const dbName = await question('   Database name (postgres): ') || 'postgres';
  const dbUser = await question('   Database username (postgres): ') || 'postgres';
  const dbPassword = await question('   Database password: ');
  
  // Encode password if it contains special characters
  const encodedPassword = await encodePassword(dbPassword);
  const databaseUrl = `postgresql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`;
  
  if (dbPassword !== encodedPassword) {
    console.log('   ✓ Password encoded for special characters');
  }

  // Anthropic API Key
  console.log('\n2️⃣  AI SERVICE CONFIGURATION');
  const anthropicKey = await question('   Anthropic API Key (sk-ant-...): ');
  
  if (!anthropicKey.startsWith('sk-ant-')) {
    console.log('   ⚠️  Warning: API key should start with sk-ant-');
  }

  // Session Secret
  console.log('\n3️⃣  SECURITY CONFIGURATION');
  const sessionSecret = await question('   Session Secret (press Enter to generate): ');
  const finalSessionSecret = sessionSecret || generateRandomSecret();
  
  if (!sessionSecret) {
    console.log('   ✓ Generated random session secret');
  }

  // Optional integrations
  console.log('\n4️⃣  OPTIONAL INTEGRATIONS (press Enter to skip)');
  const googleClientId = await question('   Google Client ID: ');
  const googleClientSecret = await question('   Google Client Secret: ');
  const jiraApiToken = await question('   JIRA API Token: ');
  const githubToken = await question('   GitHub Token: ');

  // Create .env content
  const envContent = `# MATT Environment Configuration
# Generated on ${new Date().toISOString()}

# Database Configuration
DATABASE_URL=${databaseUrl}

# AI Services
ANTHROPIC_API_KEY=${anthropicKey}

# Session Security
SESSION_SECRET=${finalSessionSecret}

# Application Settings
NODE_ENV=development
PORT=5000

# Configuration Path
CONFIG_PATH=./config/settings.json

# File Upload Settings
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB

# Optional Integrations
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}
JIRA_API_TOKEN=${jiraApiToken}
GITHUB_TOKEN=${githubToken}

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL=info
LOG_FILE=
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!');

  // Create config directory and settings file if needed
  const configDir = path.resolve(process.cwd(), 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log('✅ Created config directory');
  }

  const settingsPath = path.resolve(configDir, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    const defaultSettings = {
      app: {
        name: "MATT - Modern Automated Testing Tool",
        version: "1.0.0"
      },
      features: {
        enableGoogleDrive: !!googleClientId,
        enableJira: !!jiraApiToken,
        enableGithub: !!githubToken
      }
    };
    
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
    console.log('✅ Created default settings.json');
  }

  // Test database connection
  console.log('\n🔍 Testing database connection...');
  try {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: databaseUrl });
    await pool.query('SELECT 1');
    await pool.end();
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    console.log('   Please check your database credentials and ensure PostgreSQL is running.');
  }

  console.log('\n🎉 Setup complete! You can now run:');
  console.log('   npm run dev    - for development');
  console.log('   npm run build  - to build for production');
  console.log('   npm start      - to run in production\n');

  rl.close();
}

function generateRandomSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let secret = '';
  for (let i = 0; i < 64; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Run setup
setupEnvironment().catch(error => {
  console.error('\n❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});