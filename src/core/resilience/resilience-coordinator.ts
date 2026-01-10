/**
 * ResilienceCoordinator - Composition pattern for resilience logic
 * 
 * Single Responsibility: Coordinate resilience components
 * Uses composition instead of doing everything itself (God Class anti-pattern).
 * 
 * Components used:
 * - AdapterExecutor: Executes adapter with timeout
 * - CircuitBreaker: Prevents cascading failures
 * - retry(): Handles transient failures
 * - ErrorClassifier: Classifies errors consistently
 * 
 * Does NOT:
 * - Execute adapters directly (delegates to AdapterExecutor)
 * - Classify errors (delegates to ErrorClassifier)
 * - Convert results (delegates to ResultConverter)
 * - Compute stats (delegates to StatsComputer)
 */

import type { Adapter, AdapterResult } from '../../adapters/types.js';
import { circuitBreakers } from '../circuit-breaker.js';
import { ErrorClassifier } from '../error-classifier.js';
import { createChildLogger } from '../logger.js';
import type { ResilienceOptions, ResilientAdapterResult } from '../resilience.js';
import { retry } from '../retry.js';
import type { OrchestratorRunOptions } from '../types.js';
import { AdapterExecutor } from './adapter-executor.js';

const log = createChildLogger({ operation: 'resilience-coordinator' });

const DEFAULT_RESILIENCE_OPTIONS: Required<ResilienceOptions> = {
  circuitBreaker: true,
  retry: true,
  timeout: true,
  failureThreshold: 5,
  maxRetries: 3,
  adapterTimeout: 60000, // 1 minute
};

/**
 * ResilienceCoordinator - coordinates resilience patterns using composition
 */
export class ResilienceCoordinator {
  private executor: AdapterExecutor;
  
  constructor() {
    this.executor = new AdapterExecutor();
  }
  
  /**
   * Execute adapter with full resilience stack
   * 
   * Flow:
   * 1. Get/create circuit breaker for adapter
   * 2. Define execution function (executor + optional timeout)
   * 3. Wrap with circuit breaker (if enabled)
   * 4. Wrap with retry (if enabled)
   * 5. Execute and return detailed result
   * 
   * @param adapter - Adapter to execute
   * @param options - Orchestrator options
   * @param resilienceOptions - Resilience configuration
   * @returns Detailed result with success flag and error info
   */
  async executeResilient(
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
    }, 'Coordinating resilient execution');
    
    // Get circuit breaker for this adapter (if enabled)
    const breaker = opts.circuitBreaker 
      ? circuitBreakers.getOrCreate(adapterName, {
          failureThreshold: opts.failureThreshold
        })
      : null;
    
    let attempts = 0;
    
    try {
      // Define execution function with resilience layers
      const executeWithResilience = async (): Promise<AdapterResult> => {
        attempts++;
        
        // Define base execution function (with optional timeout)
        const executionFn = async (): Promise<AdapterResult> => {
          const timeoutMs = opts.timeout ? opts.adapterTimeout : 0;
          return await this.executor.execute(adapter, options, timeoutMs);
        };
        
        // Wrap with circuit breaker (if enabled)
        if (breaker) {
          return await breaker.execute(executionFn);
        }
        
        return await executionFn();
      };
      
      // Execute with retry (if enabled)
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
      }, 'Resilient execution succeeded');
      
      return {
        adapter: adapterName,
        success: true,
        result,
        duration
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Classify error using ErrorClassifier (single source of truth)
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
      }, 'Resilient execution failed');
      
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
   * Each adapter executes independently - failures don't cascade.
   * 
   * @param adapters - Array of adapters to execute
   * @param options - Orchestrator options
   * @param resilienceOptions - Resilience configuration
   * @returns Array of detailed results (partial success supported)
   */
  async executeResilientParallel(
    adapters: Adapter[],
    options: OrchestratorRunOptions,
    resilienceOptions: ResilienceOptions = {}
  ): Promise<ResilientAdapterResult[]> {
    log.debug({
      adapterCount: adapters.length
    }, 'Executing adapters in parallel with resilience');
    
    const promises = adapters.map(adapter => 
      this.executeResilient(adapter, options, resilienceOptions)
    );
    
    const results = await Promise.all(promises);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    log.info({
      total: results.length,
      successful: successCount,
      failed: failureCount
    }, 'Parallel execution completed');
    
    return results;
  }
}
