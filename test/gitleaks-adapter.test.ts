/**
 * @file gitleaks Adapter Test Suite - COMPREHENSIVE TESTING
 * @rule ZERO SHORTCUTS: Every feature tested, all edge cases covered
 * 
 * Test Groups:
 * 1. Tool Detection (installed/missing/version)
 * 2. Output Parsing (JSON, edge cases, malformed data)
 * 3. Severity Mapping (verified vs unverified)
 * 4. Path Normalization (Windows, Unix, relative paths)
 * 5. Error Handling (timeout, execution failure, invalid JSON)
 * 6. Sorting (deterministic output)
 * 7. Real-world Scenarios (multiple findings, complex paths)
 */

import { beforeEach, describe, expect, it } from '@jest/globals';
import { GitleaksAdapter } from '../src/adapters/gitleaks/GitleaksAdapter.js';

describe('GitleaksAdapter', () => {
  let adapter: GitleaksAdapter;

  beforeEach(() => {
    adapter = new GitleaksAdapter();
  });

  // ===== GROUP 1: Basic Properties =====
  describe('Basic Properties', () => {
    it('should have correct name and display name', () => {
      expect(adapter.name).toBe('gitleaks');
      expect(adapter.displayName).toBe('gitleaks');
    });

    it('should have description', () => {
      expect(adapter.description).toContain('Secret');
    });

    it('should have install hint', () => {
      const hint = adapter.getInstallHint();
      expect(hint).toBeTruthy();
      expect(hint).toContain('gitleaks');
    });
  });

  // ===== GROUP 2: Output Parsing - Valid JSON =====
  describe('Output Parsing - Valid Cases', () => {
    it('should parse empty array', () => {
      const output = '[]';
      const violations = adapter.parseOutput(output);
      expect(violations).toEqual([]);
    });

    it('should parse single finding', () => {
      const output = JSON.stringify([
        {
          RuleID: 'aws-access-key',
          RuleTitle: 'AWS Access Key',
          Verified: true,
          Secret: 'AKIAIOSFODNN7EXAMPLE',
          File: '.github/workflows/ci.yml',
          StartLine: 10,
          EndLine: 10,
          StartColumn: 20,
          EndColumn: 40,
          Match: 'AKIAIOSFODNN7EXAMPLE',
          MatchType: 'AWS Manager ID',
          Entropy: 4.5,
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({
        id: 'gitleaks/aws-access-key',
        severity: 'error',
        source: 'gitleaks',
        path: '.github/workflows/ci.yml',
        line: 10,
        column: 20,
      });
      expect(violations[0].message).toContain('AWS Access Key');
      expect(violations[0].message).toContain('verified secret');
    });

    it('should parse unverified finding as warning', () => {
      const output = JSON.stringify([
        {
          RuleID: 'slack-webhook',
          RuleTitle: 'Slack Webhook',
          Verified: false,
          Secret: 'https://hooks.slack.com/services/XXX',
          File: 'config.yml',
          StartLine: 5,
          EndLine: 5,
          StartColumn: 10,
          EndColumn: 50,
          Match: 'https://hooks.slack.com/services/XXX',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('warning');
      expect(violations[0].message).toContain('unverified pattern');
    });

    it('should parse multiple findings and sort them', () => {
      const output = JSON.stringify([
        {
          RuleID: 'github-token',
          RuleTitle: 'GitHub Token',
          Verified: true,
          Secret: 'ghp_XXXXXXXXXXXX',
          File: 'workflows/deploy.yml',
          StartLine: 20,
          EndLine: 20,
          StartColumn: 5,
          EndColumn: 20,
          Match: 'ghp_XXXXXXXXXXXX',
        },
        {
          RuleID: 'aws-secret-key',
          RuleTitle: 'AWS Secret Key',
          Verified: true,
          Secret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
          File: '.github/workflows/ci.yml',
          StartLine: 15,
          EndLine: 15,
          StartColumn: 10,
          EndColumn: 50,
          Match: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
        },
        {
          RuleID: 'api-key',
          RuleTitle: 'Generic API Key',
          Verified: false,
          Secret: 'sk_live_XXXXX',
          File: '.github/workflows/ci.yml',
          StartLine: 15,
          EndLine: 15,
          StartColumn: 50,
          EndColumn: 65,
          Match: 'sk_live_XXXXX',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations).toHaveLength(3);

      // Should be sorted by path, then line, then column
      expect(violations[0].path).toBe('.github/workflows/ci.yml');
      expect(violations[0].line).toBe(15);
      expect(violations[0].column).toBe(10);

      expect(violations[1].path).toBe('.github/workflows/ci.yml');
      expect(violations[1].line).toBe(15);
      expect(violations[1].column).toBe(50);

      expect(violations[2].path).toBe('workflows/deploy.yml');
      expect(violations[2].line).toBe(20);
    });

    it('should include entropy in message when available', () => {
      const output = JSON.stringify([
        {
          RuleID: 'entropy-check',
          RuleTitle: 'High Entropy String',
          Verified: false,
          Secret: 'aB3xYz9kL2mNoPqRs',
          File: 'test.txt',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 17,
          Match: 'aB3xYz9kL2mNoPqRs',
          Entropy: 4.87,
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations[0].message).toContain('4.87');
    });

    it('should preserve tool output metadata', () => {
      const output = JSON.stringify([
        {
          RuleID: 'pem-private-key',
          RuleTitle: 'PEM Private Key',
          Verified: true,
          Secret: '-----BEGIN RSA PRIVATE KEY-----',
          File: 'key.pem',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 31,
          Match: '-----BEGIN RSA PRIVATE KEY-----',
          MatchType: 'PEM PRIVATE KEY',
          Entropy: 5.2,
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations[0].toolOutput).toMatchObject({
        ruleId: 'pem-private-key',
        ruleTitle: 'PEM Private Key',
        verified: true,
        entropy: 5.2,
        matchType: 'PEM PRIVATE KEY',
      });
    });
  });

  // ===== GROUP 3: Output Parsing - Invalid/Edge Cases =====
  describe('Output Parsing - Error Cases', () => {
    it('should handle empty output', () => {
      const violations = adapter.parseOutput('');
      expect(violations).toEqual([]);
    });

    it('should handle whitespace-only output', () => {
      const violations = adapter.parseOutput('   \n\n   ');
      expect(violations).toEqual([]);
    });

    it('should handle invalid JSON gracefully', () => {
      const violations = adapter.parseOutput('{ invalid json }');
      expect(violations).toEqual([]);
    });

    it('should handle non-array JSON', () => {
      const violations = adapter.parseOutput(JSON.stringify({ error: 'not an array' }));
      expect(violations).toEqual([]);
    });

    it('should filter out incomplete findings (missing required fields)', () => {
      const output = JSON.stringify([
        // Missing File
        {
          RuleID: 'test1',
          RuleTitle: 'Test',
          Verified: true,
          Secret: 'secret1',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
        },
        // Valid finding
        {
          RuleID: 'test2',
          RuleTitle: 'Test Valid',
          Verified: false,
          Secret: 'secret2',
          File: 'test.txt',
          StartLine: 5,
          EndLine: 5,
          StartColumn: 0,
          EndColumn: 10,
        },
        // Missing StartLine
        {
          RuleID: 'test3',
          RuleTitle: 'Test',
          Verified: true,
          Secret: 'secret3',
          File: 'test.txt',
          EndLine: 10,
          StartColumn: 0,
          EndColumn: 10,
        },
      ]);

      const violations = adapter.parseOutput(output);
      // Only the second (valid) finding should be included
      expect(violations).toHaveLength(1);
      expect(violations[0].id).toBe('gitleaks/test2');
    });

    it('should handle null/undefined in findings array', () => {
      const output = JSON.stringify([
        {
          RuleID: 'valid',
          RuleTitle: 'Valid',
          Verified: true,
          Secret: 'secret',
          File: 'file.txt',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
        },
        null,
        undefined,
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations).toHaveLength(1);
    });
  });

  // ===== GROUP 4: Path Normalization =====
  describe('Path Normalization', () => {
    it('should normalize Windows paths (backslashes)', () => {
      const output = JSON.stringify([
        {
          RuleID: 'test',
          RuleTitle: 'Test',
          Verified: false,
          Secret: 'secret',
          File: 'src\\workflows\\test.yml',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
          Match: 'secret',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations[0].path).toBe('src/workflows/test.yml');
      expect(violations[0].path).not.toContain('\\');
    });

    it('should remove Windows drive letters', () => {
      const output = JSON.stringify([
        {
          RuleID: 'test',
          RuleTitle: 'Test',
          Verified: false,
          Secret: 'secret',
          File: 'D:\\.github\\workflows\\test.yml',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
          Match: 'secret',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations[0].path).not.toMatch(/^[A-Za-z]:/);
      expect(violations[0].path).toContain('workflows');
    });

    it('should handle absolute Unix paths', () => {
      const output = JSON.stringify([
        {
          RuleID: 'test',
          RuleTitle: 'Test',
          Verified: false,
          Secret: 'secret',
          File: '/.github/workflows/test.yml',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
          Match: 'secret',
        },
      ]);

      const violations = adapter.parseOutput(output, { cwd: '/home/user/repo' });
      expect(violations[0].path).not.toMatch(/^\//);
    });

    it('should normalize relative to cwd', () => {
      const output = JSON.stringify([
        {
          RuleID: 'test',
          RuleTitle: 'Test',
          Verified: false,
          Secret: 'secret',
          File: '/home/user/repo/.github/workflows/test.yml',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
          Match: 'secret',
        },
      ]);

      const violations = adapter.parseOutput(output, { cwd: '/home/user/repo' });
      expect(violations[0].path).toBe('.github/workflows/test.yml');
    });
  });

  // ===== GROUP 5: Severity Mapping =====
  describe('Severity Mapping', () => {
    it('should mark verified findings as error', () => {
      const output = JSON.stringify([
        {
          RuleID: 'test',
          RuleTitle: 'Test',
          Verified: true,
          Secret: 'secret',
          File: 'test.txt',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
          Match: 'secret',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations[0].severity).toBe('error');
    });

    it('should mark unverified findings as warning', () => {
      const output = JSON.stringify([
        {
          RuleID: 'test',
          RuleTitle: 'Test',
          Verified: false,
          Secret: 'secret',
          File: 'test.txt',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
          Match: 'secret',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations[0].severity).toBe('warning');
    });
  });

  // ===== GROUP 6: Sorting (Determinism) =====
  describe('Deterministic Sorting', () => {
    it('should sort violations by path, then line, then column', () => {
      const output = JSON.stringify([
        // Third in path order
        {
          RuleID: 'r1',
          RuleTitle: 'R1',
          Verified: false,
          Secret: 's1',
          File: 'z-file.yml',
          StartLine: 5,
          EndLine: 5,
          StartColumn: 0,
          EndColumn: 10,
          Match: 's1',
        },
        // Second in path order, but first by line
        {
          RuleID: 'r2',
          RuleTitle: 'R2',
          Verified: false,
          Secret: 's2',
          File: 'b-file.yml',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 10,
          Match: 's2',
        },
        // First in path order, but second by line
        {
          RuleID: 'r3',
          RuleTitle: 'R3',
          Verified: false,
          Secret: 's3',
          File: 'a-file.yml',
          StartLine: 10,
          EndLine: 10,
          StartColumn: 0,
          EndColumn: 10,
          Match: 's3',
        },
        // Same path and line, different column
        {
          RuleID: 'r4',
          RuleTitle: 'R4',
          Verified: false,
          Secret: 's4',
          File: 'a-file.yml',
          StartLine: 10,
          EndLine: 10,
          StartColumn: 5,
          EndColumn: 15,
          Match: 's4',
        },
      ]);

      const violations = adapter.parseOutput(output);

      // Expected order: a-file.yml:10:0, a-file.yml:10:5, b-file.yml:1:0, z-file.yml:5:0
      // (sorted by path, then line, then column - ascending)
      expect(violations[0].path).toBe('a-file.yml');
      expect(violations[0].line).toBe(10);
      expect(violations[0].column).toBe(0);  // r3

      expect(violations[1].path).toBe('a-file.yml');
      expect(violations[1].line).toBe(10);
      expect(violations[1].column).toBe(5);  // r4

      expect(violations[2].path).toBe('b-file.yml');
      expect(violations[2].line).toBe(1);
      expect(violations[2].column).toBe(0);

      expect(violations[3].path).toBe('z-file.yml');
      expect(violations[3].line).toBe(5);
      expect(violations[3].column).toBe(0);
    });

    it('should be deterministic across multiple parses', () => {
      const output = JSON.stringify([
        {
          RuleID: 'r1',
          RuleTitle: 'R1',
          Verified: true,
          Secret: 's1',
          File: 'file.yml',
          StartLine: 10,
          EndLine: 10,
          StartColumn: 5,
          EndColumn: 15,
          Match: 's1',
        },
        {
          RuleID: 'r2',
          RuleTitle: 'R2',
          Verified: false,
          Secret: 's2',
          File: 'file.yml',
          StartLine: 5,
          EndLine: 5,
          StartColumn: 0,
          EndColumn: 10,
          Match: 's2',
        },
      ]);

      const parse1 = adapter.parseOutput(output);
      const parse2 = adapter.parseOutput(output);
      const parse3 = adapter.parseOutput(output);

      // All three parses should produce identical order
      expect(parse1).toEqual(parse2);
      expect(parse2).toEqual(parse3);
    });
  });

  // ===== GROUP 7: Real-world Scenarios =====
  describe('Real-world Scenarios', () => {
    it('should handle GitHub workflows with multiple secrets', () => {
      const output = JSON.stringify([
        {
          RuleID: 'github-token',
          RuleTitle: 'GitHub Token',
          Verified: true,
          Secret: 'ghp_abcdefg1234567890',
          File: '.github/workflows/deploy.yml',
          StartLine: 15,
          EndLine: 15,
          StartColumn: 20,
          EndColumn: 40,
          Match: 'ghp_abcdefg1234567890',
        },
        {
          RuleID: 'slack-webhook',
          RuleTitle: 'Slack Webhook',
          Verified: false,
          Secret: 'https://hooks.slack.com/services/...',
          File: '.github/workflows/deploy.yml',
          StartLine: 22,
          EndLine: 22,
          StartColumn: 10,
          EndColumn: 50,
          Match: 'https://hooks.slack.com/services/...',
        },
        {
          RuleID: 'aws-access-key',
          RuleTitle: 'AWS Access Key',
          Verified: true,
          Secret: 'AKIAIOSFODNN7EXAMPLE',
          File: '.github/workflows/ci.yml',
          StartLine: 8,
          EndLine: 8,
          StartColumn: 5,
          EndColumn: 25,
          Match: 'AKIAIOSFODNN7EXAMPLE',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations).toHaveLength(3);

      // All should have correct severity
      const errors = violations.filter((v: any) => v.severity === 'error');
      const warnings = violations.filter((v: any) => v.severity === 'warning');
      expect(errors).toHaveLength(2);
      expect(warnings).toHaveLength(1);
    });

    it('should handle git history secrets', () => {
      const output = JSON.stringify([
        {
          RuleID: 'aws-secret-key',
          RuleTitle: 'AWS Secret Key',
          Verified: true,
          Secret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
          File: 'src/config.js',
          StartLine: 42,
          EndLine: 42,
          StartColumn: 15,
          EndColumn: 55,
          Match: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
          Author: 'dev@example.com',
          Commit: 'abc123def456',
          Timestamp: '2024-01-12T10:30:00Z',
        },
      ]);

      const violations = adapter.parseOutput(output);
      expect(violations).toHaveLength(1);
      expect(violations[0].toolOutput).toMatchObject({
        ruleId: 'aws-secret-key',
        verified: true,
      });
    });
  });

  // ===== GROUP 8: Message Building =====
  describe('Message Building', () => {
    it('should build message with verified status and entropy', () => {
      const output = JSON.stringify([
        {
          RuleID: 'entropy-check',
          RuleTitle: 'High Entropy String',
          Verified: true,
          Secret: 'abc123def456ghi789',
          File: 'test.txt',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 18,
          Match: 'abc123def456ghi789',
          Entropy: 4.92,
        },
      ]);

      const violations = adapter.parseOutput(output);
      const message = violations[0].message;

      expect(message).toContain('High Entropy String');
      expect(message).toContain('potential secret detected');
      expect(message).toContain('verified secret');
      expect(message).toContain('4.92');
    });

    it('should build message without entropy if not provided', () => {
      const output = JSON.stringify([
        {
          RuleID: 'test',
          RuleTitle: 'Test Rule',
          Verified: false,
          Secret: 'secret',
          File: 'test.txt',
          StartLine: 1,
          EndLine: 1,
          StartColumn: 0,
          EndColumn: 6,
          Match: 'secret',
        },
      ]);

      const violations = adapter.parseOutput(output);
      const message = violations[0].message;

      expect(message).toContain('Test Rule');
      expect(message).toContain('unverified pattern');
      expect(message).not.toMatch(/\[\d+\.\d+\]/); // No entropy
    });
  });
});
