/**
 * @file Timeout Enforcement
 * @rule Per PRODUCTION HARDENING - P2: Resilience
 * @description Per-adapter and global timeout enforcement to prevent hanging operations
 * 
 * Timeout Hierarchy:
 * - Per-adapter timeout: Each adapter has its own timeout limit
 * - Global timeout: Overall orchestration must complete within limit
 * - Graceful cancellation: Clean up resources on timeout
 * 
 * Production Use:
 * - Prevents slow adapters from blocking others
 * - Ensures predictable response times
 * - Frees resources from hanging operations
 * - Provides clear timeout errors for debugging
 */

import { createLogger } from './logger.js';
import { metrics } from './metrics.js';

const log = createLogger({ name: 'timeout' });

export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
    public readonly operation: string
  ) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Execute function with timeout
 * 
 * @param fn - Function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param operation - Name of operation (for logging)
 * @returns Result of function or throws TimeoutError
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operation: string = 'operation'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      log.error({
        operation,
        timeout: timeoutMs
      }, 'Operation timed out');
      
      metrics.adapterErrors.inc({
        adapter: operation,
        error_type: 'timeout'
      });
      
      reject(new TimeoutError(
        `Operation '${operation}' timed out after ${timeoutMs}ms`,
        timeoutMs,
        operation
      ));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Execute multiple functions with individual timeouts
 * 
 * Each function has its own timeout, but all run in parallel.
 * Returns partial results - failed/timed-out operations return errors.
 */
export async function withTimeouts<T>(
  operations: Array<{
    fn: () => Promise<T>;
    timeout: number;
    name: string;
  }>
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  const promises = operations.map(async ({ fn, timeout, name }) => {
    try {
      const result = await withTimeout(fn, timeout, name);
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  });
  
  return Promise.all(promises);
}

/**
 * Execute function with global timeout + per-step timeouts
 * 
 * Useful for orchestrating multiple steps where:
 * - Each step has its own timeout
 * - Total operation must complete within global timeout
 */
export async function withGlobalAndStepTimeouts<T>(
  steps: Array<{
    fn: () => Promise<any>;
    timeout: number;
    name: string;
  }>,
  globalTimeout: number,
  operation: string = 'orchestration'
): Promise<T[]> {
  const startTime = Date.now();
  const results: T[] = [];
  
  for (const step of steps) {
    const elapsed = Date.now() - startTime;
    const remaining = globalTimeout - elapsed;
    
    if (remaining <= 0) {
      throw new TimeoutError(
        `Global timeout (${globalTimeout}ms) exceeded during '${operation}'`,
        globalTimeout,
        operation
      );
    }
    
    // Use minimum of step timeout and remaining global timeout
    const effectiveTimeout = Math.min(step.timeout, remaining);
    
    const result = await withTimeout(
      step.fn,
      effectiveTimeout,
      step.name
    );
    
    results.push(result);
  }
  
  return results;
}

/**
 * Timeout manager for tracking and managing multiple timeouts
 */
export class TimeoutManager {
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Set a timeout for an operation
   */
  set(id: string, timeoutMs: number, callback: () => void): void {
    // Clear existing timeout if any
    this.clear(id);
    
    const timeoutId = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, timeoutMs);
    
    this.timeouts.set(id, timeoutId);
  }
  
  /**
   * Clear a specific timeout
   */
  clear(id: string): void {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
  }
  
  /**
   * Clear all timeouts
   */
  clearAll(): void {
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
  }
  
  /**
   * Get number of active timeouts
   */
  getActiveCount(): number {
    return this.timeouts.size;
  }
}
