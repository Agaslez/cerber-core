/**
 * @file Adapter Execution Strategy - Strategy Pattern
 * @rule Dependency Inversion Principle (DIP)
 * @description Abstracts adapter execution to eliminate Orchestrator → resilience coupling
 * 
 * Benefits:
 * - High-level (Orchestrator) depends on abstraction, not implementation
 * - Easy to swap strategies (legacy vs resilient vs custom)
 * - Testable in isolation
 * - Open/Closed Principle: can add new strategies without modifying Orchestrator
 */

import type { Adapter, AdapterResult } from '../../adapters/types.js';
import type { OrchestratorRunOptions } from '../types.js';

/**
 * Strategy interface for adapter execution
 * 
 * Defines contract for executing adapters in parallel or sequential mode.
 * Implementations can vary execution strategy (legacy, resilient, etc.)
 */
export interface AdapterExecutionStrategy {
  /**
   * Execute multiple adapters in parallel
   * 
   * @param adapters - Array of adapters to execute
   * @param options - Orchestrator options
   * @returns Array of adapter results
   */
  executeParallel(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]>;
  
  /**
   * Execute multiple adapters sequentially
   * 
   * @param adapters - Array of adapters to execute
   * @param options - Orchestrator options
   * @returns Array of adapter results
   */
  executeSequential(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]>;
}
