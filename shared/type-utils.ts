/**
 * Comprehensive Type Utilities for MATT Application
 * Provides type guards, transformers, and utilities for type safety
 */

// =============================================================================
// Type Guards
// =============================================================================

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  if (!itemGuard) return true;
  return value.every(itemGuard);
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// =============================================================================
// API Response Type Guards
// =============================================================================

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

export function isApiResponse(value: unknown): value is { data?: unknown; error?: string } {
  return isObject(value) && (hasProperty(value, 'data') || hasProperty(value, 'error'));
}

export function isSuccessResponse<T>(
  value: unknown,
  dataGuard?: (data: unknown) => data is T
): value is { data: T } {
  if (!isApiResponse(value) || !hasProperty(value, 'data')) return false;
  if (!dataGuard) return true;
  return dataGuard(value.data);
}

export function isErrorResponse(value: unknown): value is { error: string } {
  return isApiResponse(value) && hasProperty(value, 'error') && isString(value.error);
}

// =============================================================================
// Data Validation Utilities
// =============================================================================

export function validateAndTransform<T>(
  data: unknown,
  validator: (data: unknown) => data is T,
  fallback: T
): T {
  return validator(data) ? data : fallback;
}

export function safeAccess<T>(
  obj: Record<string, unknown>,
  key: string,
  fallback: T
): T {
  const value = obj[key];
  return value !== undefined ? value as T : fallback;
}

export function safeArrayAccess<T>(
  array: unknown[],
  index: number,
  fallback: T
): T {
  return array[index] !== undefined ? array[index] as T : fallback;
}

// =============================================================================
// Type Assertion Utilities
// =============================================================================

export function assertIsString(value: unknown, message = 'Expected string'): asserts value is string {
  if (!isString(value)) {
    throw new Error(`${message}, got ${typeof value}`);
  }
}

export function assertIsNumber(value: unknown, message = 'Expected number'): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(`${message}, got ${typeof value}`);
  }
}

export function assertIsObject(value: unknown, message = 'Expected object'): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new Error(`${message}, got ${typeof value}`);
  }
}

export function assertIsArray<T>(
  value: unknown,
  itemGuard?: (item: unknown) => item is T,
  message = 'Expected array'
): asserts value is T[] {
  if (!isArray(value, itemGuard)) {
    throw new Error(`${message}, got ${typeof value}`);
  }
}

// =============================================================================
// React Query Data Transformers
// =============================================================================

export function transformUnknownToArray<T>(
  data: unknown,
  itemTransformer: (item: unknown) => T | null,
  fallback: T[] = []
): T[] {
  if (!isArray(data)) return fallback;
  
  return data
    .map(itemTransformer)
    .filter((item): item is T => item !== null);
}

export function transformUnknownToObject<T>(
  data: unknown,
  transformer: (data: Record<string, unknown>) => T | null,
  fallback: T | null = null
): T | null {
  if (!isObject(data)) return fallback;
  return transformer(data);
}

// =============================================================================
// Safe Object Access
// =============================================================================

export class SafeObject {
  constructor(private obj: Record<string, unknown>) {}

  getString(key: string, fallback = ''): string {
    const value = this.obj[key];
    return isString(value) ? value : fallback;
  }

  getNumber(key: string, fallback = 0): number {
    const value = this.obj[key];
    return isNumber(value) ? value : fallback;
  }

  getBoolean(key: string, fallback = false): boolean {
    const value = this.obj[key];
    return isBoolean(value) ? value : fallback;
  }

  getArray<T>(key: string, itemGuard?: (item: unknown) => item is T, fallback: T[] = []): T[] {
    const value = this.obj[key];
    return isArray(value, itemGuard) ? value : fallback;
  }

  getObject(key: string): SafeObject | null {
    const value = this.obj[key];
    return isObject(value) ? new SafeObject(value) : null;
  }

  has(key: string): boolean {
    return key in this.obj;
  }

  get raw(): Record<string, unknown> {
    return this.obj;
  }
}

export function createSafeObject(data: unknown): SafeObject | null {
  return isObject(data) ? new SafeObject(data) : null;
}

// =============================================================================
// Index Signature Helpers
// =============================================================================

export type StringIndexed<T> = Record<string, T>;

export function createStringIndexed<T>(obj: Record<string, T>): StringIndexed<T> {
  return obj;
}

export function safeIndexAccess<T>(
  obj: StringIndexed<T>,
  key: string,
  fallback: T
): T {
  return obj[key] ?? fallback;
}

export function hasStringIndex<T>(
  obj: StringIndexed<T>,
  key: string
): key is keyof typeof obj {
  return key in obj;
}

// =============================================================================
// Error Handling Utilities
// =============================================================================

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (isString(error)) return error;
  if (isObject(error) && isString(error.message)) return error.message;
  return 'Unknown error occurred';
}

export function safeStringify(value: unknown, fallback = 'Unable to stringify'): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

// =============================================================================
// Promise Utilities
// =============================================================================

export async function safePromise<T>(
  promise: Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

// =============================================================================
// Date Utilities
// =============================================================================

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function safeDate(value: unknown, fallback = new Date()): Date {
  if (isValidDate(value)) return value;
  if (isString(value) || isNumber(value)) {
    const date = new Date(value);
    return isValidDate(date) ? date : fallback;
  }
  return fallback;
}

// =============================================================================
// Component Props Utilities
// =============================================================================

export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export function withDefaults<T, K extends keyof T>(
  props: T,
  defaults: Pick<T, K>
): T & Required<Pick<T, K>> {
  return { ...defaults, ...props } as T & Required<Pick<T, K>>;
}

// =============================================================================
// Type-safe event handlers
// =============================================================================

export type EventHandler<T = unknown> = (event: T) => void;
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;

export function createEventHandler<T>(
  handler: (event: T) => void,
  validator?: (event: unknown) => event is T
): EventHandler {
  return (event: unknown) => {
    if (!validator || validator(event)) {
      handler(event as T);
    }
  };
}

// =============================================================================
// Debugging Utilities
// =============================================================================

export function debugLog(message: string, data?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data);
  }
}

export function typeCheck<T>(value: unknown, typeName: string): T {
  debugLog(`Type checking for ${typeName}`, value);
  return value as T;
}