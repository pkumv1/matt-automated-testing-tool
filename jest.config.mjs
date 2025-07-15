export default {
  projects: [
    {
      displayName: 'server',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/__tests__/api/**/*.+(ts|tsx|js)',
        '<rootDir>/__tests__/services/**/*.+(ts|tsx|js)',
        '<rootDir>/__tests__/integration/**/*.+(ts|tsx|js)'
      ],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      globals: {
        'ts-jest': {
          useESM: true,
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            target: 'ES2022',
            module: 'ES2022',
            moduleResolution: 'node',
            allowJs: true,
            resolveJsonModule: true
          }
        }
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '^@assets/(.*)$': '<rootDir>/client/src/assets/$1',
        '^.*/server/config$': '<rootDir>/__mocks__/server/config.ts',
        '^.*/server/logger$': '<rootDir>/__mocks__/server/logger.ts',
        '^.*/server/vite$': '<rootDir>/__mocks__/server/vite.ts'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
        }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|@anthropic-ai|@langchain)/)'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'client',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/__tests__/components/**/*.+(ts|tsx|js)',
        '<rootDir>/__tests__/setup/**/*.+(ts|tsx|js)'
      ],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      globals: {
        'ts-jest': {
          useESM: true,
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            target: 'ES2022',
            module: 'ES2022',
            moduleResolution: 'node',
            allowJs: true,
            resolveJsonModule: true
          }
        }
      },
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '^@assets/(.*)$': '<rootDir>/client/src/assets/$1',
        '^.*/server/config$': '<rootDir>/__mocks__/server/config.ts',
        '^.*/server/logger$': '<rootDir>/__mocks__/server/logger.ts',
        '^.*/server/vite$': '<rootDir>/__mocks__/server/vite.ts'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
        }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|@anthropic-ai|@langchain)/)'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    }
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    'server/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  }
};
