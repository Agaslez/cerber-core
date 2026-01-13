import { beforeEach, describe, expect, it } from '@jest/globals';
import type { Adapter, AdapterResult } from '../../../src/adapters/types.js';
import { AdapterExecutor } from '../../../src/core/resilience/adapter-executor.js';
import { makeRunOptions } from '../../helpers/options.js';

// Mock adapter for testing
class MockAdapter implements Partial<Adapter> {
  name: string;
  shouldFail: boolean;
  delay: number;
  
  constructor(name: string, shouldFail: boolean = false, delay: number = 0) {
    this.name = name;
    this.shouldFail = shouldFail;
    this.delay = delay;
  }
  
  async run(options: any): Promise<AdapterResult> {
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    if (this.shouldFail) {
      throw new Error('Mock adapter failure');
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

describe('AdapterExecutor', () => {
  let executor: AdapterExecutor;
  
  beforeEach(() => {
    executor = new AdapterExecutor();
  });
  
  describe('execute()', () => {
    it('should execute adapter successfully without timeout', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      const options = makeRunOptions({ files: ['test.yml'] });
      
      const result = await executor.execute(adapter, options, 0);
      
      expect(result.tool).toBe('test-adapter');
      expect(result.exitCode).toBe(0);
      expect(result.violations).toEqual([]);
    });
    
    it('should execute adapter successfully with timeout (fast adapter)', async () => {
      const adapter = new MockAdapter('fast-adapter', false, 10) as any;
      const options = makeRunOptions({ files: ['test.yml'] });
      
      const result = await executor.execute(adapter, options, 1000);
      
      expect(result.tool).toBe('fast-adapter');
      expect(result.exitCode).toBe(0);
    });
    
    it('should timeout slow adapter', async () => {
      const adapter = new MockAdapter('slow-adapter', false, 500) as any;
      const options = makeRunOptions({ files: ['test.yml'] });
      
      await expect(executor.execute(adapter, options, 100)).rejects.toThrow();
    });
    
    it('should propagate adapter errors', async () => {
      const adapter = new MockAdapter('failing-adapter', true) as any;
      const options = makeRunOptions({ files: ['test.yml'] });
      
      await expect(executor.execute(adapter, options, 0)).rejects.toThrow('Mock adapter failure');
    });
    
    it('should clone options to prevent mutations', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      const originalFiles = ['test.yml'];
      const options = makeRunOptions({ files: originalFiles });
      
      await executor.execute(adapter, options, 0);
      
      // Original array should not be mutated
      expect(options.files).toBe(originalFiles);
      expect(options.files).toEqual(['test.yml']);
    });
    
    it('should handle empty files array', async () => {
      const adapter = new MockAdapter('test-adapter') as any;
      const options = makeRunOptions({ files: [] });
      
      const result = await executor.execute(adapter, options, 0);
      
      expect(result.exitCode).toBe(0);
    });
    
    it('should handle adapter that modifies options', async () => {
      class MutatingAdapter implements Partial<Adapter> {
        name = 'mutating';
        
        async run(options: any): Promise<AdapterResult> {
          options.files.push('added.yml');
          return {
            tool: 'mutating',
            version: '1.0.0',
            exitCode: 0,
            violations: [],
            executionTime: 10
          };
        }
      }
      
      const adapter = new MutatingAdapter() as any;
      const originalFiles = ['test.yml'];
      const options = makeRunOptions({ files: originalFiles });
      
      await executor.execute(adapter, options, 0);
      
      // Original array should still be unchanged
      expect(options.files).toEqual(['test.yml']);
    });
    
    it('should work with different timeout values', async () => {
      const adapter = new MockAdapter('test-adapter', false, 50) as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      // Should succeed with generous timeout
      const result = await executor.execute(adapter, options, 5000);
      expect(result.exitCode).toBe(0);
    });
  });
  
  describe('executeRaw()', () => {
    it('should execute adapter without any protections', async () => {
      const adapter = new MockAdapter('raw-adapter') as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      const result = await executor.executeRaw(adapter, options);
      
      expect(result.tool).toBe('raw-adapter');
      expect(result.exitCode).toBe(0);
    });
    
    it('should not clone options in raw mode', async () => {
      const adapter = new MockAdapter('raw-adapter') as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      await executor.executeRaw(adapter, options);
      
      // Raw mode passes options directly (no cloning)
      expect(options.files).toEqual(['test.yml']);
    });
    
    it('should propagate errors without timeout protection', async () => {
      const adapter = new MockAdapter('failing-adapter', true) as any;
      const options = { files: ['test.yml'], cwd: process.cwd() };
      
      await expect(executor.executeRaw(adapter, options)).rejects.toThrow('Mock adapter failure');
    });
  });
});
