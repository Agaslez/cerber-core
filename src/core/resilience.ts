/**
 * @file Resilience Wrapper - P2 Integration
 * @rule Per PRODUCTION HARDENING - P2: Resilience patterns for adapter execution
 * @description Wraps adapter execution with circuit breaker, retry, and timeout
 * 
 * Resilience Features:
 * - Circuit breaker prevents wasted retries on known-failing adapters
 * - Retry with exponential backoff handles transient failures
 * - Timeout enforcement prevents hanging operations
 * - Partial success reporting tracks which adapters succeeded/failed
 * 
 * Production Benefits:
 * - Adapter A fails → B and C continue (no cascading failure)
 * - Flaky network/disk → automatic retry
 * - Slow adapter → timeout prevents blocking
 * - Clear failure reasons for debugging
 */

import type { Adapter, AdapterResult } from '../adapters/types.js';
import { circuitBreakers } from './circuit-breaker.js';
import { ErrorClassifier } from './error-classifier.js';
import { createChildLogger } from './logger.js';
import { retry } from './retry.js';
import { withTimeout } from './timeout.js';
import type { OrchestratorRunOptions } from './types.js';

const log = createChildLogger({ operation: 'resilience' });

export interface ResilientAdapterResult {
  /** Adapter name */
  adapter: string;
  
  /** Whether adapter execution succeeded */
  success: boolean;
  
  /** Adapter result (if successful) */
  result?: AdapterResult;
  
  /** Error details (if failed) */
  error?: {
    message: string;
    type: 'circuit_breaker_open' | 'timeout' | 'crash' | 'not_found' | 'permission' | 'retries_exhausted' | 'validation' | 'unknown';
    attempts?: number;
    duration?: number;
  };
  
  /** Execution duration in ms */
  duration: number;
}

export interface ResilienceOptions {
  /** Enable circuit breaker (default: true) */
  circuitBreaker?: boolean;
  
  /** Enable retry logic (default: true) */
  retry?: boolean;
  
  /** Enable timeout enforcement (default: true) */
  timeout?: boolean;
  
  /** Circuit breaker failure threshold (default: 5) */
  failureThreshold?: number;
  
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  
  /** Per-adapter timeout in ms (default: 60000 = 1 min) */
  adapterTimeout?: number;
}

const DEFAULT_RESILIENCE_OPTIONS: Required<ResilienceOptions> = {
  circuitBreaker: true,
  retry: true,
  timeout: true,
  failureThreshold: 5,
  maxRetries: 3,
  adapterTimeout: 60000, // 1 minute
};

/**
 * Execute adapter with full resilience: circuit breaker + retry + timeout
 * 
 * Flow:
 * 1. Check circuit breaker (fail fast if open)
 * 2. Execute with timeout enforcement
 * 3. Retry on transient failures
 * 4. Return detailed result (success + data OR failure + reason)
 */
