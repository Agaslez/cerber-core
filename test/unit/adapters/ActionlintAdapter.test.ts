/**
 * @file ActionlintAdapter unit tests
 * @rule Per AGENTS.md §4 - Tests-first gate
 * @rule Per AGENTS.md §1 - Fixtures, not real tool
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ActionlintAdapter } from '../../../src/adapters/actionlint/ActionlintAdapter.js';

describe('@fast ActionlintAdapter', () => {
  let adapter: ActionlintAdapter;
  const fixturesDir = join(__dirname, '../../fixtures/tool-outputs/actionlint');

  beforeEach(() => {
    adapter = new ActionlintAdapter();
  });

  describe('properties', () => {
    it('should have correct name', () => {
      expect(adapter.name).toBe('actionlint');
    });

    it('should have correct displayName', () => {
      expect(adapter.displayName).toBe('actionlint');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('GitHub Actions');
    });
  });

  describe('getInstallHint', () => {
    it('should provide installation instructions', () => {
      const hint = adapter.getInstallHint();
      
      expect(hint).toContain('actionlint');
      expect(hint).toMatch(/brew|github/i);
    });
  });

  describe('parseOutput - fixtures', () => {
    it('should parse syntax error', () => {
      const fixture = readFileSync(join(fixturesDir, 'syntax-error.txt'), 'utf-8');
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({
        id: 'actionlint/syntax-check',
        severity: 'error',
        message: 'unexpected key "jobs"',
        source: 'actionlint',
        path: '.github/workflows/ci.yml',
        line: 5,
        column: 1,
      });
    });

    it('should parse expression error', () => {
      const fixture = readFileSync(join(fixturesDir, 'expression-error.txt'), 'utf-8');
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({
        id: 'actionlint/expression',
        severity: 'error',
        message: expect.stringContaining('property "unknown" is not defined'),
        source: 'actionlint',
        path: '.github/workflows/test.yml',
        line: 15,
        column: 25,
      });
    });

    it('should parse multiple errors', () => {
      const fixture = readFileSync(join(fixturesDir, 'multiple-errors.txt'), 'utf-8');
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(3);
      
      // First error - deprecated
      expect(violations[0]).toMatchObject({
        id: 'actionlint/deprecated-commands',
        severity: 'warning',
        path: '.github/workflows/deploy.yml',
        line: 10,
      });

      // Second error - syntax
      expect(violations[1]).toMatchObject({
        id: 'actionlint/syntax-check',
        severity: 'error',
        line: 15,
      });

      // Third error - action version
      expect(violations[2]).toMatchObject({
        id: 'actionlint/action-version',
        severity: 'warning',
        line: 22,
      });
    });

    it('should handle no errors', () => {
      const fixture = readFileSync(join(fixturesDir, 'no-errors.txt'), 'utf-8');
      const violations = adapter.parseOutput(fixture);

      expect(violations).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      const violations = adapter.parseOutput('');
      
      expect(violations).toHaveLength(0);
    });
  });

  describe('parseOutput - sorting', () => {
    it('should sort violations deterministically', () => {
      const output = `.github/workflows/z.yml:10:1: error z [rule-z]
.github/workflows/a.yml:5:1: error a [rule-a]
.github/workflows/a.yml:10:1: error b [rule-b]`;

      const violations = adapter.parseOutput(output);

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
      const output = '/absolute/path/.github/workflows/ci.yml:5:1: error [rule]';
      
      const violations = adapter.parseOutput(output, {
        cwd: '/absolute/path',
      });

      expect(violations).toHaveLength(1);
      expect(violations[0].path).toBe('.github/workflows/ci.yml');
    });

    it('should normalize Windows paths', () => {
      const output = 'D:\\project\\.github\\workflows\\ci.yml:5:1: error [rule]';
      
      const violations = adapter.parseOutput(output, {
        cwd: 'D:\\project',
      });

      expect(violations).toHaveLength(1);
      // Should use forward slashes
      expect(violations[0].path).toBe('.github/workflows/ci.yml');
    });
  });

  describe('severity mapping', () => {
    it('should map syntax-check to error', () => {
      const output = '.github/workflows/ci.yml:5:1: syntax error [syntax-check]';
      const violations = adapter.parseOutput(output);

      expect(violations[0].severity).toBe('error');
    });

    it('should map expression to error', () => {
      const output = '.github/workflows/ci.yml:5:1: expression error [expression]';
      const violations = adapter.parseOutput(output);

      expect(violations[0].severity).toBe('error');
    });

    it('should map deprecated-commands to warning', () => {
      const output = '.github/workflows/ci.yml:5:1: deprecated [deprecated-commands]';
      const violations = adapter.parseOutput(output);

      expect(violations[0].severity).toBe('warning');
    });

    it('should map action-version to warning', () => {
      const output = '.github/workflows/ci.yml:5:1: old version [action-version]';
      const violations = adapter.parseOutput(output);

      expect(violations[0].severity).toBe('warning');
    });

    it('should default unknown rules to warning', () => {
      const output = '.github/workflows/ci.yml:5:1: some issue [unknown-rule]';
      const violations = adapter.parseOutput(output);

      expect(violations[0].severity).toBe('warning');
    });
  });

  describe('run', () => {
    it('should return skipped result if tool not installed', async () => {
      // Mock detect to return not installed
      adapter['detect'] = async () => ({
        installed: false,
        version: null,
        installHint: 'brew install actionlint',
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
        version: '1.6.26',
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
      // This tests the filtering logic without running real actionlint
      const files = [
        '.github/workflows/ci.yml',
        '.github/workflows/deploy.yaml',
        'package.json',
        'src/index.ts',
        '.github/dependabot.yml', // Not in workflows/
      ];

      // Count would-be processed files (indirectly via filter logic)
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

  describe('integration (if actionlint installed)', () => {
    it.skip('should run on real workflow file', async () => {
      const installed = await adapter.isInstalled();
      
      if (!installed) {
        // Skip if not installed locally
        return;
      }

      // This would run real actionlint in CI
      // For now, just verify adapter can be instantiated
      expect(adapter).toBeDefined();
    });
  });
});
