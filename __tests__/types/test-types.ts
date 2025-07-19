/**
 * Test Type Definitions
 * Resolves missing test data type definitions
 */

import type { Project, TestCase as BaseTestCase, Analysis, Agent, Recommendation } from '@shared/schema';

// Test data interfaces
export interface TestProject extends Project {
  testId?: string;
  mockData?: boolean;
}

export interface TestAnalysis extends Analysis {
  testId?: string;
  mockData?: boolean;
}

export interface TestTestCase extends BaseTestCase {
  testId?: string;
  mockData?: boolean;
}

export interface TestAgent extends Agent {
  testId?: string;
  mockData?: boolean;
}

export interface TestRecommendation extends Recommendation {
  testId?: string;
  mockData?: boolean;
}

// Test response types
export interface TestApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// Mock data generators
export function createMockProject(overrides: Partial<TestProject> = {}): TestProject {
  return {
    id: 1,
    name: 'Test Project',
    description: 'Test project description',
    sourceType: 'github',
    sourceUrl: 'https://github.com/test/repo',
    repositoryData: { owner: 'test', repo: 'repo', branch: 'main' },
    analysisStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
    testId: 'test-project-1',
    mockData: true,
    ...overrides,
  };
}

export function createMockTestCase(overrides: Partial<TestTestCase> = {}): TestTestCase {
  return {
    id: 1,
    name: 'Test Case 1',
    type: 'functional',
    description: 'Test case description',
    projectId: 1,
    priority: 'high',
    status: 'pending',
    testScript: 'console.log("test");',
    generatedBy: 'test-agent',
    executionTime: 100,
    results: null,
    testId: 'test-case-1',
    mockData: true,
    ...overrides,
  };
}

export function createMockAnalysis(overrides: Partial<TestAnalysis> = {}): TestAnalysis {
  return {
    id: 1,
    type: 'security',
    projectId: 1,
    agentId: 'test-agent',
    status: 'pending',
    results: { findings: [], summary: 'Test analysis' },
    startedAt: new Date(),
    completedAt: null,
    testId: 'test-analysis-1',
    mockData: true,
    ...overrides,
  };
}

export function createMockAgent(overrides: Partial<TestAgent> = {}): TestAgent {
  return {
    id: 1,
    name: 'Test Agent',
    type: 'analyzer',
    status: 'ready',
    capabilities: { analysis: true, testing: true },
    lastActivity: new Date(),
    testId: 'test-agent-1',
    mockData: true,
    ...overrides,
  };
}

export function createMockRecommendation(overrides: Partial<TestRecommendation> = {}): TestRecommendation {
  return {
    id: 1,
    projectId: 1,
    title: 'Test Recommendation',
    description: 'Test recommendation description',
    category: 'performance',
    priority: 'high',
    actionable: true,
    implemented: false,
    testId: 'test-recommendation-1',
    mockData: true,
    ...overrides,
  };
}

// Test utilities
export function createMockApiResponse<T>(
  data: T,
  success = true,
  statusCode = 200
): TestApiResponse<T> {
  return {
    success,
    data,
    statusCode,
    message: success ? 'Success' : 'Error',
  };
}

export function createMockErrorResponse(
  message = 'Test error',
  statusCode = 500
): TestApiResponse {
  return {
    success: false,
    error: message,
    statusCode,
  };
}

// Jest mock helpers
export const mockQueryClient = {
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  refetchQueries: jest.fn(),
  clear: jest.fn(),
};

export const mockToast = {
  toast: jest.fn(),
  dismiss: jest.fn(),
};

// React Query mock helpers
export function createMockUseQuery<T>(
  data: T,
  isLoading = false,
  error: Error | null = null
) {
  return {
    data,
    isLoading,
    error,
    isError: !!error,
    isSuccess: !error && !isLoading,
    refetch: jest.fn(),
    remove: jest.fn(),
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: error ? Date.now() : 0,
  };
}

export function createMockUseMutation<TData = any, TError = Error, TVariables = void>(
  onSuccess?: (data: TData, variables: TVariables) => void,
  onError?: (error: TError, variables: TVariables) => void
) {
  return {
    mutate: jest.fn((variables: TVariables) => {
      // Simulate async operation
      setTimeout(() => {
        if (onSuccess) {
          onSuccess({} as TData, variables);
        }
      }, 0);
    }),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
    reset: jest.fn(),
  };
}

// Server test helpers
export interface MockRequest {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
  user?: any;
}

export interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  end: jest.Mock;
  locals: Record<string, any>;
}

export function createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  };
}

export function createMockResponse(): MockResponse {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    locals: {},
  };
  return res;
}

export const mockNext = jest.fn();

// Component testing helpers
export interface ComponentTestProps {
  project?: TestProject;
  projects?: TestProject[];
  testCases?: TestCase[];
  analyses?: TestAnalysis[];
  agents?: TestAgent[];
  onProjectSelect?: jest.Mock;
  onNewProject?: jest.Mock;
  onStartAnalysis?: jest.Mock;
}

export function createMockComponentProps(
  overrides: Partial<ComponentTestProps> = {}
): ComponentTestProps {
  return {
    project: createMockProject(),
    projects: [createMockProject()],
    testCases: [createMockTestCase()],
    analyses: [createMockAnalysis()],
    agents: [createMockAgent()],
    onProjectSelect: jest.fn(),
    onNewProject: jest.fn(),
    onStartAnalysis: jest.fn(),
    ...overrides,
  };
}

// Type exports for tests
export type MockFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;
export type MockObject<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? MockFunction<T[K]>
    : T[K];
};