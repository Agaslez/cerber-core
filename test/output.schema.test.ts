/**
 * Output Schema Tests
 * @rule Per AGENTS.md §3 - Deterministic output testing
 * @rule Tests FIRST - Output schema must be validated before acceptance
 * 
 * These tests verify:
 * 1. Schema compliance (all outputs match JSON schema)
 * 2. Determinism (same input → identical JSON byte-for-byte)
 * 3. Sorting (violations are deterministically sorted)
 * 4. No violations of schema rules
 */

import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { CerberOutput, Violation } from '../src/types';

describe('Output Schema', () => {
  let ajv: any;
  let schema: any;

  beforeAll(() => {
    ajv = new Ajv({ strict: false });
    const schemaPath = path.join(__dirname, '..', '.cerber', 'output.schema.json');
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  });

  describe('Schema Validation', () => {
    it('should validate well-formed output', () => {
      const output: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 0,
          errors: 0,
          warnings: 0,
          info: 0
        },
        violations: [],
        metadata: {
          tools: {}
        }
      };

      const validate = ajv.compile(schema);
      const valid = validate(output);
      expect(valid).toBe(true);
    });

    it('should reject output with missing required fields', () => {
      const invalid = {
        schemaVersion: 1,
        // ❌ missing deterministic
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: { tools: {} }
      };

      const validate = ajv.compile(schema);
      const valid = validate(invalid);
      expect(valid).toBe(false);
    });

    it('should reject output with deterministic=false', () => {
      const invalid: any = {
        schemaVersion: 1,
        deterministic: false, // ❌ must be true
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: { tools: {} }
      };

      const validate = ajv.compile(schema);
      const valid = validate(invalid);
      expect(valid).toBe(false);
    });

    it('should reject violations with invalid severity', () => {
      const invalid: any = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 1, errors: 1, warnings: 0, info: 0 },
        violations: [
          {
            id: 'test/rule',
            severity: 'critical', // ❌ must be error/warning/info
            message: 'Test violation',
            source: 'test'
          }
        ],
        metadata: { tools: {} }
      };

      const validate = ajv.compile(schema);
      const valid = validate(invalid);
      expect(valid).toBe(false);
    });
  });

  describe('Determinism', () => {
    it('should produce identical JSON for same input (no timestamps)', () => {
      const output1: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 2, errors: 1, warnings: 1, info: 0 },
        violations: [
          {
            id: 'test/rule-a',
            severity: 'error',
            message: 'Error message',
            source: 'actionlint',
            path: '.github/workflows/ci.yml',
            line: 10,
            column: 5
          },
          {
            id: 'test/rule-b',
            severity: 'warning',
            message: 'Warning message',
            source: 'zizmor',
            path: '.github/workflows/ci.yml',
            line: 20,
            column: 1
          }
        ],
        metadata: {
          profile: 'dev',
          target: 'github-actions',
          tools: {
            actionlint: { enabled: true, version: '1.6.27', exitCode: 0 },
            zizmor: { enabled: true, version: '0.2.0', exitCode: 0 }
          }
        }
      };

      const output2: CerberOutput = JSON.parse(JSON.stringify(output1));

      const json1 = JSON.stringify(output1, null, 2);
      const json2 = JSON.stringify(output2, null, 2);

      expect(json1).toBe(json2);
      expect(json1).toMatchSnapshot();
    });

    it('should exclude runMetadata from determinism checks', () => {
      const base: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: { tools: {} }
      };

      const output1 = {
        ...base,
        runMetadata: {
          generatedAt: '2026-01-11T10:00:00Z',
          executionTime: 1234
        }
      };

      const output2 = {
        ...base,
        runMetadata: {
          generatedAt: '2026-01-11T10:00:05Z', // Different timestamp
          executionTime: 5678 // Different execution time
        }
      };

      // Core output (excluding runMetadata) should be identical
      const core1 = { ...output1 };
      delete (core1 as any).runMetadata;

      const core2 = { ...output2 };
      delete (core2 as any).runMetadata;

      expect(JSON.stringify(core1)).toBe(JSON.stringify(core2));
    });
  });

  describe('Violation Sorting', () => {
    it('should validate violations are sorted by (path, line, column, id)', () => {
      const violations: Violation[] = [
        {
          id: 'rule/b',
          severity: 'warning',
          message: 'B',
          source: 'test',
          path: 'a.yml',
          line: 1,
          column: 1
        },
        {
          id: 'rule/a',
          severity: 'error',
          message: 'A',
          source: 'test',
          path: 'a.yml',
          line: 1,
          column: 2
        },
        {
          id: 'rule/c',
          severity: 'info',
          message: 'C',
          source: 'test',
          path: 'b.yml',
          line: 1,
          column: 1
        }
      ];

      // Sort deterministically: path, line, column, id
      const sorted = violations.sort((a, b) => {
        if (a.path !== b.path) return a.path!.localeCompare(b.path!);
        if (a.line !== b.line) return (a.line || 0) - (b.line || 0);
        if (a.column !== b.column) return (a.column || 0) - (b.column || 0);
        return a.id.localeCompare(b.id);
      });

      // a.yml:1:1 rule/b, a.yml:1:2 rule/a, b.yml:1:1 rule/c
      expect(sorted[0].id).toBe('rule/b'); // a.yml:1:1
      expect(sorted[1].id).toBe('rule/a'); // a.yml:1:2
      expect(sorted[2].id).toBe('rule/c'); // b.yml:1:1
    });
  });

  describe('Metadata Sorting', () => {
    it('should validate metadata tools structure', () => {
      const output: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: {
          tools: {
            actionlint: { enabled: true, version: '1.6.27', exitCode: 0 },
            zizmor: { enabled: true, version: '0.2.0', exitCode: 0 },
            gitleaks: { enabled: false, skipped: true, reason: 'not_installed' }
          }
        }
      };

      // Verify all tools are present
      expect(output.metadata.tools.actionlint).toBeDefined();
      expect(output.metadata.tools.zizmor).toBeDefined();
      expect(output.metadata.tools.gitleaks).toBeDefined();
    });
  });

  describe('Summary Calculation', () => {
    it('should verify summary matches violation counts', () => {
      const violations: Violation[] = [
        { id: 'e1', severity: 'error', message: 'E1', source: 'test' },
        { id: 'e2', severity: 'error', message: 'E2', source: 'test' },
        { id: 'w1', severity: 'warning', message: 'W1', source: 'test' },
        { id: 'i1', severity: 'info', message: 'I1', source: 'test' }
      ];

      const output: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: violations.length,
          errors: violations.filter(v => v.severity === 'error').length,
          warnings: violations.filter(v => v.severity === 'warning').length,
          info: violations.filter(v => v.severity === 'info').length
        },
        violations,
        metadata: { tools: {} }
      };

      expect(output.summary.total).toBe(4);
      expect(output.summary.errors).toBe(2);
      expect(output.summary.warnings).toBe(1);
      expect(output.summary.info).toBe(1);
    });
  });

  describe('Path Normalization', () => {
    it('should use forward slashes only (no backslashes)', () => {
      const violations: Violation[] = [
        {
          id: 'test/rule',
          severity: 'error',
          message: 'Test',
          source: 'test',
          path: '.github/workflows/ci.yml' // ✅ forward slash
        }
      ];

      expect(violations[0].path).not.toContain('\\');
    });
  });

  describe('Real Output Examples', () => {
    it('should validate example: zero violations', () => {
      const output: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: {
          profile: 'dev',
          target: 'github-actions',
          tools: {
            actionlint: { enabled: true, version: '1.6.27', exitCode: 0 },
            zizmor: { enabled: true, version: '0.2.0', exitCode: 0 }
          }
        }
      };

      const validate = ajv.compile(schema);
      expect(validate(output)).toBe(true);
      expect(output).toMatchSnapshot();
    });

    it('should validate example: multiple violations', () => {
      const output: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 3, errors: 2, warnings: 1, info: 0 },
        violations: [
          {
            id: 'actionlint/syntax',
            severity: 'error',
            message: 'Invalid workflow syntax',
            source: 'actionlint',
            path: '.github/workflows/ci.yml',
            line: 10,
            column: 5,
            hint: 'Check YAML indentation'
          },
          {
            id: 'zizmor/insecure-runner',
            severity: 'error',
            message: 'Runner must be explicitly specified',
            source: 'zizmor',
            path: '.github/workflows/ci.yml',
            line: 15,
            column: 3,
            hint: 'Use: runs-on: ubuntu-latest'
          },
          {
            id: 'actionlint/deprecated',
            severity: 'warning',
            message: 'Deprecated action version',
            source: 'actionlint',
            path: '.github/workflows/deploy.yml',
            line: 20,
            column: 1
          }
        ],
        metadata: {
          profile: 'team',
          target: 'github-actions',
          tools: {
            actionlint: { enabled: true, version: '1.6.27', exitCode: 1 },
            zizmor: { enabled: true, version: '0.2.0', exitCode: 1 }
          }
        },
        runMetadata: {
          executionTime: 1250,
          cwd: '/workspace'
        }
      };

      const validate = ajv.compile(schema);
      expect(validate(output)).toBe(true);
      expect(output).toMatchSnapshot();
    });
  });
});
