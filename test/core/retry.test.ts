/**
 * @file Retry Logic Tests
 * @rule Comprehensive test coverage for P2.2: Retry with exponential backoff
 */

import { describe, expect, it } from '@jest/globals';
import {
  calculateDelay,
  isRetryableError,
  retry,
  retryWithTimeout
} from '../../src/core/retry.js';

describe('@fast Retry Logic', () => {
  describe('isRetryableError', () => {
    it('identifies network errors as retryable', () => {
      expect(isRetryableError(new Error('ETIMEDOUT'))).toBe(true);
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ENOTFOUND'))).toBe(true);
    });
    
    it('identifies rate limit errors as retryable', () => {
      expect(isRetryableError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRetryableError(new Error('Too many requests'))).toBe(true);
    });
    
    it('identifies service errors as retryable', () => {
      expect(isRetryableError(new Error('Service unavailable'))).toBe(true);
      expect(isRetryableError(new Error('Gateway timeout'))).toBe(true);
    });
    
    it('identifies non-retryable errors', () => {
      expect(isRetryableError(new Error('Invalid input'))).toBe(false);
      expect(isRetryableError(new Error('Permission denied'))).toBe(false);
      expect(isRetryableError(new Error('Not found'))).toBe(false);
    });
  });
  
  describe('calculateDelay', () => {
    it('calculates exponential backoff correctly', () => {
      // With jitter=0, should be pure exponential
      const delay1 = calculateDelay(0, 100, 10000, 2, 0);
      const delay2 = calculateDelay(1, 100, 10000, 2, 0);
      const delay3 = calculateDelay(2, 100, 10000, 2, 0);
      
      expect(delay1).toBe(100);   // 100 * 2^0 = 100
      expect(delay2).toBe(200);   // 100 * 2^1 = 200
      expect(delay3).toBe(400);   // 100 * 2^2 = 400
    });
    
    it('respects maxDelay cap', () => {
      const delay = calculateDelay(10, 100, 1000, 2, 0);
      
      expect(delay).toBeLessThanOrEqual(1000);
    });
    
    it('adds jitter to delay', () => {
      // With jitter=0.5, delay should vary between base and base*1.5
      const delays = [];
      for (let i = 0; i < 10; i++) {
        delays.push(calculateDelay(1, 100, 10000, 2, 0.5));
      }
      
      // Should have some variation
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
      
      // All delays should be between 200 and 300
      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(200);
        expect(delay).toBeLessThanOrEqual(300);
      }
    });
  });
  
  describe('retry', () => {
    it('succeeds on first attempt', async () => {
      let attempts = 0;
      
      const result = await retry(async () => {
        attempts++;
        return 'success';
      });
      
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });
    
    it('retries on transient failure', async () => {
      let attempts = 0;
      
      const result = await retry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('ETIMEDOUT');
        }
        return 'success after retries';
      }, { maxAttempts: 3, initialDelay: 10 });
      
      expect(result).toBe('success after retries');
      expect(attempts).toBe(3);
    });
    
    it('throws after max attempts exceeded', async () => {
      let attempts = 0;
      
      await expect(
        retry(async () => {
          attempts++;
          throw new Error('ECONNRESET');
        }, { maxAttempts: 3, initialDelay: 10 })
      ).rejects.toThrow('ECONNRESET');
      
      expect(attempts).toBe(3);
    });
    
    it('does not retry non-retryable errors', async () => {
      let attempts = 0;
      
      await expect(
        retry(async () => {
          attempts++;
          throw new Error('Invalid input');
        }, { maxAttempts: 3 })
      ).rejects.toThrow('Invalid input');
      
      expect(attempts).toBe(1); // Only one attempt
    });
    
    it('calls onRetry callback', async () => {
      const retryLog: Array<{ attempt: number; delay: number }> = [];
      
      try {
        await retry(async () => {
          throw new Error('ETIMEDOUT');
        }, {
          maxAttempts: 3,
          initialDelay: 10,
          onRetry: (attempt, delay) => {
            retryLog.push({ attempt, delay });
          }
        });
      } catch {
        // Expected to fail
      }
      
      expect(retryLog.length).toBe(2); // 2 retries after first failure
      expect(retryLog[0].attempt).toBe(1);
      expect(retryLog[1].attempt).toBe(2);
    });
    
    it('uses custom isRetryable function', async () => {
      let attempts = 0;
      
      await expect(
        retry(async () => {
          attempts++;
          throw new Error('Custom error');
        }, {
          maxAttempts: 3,
          isRetryable: (error) => {
            return error instanceof Error && error.message.includes('Custom');
          },
          initialDelay: 10
        })
      ).rejects.toThrow('Custom error');
      
      expect(attempts).toBe(3); // Should retry because custom check says yes
    });
  });
  
  describe('retryWithTimeout', () => {
    it('succeeds when function completes before timeout', async () => {
      const result = await retryWithTimeout(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'success';
        },
        100, // 100ms timeout
        { maxAttempts: 1 }
      );
      
      expect(result).toBe('success');
    });
    
    it('throws timeout error when function is too slow', async () => {
      await expect(
        retryWithTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return 'too slow';
          },
          50, // 50ms timeout
          { maxAttempts: 1 }
        )
      ).rejects.toThrow(/timed out after 50ms/);
    });
    
    it('retries timeout errors', async () => {
      let attempts = 0;
      
      const result = await retryWithTimeout(
        async () => {
          attempts++;
          if (attempts < 2) {
            // First attempt: slow (will timeout)
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          // Second attempt: fast (will succeed)
          return 'success after retry';
        },
        50, // 50ms timeout
        {
          maxAttempts: 3,
          initialDelay: 10,
          isRetryable: (error) => {
            // Treat timeout errors as retryable
            return error instanceof Error && error.message.includes('timed out');
          }
        }
      );
      
      expect(result).toBe('success after retry');
      expect(attempts).toBe(2);
    });
  });
  
  describe('Performance', () => {
    it('respects initial delay', async () => {
      const start = Date.now();
      
      try {
        await retry(async () => {
          throw new Error('ETIMEDOUT');
        }, {
          maxAttempts: 2,
          initialDelay: 50,
          jitter: 0
        });
      } catch {
        // Expected
      }
      
      const elapsed = Date.now() - start;
      
      // Should take at least 50ms (one retry with 50ms delay)
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow small margin
    });
    
    it('increases delay with backoff', async () => {
      const delays: number[] = [];
      
      try {
        await retry(async () => {
          throw new Error('ETIMEDOUT');
        }, {
          maxAttempts: 4,
          initialDelay: 10,
          backoffMultiplier: 2,
          jitter: 0,
          onRetry: (_, delay) => delays.push(delay)
        });
      } catch {
        // Expected
      }
      
      // Delays should increase: ~10, ~20, ~40
      expect(delays[0]).toBeCloseTo(10, 0);
      expect(delays[1]).toBeCloseTo(20, 0);
      expect(delays[2]).toBeCloseTo(40, 0);
    });
  });
});
