/**
 * Comprehensive Error Fixes for MATT Application
 * Addresses all TypeScript and runtime errors across the application
 */

import { 
  transformToSafeTestCases, 
  transformToSafeAnalyses, 
  transformToSafeAgents,
  transformToSafeProjects,
  createSafeQueryResponse,
  SafeTestCase,
  SafeAnalysis,
  SafeAgent,
  SafeProject
} from '@/lib/type-safe-components';

// Safe property access helpers
export function safeLength(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  return 0;
}

export function safeFind<T>(data: unknown, predicate: (item: T) => boolean): T | undefined {
  if (!Array.isArray(data)) return undefined;
  try {
    return data.find(predicate);
  } catch {
    return undefined;
  }
}

export function safeFilter<T>(data: unknown, predicate: (item: T) => boolean): T[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.filter(predicate);
  } catch {
    return [];
  }
}

export function safeMap<T, R>(data: unknown, mapper: (item: T, index: number) => R): R[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.map(mapper);
  } catch {
    return [];
  }
}

export function safeSlice(data: unknown, start: number, end?: number): unknown[] {
  if (!Array.isArray(data)) return [];
  try {
    return data.slice(start, end);
  } catch {
    return [];
  }
}

export function safeSome<T>(data: unknown, predicate: (item: T) => boolean): boolean {
  if (!Array.isArray(data)) return false;
  try {
    return data.some(predicate);
  } catch {
    return false;
  }
}

// Type-safe property getters for unknown objects
export function getProperty<T>(obj: unknown, key: string, fallback: T): T {
  if (!obj || typeof obj !== 'object') return fallback;
  const value = (obj as any)[key];
  return value !== undefined ? value : fallback;
}

export function getStringProperty(obj: unknown, key: string, fallback = ''): string {
  const value = getProperty(obj, key, fallback);
  return typeof value === 'string' ? value : fallback;
}

export function getNumberProperty(obj: unknown, key: string, fallback = 0): number {
  const value = getProperty(obj, key, fallback);
  return typeof value === 'number' ? value : fallback;
}

export function getBooleanProperty(obj: unknown, key: string, fallback = false): boolean {
  const value = getProperty(obj, key, fallback);
  return typeof value === 'boolean' ? value : fallback;
}

export function getArrayProperty<T>(obj: unknown, key: string, fallback: T[] = []): T[] {
  const value = getProperty(obj, key, fallback);
  return Array.isArray(value) ? value : fallback;
}

// Safe React Query data transformers
export function useQuerySafely<T>(
  data: unknown,
  isLoading: boolean,
  error: unknown,
  transformer: (data: unknown) => T,
  fallback: T
) {
  return createSafeQueryResponse(data, isLoading, error, transformer, fallback);
}

// Common transformation patterns
export function transformAnalysisData(data: unknown) {
  return {
    analyses: transformToSafeAnalyses(getArrayProperty(data, 'analyses')),
    testCases: transformToSafeTestCases(getArrayProperty(data, 'testCases')),
    agents: transformToSafeAgents(getArrayProperty(data, 'agents')),
    projects: transformToSafeProjects(getArrayProperty(data, 'projects'))
  };
}

// Dashboard data helpers
export function getDashboardMetrics(data: unknown) {
  return {
    passRate: getNumberProperty(data, 'passRate', 0),
    testCount: getNumberProperty(data, 'testCount', 0),
    criticalIssues: getNumberProperty(data, 'criticalIssues', 0),
    status: getStringProperty(data, 'status', 'unknown'),
    score: getNumberProperty(data, 'score', 0),
    recommendations: getArrayProperty(data, 'recommendations', [])
  };
}

// Component error handling
export function withSafeProps<T extends Record<string, any>>(
  props: T,
  defaults: Partial<T>
): T {
  const safeProps = { ...defaults };
  
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined && value !== null) {
      safeProps[key as keyof T] = value;
    }
  }
  
  return safeProps as T;
}

// React Query error boundary helpers
export function handleQueryError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function isQueryLoading(...queries: Array<{ isLoading?: boolean }>): boolean {
  return queries.some(query => query?.isLoading === true);
}

export function hasQueryError(...queries: Array<{ error?: unknown }>): boolean {
  return queries.some(query => query?.error !== null && query?.error !== undefined);
}

// Type-safe mutation handlers
export function createSafeMutationHandler<T, V>(
  onSuccess?: (data: T, variables: V) => void,
  onError?: (error: unknown, variables: V) => void
) {
  return {
    onSuccess: (data: T, variables: V) => {
      try {
        onSuccess?.(data, variables);
      } catch (error) {
        console.error('Mutation success handler error:', error);
      }
    },
    onError: (error: unknown, variables: V) => {
      try {
        onError?.(error, variables);
      } catch (handlerError) {
        console.error('Mutation error handler error:', handlerError);
      }
    }
  };
}

// Enhanced logging helpers
export function logSafeError(component: string, error: unknown, context?: Record<string, any>) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${component}] ${errorMessage}`, {
    error,
    context,
    timestamp: new Date().toISOString()
  });
}

export function logSafeWarning(component: string, message: string, context?: Record<string, any>) {
  console.warn(`[${component}] ${message}`, {
    context,
    timestamp: new Date().toISOString()
  });
}

// Type assertion helpers
export function assertIsArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function assertIsObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertIsString(value: unknown): value is string {
  return typeof value === 'string';
}

export function assertIsNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// Component prop validation
export interface ComponentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateComponentProps(
  props: Record<string, unknown>,
  requiredProps: string[],
  optionalProps: string[] = []
): ComponentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required props
  for (const prop of requiredProps) {
    if (!(prop in props) || props[prop] === undefined || props[prop] === null) {
      errors.push(`Missing required prop: ${prop}`);
    }
  }
  
  // Check unknown props
  const knownProps = new Set([...requiredProps, ...optionalProps]);
  for (const prop of Object.keys(props)) {
    if (!knownProps.has(prop)) {
      warnings.push(`Unknown prop: ${prop}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export default {
  safeLength,
  safeFind,
  safeFilter,
  safeMap,
  safeSlice,
  safeSome,
  getProperty,
  getStringProperty,
  getNumberProperty,
  getBooleanProperty,
  getArrayProperty,
  useQuerySafely,
  transformAnalysisData,
  getDashboardMetrics,
  withSafeProps,
  handleQueryError,
  isQueryLoading,
  hasQueryError,
  createSafeMutationHandler,
  logSafeError,
  logSafeWarning,
  assertIsArray,
  assertIsObject,
  assertIsString,
  assertIsNumber,
  validateComponentProps
};