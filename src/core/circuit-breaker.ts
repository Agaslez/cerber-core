/**
 * @file Circuit Breaker - Resilience Pattern (REFACTORED)
 * @rule Per PRODUCTION HARDENING - P2: Resilience + REFACTOR-5 SRP
 * @description Prevents cascading failures by stopping calls to failing adapters
 * 
 * Circuit Breaker States:
 * - CLOSED: Normal operation, all requests go through
 * - OPEN: Failure threshold exceeded, all requests fail fast
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 * 
 * REFACTOR-5 Changes:
 * - Extracted FailureWindow: Time-based failure tracking
 * - Extracted StatsTracker: Statistics computation
 * - CircuitBreaker: Pure state machine logic only
 */

import { CircuitState } from './circuit-breaker/circuit-state.js';
import { FailureWindow } from './circuit-breaker/failure-window.js';
import type { CircuitBreakerStats } from './circuit-breaker/stats-tracker.js';
import { StatsTracker } from './circuit-breaker/stats-tracker.js';
import { createLogger } from './logger.js';
import { metrics } from './metrics.js';

const log = createLogger({ name: 'circuit-breaker' });

export { CircuitState };
export type { CircuitBreakerStats };

export interface CircuitBreakerOptions {
  /** Threshold: number of failures before opening circuit */
  failureThreshold?: number;
  
  /** Time window for counting failures (ms) */
  failureWindow?: number;
  
  /** How long to wait before attempting recovery (ms) */
  resetTimeout?: number;
  
  /** Number of successful calls needed to close circuit from half-open */
  successThreshold?: number;
  
  /** Name of the protected resource (for logging) */
  name: string;
}

/**
 * Circuit Breaker - State machine only
 * 
 * SRP: Manages circuit state transitions based on failure/success patterns
 * Delegates: FailureWindow (time tracking), StatsTracker (counters)
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private lastStateChange: number = Date.now();
  
  // Delegated responsibilities
  private readonly failureWindow: FailureWindow;
  private readonly stats: StatsTracker;
  
  // Configuration
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;
  private readonly name: string;
  
  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30000;
    this.successThreshold = options.successThreshold ?? 2;
    this.name = options.name;
    
    this.failureWindow = new FailureWindow(options.failureWindow ?? 60000);
    this.stats = new StatsTracker();
    
    log.info({
      name: this.name,
      failureThreshold: this.failureThreshold,
      resetTimeout: this.resetTimeout
    }, 'Circuit breaker initialized');
  }
  
  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.stats.recordCall();
    
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      const timeSinceOpen = now - this.lastStateChange;
      
      if (timeSinceOpen >= this.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        log.warn({
          name: this.name,
          state: this.state,
          timeUntilReset: this.resetTimeout - timeSinceOpen
        }, 'Circuit breaker OPEN - failing fast');
        
        throw new CircuitBreakerOpenError(
          `Circuit breaker OPEN for ${this.name} - failing fast`
        );
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.stats.recordSuccess();
    
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.stats.getConsecutiveSuccesses() >= this.successThreshold) {
        log.info({
          name: this.name,
          consecutiveSuccesses: this.stats.getConsecutiveSuccesses(),
          successThreshold: this.successThreshold
        }, 'Circuit breaker closing - service recovered');
        
        this.transitionTo(CircuitState.CLOSED);
        this.reset();
      }
    }
  }
  
  private onFailure(error: unknown): void {
    this.stats.recordFailure();
    this.failureWindow.recordFailure();
    
    const recentFailures = this.failureWindow.getRecentCount();
    
    log.error({
      name: this.name,
      state: this.state,
      recentFailures,
      failureThreshold: this.failureThreshold,
      error: error instanceof Error ? error.message : String(error)
    }, 'Circuit breaker recorded failure');
    
    if (this.state === CircuitState.CLOSED || this.state === CircuitState.HALF_OPEN) {
      if (recentFailures >= this.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
        
        metrics.adapterErrors.inc({
          adapter: this.name,
          error_type: 'circuit_breaker_open'
        });
      }
    }
  }
  
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    log.info({
      name: this.name,
      from: oldState,
      to: newState
    }, 'Circuit breaker state transition');
  }
  
  private reset(): void {
    this.failureWindow.reset();
    this.stats.resetConsecutive();
  }
  
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failureWindow.getRecentCount(),
      successes: this.stats.getTotalSuccesses(),
      consecutiveSuccesses: this.stats.getConsecutiveSuccesses(),
      lastFailureTime: this.stats.getLastFailureTime(),
      lastStateChange: this.lastStateChange,
      totalCalls: this.stats.getTotalCalls(),
      totalFailures: this.stats.getTotalFailures(),
      totalSuccesses: this.stats.getTotalSuccesses()
    };
  }
  
  forceOpen(): void {
    log.warn({ name: this.name }, 'Circuit breaker forced OPEN');
    this.transitionTo(CircuitState.OPEN);
  }
  
  forceClose(): void {
    log.warn({ name: this.name }, 'Circuit breaker forced CLOSED');
    this.transitionTo(CircuitState.CLOSED);
    this.reset();
  }
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Circuit breaker registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();
  
  /**
   * Get or create circuit breaker for adapter
   */
  getOrCreate(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    
    if (!breaker) {
      breaker = new CircuitBreaker({
        name,
        ...options
      });
      this.breakers.set(name, breaker);
    }
    
    return breaker;
  }
  
  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    
    return stats;
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceClose();
    }
  }
}

/** Global circuit breaker registry */
export const circuitBreakers = new CircuitBreakerRegistry();
