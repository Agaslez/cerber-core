/**
 * @file Circuit Breaker - Resilience Pattern
 * @rule Per PRODUCTION HARDENING - P2: Resilience
 * @description Prevents cascading failures by stopping calls to failing adapters
 * 
 * Circuit Breaker States:
 * - CLOSED: Normal operation, all requests go through
 * - OPEN: Failure threshold exceeded, all requests fail fast
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 * 
 * Production Use:
 * - Protects against flaky adapters
 * - Prevents resource exhaustion
 * - Enables graceful degradation
 * - Auto-recovery when adapter stabilizes
 */

import { createLogger } from './logger.js';
import { metrics } from './metrics.js';

const log = createLogger({ name: 'circuit-breaker' });

export enum CircuitState {
  CLOSED = 'CLOSED',         // Normal operation
  OPEN = 'OPEN',             // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN'    // Testing recovery
}

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

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastStateChange: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

/**
 * Circuit Breaker implementation
 * 
 * Prevents cascading failures by:
 * 1. Tracking failure rate of protected function
 * 2. Opening circuit when threshold exceeded
 * 3. Failing fast when circuit is open
 * 4. Testing recovery periodically
 * 5. Closing circuit when service stabilizes
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime: number | null = null;
  private lastStateChange: number = Date.now();
  private failureTimestamps: number[] = [];
  
  // Statistics
  private totalCalls: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  
  // Configuration
  private readonly failureThreshold: number;
  private readonly failureWindow: number;
  private readonly resetTimeout: number;
  private readonly successThreshold: number;
  private readonly name: string;
  
  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.failureWindow = options.failureWindow ?? 60000; // 1 minute
    this.resetTimeout = options.resetTimeout ?? 30000; // 30 seconds
    this.successThreshold = options.successThreshold ?? 2;
    this.name = options.name;
    
    log.info({
      name: this.name,
      failureThreshold: this.failureThreshold,
      failureWindow: this.failureWindow,
      resetTimeout: this.resetTimeout
    }, 'Circuit breaker initialized');
  }
  
  /**
   * Execute function with circuit breaker protection
   * 
   * @param fn - Function to protect
   * @returns Result of function or throws CircuitBreakerOpenError
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;
    
    // Check if circuit should move to HALF_OPEN
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      const timeSinceOpen = now - this.lastStateChange;
      
      if (timeSinceOpen >= this.resetTimeout) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        // Circuit is open, fail fast
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
    
    // Execute function and handle result
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }
  
  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.successes++;
    this.consecutiveSuccesses++;
    
    // If in HALF_OPEN and enough successes, close circuit
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.successThreshold) {
        log.info({
          name: this.name,
          consecutiveSuccesses: this.consecutiveSuccesses,
          successThreshold: this.successThreshold
        }, 'Circuit breaker closing - service recovered');
        
        this.transitionTo(CircuitState.CLOSED);
        this.reset();
      }
    }
  }
  
  /**
   * Handle failed execution
   */
  private onFailure(error: unknown): void {
    this.totalFailures++;
    this.failures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();
    this.failureTimestamps.push(this.lastFailureTime);
    
    // Remove old failures outside the window
    const windowStart = this.lastFailureTime - this.failureWindow;
    this.failureTimestamps = this.failureTimestamps.filter(
      ts => ts > windowStart
    );
    
    const recentFailures = this.failureTimestamps.length;
    
    log.error({
      name: this.name,
      state: this.state,
      recentFailures,
      failureThreshold: this.failureThreshold,
      error: error instanceof Error ? error.message : String(error)
    }, 'Circuit breaker recorded failure');
    
    // Open circuit if threshold exceeded
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
  
  /**
   * Transition to new circuit state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    
    log.info({
      name: this.name,
      from: oldState,
      to: newState,
      failures: this.failures,
      successes: this.successes
    }, 'Circuit breaker state transition');
  }
  
  /**
   * Reset circuit breaker statistics
   */
  private reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.consecutiveSuccesses = 0;
    this.failureTimestamps = [];
  }
  
  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      consecutiveSuccesses: this.consecutiveSuccesses,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      totalCalls: this.totalCalls,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses
    };
  }
  
  /**
   * Force circuit to open (for testing/emergency)
   */
  forceOpen(): void {
    log.warn({ name: this.name }, 'Circuit breaker forced OPEN');
    this.transitionTo(CircuitState.OPEN);
  }
  
  /**
   * Force circuit to close (for testing/recovery)
   */
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
