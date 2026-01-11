/**
 * @file Retry Strategy - Strategy Pattern for Backoff
 * @rule Per REFACTOR-6 - Strategy Pattern + Open/Closed Principle
 * @description Pluggable backoff strategies for retry logic
 */

export interface RetryStrategy {
  /**
   * Calculate delay for next retry attempt
   * 
   * @param attempt - Current attempt number (0-indexed)
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number): number;

  /**
   * Get strategy name for logging
   */
  getName(): string;
}

/**
 * Exponential Backoff Strategy
 * 
 * Delay: initialDelay * (multiplier ^ attempt) * jitter
 * Example: 100ms → 200ms → 400ms → 800ms → ...
 */
export class ExponentialBackoffStrategy implements RetryStrategy {
  constructor(
    private readonly initialDelay: number = 100,
    private readonly maxDelay: number = 30000,
    private readonly multiplier: number = 2,
    private readonly jitter: number = 0.1
  ) {}

  calculateDelay(attempt: number): number {
    const exponentialDelay = this.initialDelay * Math.pow(this.multiplier, attempt);
    const jitterFactor = 1 + Math.random() * this.jitter;
    const delayWithJitter = exponentialDelay * jitterFactor;
    
    return Math.min(delayWithJitter, this.maxDelay);
  }

  getName(): string {
    return 'exponential';
  }
}

/**
 * Linear Backoff Strategy
 * 
 * Delay: initialDelay + (increment * attempt)
 * Example: 100ms → 200ms → 300ms → 400ms → ...
 */
export class LinearBackoffStrategy implements RetryStrategy {
  constructor(
    private readonly initialDelay: number = 100,
    private readonly increment: number = 100,
    private readonly maxDelay: number = 30000,
    private readonly jitter: number = 0.1
  ) {}

  calculateDelay(attempt: number): number {
    const linearDelay = this.initialDelay + this.increment * attempt;
    const jitterFactor = 1 + Math.random() * this.jitter;
    const delayWithJitter = linearDelay * jitterFactor;
    
    return Math.min(delayWithJitter, this.maxDelay);
  }

  getName(): string {
    return 'linear';
  }
}

/**
 * Fibonacci Backoff Strategy
 * 
 * Delay: initialDelay * fibonacci(attempt)
 * Example: 100ms → 100ms → 200ms → 300ms → 500ms → 800ms → ...
 */
export class FibonacciBackoffStrategy implements RetryStrategy {
  constructor(
    private readonly initialDelay: number = 100,
    private readonly maxDelay: number = 30000,
    private readonly jitter: number = 0.1
  ) {}

  private fibonacci(n: number): number {
    if (n <= 1) return 1;
    let prev = 1;
    let curr = 1;
    
    for (let i = 2; i <= n; i++) {
      const next = prev + curr;
      prev = curr;
      curr = next;
    }
    
    return curr;
  }

  calculateDelay(attempt: number): number {
    const fibonacciDelay = this.initialDelay * this.fibonacci(attempt);
    const jitterFactor = 1 + Math.random() * this.jitter;
    const delayWithJitter = fibonacciDelay * jitterFactor;
    
    return Math.min(delayWithJitter, this.maxDelay);
  }

  getName(): string {
    return 'fibonacci';
  }
}

/**
 * Fixed Delay Strategy
 * 
 * Delay: constant delay for all attempts
 * Example: 500ms → 500ms → 500ms → ...
 */
export class FixedDelayStrategy implements RetryStrategy {
  constructor(
    private readonly delay: number = 1000,
    private readonly jitter: number = 0.1
  ) {}

  calculateDelay(_attempt: number): number {
    const jitterFactor = 1 + Math.random() * this.jitter;
    return this.delay * jitterFactor;
  }

  getName(): string {
    return 'fixed';
  }
}
