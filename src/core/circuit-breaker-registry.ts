/**
 * @file Circuit Breaker Registry with Cleanup
 * @rule Per REFACTOR-9: Fix memory leak in long-running processes
 * @description CircuitBreakerRegistry with TTL-based cleanup for unused breakers
 */

import { CircuitBreaker, CircuitState, type CircuitBreakerOptions, type CircuitBreakerStats } from './circuit-breaker.js';
import { createLogger } from './logger.js';

const log = createLogger({ name: 'circuit-breaker-registry' });

export interface BreakerEntry {
  breaker: CircuitBreaker;
  lastAccessTime: number;
  createdAt: number;
}

/**
 * CircuitBreakerRegistry with memory leak prevention
 * 
 * Tracks access time for each breaker and removes unused ones after TTL.
 * This prevents unbounded memory growth in long-running processes.
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, BreakerEntry> = new Map();
  private cleanupTimer?: NodeJS.Timeout;
  
  /**
   * Default TTL for unused breakers (1 hour)
   */
  private readonly defaultTtl: number = 60 * 60 * 1000;
  
  /**
   * Interval for periodic cleanup (10 minutes)
   */
  private readonly cleanupInterval: number = 10 * 60 * 1000;
  
  /**
   * Create registry with optional periodic cleanup
   * @param enablePeriodicCleanup - If true, cleanup runs every 10 minutes
   */
  constructor(enablePeriodicCleanup: boolean = false) {
    if (enablePeriodicCleanup) {
      this.startPeriodicCleanup();
    }
  }
  
  /**
   * Get or create circuit breaker for adapter
   */
  getOrCreate(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    let entry = this.breakers.get(name);
    
    if (!entry) {
      entry = {
        breaker: new CircuitBreaker({
          name,
          ...options
        }),
        lastAccessTime: Date.now(),
        createdAt: Date.now()
      };
      this.breakers.set(name, entry);
      
      log.info({
        name,
        registrySize: this.breakers.size
      }, 'Circuit breaker created and registered');
    } else {
      // Update last access time
      entry.lastAccessTime = Date.now();
    }
    
    return entry.breaker;
  }
  
  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, entry] of this.breakers.entries()) {
      // Update access time when stats are requested
      entry.lastAccessTime = Date.now();
      stats[name] = entry.breaker.getStats();
    }
    
    return stats;
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const entry of this.breakers.values()) {
      entry.breaker.forceClose();
      entry.lastAccessTime = Date.now();
    }
  }
  
  /**
   * Cleanup unused circuit breakers
   * 
   * Removes breakers that haven't been accessed for longer than TTL,
   * but keeps OPEN breakers to prevent re-opening immediately when accessed again.
   * 
   * @param ttl - Time-to-live in milliseconds (default: 1 hour)
   * @returns Number of breakers removed
   */
  cleanup(ttl: number = this.defaultTtl): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [name, entry] of this.breakers.entries()) {
      const timeSinceAccess = now - entry.lastAccessTime;
      
      // Keep breakers that were recently accessed
      if (timeSinceAccess < ttl) {
        continue;
      }
      
      // Keep OPEN breakers even if unused (might need to recover)
      if (entry.breaker.getStats().state === CircuitState.OPEN) {
        // Reset access time so it's not cleaned up immediately
        entry.lastAccessTime = now;
        continue;
      }
      
      // Safe to remove: CLOSED/HALF_OPEN and unused
      this.breakers.delete(name);
      removed++;
      
      log.info({
        name,
        timeSinceAccess,
        ttl,
        registrySize: this.breakers.size
      }, 'Unused circuit breaker removed');
    }
    
    return removed;
  }
  
  /**
   * Get current number of tracked breakers
   */
  getSize(): number {
    return this.breakers.size;
  }
  
  /**
   * Get information about all tracked breakers
   */
  getTrackedBreakers(): Array<{
    name: string;
    state: string;
    lastAccessTime: number;
    createdAt: number;
    ageMs: number;
    idleMs: number;
  }> {
    const now = Date.now();
    return Array.from(this.breakers.entries()).map(([name, entry]) => ({
      name,
      state: entry.breaker.getStats().state,
      lastAccessTime: entry.lastAccessTime,
      createdAt: entry.createdAt,
      ageMs: now - entry.createdAt,
      idleMs: now - entry.lastAccessTime
    }));
  }
  
  /**
   * Start periodic cleanup timer
   */
  private startPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      return; // Already running
    }
    
    this.cleanupTimer = setInterval(() => {
      const removed = this.cleanup();
      if (removed > 0) {
        log.info({
          removed,
          registrySize: this.breakers.size
        }, 'Periodic cleanup executed');
      }
    }, this.cleanupInterval);
    
    // Don't block process exit
    this.cleanupTimer.unref();
    
    log.info({
      interval: this.cleanupInterval,
      ttl: this.defaultTtl
    }, 'Periodic cleanup started');
  }
  
  /**
   * Stop periodic cleanup timer
   */
  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      log.info('Periodic cleanup stopped');
    }
  }
  
  /**
   * Clear all breakers from registry
   * Useful for testing or forced reset
   */
  clear(): void {
    this.stopPeriodicCleanup();
    this.breakers.clear();
  }
}

/** Global circuit breaker registry */
export const circuitBreakers = new CircuitBreakerRegistry();
