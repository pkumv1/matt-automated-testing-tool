# MATT Testing Suite

This directory contains the comprehensive test suite for the MATT (Mars Automated Testing Tool) application.

## Test Structure

```
__tests__/
├── api/                    # API endpoint tests
│   ├── projects.test.ts    # Project CRUD operations
│   └── test-generation.test.ts  # Test generation endpoints
├── components/             # React component tests
│   ├── app.test.tsx       # Main App component
│   └── modern-dashboard.test.tsx  # Dashboard component
├── services/              # Service layer tests
│   └── storage.test.ts    # Storage service tests
├── integration/           # Integration tests
│   └── workflow.test.ts   # End-to-end workflow tests
└── setup/                 # Test utilities
    └── test-utils.tsx     # Testing helpers and custom render
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- __tests__/api/projects.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create a new project"
```

## Test Coverage

Current test coverage targets:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Test Categories

### 1. API Tests (`__tests__/api/`)
- Project CRUD operations
- Test generation endpoints
- File upload handling
- Error scenarios

### 2. Component Tests (`__tests__/components/`)
- Dashboard rendering
- User interactions
- State management
- Route handling

### 3. Service Tests (`__tests__/services/`)
- Database operations
- Business logic
- Data validation

### 4. Integration Tests (`__tests__/integration/`)
- Complete workflow testing
- Multi-step operations
- System integration

## Mocking Strategy

- **Storage**: All database operations are mocked
- **External Services**: AI services (Anthropic) are mocked
- **File System**: File operations are mocked
- **Network**: HTTP requests are intercepted

## CI/CD Integration

Tests run automatically on:
- Push to main branch
- Pull requests
- GitHub Actions workflow

See `.github/workflows/test.yml` for CI configuration.

## Common Test Commands

```bash
# Debug tests
node --inspect-brk node_modules/.bin/jest --runInBand

# Update snapshots
npm test -- -u

# Run tests for changed files only
npm test -- -o

# Run tests with specific reporter
npm test -- --reporters=default --reporters=jest-junit
```

## Writing New Tests

1. Follow the existing test structure
2. Use descriptive test names
3. Mock external dependencies
4. Test both success and failure cases
5. Keep tests isolated and independent

## Test Best Practices

- ✅ Test behavior, not implementation
- ✅ Use meaningful test descriptions
- ✅ Keep tests DRY with shared utilities
- ✅ Mock at the appropriate level
- ✅ Test edge cases and error scenarios
- ❌ Don't test external libraries
- ❌ Avoid testing implementation details
- ❌ Don't create interdependent tests
