/**
 * @file Failure Window - Time-based failure tracking
 * @rule Per REFACTOR-5 - Single Responsibility Principle
 * @description Manages failure timestamps within a time window
 */

export class FailureWindow {
  private timestamps: number[] = [];
  private readonly windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  /**
   * Record a failure at current time
   */
  recordFailure(): void {
    this.timestamps.push(Date.now());
    this.cleanup();
  }

  /**
   * Get count of failures in current window
   */
  getRecentCount(): number {
    this.cleanup();
    return this.timestamps.length;
  }

  /**
   * Clear all failures
   */
  reset(): void {
    this.timestamps = [];
  }

  /**
   * Remove failures outside the time window
   */
  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter(ts => ts > cutoff);
  }
}
