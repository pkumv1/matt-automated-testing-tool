// Performance monitoring utility for MATT application
import { logger } from "../logger";

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000; // Keep last 1000 metrics in memory

  // Monitor a function execution time
  async monitor<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        operation,
        duration,
        timestamp: new Date(),
        metadata
      });

      // Log slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${operation} took ${duration}ms`, metadata);
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.recordMetric({
        operation: `${operation}_ERROR`,
        duration,
        timestamp: new Date(),
        metadata: { ...metadata, error: error instanceof Error ? error.message : error }
      });

      throw error;
    }
  }

  // Record a performance metric
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  // Get performance statistics
  getStats(operation?: string): {
    count: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    recentMetrics: PerformanceMetrics[];
  } {
    const relevantMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        recentMetrics: []
      };
    }

    const durations = relevantMetrics.map(m => m.duration);
    
    return {
      count: relevantMetrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      recentMetrics: relevantMetrics.slice(-10) // Last 10 metrics
    };
  }

  // Get all metrics for debugging
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
  }

  // Get slow operations report
  getSlowOperationsReport(thresholdMs: number = 1000): {
    operation: string;
    count: number;
    avgDuration: number;
    maxDuration: number;
  }[] {
    const slowMetrics = this.metrics.filter(m => m.duration > thresholdMs);
    const groupedByOperation = new Map<string, number[]>();

    slowMetrics.forEach(metric => {
      if (!groupedByOperation.has(metric.operation)) {
        groupedByOperation.set(metric.operation, []);
      }
      groupedByOperation.get(metric.operation)!.push(metric.duration);
    });

    return Array.from(groupedByOperation.entries()).map(([operation, durations]) => ({
      operation,
      count: durations.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations)
    })).sort((a, b) => b.avgDuration - a.avgDuration);
  }
}

export const performanceMonitor = new PerformanceMonitor();