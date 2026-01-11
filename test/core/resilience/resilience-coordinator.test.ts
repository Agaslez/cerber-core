import { beforeEach, describe, expect, it } from '@jest/globals';
import type { Adapter, AdapterResult } from '../../../src/adapters/types.js';
import { ResilienceCoordinator } from '../../../src/core/resilience/resilience-coordinator.js';

// Mock adapter
class MockAdapter implements Partial<Adapter> {
  name: string;
  shouldFail: boolean;
  callCount: number = 0;
  
  constructor(name: string, shouldFail: boolean = false) {
    this.name = name;
    this.shouldFail = shouldFail;
  }
  
  async run(options: any): Promise<AdapterResult> {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error('Mock failure');
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

describe('ResilienceCoordinator', () => {
  let coordinator: ResilienceCoordinator;
  
  beforeEach(() => {
    coordinator = new ResilienceCoordinator();
  });
  
  describe('executeResilient()', () => {
    it('should execute adapter successfully', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      const result = await coordinator.executeResilient(adapter, options);
      
      expect(result.success).toBe(true);
      expect(result.adapter).toBe('test-adapter');
      expect(result.result).toBeDefined();
      expect(result.result?.exitCode).toBe(0);
    });
    
    it('should handle adapter failure', async () => {
      const adapter = new MockAdapter('failing-adapter', true) as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      const result = await coordinator.executeResilient(adapter, options);
      
      expect(result.success).toBe(false);
      expect(result.adapter).toBe('failing-adapter');
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('Mock failure');
    });
    
    it('should include duration in result', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      const result = await coordinator.executeResilient(adapter, options);
      
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
    
    it('should support disabling resilience features', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      const resilienceOptions = {
        circuitBreaker: false,
        retry: false,
        timeout: false
      };
      
      const result = await coordinator.executeResilient(adapter, options, resilienceOptions);
      
      expect(result.success).toBe(true);
    });
    
    it('should retry on transient failures', async () => {
      let attempts = 0;
      class FlakeyAdapter implements Partial<Adapter> {
        name = 'flakey';
        
        async run(options: any): Promise<AdapterResult> {
          attempts++;
          if (attempts < 2) {
            throw new Error('Transient failure');
          }
          return {
            tool: 'flakey',
            version: '1.0',
            exitCode: 0,
            violations: [],
            executionTime: 10
          };
        }
      }
      
      const adapter = new FlakeyAdapter() as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      // Disable circuit breaker to test pure retry logic
      const result = await coordinator.executeResilient(adapter, options, { 
        maxRetries: 3,
        circuitBreaker: false  // Disable to test retry only
      });
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
  });
  
  describe('executeResilientParallel()', () => {
    it('should execute multiple adapters in parallel', async () => {
      const adapters = [
        new MockAdapter('adapter-1') as any,
        new MockAdapter('adapter-2') as any,
        new MockAdapter('adapter-3') as any
      ];
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      const results = await coordinator.executeResilientParallel(adapters, options);
      
      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
    });
    
    it('should support partial success', async () => {
      const adapters = [
        new MockAdapter('adapter-1') as any,
        new MockAdapter('adapter-2', true) as any,
        new MockAdapter('adapter-3') as any
      ];
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      const results = await coordinator.executeResilientParallel(adapters, options);
      
      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
    
    it('should handle all adapters failing', async () => {
      const adapters = [
        new MockAdapter('adapter-1', true) as any,
        new MockAdapter('adapter-2', true) as any
      ];
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      const results = await coordinator.executeResilientParallel(adapters, options);
      
      expect(results.length).toBe(2);
      expect(results.every(r => !r.success)).toBe(true);
    });
    
    it('should handle empty adapter list', async () => {
      const results = await coordinator.executeResilientParallel([], { files: [], cwd: process.cwd() });
      
      expect(results).toEqual([]);
    });
  });
});
