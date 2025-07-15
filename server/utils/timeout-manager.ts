import { logger } from '../logger';

interface TimeoutInfo {
  timeout: NodeJS.Timeout;
  createdAt: number;
  description: string;
}

class TimeoutManager {
  private activeTimeouts = new Map<string, TimeoutInfo>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly maxAge = 3600000; // 1 hour max age for any timeout

  constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Create a managed timeout with automatic cleanup
   */
  createTimeout(key: string, callback: () => void, delay: number, description?: string): void {
    // Clear existing timeout if it exists
    this.clearTimeout(key);

    const timeout = setTimeout(() => {
      this.activeTimeouts.delete(key);
      try {
        callback();
      } catch (error) {
        logger.error(`Error in timeout callback for ${key}:`, error);
      }
    }, delay);

    this.activeTimeouts.set(key, {
      timeout,
      createdAt: Date.now(),
      description: description || `Timeout ${key}`
    });

    logger.debug(`Created timeout: ${key} (${delay}ms)`);
  }

  /**
   * Clear a specific timeout
   */
  clearTimeout(key: string): boolean {
    const timeoutInfo = this.activeTimeouts.get(key);
    if (timeoutInfo) {
      clearTimeout(timeoutInfo.timeout);
      this.activeTimeouts.delete(key);
      logger.debug(`Cleared timeout: ${key}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all timeouts matching a pattern
   */
  clearTimeoutsMatching(pattern: RegExp): number {
    let cleared = 0;
    for (const [key, timeoutInfo] of this.activeTimeouts.entries()) {
      if (pattern.test(key)) {
        clearTimeout(timeoutInfo.timeout);
        this.activeTimeouts.delete(key);
        cleared++;
      }
    }
    logger.debug(`Cleared ${cleared} timeouts matching pattern: ${pattern}`);
    return cleared;
  }

  /**
   * Get active timeout count
   */
  getActiveCount(): number {
    return this.activeTimeouts.size;
  }

  /**
   * Get timeout statistics
   */
  getStats(): { total: number; byAge: { [key: string]: number } } {
    const now = Date.now();
    const byAge = {
      '< 1min': 0,
      '1-5min': 0,
      '5-15min': 0,
      '> 15min': 0
    };

    for (const [, info] of this.activeTimeouts.entries()) {
      const age = now - info.createdAt;
      if (age < 60000) byAge['< 1min']++;
      else if (age < 300000) byAge['1-5min']++;
      else if (age < 900000) byAge['5-15min']++;
      else byAge['> 15min']++;
    }

    return {
      total: this.activeTimeouts.size,
      byAge
    };
  }

  /**
   * Start periodic cleanup of old timeouts
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldTimeouts();
    }, 300000);
  }

  /**
   * Clean up timeouts older than maxAge
   */
  private cleanupOldTimeouts(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, info] of this.activeTimeouts.entries()) {
      if (now - info.createdAt > this.maxAge) {
        clearTimeout(info.timeout);
        this.activeTimeouts.delete(key);
        cleaned++;
        logger.warn(`Cleaned up old timeout: ${key} (age: ${Math.round((now - info.createdAt) / 1000)}s)`);
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old timeouts. Active: ${this.activeTimeouts.size}`);
    }
  }

  /**
   * Cleanup all timeouts and stop cleanup interval
   */
  destroy(): void {
    // Clear all active timeouts
    for (const [key, info] of this.activeTimeouts.entries()) {
      clearTimeout(info.timeout);
    }
    this.activeTimeouts.clear();

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    logger.info('TimeoutManager destroyed');
  }
}

// Export singleton instance
export const timeoutManager = new TimeoutManager();

// Graceful shutdown handler
process.on('SIGTERM', () => {
  timeoutManager.destroy();
});

process.on('SIGINT', () => {
  timeoutManager.destroy();
});