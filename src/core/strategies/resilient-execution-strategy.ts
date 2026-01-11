/**
 * @file ResilientExecutionStrategy - Full resilience stack
 * @rule Strategy Pattern implementation
 * @description Executes adapters with circuit breaker + retry + timeout
 */

import type { Adapter, AdapterResult } from '../../adapters/types.js';
import {
    convertToLegacyResults,
    executeResilientAdapter,
    executeResilientAdapters
} from '../resilience.js';
import type { OrchestratorRunOptions } from '../types.js';
import type { AdapterExecutionStrategy } from './adapter-execution-strategy.js';

/**
 * ResilientExecutionStrategy - Wrapper around resilience functions
 * 
 * Behavior:
 * - Circuit breaker: Opens after threshold failures
 * - Retry: Exponential backoff for retryable errors
 * - Timeout: Enforces operation timeout
 * - Partial success: Returns all results (successful + failed)
 */
export class ResilientExecutionStrategy implements AdapterExecutionStrategy {
  /**
   * Execute adapters in parallel with full resilience
   */
  async executeParallel(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    // Use resilience wrapper for parallel execution
    const resilientResults = await executeResilientAdapters(
      adapters,
      {
        files: options.files,
        cwd: options.cwd,
        timeout: options.timeout
      }
    );
    
    // Convert ResilientAdapterResult[] → AdapterResult[]
    return convertToLegacyResults(resilientResults);
  }

  /**
   * Execute adapters sequentially with full resilience
   */
  async executeSequential(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    const results: AdapterResult[] = [];

    // Execute each adapter with resilience
    for (const { adapter } of adapters) {
      const resilientResult = await executeResilientAdapter(
        adapter,
        {
          files: options.files,
          cwd: options.cwd,
          timeout: options.timeout
        }
      );
      
      // Convert single result
      const legacyResults = convertToLegacyResults([resilientResult]);
      results.push(...legacyResults);
    }

    return results;
  }
}
