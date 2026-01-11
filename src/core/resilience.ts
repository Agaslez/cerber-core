/**
 * @file Resilience Wrapper - P2 Integration (REFACTORED)
 * @rule Per REFACTOR-2: Decomposed God Class into composition pattern
 * @description Facade for resilience components following SOLID principles
 * 
 * Architecture:
 * - ResilienceCoordinator: Orchestrates circuit breaker + retry + timeout
 * - AdapterExecutor: Executes adapter with timeout protection
 * - ResultConverter: Converts between resilient and legacy formats
 * - StatsComputer: Computes partial success statistics
 * - ErrorClassifier: Single source of truth for error classification
 * 
 * This file now acts as a facade/public API, delegating to components.
 * Each component has single responsibility and is testable in isolation.
 */

import type { Adapter, AdapterResult } from '../adapters/types.js';
import { ResilienceCoordinator } from './resilience/resilience-coordinator.js';
import { ResultConverter } from './resilience/result-converter.js';
import { StatsComputer } from './resilience/stats-computer.js';
import type { OrchestratorRunOptions } from './types.js';

// Singleton instances for composition
const coordinator = new ResilienceCoordinator();
const converter = new ResultConverter();
const statsComputer = new StatsComputer();

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

/**
 * Execute adapter with full resilience: circuit breaker + retry + timeout
 * 
 * FACADE: Delegates to ResilienceCoordinator
 * 
 * @param adapter - Adapter to execute
 * @param options - Orchestrator options
 * @param resilienceOptions - Resilience configuration
 * @returns Detailed result with success flag and error details
 */
export async function executeResilientAdapter(
  adapter: Adapter,
  options: OrchestratorRunOptions,
  resilienceOptions: ResilienceOptions = {}
): Promise<ResilientAdapterResult> {
  return coordinator.executeResilient(adapter, options, resilienceOptions);
}

/**
 * Execute multiple adapters in parallel with resilience
 * 
 * FACADE: Delegates to ResilienceCoordinator
 * 
 * @param adapters - Array of named adapters
 * @param options - Orchestrator options
 * @param resilienceOptions - Resilience configuration
 * @returns Array of detailed results (partial success supported)
 */
export async function executeResilientAdapters(
  adapters: Array<{ name: string; adapter: Adapter }>,
  options: OrchestratorRunOptions,
  resilienceOptions: ResilienceOptions = {}
): Promise<ResilientAdapterResult[]> {
  const adapterList = adapters.map(({ adapter }) => adapter);
  return coordinator.executeResilientParallel(adapterList, options, resilienceOptions);
}

/**
 * Convert resilient results to legacy AdapterResult format
 * 
 * FACADE: Delegates to ResultConverter (Adapter Pattern)
 * 
 * @param resilientResults - Array of resilient results
 * @returns Array of legacy AdapterResult format
 */
export function convertToLegacyResults(
  resilientResults: ResilientAdapterResult[]
): AdapterResult[] {
  return converter.convertBatch(resilientResults);
}

/**
 * Partial success statistics (legacy format)
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

/**
 * Compute partial success statistics
 * 
 * FACADE: Delegates to StatsComputer, then formats to legacy structure
 * 
 * @param results - Array of resilient results
 * @returns Statistics object with success/failure details
 */
export function computePartialSuccessStats(
  results: ResilientAdapterResult[]
): PartialSuccessStats {
  const stats = statsComputer.compute(results);
  const failures = converter.extractFailures(results);
  
  return {
    total: results.length,
    successful: stats.successfulAdapters,
    failed: stats.failedAdapters,
    successRate: stats.successRate / 100, // Convert from percentage to 0-1
    failures
  };
}
