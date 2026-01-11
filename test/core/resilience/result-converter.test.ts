import { describe, expect, it } from '@jest/globals';
import type { ResilientAdapterResult } from '../../../src/core/resilience.js';
import { ResultConverter } from '../../../src/core/resilience/result-converter.js';

describe('ResultConverter', () => {
  let converter: ResultConverter;
  
  beforeEach(() => {
    converter = new ResultConverter();
  });
  
  describe('convert()', () => {
    it('should convert successful result to legacy format', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: true,
        result: {
          tool: 'test-adapter',
          version: '1.0.0',
          exitCode: 0,
          violations: [{ id: 'test-rule', source: 'test-adapter', severity: 'error', message: 'test', path: 'test.yml', line: 1, column: 1 }],
          executionTime: 100
        },
        duration: 150
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.tool).toBe('test-adapter');
      expect(legacy.version).toBe('1.0.0');
      expect(legacy.exitCode).toBe(0);
      expect(legacy.violations.length).toBe(1);
      expect(legacy.executionTime).toBe(100);
      expect(legacy.skipped).toBeUndefined();
    });
    
    it('should convert circuit breaker open error to exitCode 129', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: false,
        error: {
          message: 'Circuit breaker open',
          type: 'circuit_breaker_open'
        },
        duration: 10
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(129);
      expect(legacy.skipped).toBe(true);
      expect(legacy.skipReason).toBe('Circuit breaker open');
    });
    
    it('should convert timeout error to exitCode 124', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: false,
        error: {
          message: 'Operation timed out',
          type: 'timeout'
        },
        duration: 5000
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(124);
      expect(legacy.violations).toEqual([]);
    });
    
    it('should convert not_found error to exitCode 127', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'missing-tool',
        success: false,
        error: {
          message: 'ENOENT: command not found',
          type: 'not_found'
        },
        duration: 5
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(127);
    });
    
    it('should convert permission error to exitCode 126', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: false,
        error: {
          message: 'Permission denied',
          type: 'permission'
        },
        duration: 5
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(126);
    });
    
    it('should convert retries_exhausted error to exitCode 130', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: false,
        error: {
          message: 'All retries failed',
          type: 'retries_exhausted',
          attempts: 3
        },
        duration: 1500
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(130);
    });
    
    it('should convert crash error to exitCode 3', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: false,
        error: {
          message: 'Adapter crashed',
          type: 'crash'
        },
        duration: 50
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(3);
    });
    
    it('should convert validation error to exitCode 1', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: false,
        error: {
          message: 'Invalid input',
          type: 'validation'
        },
        duration: 10
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(1);
    });
    
    it('should convert unknown error to exitCode 1', () => {
      const resilientResult: ResilientAdapterResult = {
        adapter: 'test-adapter',
        success: false,
        error: {
          message: 'Something went wrong',
          type: 'unknown'
        },
        duration: 20
      };
      
      const legacy = converter.convert(resilientResult);
      
      expect(legacy.exitCode).toBe(1);
    });
  });
  
  describe('convertBatch()', () => {
    it('should convert multiple results', () => {
      const resilientResults: ResilientAdapterResult[] = [
        {
          adapter: 'adapter-1',
          success: true,
          result: { tool: 'adapter-1', version: '1.0', exitCode: 0, violations: [], executionTime: 10 },
          duration: 100
        },
        {
          adapter: 'adapter-2',
          success: false,
          error: { message: 'Failed', type: 'crash' },
          duration: 50
        }
      ];
      
      const legacyResults = converter.convertBatch(resilientResults);
      
      expect(legacyResults.length).toBe(2);
      expect(legacyResults[0].exitCode).toBe(0);
      expect(legacyResults[1].exitCode).toBe(3);
    });
    
    it('should handle empty array', () => {
      const legacyResults = converter.convertBatch([]);
      expect(legacyResults).toEqual([]);
    });
  });
  
  describe('extractSuccessful()', () => {
    it('should extract only successful results', () => {
      const resilientResults: ResilientAdapterResult[] = [
        {
          adapter: 'adapter-1',
          success: true,
          result: { tool: 'adapter-1', version: '1.0', exitCode: 0, violations: [], executionTime: 10 },
          duration: 100
        },
        {
          adapter: 'adapter-2',
          success: false,
          error: { message: 'Failed', type: 'crash' },
          duration: 50
        },
        {
          adapter: 'adapter-3',
          success: true,
          result: { tool: 'adapter-3', version: '1.0', exitCode: 0, violations: [], executionTime: 20 },
          duration: 200
        }
      ];
      
      const successful = converter.extractSuccessful(resilientResults);
      
      expect(successful.length).toBe(2);
      expect(successful[0].tool).toBe('adapter-1');
      expect(successful[1].tool).toBe('adapter-3');
    });
    
    it('should return empty array when all failed', () => {
      const resilientResults: ResilientAdapterResult[] = [
        {
          adapter: 'adapter-1',
          success: false,
          error: { message: 'Failed', type: 'crash' },
          duration: 50
        }
      ];
      
      const successful = converter.extractSuccessful(resilientResults);
      expect(successful).toEqual([]);
    });
  });
  
  describe('extractFailures()', () => {
    it('should extract failure details', () => {
      const resilientResults: ResilientAdapterResult[] = [
        {
          adapter: 'adapter-1',
          success: true,
          result: { tool: 'adapter-1', version: '1.0', exitCode: 0, violations: [], executionTime: 10 },
          duration: 100
        },
        {
          adapter: 'adapter-2',
          success: false,
          error: { message: 'Failed', type: 'crash' },
          duration: 50
        },
        {
          adapter: 'adapter-3',
          success: false,
          error: { message: 'Timeout', type: 'timeout' },
          duration: 5000
        }
      ];
      
      const failures = converter.extractFailures(resilientResults);
      
      expect(failures.length).toBe(2);
      expect(failures[0]).toEqual({ adapter: 'adapter-2', reason: 'Failed', type: 'crash' });
      expect(failures[1]).toEqual({ adapter: 'adapter-3', reason: 'Timeout', type: 'timeout' });
    });
    
    it('should return empty array when all succeeded', () => {
      const resilientResults: ResilientAdapterResult[] = [
        {
          adapter: 'adapter-1',
          success: true,
          result: { tool: 'adapter-1', version: '1.0', exitCode: 0, violations: [], executionTime: 10 },
          duration: 100
        }
      ];
      
      const failures = converter.extractFailures(resilientResults);
      expect(failures).toEqual([]);
    });
  });
});
