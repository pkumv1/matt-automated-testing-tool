/**
 * Error Boundary and Safe Data Access Components
 * Provides comprehensive error handling for React Query responses
 */

import React from 'react';
import { QueryErrorResetBoundary, useQuery, useMutation } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error} 
          reset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{error.message}</p>
        <Button onClick={reset} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Query Error Boundary with reset
export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary 
          fallback={({ error }) => (
            <DefaultErrorFallback error={error} reset={reset} />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

// Safe data wrapper component
interface SafeDataWrapperProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  children: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ComponentType<{ error: unknown; retry?: () => void }>;
  retry?: () => void;
}

export function SafeDataWrapper<T>({
  data,
  isLoading,
  error,
  children,
  fallback = <div>No data available</div>,
  loadingComponent = <div>Loading...</div>,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  retry,
}: SafeDataWrapperProps<T>) {
  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  if (error) {
    return <ErrorComponent error={error} retry={retry} />;
  }

  if (!data) {
    return <>{fallback}</>;
  }

  try {
    return <>{children(data)}</>;
  } catch (renderError) {
    console.error('Error rendering safe data wrapper:', renderError);
    return <ErrorComponent error={renderError} retry={retry} />;
  }
}

function DefaultErrorComponent({ error, retry }: { error: unknown; retry?: () => void }) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error Loading Data</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{errorMessage}</p>
        {retry && (
          <Button onClick={retry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Safe array renderer
interface SafeArrayRendererProps<T> {
  data: unknown;
  isLoading: boolean;
  error: unknown;
  itemRenderer: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
  retry?: () => void;
}

export function SafeArrayRenderer<T>({
  data,
  isLoading,
  error,
  itemRenderer,
  emptyMessage = 'No items found',
  className,
  retry,
}: SafeArrayRendererProps<T>) {
  return (
    <SafeDataWrapper
      data={Array.isArray(data) ? data as T[] : undefined}
      isLoading={isLoading}
      error={error}
      fallback={<div className={className}>{emptyMessage}</div>}
      retry={retry}
    >
      {(items) => (
        <div className={className}>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {itemRenderer(item, index)}
            </React.Fragment>
          ))}
        </div>
      )}
    </SafeDataWrapper>
  );
}

// React Query hook with error boundary
export function useSafeQuery<T = unknown>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    retry?: boolean | number;
    retryDelay?: number;
    onError?: (error: unknown) => void;
    transform?: (data: unknown) => T;
  } = {}
) {
  const {
    enabled = true,
    staleTime = 30000,
    retry = 3,
    retryDelay = 1000,
    onError,
    transform,
  } = options;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await queryFn();
        return transform ? transform(result) : result;
      } catch (error) {
        onError?.(error);
        throw error;
      }
    },
    enabled,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    ...query,
    safeData: query.data || undefined,
    hasData: !!query.data,
    isEmpty: Array.isArray(query.data) ? query.data.length === 0 : !query.data,
  };
}

// Safe mutation hook
export function useSafeMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
  } = {}
) {
  const { onSuccess, onError, onSettled } = options;

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      try {
        onSuccess?.(data, variables);
      } catch (error) {
        console.error('Error in mutation success handler:', error);
      }
    },
    onError: (error, variables) => {
      console.error('Mutation error:', error);
      try {
        onError?.(error, variables);
      } catch (handlerError) {
        console.error('Error in mutation error handler:', handlerError);
      }
    },
    onSettled: (data, error, variables) => {
      try {
        onSettled?.(data, error, variables);
      } catch (handlerError) {
        console.error('Error in mutation settled handler:', handlerError);
      }
    },
  });
}

// Type-safe property accessor
export function safeGet<T extends Record<string, any>, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  fallback?: T[K]
): T[K] | undefined {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }
  
  try {
    return obj[key] !== undefined ? obj[key] : fallback;
  } catch {
    return fallback;
  }
}

// Safe array access
export function safeArrayAccess<T>(
  array: T[] | null | undefined,
  index: number,
  fallback?: T
): T | undefined {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return fallback;
  }
  
  try {
    return array[index] !== undefined ? array[index] : fallback;
  } catch {
    return fallback;
  }
}

// Component higher-order component with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}