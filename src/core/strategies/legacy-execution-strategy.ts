/**
 * @file LegacyExecutionStrategy - No resilience (original behavior)
 * @rule Strategy Pattern implementation
 * @description Executes adapters without resilience features (backward compatible)
 */

import type { Adapter, AdapterResult } from '../../adapters/types.js';
import { ErrorClassifier } from '../error-classifier.js';
import { logError } from '../logger.js';
import { metrics } from '../metrics.js';
import type { OrchestratorRunOptions } from '../types.js';
import type { AdapterExecutionStrategy } from './adapter-execution-strategy.js';

/**
 * LegacyExecutionStrategy - Original execution without resilience
 * 
 * Behavior:
 * - No circuit breaker
 * - No retry
 * - No timeout enforcement (uses adapter's own timeout)
 * - Adapter errors converted to error results (graceful degradation)
 */
export class LegacyExecutionStrategy implements AdapterExecutionStrategy {
  /**
   * Execute adapters in parallel (original behavior)
   */
  async executeParallel(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    const promises = adapters.map(async ({ adapter }) => {
      try {
        // Clone options to prevent adapter mutations affecting others
        return await adapter.run({
          files: [...options.files],  // Clone array
          cwd: options.cwd,
          timeout: options.timeout,
        });
      } catch (error) {
        // Graceful: adapter crashes → create error result with proper classification
        return this.createErrorResult(adapter, error, options);
      }
    });

    return Promise.all(promises);
  }

  /**
   * Execute adapters sequentially (original behavior)
   */
  async executeSequential(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    const results: AdapterResult[] = [];

    for (const { adapter } of adapters) {
      try {
        // Clone options to prevent adapter mutations
        const result = await adapter.run({
          files: [...options.files],
          cwd: options.cwd,
          timeout: options.timeout,
        });
        
        results.push(result);
      } catch (error) {
        // Graceful: adapter crashes → create error result, continue
        results.push(this.createErrorResult(adapter, error, options));
      }
    }

    return results;
  }

  /**
   * Create error result from adapter exception
   * 
   * Uses ErrorClassifier for consistent error handling
   */
  private createErrorResult(
    adapter: Adapter,
    error: unknown,
    options: OrchestratorRunOptions
  ): AdapterResult {
    const classification = ErrorClassifier.classify(error);
    
    // Log error with full context
    logError('Adapter execution failed', error, {
      adapter: adapter.name,
      exitCode: classification.exitCode,
      errorType: classification.type,
      options: {
        filesCount: options.files.length,
        cwd: options.cwd,
        timeout: options.timeout
      }
    });
    
    // Record error metric
    metrics.adapterErrors.inc({ 
      adapter: adapter.name, 
      error_type: classification.type
    });

    return {
      tool: adapter.name,
      version: 'unknown',
      exitCode: classification.exitCode,
      violations: [],
      executionTime: 0,
      skipped: true,
      skipReason: `${classification.reason}: ${classification.message}`,
    };
  }
}
