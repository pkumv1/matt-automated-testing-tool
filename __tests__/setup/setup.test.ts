// __tests__/setup/setup.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Setup Tests', () => {
  it('should verify test environment is configured correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have test database URL configured', () => {
    expect(process.env.DATABASE_URL).toBe('postgresql://test:test@localhost:5432/test');
  });

  it('should have test session secret configured', () => {
    expect(process.env.SESSION_SECRET).toBe('test-secret');
  });

  it('should have test API key configured', () => {
    expect(process.env.ANTHROPIC_API_KEY).toBe('test-api-key');
  });
});
