/**
 * ErrorClassifier - Single Source of Truth for error classification
 * 
 * Provides consistent error type classification and metadata across the system.
 * This eliminates code duplication and ensures all error handling follows the same rules.
 * 
 * @module error-classifier
 */

/**
 * Standardized error classification result
 */
export interface ErrorClassification {
  /** Error type category */
  type: 'circuit_breaker_open' | 'timeout' | 'not_found' | 'permission' | 'validation' | 'retries_exhausted' | 'crash' | 'unknown';
  
  /** Exit code following POSIX conventions */
  exitCode: number;
  
  /** Human-readable reason */
  reason: string;
  
  /** Original error message */
  message: string;
}

/**
 * ErrorClassifier - Centralized error classification logic
 * 
 * Usage:
 * ```typescript
 * const result = ErrorClassifier.classify(error);
 * console.log(result.type, result.exitCode, result.reason);
 * ```
 */
export class ErrorClassifier {
  /**
   * Classify an error and return standardized metadata
   * 
   * @param error - Error to classify (Error object or string)
   * @param context - Optional context for classification (e.g., retry attempts)
   * @returns Standardized error classification
   */
  static classify(
    error: Error | string | unknown,
    context?: {
      attempts?: number;
      maxRetries?: number;
    }
  ): ErrorClassification {
    const message = this.extractMessage(error);
    const messageLower = message.toLowerCase();

    // Priority 1: Circuit breaker state
    if (messageLower.includes('circuit breaker open')) {
      return {
        type: 'circuit_breaker_open',
        exitCode: 129,  // Custom: circuit breaker open
        reason: 'Circuit breaker open',
        message
      };
    }

    // Priority 2: Timeout errors
    if (messageLower.includes('timeout') || messageLower.includes('etimedout') || messageLower.includes('timed out')) {
      return {
        type: 'timeout',
        exitCode: 124,  // POSIX: timeout
        reason: 'Execution timeout',
        message
      };
    }

    // Priority 3: Tool not found
    if (messageLower.includes('enoent') || messageLower.includes('not found')) {
      return {
        type: 'not_found',
        exitCode: 127,  // POSIX: command not found
        reason: 'Tool not found',
        message
      };
    }

    // Priority 4: Permission errors
    if (messageLower.includes('eacces') || messageLower.includes('permission')) {
      return {
        type: 'permission',
        exitCode: 126,  // POSIX: permission denied
        reason: 'Permission denied',
        message
      };
    }

    // Priority 5: Validation errors
    if (messageLower.includes('validation') || messageLower.includes('invalid')) {
      return {
        type: 'validation',
        exitCode: 1,  // Generic error
        reason: 'Invalid input',
        message
      };
    }

    // Priority 6: Retry exhaustion (context-dependent)
    if (context?.attempts !== undefined && context?.maxRetries !== undefined) {
      if (context.attempts >= context.maxRetries) {
        return {
          type: 'retries_exhausted',
          exitCode: 130,  // Custom: retries exhausted
          reason: 'Retries exhausted',
          message
        };
      }
    }

    // Priority 7: Generic crash
    if (error instanceof Error && error.stack) {
      return {
        type: 'crash',
        exitCode: 3,  // Custom: adapter crash
        reason: 'Adapter crashed',
        message
      };
    }

    // Fallback: Unknown error
    return {
      type: 'unknown',
      exitCode: 1,  // Generic error
      reason: 'Unknown error',
      message
    };
  }

  /**
   * Extract error message from various error types
   * 
   * @param error - Error to extract message from
   * @returns Error message string
   */
  private static extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message || 'Unknown error';
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error === null || error === undefined) {
      return 'Unknown error';
    }
    
    return String(error);
  }

  /**
   * Check if an error is retryable based on its classification
   * 
   * @param error - Error to check
   * @returns true if error is retryable
   */
  static isRetryable(error: Error | string | unknown): boolean {
    const classification = this.classify(error);
    
    // Non-retryable errors: permanent failures
    const nonRetryableTypes: ErrorClassification['type'][] = [
      'not_found',        // Tool doesn't exist
      'permission',       // No access
      'validation',       // Invalid input
      'retries_exhausted' // Already retried max times
    ];
    
    return !nonRetryableTypes.includes(classification.type);
  }
}
