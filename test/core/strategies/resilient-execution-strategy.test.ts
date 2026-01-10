/**
 * @file ResilientExecutionStrategy.test.ts
 * @rule Tests for Strategy Pattern with full resilience stack
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { AdapterResult } from '../../../src/adapters/types.js';
import * as resilience from '../../../src/core/resilience.js';
import { ResilientExecutionStrategy } from '../../../src/core/strategies/resilient-execution-strategy.js';
import type { OrchestratorRunOptions } from '../../../src/core/types.js';

describe('ResilientExecutionStrategy', () => {
  let strategy: ResilientExecutionStrategy;
  let options: OrchestratorRunOptions;

  beforeEach(() => {
    strategy = new ResilientExecutionStrategy();
    
    options = {
      files: ['file1.ts', 'file2.ts'],
      cwd: '/test/cwd',
      timeout: 5000,
      parallel: true,
      profile: 'default',
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('executeParallel', () => {
    it('should call executeResilientAdapters with correct arguments', async () => {
      const mockSpyExecute = jest.spyOn(resilience, 'executeResilientAdapters').mockResolvedValue([
        {
          adapter: 'adapter1',
          success: true,
          duration: 100,
          result: {
            tool: 'adapter1',
            version: '1.0.0',
            exitCode: 0,
            violations: [],
            executionTime: 100,
          } as AdapterResult,
        },
      ]);

      const mockSpyConvert = jest.spyOn(resilience, 'convertToLegacyResults').mockReturnValue([
        {
          tool: 'adapter1',
          version: '1.0.0',
          exitCode: 0,
          violations: [],
          executionTime: 100,
        } as AdapterResult,
      ]);

      const mockAdapters = [
        { name: 'adapter1', adapter: { name: 'adapter1', run: jest.fn() } as any },
      ];

      await strategy.executeParallel(mockAdapters, options);

      expect(mockSpyExecute).toHaveBeenCalledWith(
        mockAdapters,
        {
          files: ['file1.ts', 'file2.ts'],
          cwd: '/test/cwd',
          timeout: 5000,
        }
      );

      expect(mockSpyConvert).toHaveBeenCalled();

      mockSpyExecute.mockRestore();
      mockSpyConvert.mockRestore();
    });

    it('should return converted legacy results', async () => {
      const mockLegacyResults = [
        {
          tool: 'adapter1',
          version: '1.0.0',
          exitCode: 0,
          violations: [],
          executionTime: 100,
        } as AdapterResult,
      ];

      jest.spyOn(resilience, 'executeResilientAdapters').mockResolvedValue([
        {
          adapter: 'adapter1',
          success: true,
          duration: 100,
          result: mockLegacyResults[0],
        },
      ]);

      jest.spyOn(resilience, 'convertToLegacyResults').mockReturnValue(mockLegacyResults);

      const mockAdapters = [
        { name: 'adapter1', adapter: { name: 'adapter1', run: jest.fn() } as any },
      ];

      const results = await strategy.executeParallel(mockAdapters, options);

      expect(results).toEqual(mockLegacyResults);
    });
  });

  describe('executeSequential', () => {
    it('should call executeResilientAdapter for each adapter', async () => {
      const mockSpyExecute = jest.spyOn(resilience, 'executeResilientAdapter').mockResolvedValue({
        adapter: 'adapter1',
        success: true,
        duration: 100,
        result: {
          tool: 'adapter1',
          version: '1.0.0',
          exitCode: 0,
          violations: [],
          executionTime: 100,
        } as AdapterResult,
      });

      const mockSpyConvert = jest.spyOn(resilience, 'convertToLegacyResults').mockReturnValue([
        {
          tool: 'adapter1',
          version: '1.0.0',
          exitCode: 0,
          violations: [],
          executionTime: 100,
        } as AdapterResult,
      ]);

      const mockAdapters = [
        { name: 'adapter1', adapter: { name: 'adapter1', run: jest.fn() } as any },
        { name: 'adapter2', adapter: { name: 'adapter2', run: jest.fn() } as any },
      ];

      await strategy.executeSequential(mockAdapters, options);

      expect(mockSpyExecute).toHaveBeenCalledTimes(2);
      expect(mockSpyConvert).toHaveBeenCalledTimes(2);

      mockSpyExecute.mockRestore();
      mockSpyConvert.mockRestore();
    });

    it('should accumulate results from all adapters', async () => {
      const mockResult1 = {
        tool: 'adapter1',
        version: '1.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 100,
      } as AdapterResult;

      const mockResult2 = {
        tool: 'adapter2',
        version: '2.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 150,
      } as AdapterResult;

      jest.spyOn(resilience, 'executeResilientAdapter').mockResolvedValue({
        adapter: 'adapter1',
        success: true,
        duration: 100,
        result: mockResult1,
      });

      jest.spyOn(resilience, 'convertToLegacyResults')
        .mockReturnValueOnce([mockResult1])
        .mockReturnValueOnce([mockResult2]);

      const mockAdapters = [
        { name: 'adapter1', adapter: { name: 'adapter1', run: jest.fn() } as any },
        { name: 'adapter2', adapter: { name: 'adapter2', run: jest.fn() } as any },
      ];

      const results = await strategy.executeSequential(mockAdapters, options);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockResult1);
      expect(results[1]).toEqual(mockResult2);
    });
  });

  describe('Integration with resilience functions', () => {
    it('should delegate to resilience module for parallel execution', async () => {
      const mockExecuteSpy = jest.spyOn(resilience, 'executeResilientAdapters');
      const mockConvertSpy = jest.spyOn(resilience, 'convertToLegacyResults');

      mockExecuteSpy.mockResolvedValue([]);
      mockConvertSpy.mockReturnValue([]);

      const mockAdapters = [
        { name: 'test', adapter: { name: 'test', run: jest.fn() } as any },
      ];

      await strategy.executeParallel(mockAdapters, options);

      expect(mockExecuteSpy).toHaveBeenCalled();
      expect(mockConvertSpy).toHaveBeenCalled();

      mockExecuteSpy.mockRestore();
      mockConvertSpy.mockRestore();
    });

    it('should delegate to resilience module for sequential execution', async () => {
      const mockExecuteSpy = jest.spyOn(resilience, 'executeResilientAdapter');
      const mockConvertSpy = jest.spyOn(resilience, 'convertToLegacyResults');

      mockExecuteSpy.mockResolvedValue({
        adapter: 'test',
        success: true,
        duration: 100,
        result: {} as AdapterResult,
      });
      mockConvertSpy.mockReturnValue([]);

      const mockAdapters = [
        { name: 'test', adapter: { name: 'test', run: jest.fn() } as any },
      ];

      await strategy.executeSequential(mockAdapters, options);

      expect(mockExecuteSpy).toHaveBeenCalled();
      expect(mockConvertSpy).toHaveBeenCalled();

      mockExecuteSpy.mockRestore();
      mockConvertSpy.mockRestore();
    });
  });
});

