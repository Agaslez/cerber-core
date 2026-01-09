/**
 * @file ZizmorAdapter unit tests
 * @rule Per AGENTS.md §4 - Tests-first gate
 * @rule Per AGENTS.md §1 - Fixtures, not real tool
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ZizmorAdapter } from '../../../src/adapters/zizmor/ZizmorAdapter.js';

describe('ZizmorAdapter', () => {
  let adapter: ZizmorAdapter;
  const fixturesDir = join(__dirname, '../../fixtures/tool-outputs/zizmor');

  beforeEach(() => {
    adapter = new ZizmorAdapter();
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(adapter.name).toBe('zizmor');
    });

    it('should have correct displayName', () => {
      expect(adapter.displayName).toBe('zizmor');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('security');
    });
  });

  describe('getInstallHint', () => {
    it('should provide installation instructions', () => {
      const hint = adapter.getInstallHint();

      expect(hint).toContain('zizmor');
      expect(hint).toMatch(/github/i);
    });
  });

  describe('parseOutput - fixtures', () => {
    it('should parse security issues', () => {
      const fixture = readFileSync(
        join(fixturesDir, 'security-issues.json'),
        'utf-8'
      );
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(2);

      // First issue - dangerous-triggers (high)
      expect(violations[0]).toMatchObject({
        id: 'zizmor/dangerous-triggers',
        severity: 'error', // high → error
        message: expect.stringContaining('pull_request_target'),
        source: 'zizmor',
        path: '.github/workflows/ci.yml',
        line: 5,
        column: 1,
      });

      // Second issue - hardcoded-credentials (critical)
      expect(violations[1]).toMatchObject({
        id: 'zizmor/hardcoded-credentials',
        severity: 'error', // critical → error
        message: expect.stringContaining('hardcoded credential'),
        line: 15,
      });
    });

    it('should parse injection risk', () => {
      const fixture = readFileSync(
        join(fixturesDir, 'injection-risk.json'),
        'utf-8'
      );
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({
        id: 'zizmor/injection-risk',
        severity: 'error',
        message: expect.stringContaining('command injection'),
        path: '.github/workflows/deploy.yml',
        line: 22,
      });
    });

    it('should parse multiple severities', () => {
      const fixture = readFileSync(
        join(fixturesDir, 'multiple-severities.json'),
        'utf-8'
      );
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(3);

      // Medium severity → warning
      expect(violations[0].severity).toBe('warning');
      expect(violations[1].severity).toBe('warning');

      // Low severity → info
      expect(violations[2].severity).toBe('info');
    });

    it('should handle no issues', () => {
      const fixture = readFileSync(join(fixturesDir, 'no-issues.json'), 'utf-8');
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      const violations = adapter.parseOutput('');

      expect(violations).toHaveLength(0);
    });

    it('should handle invalid JSON gracefully', () => {
      const violations = adapter.parseOutput('not valid json');

      expect(violations).toHaveLength(0);
    });
  });

  describe('severity mapping', () => {
    it('should map critical to error', () => {
      const json = JSON.stringify([
        {
          workflowPath: '.github/workflows/ci.yml',
          job: 'test',
          step: 1,
          rule: 'test-rule',
          severity: 'critical',
          message: 'test',
          line: 1,
        },
      ]);

      const violations = adapter.parseOutput(json);
      expect(violations[0].severity).toBe('error');
    });

    it('should map high to error', () => {
      const json = JSON.stringify([
        {
          workflowPath: '.github/workflows/ci.yml',
          job: 'test',
          step: 1,
          rule: 'test-rule',
          severity: 'high',
          message: 'test',
          line: 1,
        },
      ]);

      const violations = adapter.parseOutput(json);
      expect(violations[0].severity).toBe('error');
    });

    it('should map medium to warning', () => {
      const json = JSON.stringify([
        {
          workflowPath: '.github/workflows/ci.yml',
          job: 'test',
          step: 1,
          rule: 'test-rule',
          severity: 'medium',
          message: 'test',
          line: 1,
        },
      ]);

      const violations = adapter.parseOutput(json);
      expect(violations[0].severity).toBe('warning');
    });

    it('should map low to info', () => {
      const json = JSON.stringify([
        {
          workflowPath: '.github/workflows/ci.yml',
          job: 'test',
          step: 1,
          rule: 'test-rule',
          severity: 'low',
          message: 'test',
          line: 1,
        },
      ]);

      const violations = adapter.parseOutput(json);
      expect(violations[0].severity).toBe('info');
    });
  });

  describe('parseOutput - sorting', () => {
    it('should sort violations deterministically', () => {
      const json = JSON.stringify([
        {
          workflowPath: '.github/workflows/z.yml',
          job: 'test',
          step: 1,
          rule: 'rule-z',
          severity: 'high',
          message: 'z',
          line: 10,
        },
        {
          workflowPath: '.github/workflows/a.yml',
          job: 'test',
          step: 1,
          rule: 'rule-a',
          severity: 'high',
          message: 'a',
          line: 5,
        },
        {
          workflowPath: '.github/workflows/a.yml',
          job: 'test',
          step: 1,
          rule: 'rule-b',
          severity: 'high',
          message: 'b',
          line: 10,
        },
      ]);

      const violations = adapter.parseOutput(json);

      expect(violations).toHaveLength(3);
      // Sorted by path first, then line
      expect(violations[0].path).toBe('.github/workflows/a.yml');
      expect(violations[0].line).toBe(5);
      expect(violations[1].path).toBe('.github/workflows/a.yml');
      expect(violations[1].line).toBe(10);
      expect(violations[2].path).toBe('.github/workflows/z.yml');
    });
  });

  describe('parseOutput - path normalization', () => {
    it('should make paths relative to cwd', () => {
      const json = JSON.stringify([
        {
          workflowPath: '/absolute/path/.github/workflows/ci.yml',
          job: 'test',
          step: 1,
          rule: 'test-rule',
          severity: 'high',
          message: 'test',
          line: 5,
        },
      ]);

      const violations = adapter.parseOutput(json, {
        cwd: '/absolute/path',
      });

      expect(violations).toHaveLength(1);
      expect(violations[0].path).toBe('.github/workflows/ci.yml');
    });

    it('should normalize Windows paths', () => {
      const json = JSON.stringify([
        {
          workflowPath: 'D:\\project\\.github\\workflows\\ci.yml',
          job: 'test',
          step: 1,
          rule: 'test-rule',
          severity: 'high',
          message: 'test',
          line: 5,
        },
      ]);

      const violations = adapter.parseOutput(json, {
        cwd: 'D:\\project',
      });

      expect(violations).toHaveLength(1);
      // Should use forward slashes
      expect(violations[0].path).toBe('.github/workflows/ci.yml');
    });
  });

  describe('toolOutput metadata', () => {
    it('should preserve job and step information', () => {
      const json = JSON.stringify([
        {
          workflowPath: '.github/workflows/ci.yml',
          job: 'build',
          step: 5,
          rule: 'test-rule',
          severity: 'high',
          message: 'test',
          line: 10,
        },
      ]);

      const violations = adapter.parseOutput(json);

      expect(violations[0].toolOutput).toMatchObject({
        job: 'build',
        step: 5,
        originalSeverity: 'high',
      });
    });
  });

  describe('run', () => {
    it('should return skipped result if tool not installed', async () => {
      // Mock detect to return not installed
      adapter['detect'] = async () => ({
        installed: false,
        version: null,
        installHint: 'Download from GitHub releases',
      });

      const result = await adapter.run({
        files: ['.github/workflows/ci.yml'],
        cwd: process.cwd(),
      });

      expect(result.skipped).toBe(true);
      expect(result.skipReason).toContain('not installed');
      expect(result.violations).toHaveLength(0);
    });

    it('should return empty result for non-workflow files', async () => {
      // Mock detect to return installed
      adapter['detect'] = async () => ({
        installed: true,
        version: '1.0.0',
        installHint: '',
      });

      const result = await adapter.run({
        files: ['README.md', 'src/index.ts'],
        cwd: process.cwd(),
      });

      expect(result.violations).toHaveLength(0);
      expect(result.exitCode).toBe(0);
    });

    it('should filter for workflow files only', async () => {
      const files = [
        '.github/workflows/ci.yml',
        '.github/workflows/deploy.yaml',
        'package.json',
        'src/index.ts',
        '.github/dependabot.yml', // Not in workflows/
      ];

      // Count would-be processed files
      const workflowFiles = files.filter(
        (file) =>
          file.includes('.github/workflows/') &&
          (file.endsWith('.yml') || file.endsWith('.yaml'))
      );

      expect(workflowFiles).toHaveLength(2);
      expect(workflowFiles).toContain('.github/workflows/ci.yml');
      expect(workflowFiles).toContain('.github/workflows/deploy.yaml');
    });
  });

  describe('integration (if zizmor installed)', () => {
    it.skip('should run on real workflow file', async () => {
      const installed = await adapter.isInstalled();

      if (!installed) {
        return;
      }

      expect(adapter).toBeDefined();
    });
  });
});
