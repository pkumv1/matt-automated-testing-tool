/**
 * Type-safe API client utilities for MATT Application
 * Provides comprehensive type safety for all API calls and React Query integration
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Project,
  Analysis,
  TestCase,
  Agent,
  Recommendation,
  ProjectWithStats,
  ProjectAnalysisData,
  TestCaseWithResults,
  AgentWithCapabilities,
  ApiResponse,
  PaginatedResponse,
  TestExecutionResult,
  AnalysisResult,
  PlatformTestResult,
} from '@shared/api-types';
import { queryKeys } from '@shared/api-types';

// =============================================================================
// API Client Functions
// =============================================================================

class ApiClient {
  private baseUrl = '/api';

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  // Project endpoints
  async getProjects(lightweight = true): Promise<ProjectWithStats[]> {
    return this.request<ProjectWithStats[]>(`/projects?lightweight=${lightweight}`);
  }

  async getProject(id: number): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: number): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Analysis endpoints
  async getProjectAnalyses(projectId: number): Promise<Analysis[]> {
    return this.request<Analysis[]>(`/projects/${projectId}/analyses`);
  }

  async startAnalysis(projectId: number, options?: any): Promise<Analysis> {
    return this.request<Analysis>(`/projects/${projectId}/analyze`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getAnalysisResults(analysisId: number): Promise<AnalysisResult> {
    return this.request<AnalysisResult>(`/analyses/${analysisId}/results`);
  }

  // Test Case endpoints
  async getProjectTestCases(projectId: number): Promise<TestCaseWithResults[]> {
    return this.request<TestCaseWithResults[]>(`/projects/${projectId}/test-cases`);
  }

  async generateTestCases(projectId: number, options: any): Promise<TestCase[]> {
    return this.request<TestCase[]>(`/projects/${projectId}/generate-tests`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async runTestSuite(projectId: number): Promise<TestExecutionResult[]> {
    return this.request<TestExecutionResult[]>(`/projects/${projectId}/run-tests`, {
      method: 'POST',
    });
  }

  // Agent endpoints
  async getAgents(): Promise<AgentWithCapabilities[]> {
    return this.request<AgentWithCapabilities[]>('/agents');
  }

  async updateAgentStatus(id: number, status: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Recommendation endpoints
  async getProjectRecommendations(projectId: number): Promise<Recommendation[]> {
    return this.request<Recommendation[]>(`/projects/${projectId}/recommendations`);
  }

  // GitHub Integration
  async importGitHubProject(options: any): Promise<Project> {
    return this.request<Project>('/github/import', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // Multi-platform Testing
  async runPlatformTests(projectId: number, platforms: string[]): Promise<PlatformTestResult[]> {
    return this.request<PlatformTestResult[]>(`/projects/${projectId}/platform-tests`, {
      method: 'POST',
      body: JSON.stringify({ platforms }),
    });
  }
}

export const apiClient = new ApiClient();

// =============================================================================
// React Query Hooks
// =============================================================================

// Project hooks
export function useProjects(lightweight = true) {
  return useQuery({
    queryKey: [...queryKeys.projects, lightweight],
    queryFn: () => apiClient.getProjects(lightweight),
    staleTime: 30000, // 30 seconds
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => apiClient.getProject(id),
    enabled: !!id,
  });
}

export function useProjectAnalysis(projectId: number) {
  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => apiClient.getProject(projectId),
    enabled: !!projectId,
  });

  const analysesQuery = useQuery({
    queryKey: queryKeys.projectAnalyses(projectId),
    queryFn: () => apiClient.getProjectAnalyses(projectId),
    enabled: !!projectId,
  });

  const testCasesQuery = useQuery({
    queryKey: queryKeys.projectTestCases(projectId),
    queryFn: () => apiClient.getProjectTestCases(projectId),
    enabled: !!projectId,
  });

  const recommendationsQuery = useQuery({
    queryKey: queryKeys.projectRecommendations(projectId),
    queryFn: () => apiClient.getProjectRecommendations(projectId),
    enabled: !!projectId,
  });

  const isLoading = projectQuery.isLoading || analysesQuery.isLoading || 
                   testCasesQuery.isLoading || recommendationsQuery.isLoading;
  
  const error = projectQuery.error || analysesQuery.error || 
                testCasesQuery.error || recommendationsQuery.error;

  const data: ProjectAnalysisData | null = projectQuery.data ? {
    project: projectQuery.data,
    analyses: analysesQuery.data || [],
    testCases: testCasesQuery.data || [],
    recommendations: recommendationsQuery.data || [],
    totalTests: testCasesQuery.data?.length || 0,
    passedTests: testCasesQuery.data?.filter(tc => tc.status === 'passed').length || 0,
    failedTests: testCasesQuery.data?.filter(tc => tc.status === 'failed').length || 0,
    coveragePercentage: 0, // Calculate based on results
  } : null;

  return {
    data,
    isLoading,
    error: error?.message || null,
    refetch: () => {
      projectQuery.refetch();
      analysesQuery.refetch();
      testCasesQuery.refetch();
      recommendationsQuery.refetch();
    },
  };
}

// Test Case hooks
export function useProjectTestCases(projectId: number) {
  return useQuery({
    queryKey: queryKeys.projectTestCases(projectId),
    queryFn: () => apiClient.getProjectTestCases(projectId),
    enabled: !!projectId,
  });
}

// Agent hooks
export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: () => apiClient.getAgents(),
    staleTime: 60000, // 1 minute
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (project: Partial<Project>) => apiClient.createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Project> }) => 
      apiClient.updateProject(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.id) });
    },
  });
}

export function useStartAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, options }: { projectId: number; options?: any }) => 
      apiClient.startAnalysis(projectId, options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projectAnalyses(variables.projectId) 
      });
    },
  });
}

export function useGenerateTestCases() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, options }: { projectId: number; options: any }) => 
      apiClient.generateTestCases(projectId, options),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.projectTestCases(variables.projectId) 
      });
    },
  });
}

export function useRunTestSuite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (projectId: number) => apiClient.runTestSuite(projectId),
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.testResults(projectId) 
      });
    },
  });
}

export function useImportGitHubProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (options: any) => apiClient.importGitHubProject(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function isApiError(error: unknown): error is Error {
  return error instanceof Error;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isProject(data: unknown): data is Project {
  return typeof data === 'object' && data !== null && 'id' in data && 'name' in data;
}

export function isTestCase(data: unknown): data is TestCase {
  return typeof data === 'object' && data !== null && 'id' in data && 'name' in data && 'projectId' in data;
}

export function isAnalysis(data: unknown): data is Analysis {
  return typeof data === 'object' && data !== null && 'id' in data && 'type' in data;
}

// =============================================================================
// Data Transformation Utilities
// =============================================================================

export function transformTestCaseData(data: unknown): TestCaseWithResults[] {
  if (!Array.isArray(data)) return [];
  
  return data
    .filter(isTestCase)
    .map(tc => ({
      ...tc,
      framework: tc.type || 'unknown',
      script: tc.testScript || '',
      expectedOutcome: 'Pass',
      estimatedDuration: tc.executionTime || 0,
    }));
}

export function transformProjectData(data: unknown): ProjectWithStats[] {
  if (!Array.isArray(data)) return [];
  
  return data
    .filter(isProject)
    .map(project => ({
      ...project,
      testCaseCount: 0,
      analysisCount: 0,
      successRate: 0,
    }));
}

export { queryKeys } from '@shared/api-types';