export async function executeResilientAdapter(
  adapter: Adapter,
  options: OrchestratorRunOptions,
  resilienceOptions: ResilienceOptions = {}
): Promise<ResilientAdapterResult> {
  const opts = { ...DEFAULT_RESILIENCE_OPTIONS, ...resilienceOptions };
  const startTime = Date.now();
  const adapterName = adapter.name;
  
  log.debug({
    adapter: adapterName,
    circuitBreaker: opts.circuitBreaker,
    retry: opts.retry,
    timeout: opts.timeout,
    maxRetries: opts.maxRetries,
    adapterTimeout: opts.adapterTimeout
  }, 'Executing adapter with resilience');
  
  // Get circuit breaker for this adapter
  const breaker = opts.circuitBreaker 
    ? circuitBreakers.getOrCreate(adapterName, {
        failureThreshold: opts.failureThreshold
      })
    : null;
  
  let attempts = 0;
  
  try {
    // Wrap adapter execution in retry + timeout + circuit breaker
    const executeWithResilience = async (): Promise<AdapterResult> => {
      attempts++;
      
      // Define adapter execution function
      const adapterExecution = async (): Promise<AdapterResult> => {
        // Clone options to prevent mutations
        const execOptions = {
          files: [...options.files],
          cwd: options.cwd,
          timeout: options.timeout,
        };
        
        return await adapter.run(execOptions);
      };
      
      // Wrap with timeout if enabled
      const executionFn = opts.timeout
        ? () => withTimeout(adapterExecution, opts.adapterTimeout, adapterName)
        : adapterExecution;
      
      // Wrap with circuit breaker if enabled
      if (breaker) {
        return await breaker.execute(executionFn);
      }
      
      return await executionFn();
    };
    
    // Execute with retry if enabled
    const result = opts.retry
      ? await retry(executeWithResilience, {
          maxAttempts: opts.maxRetries,
          initialDelay: 100,
          backoffMultiplier: 2,
          jitter: 0.1,
          name: adapterName
        })
      : await executeWithResilience();
    
    const duration = Date.now() - startTime;
    
    log.info({
      adapter: adapterName,
      attempts,
      duration,
      violations: result.violations.length
    }, 'Adapter execution succeeded');
    
    return {
      adapter: adapterName,
      success: true,
      result,
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Use ErrorClassifier for consistent error handling
    const classification = ErrorClassifier.classify(error, {
      attempts,
      maxRetries: opts.maxRetries
    });
    
    log.error({
      adapter: adapterName,
      errorType: classification.type,
      exitCode: classification.exitCode,
      attempts,
      duration,
      error: classification.message
    }, 'Adapter execution failed');
    
    return {
      adapter: adapterName,
      success: false,
      error: {
        message: classification.message,
        type: classification.type,
        attempts,
        duration
      },
      duration
    };
  }
}

/**
 * Execute multiple adapters in parallel with resilience
 * 
 * Returns partial success - if adapter A fails, B and C continue.
 * Each adapter result includes success flag + detailed error info.
 */
export async function executeResilientAdapters(
  adapters: Array<{ name: string; adapter: Adapter }>,
  options: OrchestratorRunOptions,
  resilienceOptions: ResilienceOptions = {}
): Promise<ResilientAdapterResult[]> {
  const promises = adapters.map(({ adapter }) =>
    executeResilientAdapter(adapter, options, resilienceOptions)
  );
  
  // Wait for all adapters (successful or failed)
  return Promise.all(promises);
}

/**
 * Convert resilient results to legacy AdapterResult format
 * 
 * For backward compatibility with existing code.
 * Failed adapters return empty result with exit code.
 */
export function convertToLegacyResults(
  resilientResults: ResilientAdapterResult[]
): AdapterResult[] {
  return resilientResults.map(result => {
    if (result.success && result.result) {
      return result.result;
    }
    
    // Failed adapter - create error result
    const exitCode = result.error?.type === 'circuit_breaker_open' ? 125
      : result.error?.type === 'timeout' ? 124
      : result.error?.type === 'not_found' ? 127
      : result.error?.type === 'permission' ? 126
      : 3; // crash or retries exhausted
    
    return {
      tool: result.adapter,
      version: 'unknown',
      exitCode,
      violations: [],
      executionTime: result.duration,
      skipped: true,
      skipReason: result.error?.message || 'Unknown error'
    };
  });
}

/**
 * Compute partial success statistics
 */
export interface PartialSuccessStats {
  /** Total adapters executed */
  total: number;
  
  /** Number of successful adapters */
  successful: number;
  
  /** Number of failed adapters */
  failed: number;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Failed adapter names with reasons */
  failures: Array<{
    adapter: string;
    reason: string;
    type: string;
  }>;
}

export function computePartialSuccessStats(
  results: ResilientAdapterResult[]
): PartialSuccessStats {
  const total = results.length;
  const successful = results.filter(r => r.success).length;
  const failed = total - successful;
  const successRate = total > 0 ? successful / total : 0;
  
  const failures = results
    .filter(r => !r.success)
    .map(r => ({
      adapter: r.adapter,
      reason: r.error?.message || 'Unknown error',
      type: r.error?.type || 'unknown'
    }));
  
  return {
    total,
    successful,
    failed,
    successRate,
    failures
  };
}
