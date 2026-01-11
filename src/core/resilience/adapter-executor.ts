/**
 * AdapterExecutor - Single Responsibility: Execute adapter with timeout
 * 
 * Separated from resilience coordinator to follow SRP.
 * Only handles: adapter execution + timeout wrapping + options cloning
 * 
 * Does NOT handle:
 * - Circuit breaker (handled by coordinator)
 * - Retry logic (handled by coordinator)
 * - Error classification (handled by ErrorClassifier)
 * - Result conversion (handled by ResultConverter)
 */

import type { Adapter, AdapterResult } from '../../adapters/types.js';
import type { OrchestratorRunOptions } from '../types.js';
import { withTimeout } from '../timeout.js';

/**
 * AdapterExecutor - executes adapter with timeout protection
 */
export class AdapterExecutor {
  /**
   * Execute adapter with optional timeout enforcement
   * 
   * @param adapter - Adapter to execute
   * @param options - Orchestrator options (files, cwd, timeout)
   * @param timeoutMs - Timeout in milliseconds (0 = no timeout)
   * @returns Adapter result
   * @throws Error if execution fails or times out
   */
  async execute(
    adapter: Adapter,
    options: OrchestratorRunOptions,
    timeoutMs: number = 0
  ): Promise<AdapterResult> {
    // Clone options to prevent mutations (race condition fix)
    const execOptions = {
      files: [...options.files],
      cwd: options.cwd,
      timeout: options.timeout,
    };
    
    // Define adapter execution function
    const adapterExecution = async (): Promise<AdapterResult> => {
      return await adapter.run(execOptions);
    };
    
    // Wrap with timeout if enabled (timeoutMs > 0)
    if (timeoutMs > 0) {
      return await withTimeout(adapterExecution, timeoutMs, adapter.name);
    }
    
    // Execute without timeout
    return await adapterExecution();
  }
  
  /**
   * Execute adapter without any protections (for testing)
   * 
   * @param adapter - Adapter to execute
   * @param options - Orchestrator options
   * @returns Adapter result
   */
  async executeRaw(
    adapter: Adapter,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult> {
    return await adapter.run(options);
  }
}
