/**
 * @file Resilience Integration Tests
 * @rule Comprehensive test coverage for P2.4: Resilience wrapper + Orchestrator integration
 */

import { describe, expect, it } from '@jest/globals';
import type { AdapterResult } from '../../src/adapters/types.js';
import {
    computePartialSuccessStats,
    convertToLegacyResults,
    executeResilientAdapter,
    executeResilientAdapters,
    type ResilientAdapterResult
} from '../../src/core/resilience.js';

// Mock adapter - minimal implementation for testing
class MockAdapter {
  name: string;
  shouldFail: boolean;
  failureType: 'timeout' | 'crash' | 'not_found' | 'normal';
  callCount: number;
  
  constructor(name: string, shouldFail: boolean = false, failureType: 'timeout' | 'crash' | 'not_found' | 'normal' = 'normal') {
    this.name = name;
    this.shouldFail = shouldFail;
    this.failureType = failureType;
    this.callCount = 0;
  }
  
  async run(options: any): Promise<AdapterResult> {
    this.callCount++;
    
    if (this.shouldFail) {
      if (this.failureType === 'timeout') {
        await new Promise(resolve => setTimeout(resolve, 200));
      } else if (this.failureType === 'not_found') {
        throw new Error('ENOENT: tool not found');
      } else if (this.failureType === 'crash') {
        throw new Error('Adapter crashed unexpectedly');
      }
      
      throw new Error('Simulated failure');
    }
    
    return {
      tool: this.name,
      version: '1.0.0',
      exitCode: 0,
      violations: [],
      executionTime: 10
    };
  }
}

