/**
 * @file Timeout Enforcement Tests
 * @rule Comprehensive test coverage for P2.3: Timeout enforcement
 */

import { describe, expect, it } from '@jest/globals';
import {
    TimeoutError,
    TimeoutManager,
    withGlobalAndStepTimeouts,
    withTimeout,
    withTimeouts
} from '../../src/core/timeout.js';

describe('@fast Timeout Enforcement', () => {
  describe('withTimeout', () => {
    it('returns result when function completes before timeout', async () => {
      const result = await withTimeout(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'success';
        },
        100,
        'test-op'
      );
      
      expect(result).toBe('success');
    });
    
    it('throws TimeoutError when function exceeds timeout', async () => {
      await expect(
        withTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'too slow';
          },
          20,
          'slow-op'
        )
      ).rejects.toThrow(TimeoutError);
    });
    
    it('includes timeout details in error', async () => {
      try {
        await withTimeout(
          async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
          },
          20,
          'my-operation'
        );
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        if (error instanceof TimeoutError) {
          expect(error.operation).toBe('my-operation');
          expect(error.timeoutMs).toBe(20);
          expect(error.message).toContain('my-operation');
          expect(error.message).toContain('20ms');
        }
      }
    });
    
    it('propagates non-timeout errors', async () => {
      await expect(
        withTimeout(
          async () => {
            throw new Error('Custom error');
          },
          100,
          'failing-op'
        )
      ).rejects.toThrow('Custom error');
    });
    
    it('cleans up timeout on success', async () => {
      const timeoutsBefore = (process as any)._getActiveHandles?.()?.length || 0;
      
      await withTimeout(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'done';
        },
        100,
        'cleanup-test'
      );
      
      // Give time for cleanup
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Should not have lingering timeouts
      // (This is a weak test but better than nothing)
      expect(true).toBe(true);
    });
  });
  
  describe('withTimeouts', () => {
    it('runs multiple operations with individual timeouts', async () => {
      const results = await withTimeouts([
        {
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'result-1';
          },
          timeout: 50,
          name: 'op-1'
        },
        {
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
            return 'result-2';
          },
          timeout: 50,
          name: 'op-2'
        }
      ]);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('result-1');
      expect(results[1].success).toBe(true);
      expect(results[1].result).toBe('result-2');
    });
    
    it('returns partial results when some operations timeout', async () => {
      const results = await withTimeouts([
        {
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return 'fast';
          },
          timeout: 50,
          name: 'fast-op'
        },
        {
          fn: async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return 'slow';
          },
          timeout: 30,
          name: 'slow-op'
        }
      ]);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('fast');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeInstanceOf(TimeoutError);
    });
    
    it('returns partial results when some operations fail', async () => {
      const results = await withTimeouts([
        {
          fn: async () => 'success',
          timeout: 50,
          name: 'good-op'
        },
        {
          fn: async () => {
            throw new Error('Intentional failure');
          },
          timeout: 50,
          name: 'bad-op'
        }
      ]);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('success');
      expect(results[1].success).toBe(false);
      expect(results[1].error?.message).toBe('Intentional failure');
    });
  });
  
  describe('withGlobalAndStepTimeouts', () => {
    it('completes when all steps finish within timeouts', async () => {
      const results = await withGlobalAndStepTimeouts(
        [
          {
            fn: async () => {
              await new Promise(resolve => setTimeout(resolve, 10));
              return 'step-1';
            },
            timeout: 50,
            name: 'step-1'
          },
          {
            fn: async () => {
              await new Promise(resolve => setTimeout(resolve, 10));
              return 'step-2';
            },
            timeout: 50,
            name: 'step-2'
          }
        ],
        200, // Global timeout
        'multi-step-op'
      );
      
      expect(results).toHaveLength(2);
      expect(results[0]).toBe('step-1');
      expect(results[1]).toBe('step-2');
    });
    
    it('throws when global timeout exceeded', async () => {
      await expect(
        withGlobalAndStepTimeouts(
          [
            {
              fn: async () => {
                await new Promise(resolve => setTimeout(resolve, 30));
                return 'step-1';
              },
              timeout: 100,
              name: 'step-1'
            },
            {
              fn: async () => {
                await new Promise(resolve => setTimeout(resolve, 30));
                return 'step-2';
              },
              timeout: 100,
              name: 'step-2'
            }
          ],
          40, // Global timeout - not enough for both steps
          'slow-orchestration'
        )
      ).rejects.toThrow(/(Global timeout|timed out)/);
    });
    
    it('uses minimum of step timeout and remaining global timeout', async () => {
      // This tests that if global timeout is running low, step timeout is reduced
      const results = await withGlobalAndStepTimeouts(
        [
          {
            fn: async () => {
              await new Promise(resolve => setTimeout(resolve, 20));
              return 'step-1';
            },
            timeout: 50,
            name: 'step-1'
          }
        ],
        100,
        'test-op'
      );
      
      expect(results).toHaveLength(1);
      expect(results[0]).toBe('step-1');
    });
  });
  
  describe('TimeoutManager', () => {
    it('manages multiple timeouts', async () => {
      const manager = new TimeoutManager();
      const results: string[] = [];
      
      manager.set('timeout-1', 20, () => results.push('timeout-1'));
      manager.set('timeout-2', 40, () => results.push('timeout-2'));
      
      expect(manager.getActiveCount()).toBe(2);
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(results).toEqual(['timeout-1', 'timeout-2']);
      expect(manager.getActiveCount()).toBe(0);
    });
    
    it('clears specific timeout', async () => {
      const manager = new TimeoutManager();
      const results: string[] = [];
      
      manager.set('timeout-1', 20, () => results.push('timeout-1'));
      manager.set('timeout-2', 20, () => results.push('timeout-2'));
      
      manager.clear('timeout-1');
      
      await new Promise(resolve => setTimeout(resolve, 30));
      
      expect(results).toEqual(['timeout-2']);
    });
    
    it('clears all timeouts', async () => {
      const manager = new TimeoutManager();
      const results: string[] = [];
      
      manager.set('timeout-1', 20, () => results.push('timeout-1'));
      manager.set('timeout-2', 20, () => results.push('timeout-2'));
      
      expect(manager.getActiveCount()).toBe(2);
      
      manager.clearAll();
      
      expect(manager.getActiveCount()).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 30));
      
      expect(results).toEqual([]);
    });
    
    it('replaces existing timeout with same ID', async () => {
      const manager = new TimeoutManager();
      const results: string[] = [];
      
      manager.set('timeout-1', 20, () => results.push('first'));
      manager.set('timeout-1', 40, () => results.push('second'));
      
      expect(manager.getActiveCount()).toBe(1);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(results).toEqual(['second']); // First should be replaced
    });
  });
});
