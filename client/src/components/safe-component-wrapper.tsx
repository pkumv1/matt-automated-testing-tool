/**
 * Safe Component Wrapper
 * Provides comprehensive error handling and type safety for all React components
 */

import React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { 
  transformToSafeTestCases,
  transformToSafeAnalyses, 
  transformToSafeAgents,
  transformToSafeProjects,
  createSafeQueryResponse
} from "@/lib/type-safe-components";
import {
  safeLength,
  safeFind,
  safeFilter,
  safeMap,
  getProperty,
  getDashboardMetrics,
  withSafeProps
} from "@/lib/comprehensive-error-fixes";

interface SafeComponentWrapperProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SafeComponentWrapper extends React.Component<SafeComponentWrapperProps, ErrorBoundaryState> {
  constructor(props: SafeComponentWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.componentName || 'component'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Component Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              {this.props.fallbackMessage || 
               `An error occurred in ${this.props.componentName || 'this component'}`}
            </p>
            {this.props.showRetry && (
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                  this.props.onRetry?.();
                }} 
                variant="outline" 
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Enhanced safe data renderer for unknown data
interface SafeDataRendererProps<T> {
  data: unknown;
  isLoading?: boolean;
  error?: unknown;
  transformer: (data: unknown) => T;
  fallback: T;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
}

export function SafeDataRenderer<T>({
  data,
  isLoading = false,
  error,
  transformer,
  fallback,
  children,
  loadingComponent = <div>Loading...</div>,
  errorComponent = <div>Error loading data</div>,
  emptyComponent = <div>No data available</div>,
  className
}: SafeDataRendererProps<T>) {
  if (isLoading) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (error) {
    return <div className={className}>{errorComponent}</div>;
  }

  try {
    const transformedData = transformer(data);
    
    if (!transformedData || (Array.isArray(transformedData) && transformedData.length === 0)) {
      return <div className={className}>{emptyComponent}</div>;
    }

    return (
      <SafeComponentWrapper>
        <div className={className}>
          {children(transformedData)}
        </div>
      </SafeComponentWrapper>
    );
  } catch (transformError) {
    console.error('Data transformation error:', transformError);
    return <div className={className}>{errorComponent}</div>;
  }
}

// Safe list renderer for arrays
interface SafeListRendererProps<T> {
  data: unknown;
  isLoading?: boolean;
  error?: unknown;
  itemRenderer: (item: T, index: number) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  itemClassName?: string;
  transformer?: (data: unknown) => T[];
}

export function SafeListRenderer<T>({
  data,
  isLoading = false,
  error,
  itemRenderer,
  keyExtractor = (_, index) => index,
  emptyMessage = "No items found",
  className,
  itemClassName,
  transformer = (data) => Array.isArray(data) ? data as T[] : []
}: SafeListRendererProps<T>) {
  return (
    <SafeDataRenderer
      data={data}
      isLoading={isLoading}
      error={error}
      transformer={transformer}
      fallback={[] as T[]}
      emptyComponent={<div className="text-center text-muted-foreground py-8">{emptyMessage}</div>}
      className={className}
    >
      {(items) => (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={keyExtractor(item, index)} className={itemClassName}>
              <SafeComponentWrapper componentName={`ListItem-${index}`}>
                {itemRenderer(item, index)}
              </SafeComponentWrapper>
            </div>
          ))}
        </div>
      )}
    </SafeDataRenderer>
  );
}

// Safe dashboard metrics renderer
interface SafeDashboardMetricsProps {
  data: unknown;
  isLoading?: boolean;
  error?: unknown;
  children: (metrics: {
    passRate: number;
    testCount: number;
    criticalIssues: number;
    status: string;
    score: number;
    recommendations: unknown[];
  }) => React.ReactNode;
}

export function SafeDashboardMetrics({
  data,
  isLoading = false,
  error,
  children
}: SafeDashboardMetricsProps) {
  return (
    <SafeDataRenderer
      data={data}
      isLoading={isLoading}
      error={error}
      transformer={getDashboardMetrics}
      fallback={{
        passRate: 0,
        testCount: 0,
        criticalIssues: 0,
        status: 'unknown',
        score: 0,
        recommendations: []
      }}
    >
      {children}
    </SafeDataRenderer>
  );
}

// Query wrapper with error boundary
export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <SafeComponentWrapper
          fallbackMessage="A query error occurred"
          showRetry={true}
          onRetry={reset}
          componentName="QueryBoundary"
        >
          {children}
        </SafeComponentWrapper>
      )}
    </QueryErrorResetBoundary>
  );
}

// Safe props HOC
export function withSafeData<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  propTransformers?: Partial<Record<keyof P, (value: unknown) => any>>,
  defaultProps?: Partial<P>
) {
  return function SafeDataComponent(props: P) {
    const safeProps = withSafeProps(props, defaultProps || {});
    
    // Apply transformers
    if (propTransformers) {
      for (const [key, transformer] of Object.entries(propTransformers)) {
        if (key in safeProps && transformer) {
          try {
            safeProps[key as keyof P] = transformer(safeProps[key as keyof P]);
          } catch (error) {
            console.warn(`Error transforming prop ${key}:`, error);
          }
        }
      }
    }

    return (
      <SafeComponentWrapper componentName={Component.displayName || Component.name}>
        <Component {...safeProps} />
      </SafeComponentWrapper>
    );
  };
}

// Export safe data utilities for use in components
export const safeUtils = {
  length: safeLength,
  find: safeFind,
  filter: safeFilter,
  map: safeMap,
  property: getProperty,
  
  // Safe transformers
  testCases: transformToSafeTestCases,
  analyses: transformToSafeAnalyses,
  agents: transformToSafeAgents,
  projects: transformToSafeProjects,
  
  // Query helpers
  queryResponse: createSafeQueryResponse
};

export default SafeComponentWrapper;