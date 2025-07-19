/**
 * Comprehensive API Type Definitions for MATT Application
 * Provides type safety for all API responses and React Query data
 */

import type { Project, Analysis, TestCase, Agent, Recommendation } from './schema';

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// =============================================================================
// Project Types
// =============================================================================

export interface ProjectWithStats extends Project {
  testCaseCount?: number;
  analysisCount?: number;
  lastAnalysisDate?: Date;
  successRate?: number;
}

export interface ProjectAnalysisData {
  project: Project;
  analyses: Analysis[];
  testCases: TestCase[];
  recommendations: Recommendation[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  coveragePercentage: number;
}

// =============================================================================
// Test Case Types
// =============================================================================

export interface TestCaseWithResults extends TestCase {
  framework?: string;
  script?: string;
  expectedOutcome?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  lastRun?: Date;
  runCount?: number;
}

export interface TestExecutionResult {
  testId: number;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  output: string;
  error?: string;
  timestamp: Date;
}

// =============================================================================
// Analysis Types
// =============================================================================

export interface AnalysisResult {
  type: string;
  findings: AnalysisFinding[];
  summary: AnalysisSummary;
  recommendations: string[];
  timestamp: Date;
}

export interface AnalysisFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'performance' | 'quality' | 'accessibility';
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface AnalysisSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  score: number;
  categories: {
    security: number;
    performance: number;
    quality: number;
    accessibility: number;
  };
}

// =============================================================================
// Agent Types
// =============================================================================

export interface AgentWithCapabilities extends Agent {
  isActive: boolean;
  workload: number;
  lastTaskDuration?: number;
  successRate?: number;
  specializations: string[];
}

export interface MCPAgentCapability {
  name: string;
  type: string;
  frameworks: string[];
  tools: string[];
  maxConcurrency: number;
  status: 'available' | 'busy' | 'error' | 'offline';
}

// =============================================================================
// GitHub Integration Types
// =============================================================================

export interface GitHubRepository {
  owner: string;
  repo: string;
  branch: string;
  url: string;
  private: boolean;
  language: string;
  size: number;
  lastUpdated: Date;
}

export interface GitHubAnalysisRequest {
  repositoryUrl: string;
  branch?: string;
  analysisTypes: string[];
  includeTests: boolean;
  testFrameworks: string[];
}

// =============================================================================
// Multi-Platform Testing Types
// =============================================================================

export interface PlatformTestScript {
  id: string;
  name: string;
  platform: string;
  framework: string;
  script: string;
  configuration: Record<string, any>;
  environment: string;
  tags: string[];
}

export interface PlatformTestResult {
  scriptId: string;
  platform: string;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  output: string;
  errors: string[];
  duration: number;
  metrics: {
    performance?: number;
    coverage?: number;
    accessibility?: number;
    security?: number;
  };
  screenshots?: string[];
  logs: string[];
  timestamp: Date;
}

// =============================================================================
// Error Types
// =============================================================================

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// =============================================================================
// Query Keys for React Query
// =============================================================================

export const queryKeys = {
  projects: ['projects'] as const,
  project: (id: number) => ['projects', id] as const,
  projectAnalyses: (id: number) => ['projects', id, 'analyses'] as const,
  projectTestCases: (id: number) => ['projects', id, 'testCases'] as const,
  projectRecommendations: (id: number) => ['projects', id, 'recommendations'] as const,
  agents: ['agents'] as const,
  testExecution: (projectId: number) => ['testExecution', projectId] as const,
  githubRepos: ['github', 'repos'] as const,
  testResults: (projectId: number) => ['testResults', projectId] as const,
} as const;

// =============================================================================
// Utility Types
// =============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStateWithData<T> {
  state: LoadingState;
  data?: T;
  error?: string;
}

// =============================================================================
// Hook Return Types
// =============================================================================

export interface UseProjectsReturn {
  projects: ProjectWithStats[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseProjectAnalysisReturn {
  data: ProjectAnalysisData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// =============================================================================
// Component Prop Types
// =============================================================================

export interface DashboardProps {
  activeProject: Project | null;
  projects: ProjectWithStats[];
  agents: AgentWithCapabilities[];
  testCases: TestCaseWithResults[];
  onProjectSelect: (project: Project) => void;
  onNewProject: () => void;
  onStartAnalysis: () => void;
  onTabChange?: (tab: string) => void;
}

export interface TestGenerationProps {
  project: Project;
  existingTests: TestCaseWithResults[];
  frameworks: string[];
  onTestsGenerated: (tests: TestCase[]) => void;
  onError: (error: string) => void;
}

// =============================================================================
// Advanced Analytics Types
// =============================================================================

export interface AnalyticsMetric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface QualityGate {
  id: string;
  name: string;
  criteria: QualityGateCriteria[];
  status: 'passed' | 'failed' | 'warning';
  projectId: number;
}

export interface QualityGateCriteria {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  actualValue: number;
  status: 'passed' | 'failed' | 'warning';
}

export interface TestOptimization {
  testId: number;
  optimization: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  description: string;
  estimatedTimeReduction: number;
}

// =============================================================================
// Export all types
// =============================================================================

export type {
  // Re-export schema types
  Project,
  Analysis,
  TestCase,
  Agent,
  Recommendation,
};