describe('Resilience Integration', () => {
  describe('executeResilientAdapter', () => {
    it('returns success for working adapter', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      
      const result = await executeResilientAdapter(
        adapter,
        { files: ['test.yml'], cwd: process.cwd() }
      );
      
      expect(result.success).toBe(true);
      expect(result.adapter).toBe('test-adapter');
      expect(result.result).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });
    
    it('retries on transient failures', async () => {
      let attempts = 0;
      const flakyAdapter = {
        name: 'flaky-adapter',
        async run() {
          attempts++;
          if (attempts < 2) {
            throw new Error('ECONNRESET');
          }
          return {
            tool: 'flaky-adapter',
            version: '1.0.0',
            exitCode: 0,
            violations: [],
            executionTime: 10
          };
        }
      } as any;
      
      const result = await executeResilientAdapter(
        flakyAdapter,
        { files: ['test.yml'], cwd: process.cwd() },
        { maxRetries: 3 }
      );
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
    
    it('times out slow adapters', async () => {
      const slowAdapter = new MockAdapter('slow-adapter', true, 'timeout') as any;
      
      const result = await executeResilientAdapter(
        slowAdapter,
        { files: ['test.yml'], cwd: process.cwd() },
        { adapterTimeout: 50, maxRetries: 1 }
      );
      
      expect(result.success).toBe(false);
      // Timeout errors are retryable, so after retries exhausted we still report timeout
      expect(result.error?.type).toBe('timeout');
      expect(result.error?.attempts).toBeGreaterThan(0);
    });
    
    it('classifies error types correctly', async () => {
      const notFoundAdapter = new MockAdapter('missing-tool', true, 'not_found') as any;
      
      const result = await executeResilientAdapter(
        notFoundAdapter,
        { files: ['test.yml'], cwd: process.cwd() },
        { maxRetries: 1 }
      );
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('not_found');
    });
    
    it('includes duration and attempts in result', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      
      const result = await executeResilientAdapter(
        adapter,
        { files: ['test.yml'], cwd: process.cwd() }
      );
      
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.error?.attempts).toBeUndefined(); // No failures
    });
  });
  
  describe('executeResilientAdapters', () => {
    it('runs multiple adapters in parallel', async () => {
      const adapters = [
        { name: 'adapter-1', adapter: new MockAdapter('adapter-1') as any },
        { name: 'adapter-2', adapter: new MockAdapter('adapter-2') as any },
        { name: 'adapter-3', adapter: new MockAdapter('adapter-3') as any }
      ];
      
      const results = await executeResilientAdapters(
        adapters,
        { files: ['test.yml'], cwd: process.cwd() }
      );
      
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    it('returns partial success when some adapters fail', async () => {
      const adapters = [
        { name: 'good-1', adapter: new MockAdapter('good-1') as any },
        { name: 'bad', adapter: new MockAdapter('bad', true, 'crash') as any },
        { name: 'good-2', adapter: new MockAdapter('good-2') as any }
      ];
      
      const results = await executeResilientAdapters(
        adapters,
        { files: ['test.yml'], cwd: process.cwd() },
        { maxRetries: 1 }
      );
      
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);  // good-1
      expect(results[1].success).toBe(false); // bad
      expect(results[2].success).toBe(true);  // good-2
    });
    
    it('continues execution even when one adapter fails', async () => {
      const adapters = [
        { name: 'fail-fast', adapter: new MockAdapter('fail-fast', true, 'crash') as any },
        { name: 'should-still-run', adapter: new MockAdapter('should-still-run') as any }
      ];
      
      const results = await executeResilientAdapters(
        adapters,
        { files: ['test.yml'], cwd: process.cwd() },
        { maxRetries: 1 }
      );
      
      // Second adapter should still run despite first failing
      expect(results[1].success).toBe(true);
    });
  });
  
  describe('convertToLegacyResults', () => {
    it('converts successful results', () => {
      const resilientResults: ResilientAdapterResult[] = [
        {
          adapter: 'test-adapter',
          success: true,
          result: {
            tool: 'test-adapter',
            version: '1.0.0',
            exitCode: 0,
            violations: [],
            executionTime: 10
          },
          duration: 10
        }
      ];
      
      const legacy = convertToLegacyResults(resilientResults);
      
      expect(legacy).toHaveLength(1);
      expect(legacy[0].exitCode).toBe(0);
      expect(legacy[0].violations).toEqual([]);
    });
    
    it('converts failedexitCode).toBe(0ect exit codes', () => {
      const resilientResults: ResilientAdapterResult[] = [
        {
          adapter: 'timeout-adapter',
          success: false,
          error: {
            message: 'Timeout',
            type: 'timeout',
            attempts: 3,
            duration: 100
          },
          duration: 100
        },
        {
          adapter: 'not-found-adapter',
          success: false,
          error: {
            message: 'Not found',
            type: 'not_found',
            attempts: 1,
            duration: 10
          },
          duration: 10
        }
      ];
      
      const legacy = convertToLegacyResults(resilientResults);
      
      expect(legacy).toHaveLength(2);
      expect(legacy[0].exitCode).toBe(124); // timeout
      expect(legacy[1].exitCode).toBe(127); // not_found
    });
  });
  
  describe('computePartialSuccessStats', () => {
    it('computes correct statistics', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'good-1', success: true, duration: 10 },
        { adapter: 'good-2', success: true, duration: 20 },
        { adapter: 'bad-1', success: false, error: { message: 'Failed', type: 'crash' }, duration: 30 },
        { adapter: 'bad-2', success: false, error: { message: 'Timeout', type: 'timeout' }, duration: 40 }
      ];
      
      const stats = computePartialSuccessStats(results);
      
      expect(stats.total).toBe(4);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(2);
      expect(stats.successRate).toBe(0.5);
      expect(stats.failures).toHaveLength(2);
      expect(stats.failures[0].adapter).toBe('bad-1');
      expect(stats.failures[1].adapter).toBe('bad-2');
    });
    
    it('handles all success', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'good-1', success: true, duration: 10 },
        { adapter: 'good-2', success: true, duration: 20 }
      ];
      
      const stats = computePartialSuccessStats(results);
      
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(0);
      expect(stats.successRate).toBe(1.0);
      expect(stats.failures).toHaveLength(0);
    });
    
    it('handles all failure', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'bad-1', success: false, error: { message: 'Failed', type: 'crash' }, duration: 10 },
        { adapter: 'bad-2', success: false, error: { message: 'Timeout', type: 'timeout' }, duration: 20 }
      ];
      
      const stats = computePartialSuccessStats(results);
      
      expect(stats.total).toBe(2);
      expect(stats.successful).toBe(0);
      expect(stats.failed).toBe(2);
      expect(stats.successRate).toBe(0);
      expect(stats.failures).toHaveLength(2);
    });
  });
  
  describe('Circuit Breaker Integration', () => {
    it('opens circuit after repeated failures', async () => {
      const failingAdapter = new MockAdapter('failing-adapter', true, 'crash') as any;
      
      // Fail 5 times (threshold)
      for (let i = 0; i < 5; i++) {
        await executeResilientAdapter(
          failingAdapter,
          { files: ['test.yml'], cwd: process.cwd() },
          { maxRetries: 1, failureThreshold: 5 }
        );
      }
      
      // Next call should fail fast
      const startTime = Date.now();
      const result = await executeResilientAdapter(
        failingAdapter,
        { files: ['test.yml'], cwd: process.cwd() },
        { maxRetries: 1, failureThreshold: 5 }
      );
      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('circuit_breaker_open');
      // Should fail instantly (circuit breaker open)
      expect(duration).toBeLessThan(100);
    });
  });
});
