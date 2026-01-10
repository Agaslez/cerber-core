/**
 * StatsComputer - Single Responsibility: Compute partial success statistics
 * 
 * Separated from resilience coordinator to follow SRP.
 * Pure function - no side effects, no state.
 * 
 * Computes:
 * - Number of successful adapters
 * - Number of failed adapters
 * - Success rate percentage
 */

import type { ResilientAdapterResult } from '../resilience.js';

/**
 * Partial success statistics
 */
export interface PartialSuccessStats {
  /** Number of adapters that succeeded */
  successfulAdapters: number;
  
  /** Number of adapters that failed */
  failedAdapters: number;
  
  /** Success rate as percentage (0-100) */
  successRate: number;
}

/**
 * StatsComputer - computes statistics from resilient adapter results
 */
export class StatsComputer {
  /**
   * Compute partial success statistics
   * 
   * @param results - Array of resilient adapter results
   * @returns Statistics object with success/failure counts and rate
   */
  compute(results: ResilientAdapterResult[]): PartialSuccessStats {
    if (results.length === 0) {
      return {
        successfulAdapters: 0,
        failedAdapters: 0,
        successRate: 0
      };
    }
    
    const successfulAdapters = results.filter(r => r.success).length;
    const failedAdapters = results.filter(r => !r.success).length;
    const successRate = Math.round((successfulAdapters / results.length) * 100);
    
    return {
      successfulAdapters,
      failedAdapters,
      successRate
    };
  }
  
  /**
   * Check if results represent complete success
   * 
   * @param results - Array of resilient adapter results
   * @returns true if all adapters succeeded
   */
  isCompleteSuccess(results: ResilientAdapterResult[]): boolean {
    return results.length > 0 && results.every(r => r.success);
  }
  
  /**
   * Check if results represent complete failure
   * 
   * @param results - Array of resilient adapter results
   * @returns true if all adapters failed
   */
  isCompleteFailure(results: ResilientAdapterResult[]): boolean {
    return results.length > 0 && results.every(r => !r.success);
  }
  
  /**
   * Check if results represent partial success
   * 
   * @param results - Array of resilient adapter results
   * @returns true if some (but not all) adapters succeeded
   */
  isPartialSuccess(results: ResilientAdapterResult[]): boolean {
    if (results.length === 0) return false;
    
    const successCount = results.filter(r => r.success).length;
    return successCount > 0 && successCount < results.length;
  }
}
