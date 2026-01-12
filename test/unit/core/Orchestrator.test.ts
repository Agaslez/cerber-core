/**
 * @file Orchestrator unit tests
 * @rule Per AGENTS.md §4 - Tests-first gate
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import type { Adapter, AdapterResult } from '../../../src/adapters/types.js';
import { Orchestrator } from '../../../src/core/Orchestrator.js';
import type { Violation } from '../../../src/types.js';

// Mock adapter for testing
class MockAdapter implements Adapter {
  public readonly name: string;
  public readonly displayName: string;
  public readonly description: string;

  constructor(
    name: string,
    private mockResult: Partial<AdapterResult> = {}
  ) {
    this.name = name;
    this.displayName = name;
    this.description = `Mock ${name} adapter`;
  }

  async detect() {
    return { installed: true, version: '1.0.0', installHint: '' };
  }

  async getVersion() {
    return '1.0.0';
  }

  async isInstalled() {
    return true;
  }

  getInstallHint() {
    return 'mock install';
  }

  async run(): Promise<AdapterResult> {
    return {
      tool: this.name,
      version: '1.0.0',
      exitCode: 0,
      violations: [],
      executionTime: 10,
      ...this.mockResult,
    };
  }

  parseOutput(): Violation[] {
    return [];
  }
}

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  describe('registration', () => {
    it('should register default adapters', () => {
      const adapters = orchestrator.listAdapters();

      expect(adapters).toContain('actionlint');
      expect(adapters).toContain('gitleaks');
      expect(adapters).toContain('zizmor');
      expect(adapters).toHaveLength(3);
    });

    it('should register custom adapter', () => {
      orchestrator.register({
        name: 'custom',
        displayName: 'Custom',
        enabled: true,
        factory: () => new MockAdapter('custom'),
      });

      const adapters = orchestrator.listAdapters();
      expect(adapters).toContain('custom');
    });

    it('should not list disabled adapters', () => {
      orchestrator.register({
        name: 'disabled',
        displayName: 'Disabled',
        enabled: false,
        factory: () => new MockAdapter('disabled'),
      });

      const adapters = orchestrator.listAdapters();
      expect(adapters).not.toContain('disabled');
    });

    it('should return sorted adapter list', () => {
      const adapters = orchestrator.listAdapters();
      const sorted = [...adapters].sort();

      expect(adapters).toEqual(sorted);
    });
  });

  describe('getAdapter', () => {
    it('should get registered adapter', () => {
      const adapter = orchestrator.getAdapter('actionlint');

      expect(adapter).not.toBeNull();
      expect(adapter?.name).toBe('actionlint');
    });

    it('should return null for unknown adapter', () => {
      const adapter = orchestrator.getAdapter('unknown');

      expect(adapter).toBeNull();
    });

    it('should return null for disabled adapter', () => {
      orchestrator.register({
        name: 'disabled',
        displayName: 'Disabled',
        enabled: false,
        factory: () => new MockAdapter('disabled'),
      });

      const adapter = orchestrator.getAdapter('disabled');
      expect(adapter).toBeNull();
    });
  });

  describe('run', () => {
    beforeEach(() => {
      // Clear default adapters and register mocks
      orchestrator = new Orchestrator();
      orchestrator.register({
        name: 'mock1',
        displayName: 'Mock 1',
        enabled: true,
        factory: () =>
          new MockAdapter('mock1', {
            violations: [
              {
                id: 'mock1/rule1',
                severity: 'error',
                message: 'Error from mock1',
                source: 'mock1',
                path: 'file1.yml',
                line: 10,
              },
            ],
          }),
      });

      orchestrator.register({
        name: 'mock2',
        displayName: 'Mock 2',
        enabled: true,
        factory: () =>
          new MockAdapter('mock2', {
            violations: [
              {
                id: 'mock2/rule2',
                severity: 'warning',
                message: 'Warning from mock2',
                source: 'mock2',
                path: 'file2.yml',
                line: 5,
              },
            ],
          }),
      });
    });

    it('should run all adapters and merge results', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      expect(result.violations).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.errors).toBe(1);
      expect(result.summary.warnings).toBe(1);
    });

    it('should have deterministic flag', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      expect(result.deterministic).toBe(true);
    });

    it('should have contract version', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      expect(result.contractVersion).toBe(1);
    });

    it('should sort violations deterministically', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      // Should be sorted by path
      expect(result.violations[0].path).toBe('file1.yml');
      expect(result.violations[1].path).toBe('file2.yml');
    });

    it('should sort metadata keys', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      const toolNames = Object.keys(result.metadata.tools);
      const sortedToolNames = [...toolNames].sort();

      expect(toolNames).toEqual(sortedToolNames);
    });

    it('should include metadata for each adapter', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      // Schema V1: tools is an array
      const mock1Tool = result.metadata.tools.find(t => t.name === 'mock1');
      const mock2Tool = result.metadata.tools.find(t => t.name === 'mock2');
      
      expect(mock1Tool).toMatchObject({
        version: '1.0.0',
        exitCode: 0,
      });

      expect(mock2Tool).toMatchObject({
        version: '1.0.0',
        exitCode: 0,
      });
    });

    it('should include runtime metadata', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
        tools: ['mock1', 'mock2'],  // Explicitly specify only mock adapters
      });

      expect(result.runMetadata).toBeDefined();
      expect(result.runMetadata?.executionTime).toBeGreaterThanOrEqual(0);  // Can be 0 for fast execution
      expect(result.runMetadata?.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      
      // Verify tools were run
      expect(result.metadata.tools).toHaveLength(2);
      expect(result.metadata.tools.map(t => t.name)).toContain('mock1');
      expect(result.metadata.tools.map(t => t.name)).toContain('mock2');
    });

    it('should run only specified adapters', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
        tools: ['mock1'],  // Changed from 'adapters' to 'tools'
      });

      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].source).toBe('mock1');
      expect(result.metadata.tools).toHaveLength(1);
      expect(result.metadata.tools[0].name).toBe('mock1');
    });

    it('should handle empty adapter list gracefully', async () => {
      // Use fresh orchestrator with no adapters
      const emptyOrchestrator = new Orchestrator();
      
      const result = await emptyOrchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
        tools: ['nonexistent'], // Request adapter that doesn't exist
      });

      expect(result.violations).toHaveLength(0);
      expect(result.summary.total).toBe(0);
      expect(result.metadata.tools).toHaveLength(0);
    });
  });

  describe('graceful degradation', () => {
    it('should continue when one adapter fails', async () => {
      orchestrator = new Orchestrator();

      // Working adapter
      orchestrator.register({
        name: 'working',
        displayName: 'Working',
        enabled: true,
        factory: () =>
          new MockAdapter('working', {
            violations: [
              {
                id: 'working/rule',
                severity: 'error',
                message: 'Success',
                source: 'working',
              },
            ],
          }),
      });

      // Failing adapter
      orchestrator.register({
        name: 'failing',
        displayName: 'Failing',
        enabled: true,
        factory: () => {
          const adapter = new MockAdapter('failing');
          adapter.run = async () => {
            throw new Error('Adapter crashed');
          };
          return adapter;
        },
      });

      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      // Should have result from working adapter
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].source).toBe('working');

      // Should have error metadata for failing adapter
      const failingTool = result.metadata.tools.find(t => t.name === 'failing');
      expect(failingTool?.skipped).toBe(true);
      expect(failingTool?.reason).toContain('crashed');
    });
  });

  describe('parallel vs sequential', () => {
    beforeEach(() => {
      orchestrator = new Orchestrator();
      orchestrator.register({
        name: 'mock1',
        displayName: 'Mock 1',
        enabled: true,
        factory: () => new MockAdapter('mock1'),
      });
      orchestrator.register({
        name: 'mock2',
        displayName: 'Mock 2',
        enabled: true,
        factory: () => new MockAdapter('mock2'),
      });
    });

    it('should run in parallel by default', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      const toolNames = result.metadata.tools.map(t => t.name);
      expect(toolNames).toContain('mock1');
      expect(toolNames).toContain('mock2');
    });

    it('should run sequentially when parallel=false', async () => {
      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
        parallel: false,
      });

      const toolNames = result.metadata.tools.map(t => t.name);
      expect(toolNames).toContain('mock1');
      expect(toolNames).toContain('mock2');
    });
  });

  describe('violation sorting', () => {
    it('should sort by path, line, column, id, source', async () => {
      orchestrator = new Orchestrator();
      orchestrator.register({
        name: 'test',
        displayName: 'Test',
        enabled: true,
        factory: () =>
          new MockAdapter('test', {
            violations: [
              { id: 'z', severity: 'error' as const, message: 'z', source: 'test', path: 'z.yml', line: 1 },
              { id: 'a', severity: 'error' as const, message: 'a', source: 'test', path: 'a.yml', line: 10 },
              { id: 'b', severity: 'error' as const, message: 'b', source: 'test', path: 'a.yml', line: 5 },
              { id: 'c', severity: 'error' as const, message: 'c', source: 'test', path: 'a.yml', line: 5, column: 10 },
              { id: 'd', severity: 'error' as const, message: 'd', source: 'test', path: 'a.yml', line: 5, column: 5 },
            ],
          }),
      });

      const result = await orchestrator.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });

      // Should have 5 violations total
      expect(result.violations).toHaveLength(5);

      // Check sorting: path → line → column → id
      // First: a.yml line 5 column 5 (id: d)
      expect(result.violations[0].path).toBe('a.yml');
      expect(result.violations[0].line).toBe(5);
      expect(result.violations[0].column).toBe(5);
      expect(result.violations[0].id).toBe('d');

      // Second: a.yml line 5 column 10 (id: c)
      expect(result.violations[1].path).toBe('a.yml');
      expect(result.violations[1].line).toBe(5);
      expect(result.violations[1].column).toBe(10);
      expect(result.violations[1].id).toBe('c');

      // Third: a.yml line 5 no column (id: b) - undefined column sorts to Infinity
      expect(result.violations[2].path).toBe('a.yml');
      expect(result.violations[2].line).toBe(5);
      expect(result.violations[2].column).toBeUndefined();
      expect(result.violations[2].id).toBe('b');

      // Fourth: a.yml line 10 (id: a)
      expect(result.violations[3].path).toBe('a.yml');
      expect(result.violations[3].line).toBe(10);
      expect(result.violations[3].id).toBe('a');

      // Fifth: z.yml line 1 (id: z)
      expect(result.violations[4].path).toBe('z.yml');
      expect(result.violations[4].line).toBe(1);
      expect(result.violations[4].id).toBe('z');
    });
  });
});
