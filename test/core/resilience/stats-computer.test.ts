import { describe, expect, it } from '@jest/globals';
import type { ResilientAdapterResult } from '../../../src/core/resilience.js';
import { StatsComputer } from '../../../src/core/resilience/stats-computer.js';

describe('StatsComputer', () => {
  let computer: StatsComputer;
  
  beforeEach(() => {
    computer = new StatsComputer();
  });
  
  describe('compute()', () => {
    it('should compute stats for all successful adapters', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: true, result: { tool: 'A', version: '1.0', exitCode: 0, violations: [], executionTime: 10 }, duration: 100 },
        { adapter: 'B', success: true, result: { tool: 'B', version: '1.0', exitCode: 0, violations: [], executionTime: 20 }, duration: 200 },
        { adapter: 'C', success: true, result: { tool: 'C', version: '1.0', exitCode: 0, violations: [], executionTime: 30 }, duration: 300 }
      ];
      
      const stats = computer.compute(results);
      
      expect(stats.successfulAdapters).toBe(3);
      expect(stats.failedAdapters).toBe(0);
      expect(stats.successRate).toBe(100);
    });
    
    it('should compute stats for all failed adapters', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: false, error: { message: 'Error A', type: 'crash' }, duration: 100 },
        { adapter: 'B', success: false, error: { message: 'Error B', type: 'timeout' }, duration: 200 }
      ];
      
      const stats = computer.compute(results);
      
      expect(stats.successfulAdapters).toBe(0);
      expect(stats.failedAdapters).toBe(2);
      expect(stats.successRate).toBe(0);
    });
    
    it('should compute stats for partial success', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: true, result: { tool: 'A', version: '1.0', exitCode: 0, violations: [], executionTime: 10 }, duration: 100 },
        { adapter: 'B', success: false, error: { message: 'Error B', type: 'crash' }, duration: 200 },
        { adapter: 'C', success: true, result: { tool: 'C', version: '1.0', exitCode: 0, violations: [], executionTime: 30 }, duration: 300 }
      ];
      
      const stats = computer.compute(results);
      
      expect(stats.successfulAdapters).toBe(2);
      expect(stats.failedAdapters).toBe(1);
      expect(stats.successRate).toBe(67); // 2/3 = 0.666... rounded to 67%
    });
    
    it('should handle empty results array', () => {
      const results: ResilientAdapterResult[] = [];
      
      const stats = computer.compute(results);
      
      expect(stats.successfulAdapters).toBe(0);
      expect(stats.failedAdapters).toBe(0);
      expect(stats.successRate).toBe(0);
    });
    
    it('should round success rate to nearest integer', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: true, result: { tool: 'A', version: '1.0', exitCode: 0, violations: [], executionTime: 10 }, duration: 100 },
        { adapter: 'B', success: false, error: { message: 'Error', type: 'crash' }, duration: 100 },
        { adapter: 'C', success: false, error: { message: 'Error', type: 'crash' }, duration: 100 }
      ];
      
      const stats = computer.compute(results);
      
      expect(stats.successRate).toBe(33); // 1/3 = 0.333... rounded to 33%
    });
  });
  
  describe('isCompleteSuccess()', () => {
    it('should return true when all adapters succeeded', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: true, result: { tool: 'A', version: '1.0', exitCode: 0, violations: [], executionTime: 10 }, duration: 100 },
        { adapter: 'B', success: true, result: { tool: 'B', version: '1.0', exitCode: 0, violations: [], executionTime: 20 }, duration: 200 }
      ];
      
      expect(computer.isCompleteSuccess(results)).toBe(true);
    });
    
    it('should return false when some adapters failed', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: true, result: { tool: 'A', version: '1.0', exitCode: 0, violations: [], executionTime: 10 }, duration: 100 },
        { adapter: 'B', success: false, error: { message: 'Error', type: 'crash' }, duration: 200 }
      ];
      
      expect(computer.isCompleteSuccess(results)).toBe(false);
    });
    
    it('should return false for empty array', () => {
      expect(computer.isCompleteSuccess([])).toBe(false);
    });
  });
  
  describe('isCompleteFailure()', () => {
    it('should return true when all adapters failed', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: false, error: { message: 'Error', type: 'crash' }, duration: 100 },
        { adapter: 'B', success: false, error: { message: 'Error', type: 'timeout' }, duration: 200 }
      ];
      
      expect(computer.isCompleteFailure(results)).toBe(true);
    });
    
    it('should return false when some adapters succeeded', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: false, error: { message: 'Error', type: 'crash' }, duration: 100 },
        { adapter: 'B', success: true, result: { tool: 'B', version: '1.0', exitCode: 0, violations: [], executionTime: 20 }, duration: 200 }
      ];
      
      expect(computer.isCompleteFailure(results)).toBe(false);
    });
    
    it('should return false for empty array', () => {
      expect(computer.isCompleteFailure([])).toBe(false);
    });
  });
  
  describe('isPartialSuccess()', () => {
    it('should return true when some (but not all) adapters succeeded', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: true, result: { tool: 'A', version: '1.0', exitCode: 0, violations: [], executionTime: 10 }, duration: 100 },
        { adapter: 'B', success: false, error: { message: 'Error', type: 'crash' }, duration: 200 }
      ];
      
      expect(computer.isPartialSuccess(results)).toBe(true);
    });
    
    it('should return false when all adapters succeeded', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: true, result: { tool: 'A', version: '1.0', exitCode: 0, violations: [], executionTime: 10 }, duration: 100 },
        { adapter: 'B', success: true, result: { tool: 'B', version: '1.0', exitCode: 0, violations: [], executionTime: 20 }, duration: 200 }
      ];
      
      expect(computer.isPartialSuccess(results)).toBe(false);
    });
    
    it('should return false when all adapters failed', () => {
      const results: ResilientAdapterResult[] = [
        { adapter: 'A', success: false, error: { message: 'Error', type: 'crash' }, duration: 100 },
        { adapter: 'B', success: false, error: { message: 'Error', type: 'timeout' }, duration: 200 }
      ];
      
      expect(computer.isPartialSuccess(results)).toBe(false);
    });
    
    it('should return false for empty array', () => {
      expect(computer.isPartialSuccess([])).toBe(false);
    });
  });
});
