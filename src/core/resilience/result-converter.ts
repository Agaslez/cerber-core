/**
 * ResultConverter - Adapter Pattern for result format conversion
 * 
 * Separated from resilience coordinator to follow SRP and OCP.
 * Converts between ResilientAdapterResult and legacy AdapterResult formats.
 * 
 * Uses Adapter Pattern to enable:
 * - Format conversion without changing core logic
 * - Easy extension for new formats
 * - Testable in isolation
 */

import type { AdapterResult } from '../../adapters/types.js';
import type { ResilientAdapterResult } from '../resilience.js';

/**
 * ResultConverter - converts resilient results to legacy format
 * 
 * Implements Adapter Pattern for format conversion.
 */
export class ResultConverter {
  /**
   * Convert resilient adapter result to legacy AdapterResult format
   * 
   * Mapping:
   * - Success → exitCode 0, violations from result
   * - Failure → exitCode based on error type, empty violations, skipReason
   * 
   * @param resilientResult - Result from resilient execution
   * @returns Legacy AdapterResult format
   */
  convert(resilientResult: ResilientAdapterResult): AdapterResult {
    // Success case: return adapter's actual result
    if (resilientResult.success && resilientResult.result) {
      return resilientResult.result;
    }
    
    // Failure case: create error AdapterResult
    const errorType = resilientResult.error?.type || 'unknown';
    const exitCode = this.mapErrorTypeToExitCode(errorType);
    const errorMessage = resilientResult.error?.message || 'Unknown error';
    
    return {
      tool: resilientResult.adapter,
      version: 'unknown',
      exitCode,
      violations: [],
      executionTime: resilientResult.duration,
      skipped: true,
      skipReason: errorMessage
    };
  }
  
  /**
   * Convert array of resilient results to legacy format
   * 
   * @param resilientResults - Array of resilient results
   * @returns Array of legacy AdapterResult format
   */
  convertBatch(resilientResults: ResilientAdapterResult[]): AdapterResult[] {
    return resilientResults.map(r => this.convert(r));
  }
  
  /**
   * Map error type to POSIX-compliant exit code
   * 
   * Exit codes:
   * - 0: Success (should not reach this in error path)
   * - 1: Generic error
   * - 3: Adapter crash
   * - 124: Timeout (POSIX)
   * - 126: Permission denied (POSIX)
   * - 127: Command not found (POSIX)
   * - 129: Circuit breaker open (custom)
   * - 130: Retries exhausted (custom)
   * 
   * @param errorType - Error type from ErrorClassifier
   * @returns POSIX-compliant exit code
   */
  private mapErrorTypeToExitCode(errorType: string): number {
    switch (errorType) {
      case 'circuit_breaker_open':
        return 129;
      case 'timeout':
        return 124;
      case 'not_found':
        return 127;
      case 'permission':
        return 126;
      case 'retries_exhausted':
        return 130;
      case 'crash':
        return 3;
      case 'validation':
        return 1;
      case 'unknown':
      default:
        return 1;
    }
  }
  
  /**
   * Extract successful results only
   * 
   * @param resilientResults - Array of resilient results
   * @returns Array of successful adapter results only
   */
  extractSuccessful(resilientResults: ResilientAdapterResult[]): AdapterResult[] {
    return resilientResults
      .filter(r => r.success && r.result)
      .map(r => r.result!);
  }
  
  /**
   * Extract failed results with error details
   * 
   * @param resilientResults - Array of resilient results
   * @returns Array of tuples [adapter name, reason, type]
   */
  extractFailures(resilientResults: ResilientAdapterResult[]): Array<{ adapter: string; reason: string; type: string }> {
    return resilientResults
      .filter(r => !r.success)
      .map(r => ({
        adapter: r.adapter,
        reason: r.error?.message || 'Unknown error',
        type: r.error?.type || 'unknown'
      }));
  }
}
