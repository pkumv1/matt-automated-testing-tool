/**
 * Type-Safe Component Utilities
 * Provides safe access to unknown data from React Query
 */

import { isArray, isObject, isString, isNumber } from '@shared/type-utils';

// Test Case interfaces
export interface SafeTestCase {
  id: number;
  name: string;
  type: string;
  priority: string;
  status?: string;
  description?: string;
  testScript?: string;
  framework?: string;
  script?: string;
  expectedOutcome?: string;
  executionTime?: number;
  projectId?: number;
  generatedBy?: string;
  results?: unknown;
}

export interface SafeAnalysis {
  id: number;
  type: string;
  results?: unknown;
  status?: string;
  projectId?: number;
  agentId?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface SafeAgent {
  id: number;
  name: string;
  type: string;
  status?: string;
  capabilities?: unknown;
  lastActivity?: Date;
}

export interface SafeProject {
  id: number;
  name: string;
  description?: string;
  sourceType: string;
  sourceUrl?: string;
  repositoryData?: unknown;
  analysisStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Type-safe data transformers
export function transformToSafeTestCases(data: unknown): SafeTestCase[] {
  if (!isArray(data)) return [];
  
  return data
    .filter(isObject)
    .map((item): SafeTestCase => ({
      id: isNumber(item.id) ? item.id : 0,
      name: isString(item.name) ? item.name : 'Unnamed Test',
      type: isString(item.type) ? item.type : 'unknown',
      priority: isString(item.priority) ? item.priority : 'medium',
      status: isString(item.status) ? item.status : undefined,
      description: isString(item.description) ? item.description : undefined,
      testScript: isString(item.testScript) ? item.testScript : undefined,
      framework: isString(item.framework) ? item.framework : undefined,
      script: isString(item.script) ? item.script : undefined,
      expectedOutcome: isString(item.expectedOutcome) ? item.expectedOutcome : undefined,
      executionTime: isNumber(item.executionTime) ? item.executionTime : undefined,
      projectId: isNumber(item.projectId) ? item.projectId : undefined,
      generatedBy: isString(item.generatedBy) ? item.generatedBy : undefined,
      results: item.results,
    }))
    .filter(item => item.id > 0); // Ensure valid items
}

export function transformToSafeAnalyses(data: unknown): SafeAnalysis[] {
  if (!isArray(data)) return [];
  
  return data
    .filter(isObject)
    .map((item): SafeAnalysis => ({
      id: isNumber(item.id) ? item.id : 0,
      type: isString(item.type) ? item.type : 'unknown',
      results: item.results,
      status: isString(item.status) ? item.status : undefined,
      projectId: isNumber(item.projectId) ? item.projectId : undefined,
      agentId: isString(item.agentId) ? item.agentId : undefined,
      startedAt: item.startedAt instanceof Date ? item.startedAt : undefined,
      completedAt: item.completedAt instanceof Date ? item.completedAt : undefined,
    }))
    .filter(item => item.id > 0);
}

export function transformToSafeAgents(data: unknown): SafeAgent[] {
  if (!isArray(data)) return [];
  
  return data
    .filter(isObject)
    .map((item): SafeAgent => ({
      id: isNumber(item.id) ? item.id : 0,
      name: isString(item.name) ? item.name : 'Unknown Agent',
      type: isString(item.type) ? item.type : 'unknown',
      status: isString(item.status) ? item.status : undefined,
      capabilities: item.capabilities,
      lastActivity: item.lastActivity instanceof Date ? item.lastActivity : undefined,
    }))
    .filter(item => item.id > 0);
}

export function transformToSafeProjects(data: unknown): SafeProject[] {
  if (!isArray(data)) return [];
  
  return data
    .filter(isObject)
    .map((item): SafeProject => ({
      id: isNumber(item.id) ? item.id : 0,
      name: isString(item.name) ? item.name : 'Unnamed Project',
      description: isString(item.description) ? item.description : undefined,
      sourceType: isString(item.sourceType) ? item.sourceType : 'unknown',
      sourceUrl: isString(item.sourceUrl) ? item.sourceUrl : undefined,
      repositoryData: item.repositoryData,
      analysisStatus: isString(item.analysisStatus) ? item.analysisStatus : undefined,
      createdAt: item.createdAt instanceof Date ? item.createdAt : undefined,
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt : undefined,
    }))
    .filter(item => item.id > 0);
}

// Safe property accessors
export function getSafeProperty<T>(obj: unknown, property: string, fallback: T): T {
  if (!isObject(obj)) return fallback;
  const value = obj[property];
  return value !== undefined ? value as T : fallback;
}

export function getSafeStringProperty(obj: unknown, property: string, fallback = ''): string {
  if (!isObject(obj)) return fallback;
  const value = obj[property];
  return isString(value) ? value : fallback;
}

export function getSafeNumberProperty(obj: unknown, property: string, fallback = 0): number {
  if (!isObject(obj)) return fallback;
  const value = obj[property];
  return isNumber(value) ? value : fallback;
}

export function getSafeArrayProperty<T>(obj: unknown, property: string, fallback: T[] = []): T[] {
  if (!isObject(obj)) return fallback;
  const value = obj[property];
  return isArray(value) ? value as T[] : fallback;
}

// Type guards for safer component props
export function isValidTestCase(obj: unknown): obj is SafeTestCase {
  return isObject(obj) && 
         isNumber(obj.id) && 
         obj.id > 0 &&
         isString(obj.name) && 
         isString(obj.type);
}

export function isValidAnalysis(obj: unknown): obj is SafeAnalysis {
  return isObject(obj) && 
         isNumber(obj.id) && 
         obj.id > 0 &&
         isString(obj.type);
}

export function isValidAgent(obj: unknown): obj is SafeAgent {
  return isObject(obj) && 
         isNumber(obj.id) && 
         obj.id > 0 &&
         isString(obj.name) && 
         isString(obj.type);
}

export function isValidProject(obj: unknown): obj is SafeProject {
  return isObject(obj) && 
         isNumber(obj.id) && 
         obj.id > 0 &&
         isString(obj.name) && 
         isString(obj.sourceType);
}

// Component error boundaries helpers
export function handleComponentError(error: unknown, componentName: string): string {
  console.error(`Error in ${componentName}:`, error);
  
  if (error instanceof Error) {
    return `Error in ${componentName}: ${error.message}`;
  }
  
  return `Unknown error occurred in ${componentName}`;
}

// React Query data transformers
export function useTransformedData<T>(
  data: unknown,
  transformer: (data: unknown) => T,
  fallback: T
): T {
  try {
    return data ? transformer(data) : fallback;
  } catch (error) {
    console.warn('Data transformation failed:', error);
    return fallback;
  }
}

// Safe array operations
export function safeFilter<T>(
  array: unknown,
  predicate: (item: T) => boolean,
  fallback: T[] = []
): T[] {
  if (!isArray(array)) return fallback;
  
  try {
    return (array as T[]).filter(predicate);
  } catch (error) {
    console.warn('Safe filter operation failed:', error);
    return fallback;
  }
}

export function safeMap<T, R>(
  array: unknown,
  mapper: (item: T, index: number) => R,
  fallback: R[] = []
): R[] {
  if (!isArray(array)) return fallback;
  
  try {
    return (array as T[]).map(mapper);
  } catch (error) {
    console.warn('Safe map operation failed:', error);
    return fallback;
  }
}

export function safeFind<T>(
  array: unknown,
  predicate: (item: T) => boolean,
  fallback?: T
): T | undefined {
  if (!isArray(array)) return fallback;
  
  try {
    return (array as T[]).find(predicate) || fallback;
  } catch (error) {
    console.warn('Safe find operation failed:', error);
    return fallback;
  }
}

// React Query response helpers
export interface SafeQueryResponse<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
}

export function createSafeQueryResponse<T>(
  data: unknown,
  isLoading: boolean,
  error: unknown,
  transformer: (data: unknown) => T,
  fallback: T
): SafeQueryResponse<T> {
  const transformedData = useTransformedData(data, transformer, fallback);
  
  return {
    data: transformedData,
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    isEmpty: isArray(transformedData) ? (transformedData as unknown[]).length === 0 : !transformedData,
  };
}