/**
 * @file Retry Logic - Resilience Pattern
 * @rule Per PRODUCTION HARDENING - P2: Resilience
 * @description Automatic retry with exponential backoff and jitter for transient failures
 * 
 * Retry Strategy:
 * - Exponential backoff: 100ms → 200ms → 400ms → 800ms → ...
 * - Jitter: Random delay to prevent thundering herd
 * - Max attempts: Configurable limit
 * - Retryable errors: Transient failures (timeout, network, rate limit)
 * 
 * Production Use:
 * - Handles flaky network connections
 * - Recovers from temporary service degradation
 * - Prevents cascading failures
 * - Improves success rate without manual intervention
 */

import { ErrorClassifier } from './error-classifier.js';
import { createLogger } from './logger.js';
import { ExponentialBackoffStrategy, type RetryStrategy } from './retry-strategy.js';

const log = createLogger({ name: 'retry' });

export interface RetryOptions {
  /** Maximum number of retry attempts (0 = no retries) */
  maxAttempts?: number;
  
  /** Retry strategy (defaults to ExponentialBackoffStrategy) */
  strategy?: RetryStrategy;
  
  /** Legacy: Initial delay in milliseconds (used if no strategy provided) */
  initialDelay?: number;
  
  /** Legacy: Maximum delay in milliseconds (used if no strategy provided) */
  maxDelay?: number;
  
  /** Legacy: Backoff multiplier (used if no strategy provided) */
  backoffMultiplier?: number;
  
  /** Legacy: Add random jitter (used if no strategy provided) */
  jitter?: number;
  
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  
  /** Name of the operation (for logging) */
  name?: string;
  
  /** Callback before each retry attempt */
  onRetry?: (attempt: number, delay: number, error: unknown) => void;
}

export interface RetryStats {
  attempts: number;
  totalDelay: number;
  errors: unknown[];
}

/**
 * Check if error is retryable by default
 * 
 * Uses ErrorClassifier as single source of truth for retryability
 */
export function isRetryableError(error: unknown): boolean {
  return ErrorClassifier.isRetryable(error);
}

/**
 * Calculate delay with exponential backoff and jitter
 * 
 * Formula: min(initialDelay * (multiplier ^ attempt) * (1 + jitter * random()), maxDelay)
 */
export function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: number
): number {
  // Base exponential backoff
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  
  // Add jitter (random factor between 0 and jitter)
  const jitterFactor = 1 + (Math.random() * jitter);
  const delayWithJitter = exponentialDelay * jitterFactor;
  
  // Cap at maxDelay
  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Execute function with automatic retry logic
 * 
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Result of function or throws last error
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    strategy,
    initialDelay = 100,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = 0.1,
    isRetryable = isRetryableError,
    name = 'operation',
    onRetry
  } = options;
  
  // Create strategy if not provided (backward compatibility)
  const backoffStrategy = strategy ?? new ExponentialBackoffStrategy(
    initialDelay,
    maxDelay,
    backoffMultiplier,
    jitter
  );
  
  const stats: RetryStats = {
    attempts: 0,
    totalDelay: 0,
    errors: []
  };
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    stats.attempts++;
    
    try {
      const result = await fn();
      
      if (attempt > 0) {
        log.info({
          name,
          attempts: stats.attempts,
          totalDelay: stats.totalDelay,
          strategy: backoffStrategy.getName()
        }, 'Retry succeeded');
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      stats.errors.push(error);
      
      const shouldRetry = attempt < maxAttempts - 1 && isRetryable(error);
      
      if (!shouldRetry) {
        log.error({
          name,
          attempts: stats.attempts,
          retryable: isRetryable(error),
          error: error instanceof Error ? error.message : String(error)
        }, 'Retry exhausted or error not retryable');
        
        throw error;
      }
      
      const delay = backoffStrategy.calculateDelay(attempt);
      stats.totalDelay += delay;
      
      log.warn({
        name,
        attempt: attempt + 1,
        maxAttempts,
        delay,
        strategy: backoffStrategy.getName(),
        error: error instanceof Error ? error.message : String(error)
      }, 'Retry attempt failed, retrying...');
      
      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt + 1, delay, error);
      }
      
      // Wait before next attempt
      await sleep(delay);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry with circuit breaker integration
 * 
 * This combines retry logic with circuit breaker for optimal resilience:
 * - Circuit breaker prevents wasting retries on known-down services
 * - Retries handle transient failures when circuit is closed
 */
export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions = {},
  circuitBreakerName?: string
): Promise<T> {
  // If circuit breaker is provided, wrap function with it
  if (circuitBreakerName) {
    const { circuitBreakers } = await import('./circuit-breaker.js');
    const breaker = circuitBreakers.getOrCreate(circuitBreakerName);
    
    return retry(() => breaker.execute(fn), retryOptions);
  }
  
  // Otherwise, just retry
  return retry(fn, retryOptions);
}

/**
 * Retry decorator for class methods
 * 
 * Usage:
 * class MyService {
 *   @withRetry({ maxAttempts: 3 })
 *   async fetchData() { ... }
 * }
 */
export function withRetry(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const methodName = `${target.constructor.name}.${propertyKey}`;
      
      return retry(
        () => originalMethod.apply(this, args),
        { ...options, name: methodName }
      );
    };
    
    return descriptor;
  };
}

/**
 * Batch retry - retry multiple operations with shared backoff
 * 
 * If one operation fails, all subsequent operations in the batch
 * will wait for the backoff delay before retrying.
 */
export async function retryBatch<T>(
  operations: Array<() => Promise<T>>,
  options: RetryOptions = {}
): Promise<T[]> {
  const results: T[] = [];
  
  for (const operation of operations) {
    const result = await retry(operation, options);
    results.push(result);
  }
  
  return results;
}

/**
 * Retry with timeout
 * 
 * Combines retry logic with timeout enforcement
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return retry(async () => {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }, retryOptions);
}
