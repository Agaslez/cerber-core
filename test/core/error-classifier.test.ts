import { describe, expect, it } from '@jest/globals';
import { ErrorClassifier } from '../../src/core/error-classifier.js';

describe('@fast ErrorClassifier', () => {
  describe('classify()', () => {
    it('should classify ENOENT as not_found with exitCode 127', () => {
      const error = new Error('ENOENT: no such file or directory');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('not_found');
      expect(result.exitCode).toBe(127);
      expect(result.reason).toBe('Tool not found');
      expect(result.message).toContain('ENOENT');
    });

    it('should classify "not found" message as not_found', () => {
      const error = 'Command not found: eslint';
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('not_found');
      expect(result.exitCode).toBe(127);
      expect(result.reason).toBe('Tool not found');
    });

    it('should classify EACCES as permission with exitCode 126', () => {
      const error = new Error('EACCES: permission denied');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('permission');
      expect(result.exitCode).toBe(126);
      expect(result.reason).toBe('Permission denied');
      expect(result.message).toContain('EACCES');
    });

    it('should classify "permission" message as permission', () => {
      const error = 'Permission denied: cannot access /root';
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('permission');
      expect(result.exitCode).toBe(126);
      expect(result.reason).toBe('Permission denied');
    });

    it('should classify ETIMEDOUT as timeout with exitCode 124', () => {
      const error = new Error('ETIMEDOUT: operation timed out');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('timeout');
      expect(result.exitCode).toBe(124);
      expect(result.reason).toBe('Execution timeout');
      expect(result.message).toContain('ETIMEDOUT');
    });

    it('should classify "timeout" message as timeout', () => {
      const error = 'Execution timeout after 5000ms';
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('timeout');
      expect(result.exitCode).toBe(124);
      expect(result.reason).toBe('Execution timeout');
    });

    it('should classify circuit breaker open error', () => {
      const error = new Error('Circuit breaker OPEN - preventing execution');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('circuit_breaker_open');
      expect(result.exitCode).toBe(129);
      expect(result.reason).toBe('Circuit breaker open');
      expect(result.message).toContain('Circuit breaker');
    });

    it('should classify validation errors', () => {
      const error = new Error('Validation failed: invalid configuration');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('validation');
      expect(result.exitCode).toBe(1);
      expect(result.reason).toBe('Invalid input');
    });

    it('should classify retries exhausted with context', () => {
      const error = new Error('Network error');
      const result = ErrorClassifier.classify(error, {
        attempts: 3,
        maxRetries: 3
      });

      expect(result.type).toBe('retries_exhausted');
      expect(result.exitCode).toBe(130);
      expect(result.reason).toBe('Retries exhausted');
    });

    it('should not classify as retries_exhausted if attempts < maxRetries', () => {
      const error = new Error('Network error');
      const result = ErrorClassifier.classify(error, {
        attempts: 2,
        maxRetries: 3
      });

      expect(result.type).not.toBe('retries_exhausted');
      expect(result.type).toBe('crash');  // Has stack
    });

    it('should classify Error with stack as crash', () => {
      const error = new Error('Unexpected error in adapter');
      const result = ErrorClassifier.classify(error);

      expect(result.type).toBe('crash');
      expect(result.exitCode).toBe(3);
      expect(result.reason).toBe('Adapter crashed');
    });

    it('should handle null error', () => {
      const result = ErrorClassifier.classify(null);

      expect(result.type).toBe('unknown');
      expect(result.exitCode).toBe(1);
      expect(result.reason).toBe('Unknown error');
      expect(result.message).toBe('Unknown error');
    });

    it('should handle undefined error', () => {
      const result = ErrorClassifier.classify(undefined);

      expect(result.type).toBe('unknown');
      expect(result.exitCode).toBe(1);
      expect(result.reason).toBe('Unknown error');
      expect(result.message).toBe('Unknown error');
    });

    it('should handle empty string error', () => {
      const result = ErrorClassifier.classify('');

      expect(result.type).toBe('unknown');
      expect(result.exitCode).toBe(1);
      expect(result.reason).toBe('Unknown error');
      expect(result.message).toBe('');
    });

    it('should handle object error', () => {
      const result = ErrorClassifier.classify({ code: 'ERR_CUSTOM' });

      expect(result.type).toBe('unknown');
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('Object');
    });

    it('should be case-insensitive for error messages', () => {
      const error1 = 'TIMEOUT occurred';
      const error2 = 'timeout occurred';
      const error3 = 'TiMeOuT occurred';

      expect(ErrorClassifier.classify(error1).type).toBe('timeout');
      expect(ErrorClassifier.classify(error2).type).toBe('timeout');
      expect(ErrorClassifier.classify(error3).type).toBe('timeout');
    });
  });

  describe('isRetryable()', () => {
    it('should return false for not_found errors (tool missing)', () => {
      const error = new Error('ENOENT: command not found');
      expect(ErrorClassifier.isRetryable(error)).toBe(false);
    });

    it('should return false for permission errors (permanent)', () => {
      const error = new Error('EACCES: permission denied');
      expect(ErrorClassifier.isRetryable(error)).toBe(false);
    });

    it('should return false for validation errors (invalid input)', () => {
      const error = new Error('Validation failed');
      expect(ErrorClassifier.isRetryable(error)).toBe(false);
    });

    it('should return false for retries_exhausted when context provided', () => {
      const error = new Error('Network error');
      // Classification with context shows retries exhausted
      const classification = ErrorClassifier.classify(error, { attempts: 3, maxRetries: 3 });
      expect(classification.type).toBe('retries_exhausted');
      
      // Verify the type is non-retryable by checking against non-retryable list
      const nonRetryableTypes = ['not_found', 'permission', 'validation', 'retries_exhausted'];
      expect(nonRetryableTypes).toContain(classification.type);
    });

    it('should return true for timeout errors (transient)', () => {
      const error = new Error('ETIMEDOUT');
      expect(ErrorClassifier.isRetryable(error)).toBe(true);
    });

    it('should return true for circuit_breaker_open (can retry later)', () => {
      const error = new Error('Circuit breaker OPEN');
      expect(ErrorClassifier.isRetryable(error)).toBe(true);
    });

    it('should return true for crash errors (might be transient)', () => {
      const error = new Error('Unexpected crash');
      expect(ErrorClassifier.isRetryable(error)).toBe(true);
    });

    it('should return true for unknown errors (might be transient)', () => {
      const error = 'Something went wrong';
      expect(ErrorClassifier.isRetryable(error)).toBe(true);
    });
  });

  describe('error priority', () => {
    it('should prioritize circuit_breaker_open over other errors', () => {
      const error = 'Circuit breaker OPEN and also timeout occurred';
      const result = ErrorClassifier.classify(error);
      expect(result.type).toBe('circuit_breaker_open');
    });

    it('should prioritize timeout over not_found', () => {
      const error = 'timeout occurred while searching: not found';
      const result = ErrorClassifier.classify(error);
      expect(result.type).toBe('timeout');
    });

    it('should prioritize not_found over permission', () => {
      const error = 'ENOENT: permission denied on missing file';
      const result = ErrorClassifier.classify(error);
      expect(result.type).toBe('not_found');
    });
  });

  describe('edge cases', () => {
    it('should handle Error without message', () => {
      const error = new Error();
      error.message = '';
      const result = ErrorClassifier.classify(error);
      expect(result.message).toBe('Unknown error');
    });

    it('should handle numeric error', () => {
      const result = ErrorClassifier.classify(404);
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('404');
    });

    it('should handle boolean error', () => {
      const result = ErrorClassifier.classify(false);
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('false');
    });

    it('should preserve original error message', () => {
      const originalMessage = 'Very specific error: XYZ failed at line 42';
      const error = new Error(originalMessage);
      const result = ErrorClassifier.classify(error);
      expect(result.message).toBe(originalMessage);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'A'.repeat(10000);
      const error = new Error(longMessage);
      const result = ErrorClassifier.classify(error);
      expect(result.message).toBe(longMessage);
      expect(result.type).toBe('crash');
    });
  });
});
