// __mocks__/server/config.ts
// Mock configuration for testing
export const ENV = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  ANTHROPIC_API_KEY: 'test-api-key',
  NODE_ENV: 'test',
  PORT: 5000,
  SESSION_SECRET: 'test-secret',
  CONFIG_PATH: './config/settings.json',
  UPLOAD_DIR: 'uploads',
  MAX_FILE_SIZE: '50MB',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  JIRA_API_TOKEN: '',
  GITHUB_TOKEN: '',
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 900000,
  LOG_LEVEL: 'info',
  LOG_FILE: ''
};

export function validateEnvironment() {
  return true;
}

export function initializeDirectories() {
  // No-op in tests
}

export function loadConfigFile() {
  return {};
}

export function checkServiceConnections() {
  return {
    database: true,
    anthropic: true,
    googleDrive: false,
    jira: false,
    github: false
  };
}
