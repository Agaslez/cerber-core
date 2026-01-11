/**
 * @file LegacyExecutionStrategy.test.ts
 * @rule Tests for Strategy Pattern implementation (no resilience)
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Adapter, AdapterResult } from '../../../src/adapters/types.js';
import { LegacyExecutionStrategy } from '../../../src/core/strategies/legacy-execution-strategy.js';
import type { OrchestratorRunOptions } from '../../../src/core/types.js';

describe('LegacyExecutionStrategy', () => {
  let strategy: LegacyExecutionStrategy;
  let options: OrchestratorRunOptions;

  beforeEach(() => {
    strategy = new LegacyExecutionStrategy();

    options = {
      files: ['file1.ts', 'file2.ts'],
      cwd: '/test/cwd',
      timeout: 5000,
      parallel: true,
      profile: 'default',
    };
  });

  describe('executeParallel', () => {
    it('should execute multiple adapters in parallel successfully', async () => {
      const mockRun1 = jest.fn<Adapter['run']>().mockResolvedValue({
        tool: 'adapter1',
        version: '1.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 100,
      } as AdapterResult);

      const mockRun2 = jest.fn<Adapter['run']>().mockResolvedValue({
        tool: 'adapter2',
        version: '2.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 150,
      } as AdapterResult);

      const results = await strategy.executeParallel(
        [
          { name: 'adapter1', adapter: { name: 'adapter1', run: mockRun1 } as any },
          { name: 'adapter2', adapter: { name: 'adapter2', run: mockRun2 } as any },
        ],
        options
      );

      expect(results).toHaveLength(2);
      expect(results[0].tool).toBe('adapter1');
      expect(results[1].tool).toBe('adapter2');
      expect(mockRun1).toHaveBeenCalledWith({
        files: ['file1.ts', 'file2.ts'],
        cwd: '/test/cwd',
        timeout: 5000,
      });
    });

    it('should handle partial failures gracefully', async () => {
      const mockRun1 = jest.fn<Adapter['run']>().mockResolvedValue({
        tool: 'adapter1',
        version: '1.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 100,
      } as AdapterResult);

      const mockRun2 = jest.fn<Adapter['run']>().mockRejectedValue(new Error('Adapter crashed'));

      const results = await strategy.executeParallel(
        [
          { name: 'adapter1', adapter: { name: 'adapter1', run: mockRun1 } as any },
          { name: 'adapter2', adapter: { name: 'adapter2', run: mockRun2 } as any },
        ],
        options
      );

      expect(results).toHaveLength(2);
      expect(results[0].exitCode).toBe(0);
      expect(results[1].exitCode).not.toBe(0);
      expect(results[1].skipped).toBe(true);
      expect(results[1].skipReason).toContain('Adapter crashed');
    });

    it('should use ErrorClassifier for error classification', async () => {
      const mockRun = jest.fn<Adapter['run']>().mockRejectedValue(new Error('Command not found'));

      const results = await strategy.executeParallel(
        [{ name: 'test-adapter', adapter: { name: 'test-adapter', run: mockRun } as any }],
        options
      );

      expect(results).toHaveLength(1);
      expect(results[0].exitCode).toBe(127); // POSIX code for command not found
      expect(results[0].skipped).toBe(true);
    });

    it('should pass correct options to adapters', async () => {
      const mockRun = jest.fn<Adapter['run']>().mockResolvedValue({
        tool: 'test',
        version: '1.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 50,
      } as AdapterResult);

      await strategy.executeParallel(
        [{ name: 'test-adapter', adapter: { name: 'test-adapter', run: mockRun } as any }],
        options
      );

      expect(mockRun).toHaveBeenCalledWith({
        files: ['file1.ts', 'file2.ts'],
        cwd: '/test/cwd',
        timeout: 5000,
      });
    });
  });

  describe('executeSequential', () => {
    it('should execute adapters sequentially', async () => {
      const mockRun1 = jest.fn<Adapter['run']>().mockResolvedValue({
        tool: 'adapter1',
        version: '1.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 100,
      } as AdapterResult);

      const mockRun2 = jest.fn<Adapter['run']>().mockResolvedValue({
        tool: 'adapter2',
        version: '2.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 150,
      } as AdapterResult);

      const results = await strategy.executeSequential(
        [
          { name: 'adapter1', adapter: { name: 'adapter1', run: mockRun1 } as any },
          { name: 'adapter2', adapter: { name: 'adapter2', run: mockRun2 } as any },
        ],
        options
      );

      expect(results).toHaveLength(2);
      expect(results[0].tool).toBe('adapter1');
      expect(results[1].tool).toBe('adapter2');
    });

    it('should handle errors in sequential execution', async () => {
      const mockRun1 = jest.fn<Adapter['run']>().mockRejectedValue(new Error('Error 1'));
      const mockRun2 = jest.fn<Adapter['run']>().mockResolvedValue({
        tool: 'adapter2',
        version: '2.0.0',
        exitCode: 0,
        violations: [],
        executionTime: 150,
      } as AdapterResult);

      const results = await strategy.executeSequential(
        [
          { name: 'adapter1', adapter: { name: 'adapter1', run: mockRun1 } as any },
          { name: 'adapter2', adapter: { name: 'adapter2', run: mockRun2 } as any },
        ],
        options
      );

      expect(results).toHaveLength(2);
      expect(results[0].skipped).toBe(true);
      expect(results[1].exitCode).toBe(0);
    });
  });

  describe('Error Classification', () => {
    it('should classify not_found errors', async () => {
      const mockRun = jest.fn<Adapter['run']>().mockRejectedValue(new Error('Command not found'));

      const results = await strategy.executeParallel(
        [{ name: 'test-adapter', adapter: { name: 'test-adapter', run: mockRun } as any }],
        options
      );

      expect(results[0].exitCode).toBe(127);
    });

    it('should classify permission errors', async () => {
      const mockRun = jest.fn<Adapter['run']>().mockRejectedValue(new Error('EACCES: permission denied'));

      const results = await strategy.executeParallel(
        [{ name: 'test-adapter', adapter: { name: 'test-adapter', run: mockRun } as any }],
        options
      );

      expect(results[0].exitCode).toBe(126);
    });

    it('should classify timeout errors', async () => {
      const mockRun = jest.fn<Adapter['run']>().mockRejectedValue(new Error('Operation timed out'));

      const results = await strategy.executeParallel(
        [{ name: 'test-adapter', adapter: { name: 'test-adapter', run: mockRun } as any }],
        options
      );

      expect(results[0].exitCode).toBe(124);
    });
  });
});
