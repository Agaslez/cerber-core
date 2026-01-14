/**
 * @file BaseAdapter unit tests
 * @rule Per AGENTS.md §4 - Tests-first gate
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { BaseAdapter } from '../../../src/adapters/_shared/BaseAdapter.js';
import type { AdapterResult, AdapterRunOptions } from '../../../src/adapters/types.js';
import type { Violation } from '../../../src/types.js';

// Mock adapter for testing
class MockAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'mock',
      displayName: 'Mock Tool',
      description: 'Mock adapter for testing',
      binaryName: 'node', // Use node so it's always available
      versionArgs: ['--version'],
      versionPattern: /v?(\d+\.\d+\.\d+)/,
      installHint: 'npm install -g mock-tool',
    });
  }

  async run(options: AdapterRunOptions): Promise<AdapterResult> {
    const version = await this.getVersion();
    return this.createResult(version || 'unknown', 0, [], 0);
  }

  parseOutput(rawOutput: string): Violation[] {
    // Mock parser - split by lines
    return rawOutput.split('\n')
      .filter(line => line.trim())
      .map((line, index) => ({
        id: `mock-rule-${index}`,
        severity: 'error' as const,
        message: line,
        source: 'mock',
        path: 'test.yml',
        line: index + 1,
      }));
  }
}

describe('@fast BaseAdapter', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(adapter.name).toBe('mock');
    });

    it('should have correct displayName', () => {
      expect(adapter.displayName).toBe('Mock Tool');
    });

    it('should have correct description', () => {
      expect(adapter.description).toBe('Mock adapter for testing');
    });
  });

  describe('detect', () => {
    it('should detect installed tool', async () => {
      const detection = await adapter.detect();
      
      expect(detection.installed).toBe(true);
      expect(detection.version).toMatch(/\d+\.\d+\.\d+/);
      expect(detection.path).toBeTruthy();
    });
  });

  describe('getVersion', () => {
    it('should return version string', async () => {
      const version = await adapter.getVersion();
      
      expect(version).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('isInstalled', () => {
    it('should return true for installed tool', async () => {
      const installed = await adapter.isInstalled();
      
      expect(installed).toBe(true);
    });
  });

  describe('getInstallHint', () => {
    it('should return installation hint', () => {
      const hint = adapter.getInstallHint();
      
      expect(hint).toContain('npm install');
    });
  });

  describe('sortViolations', () => {
    it('should sort by path first', () => {
      const violations: Violation[] = [
        { id: 'rule-1', severity: 'error', message: 'Error', source: 'mock', path: 'z.yml', line: 1 },
        { id: 'rule-2', severity: 'error', message: 'Error', source: 'mock', path: 'a.yml', line: 1 },
      ];
      
      const sorted = adapter['sortViolations'](violations);
      
      expect(sorted[0].path).toBe('a.yml');
      expect(sorted[1].path).toBe('z.yml');
    });

    it('should sort by line within same path', () => {
      const violations: Violation[] = [
        { id: 'rule-1', severity: 'error', message: 'Error', source: 'mock', path: 'test.yml', line: 10 },
        { id: 'rule-2', severity: 'error', message: 'Error', source: 'mock', path: 'test.yml', line: 2 },
      ];
      
      const sorted = adapter['sortViolations'](violations);
      
      expect(sorted[0].line).toBe(2);
      expect(sorted[1].line).toBe(10);
    });

    it('should sort by column within same line', () => {
      const violations: Violation[] = [
        { id: 'rule-1', severity: 'error', message: 'Error', source: 'mock', path: 'test.yml', line: 5, column: 20 },
        { id: 'rule-2', severity: 'error', message: 'Error', source: 'mock', path: 'test.yml', line: 5, column: 10 },
      ];
      
      const sorted = adapter['sortViolations'](violations);
      
      expect(sorted[0].column).toBe(10);
      expect(sorted[1].column).toBe(20);
    });

    it('should sort by id within same location', () => {
      const violations: Violation[] = [
        { id: 'rule-z', severity: 'error', message: 'Error', source: 'mock', path: 'test.yml', line: 5 },
        { id: 'rule-a', severity: 'error', message: 'Error', source: 'mock', path: 'test.yml', line: 5 },
      ];
      
      const sorted = adapter['sortViolations'](violations);
      
      expect(sorted[0].id).toBe('rule-a');
      expect(sorted[1].id).toBe('rule-z');
    });

    it('should not mutate original array', () => {
      const violations: Violation[] = [
        { id: 'rule-2', severity: 'error', message: 'Error', source: 'mock', path: 'b.yml' },
        { id: 'rule-1', severity: 'error', message: 'Error', source: 'mock', path: 'a.yml' },
      ];
      
      const original = [...violations];
      adapter['sortViolations'](violations);
      
      expect(violations).toEqual(original);
    });
  });

  describe('createSkippedResult', () => {
    it('should create skipped result', () => {
      const result = adapter['createSkippedResult']('Tool not installed');
      
      expect(result.tool).toBe('mock');
      expect(result.version).toBe('n/a');
      expect(result.exitCode).toBe(0);
      expect(result.violations).toEqual([]);
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('Tool not installed');
    });
  });

  describe('createResult', () => {
    it('should create result with violations', () => {
      const violations: Violation[] = [
        { id: 'rule-1', severity: 'error', message: 'Error', source: 'mock' },
      ];
      
      const result = adapter['createResult']('1.0.0', 1, violations, 100);
      
      expect(result.tool).toBe('mock');
      expect(result.version).toBe('1.0.0');
      expect(result.exitCode).toBe(1);
      expect(result.violations).toEqual(violations);
      expect(result.executionTime).toBe(100);
    });

    it('should sort violations', () => {
      const violations: Violation[] = [
        { id: 'rule-2', severity: 'error', message: 'Error', source: 'mock', path: 'b.yml' },
        { id: 'rule-1', severity: 'error', message: 'Error', source: 'mock', path: 'a.yml' },
      ];
      
      const result = adapter['createResult']('1.0.0', 0, violations, 100);
      
      expect(result.violations[0].path).toBe('a.yml');
      expect(result.violations[1].path).toBe('b.yml');
    });
  });

  describe('parseOutput', () => {
    it('should parse output into violations', () => {
      const output = `Error on line 1
Warning on line 2
Info on line 3`;
      
      const violations = adapter.parseOutput(output);
      
      expect(violations).toHaveLength(3);
      expect(violations[0].message).toContain('line 1');
      expect(violations[1].message).toContain('line 2');
      expect(violations[2].message).toContain('line 3');
    });
  });

  describe('run', () => {
    it('should execute and return result', async () => {
      const result = await adapter.run({
        files: ['test.yml'],
        cwd: process.cwd(),
      });
      
      expect(result.tool).toBe('mock');
      expect(result.version).toBeTruthy();
      expect(result.exitCode).toBe(0);
    });
  });
});
