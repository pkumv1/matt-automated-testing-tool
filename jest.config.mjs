export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@assets/(.*)$': '<rootDir>/client/src/assets/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: '<rootDir>/tsconfig.jest.json'
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|@anthropic-ai|@langchain)/)'
  ],
  roots: ['<rootDir>/__tests__', '<rootDir>/client', '<rootDir>/server'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
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
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  // Use different test environments for different file types
  projects: [
    {
      displayName: 'client',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'jsdom',
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      testMatch: [
        '<rootDir>/__tests__/components/**/*.+(ts|tsx|js)',
        '<rootDir>/__tests__/setup/**/*.+(ts|tsx|js)',
        '<rootDir>/client/**/*.test.+(ts|tsx|js)',
        '<rootDir>/client/**/*.spec.+(ts|tsx|js)'
      ],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '^@assets/(.*)$': '<rootDir>/client/src/assets/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: '<rootDir>/tsconfig.jest.json'
        }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|@anthropic-ai|@langchain)/)'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'server',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      testMatch: [
        '<rootDir>/__tests__/api/**/*.+(ts|tsx|js)',
        '<rootDir>/__tests__/services/**/*.+(ts|tsx|js)',
        '<rootDir>/__tests__/integration/**/*.+(ts|tsx|js)',
        '<rootDir>/server/**/*.test.+(ts|tsx|js)',
        '<rootDir>/server/**/*.spec.+(ts|tsx|js)'
      ],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1',
        '^@assets/(.*)$': '<rootDir>/client/src/assets/$1',
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: '<rootDir>/tsconfig.jest.json'
        }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(nanoid|@anthropic-ai|@langchain)/)'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    }
  ]
};
