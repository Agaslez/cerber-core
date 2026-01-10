/**
 * @file COMMIT 5: Orchestrator Core Tests
 * @rule Test behavior, not implementation
 */

import { Orchestrator } from '../src/core/Orchestrator.js';

describe('COMMIT 5: Orchestrator Core', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  describe('Deduplication (behavior via run)', () => {
    it('should deduplicate identical violations from same adapter', async () => {
      // Mock adapter that returns duplicates
      const mockAdapter = {
        name: 'test-adapter',
        async run(): Promise<import('../src/adapters/types.js').AdapterResult> {
          return {
            tool: 'test-adapter',
            version: '1.0.0',
            exitCode: 0,
            executionTime: 100,
            violations: [
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'error' as const,
                message: 'Duplicate message',
                path: 'file.yml',
                line: 10,
                column: 5,
              },
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'error' as const,
                message: 'Duplicate message',
                path: 'file.yml',
                line: 10,
                column: 5,
              },
            ],
          };
        },
      };

      orchestrator.register({
        name: 'test-adapter',
        displayName: 'Test Adapter',
        enabled: true,
        factory: () => mockAdapter as any,
      });

      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: ['test-adapter'],
      });

      // Should deduplicate - only 1 violation
      expect(result.violations).toHaveLength(1);
      expect(result.summary.total).toBe(1);
      expect(result.summary.errors).toBe(1);
    });

    it('should keep violations with different messages', async () => {
      const mockAdapter = {
        name: 'test-adapter',
        async run(): Promise<import('../src/adapters/types.js').AdapterResult> {
          return {
            tool: 'test-adapter',
            version: '1.0.0',
            exitCode: 0,
            executionTime: 100,
            violations: [
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'error' as const,
                message: 'Message A',
                path: 'file.yml',
                line: 10,
                column: 5,
              },
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'error' as const,
                message: 'Message B',
                path: 'file.yml',
                line: 10,
                column: 5,
              },
            ],
          };
        },
      };

      orchestrator.register({
        name: 'test-adapter',
        displayName: 'Test Adapter',
        enabled: true,
        factory: () => mockAdapter as any,
      });

      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: ['test-adapter'],
      });

      // Different messages - keep both
      expect(result.violations).toHaveLength(2);
      expect(result.summary.total).toBe(2);
    });
  });

  describe('Result Schema (V1)', () => {
    it('should produce valid V1 schema output', async () => {
      const mockAdapter = {
        name: 'test-adapter',
        async run(): Promise<import('../src/adapters/types.js').AdapterResult> {
          return {
            tool: 'test-adapter',
            version: '1.0.0',
            exitCode: 0,
            executionTime: 100,
            violations: [
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'error' as const,
                message: 'Test violation',
                path: 'file.yml',
                line: 10,
                column: 5,
              },
            ],
          };
        },
      };

      orchestrator.register({
        name: 'test-adapter',
        displayName: 'Test Adapter',
        enabled: true,
        factory: () => mockAdapter as any,
      });

      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: ['test-adapter'],
        profile: 'dev',
      });

      // Schema V1 fields
      expect(result.schemaVersion).toBe(1);
      expect(result.contractVersion).toBe(1);
      expect(result.deterministic).toBe(true);

      // Metadata array format (not object!)
      expect(Array.isArray(result.metadata.tools)).toBe(true);
      expect(result.metadata.tools).toHaveLength(1);
      expect(result.metadata.tools[0].name).toBe('test-adapter');
      expect(result.metadata.tools[0].version).toBe('1.0.0');
      expect(result.metadata.tools[0].exitCode).toBe(0);

      // RunMetadata
      expect(result.runMetadata).toBeDefined();
      expect(result.runMetadata?.profile).toBe('dev');
      expect(result.runMetadata?.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601
      expect(typeof result.runMetadata?.executionTime).toBe('number');

      // Summary
      expect(result.summary.total).toBe(1);
      expect(result.summary.errors).toBe(1);
      expect(result.summary.warnings).toBe(0);
      expect(result.summary.info).toBe(0);

      // Violations
      expect(result.violations).toHaveLength(1);
    });

    it('should handle empty result correctly', async () => {
      const result = await orchestrator.run({
        files: ['nonexistent.yml'],
        cwd: '/project',
        tools: ['nonexistent-tool'], // Non-existent tool = no adapters run
      });

      expect(result.schemaVersion).toBe(1);
      expect(result.contractVersion).toBe(1);
      expect(result.deterministic).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.metadata.tools).toHaveLength(0); // No valid adapters
      expect(result.summary.total).toBe(0);
    });
  });

  describe('Deterministic Sorting (behavior)', () => {
    it('should sort violations by severity, then path, then line', async () => {
      const mockAdapter = {
        name: 'test-adapter',
        async run(): Promise<import('../src/adapters/types.js').AdapterResult> {
          return {
            tool: 'test-adapter',
            version: '1.0.0',
            exitCode: 0,
            executionTime: 100,
            violations: [
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'info' as const,
                message: 'Info violation',
                path: 'z.yml',
                line: 30,
                column: 5,
              },
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'error' as const,
                message: 'Error violation',
                path: 'a.yml',
                line: 10,
                column: 5,
              },
              {
                source: 'test-adapter',
                id: 'test/rule',
                severity: 'warning' as const,
                message: 'Warning violation',
                path: 'm.yml',
                line: 20,
                column: 5,
              },
            ],
          };
        },
      };

      orchestrator.register({
        name: 'test-adapter',
        displayName: 'Test Adapter',
        enabled: true,
        factory: () => mockAdapter as any,
      });

      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: ['test-adapter'],
      });

      // Should sort: error → warning → info
      expect(result.violations[0].severity).toBe('error');
      expect(result.violations[1].severity).toBe('warning');
      expect(result.violations[2].severity).toBe('info');

      // Within severity, should sort by path
      expect(result.violations[0].path).toBe('a.yml');
      expect(result.violations[1].path).toBe('m.yml');
      expect(result.violations[2].path).toBe('z.yml');
    });
  });

  describe('Tool Parameter Support', () => {
    it('should accept tools parameter (in addition to adapters)', async () => {
      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: ['actionlint'], // Use 'tools' not 'adapters'
      });

      expect(result).toBeDefined();
      expect(result.schemaVersion).toBe(1);
    });
  });

  describe('Profile Parameter', () => {
    it('should include profile in runMetadata', async () => {
      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: [],
        profile: 'team',
      });

      expect(result.runMetadata?.profile).toBe('team');
    });

    it('should handle missing profile', async () => {
      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: [],
      });

      expect(result.runMetadata?.profile).toBeUndefined();
    });
  });

  describe('Summary Calculation', () => {
    it('should calculate correct summary', async () => {
      const mockAdapter = {
        name: 'test-adapter',
        async run(): Promise<import('../src/adapters/types.js').AdapterResult> {
          return {
            tool: 'test-adapter',
            version: '1.0.0',
            exitCode: 0,
            executionTime: 100,
            violations: [
              {
                source: 'test-adapter',
                id: 'test/rule1',
                severity: 'error' as const,
                message: 'Error 1',
              },
              {
                source: 'test-adapter',
                id: 'test/rule2',
                severity: 'error' as const,
                message: 'Error 2',
              },
              {
                source: 'test-adapter',
                id: 'test/rule3',
                severity: 'warning' as const,
                message: 'Warning 1',
              },
              {
                source: 'test-adapter',
                id: 'test/rule4',
                severity: 'info' as const,
                message: 'Info 1',
              },
            ],
          };
        },
      };

      orchestrator.register({
        name: 'test-adapter',
        displayName: 'Test Adapter',
        enabled: true,
        factory: () => mockAdapter as any,
      });

      const result = await orchestrator.run({
        files: ['file.yml'],
        cwd: '/project',
        tools: ['test-adapter'],
      });

      expect(result.summary.total).toBe(4);
      expect(result.summary.errors).toBe(2);
      expect(result.summary.warnings).toBe(1);
      expect(result.summary.info).toBe(1);
    });
  });
});
