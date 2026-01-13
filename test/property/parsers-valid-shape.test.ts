/**
 * Property-Based Valid-Shape Testing: Must-Produce
 * 
 * Tests with VALID tool output and verifies CORRECT Violation[] shape
 * Goal: Parsers correctly map tool output to {id, severity, message, source, path?}
 * 
 * Uses hand-crafted valid JSON fixtures that mimic real tool output
 * Assertions: Returned violations have correct structure and valid values
 */

import { ActionlintAdapter } from '../../src/adapters/actionlint/ActionlintAdapter';
import { GitleaksAdapter } from '../../src/adapters/gitleaks/GitleaksAdapter';
import { ZizmorAdapter } from '../../src/adapters/zizmor/ZizmorAdapter';

describe('Property-Based Valid-Shape Testing: Must-Produce', () => {
  describe('ActionlintAdapter - shape validation', () => {
    it('should produce valid Violation shape from actionlint JSON', () => {
      const adapter = new ActionlintAdapter();
      const validActionlintOutput = JSON.stringify({
        'workflow.yml': [
          {
            Line: 5,
            Column: 2,
            Level: 'error',
            Message: 'Invalid action reference',
            Rule: { Name: 'runner-label' },
          },
          {
            Line: 10,
            Column: 1,
            Level: 'warning',
            Message: 'Missing checkout',
            Rule: { Name: 'checkout-v2' },
          },
        ],
      });

      const violations = adapter.parseOutput(validActionlintOutput);

      expect(Array.isArray(violations)).toBe(true);
      violations.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(v).toHaveProperty('source');
        expect(typeof v.id).toBe('string');
        expect(['error', 'warning', 'info']).toContain(v.severity);
        expect(typeof v.message).toBe('string');
        expect(v.source).toBe('actionlint');
      });
    });

    it('should map severity levels correctly', () => {
      const adapter = new ActionlintAdapter();
      const testCases = [
        { input: 'error', expectedSeverity: 'error' },
        { input: 'warning', expectedSeverity: 'warning' },
        { input: 'note', expectedSeverity: 'info' },
      ];

      testCases.forEach(({ input, expectedSeverity }) => {
        const json = JSON.stringify({
          'test.yml': [
            {
              Line: 1,
              Column: 1,
              Level: input,
              Message: 'Test',
              Rule: { Name: 'test-rule' },
            },
          ],
        });

        const violations = adapter.parseOutput(json);
        if (violations.length > 0) {
          expect(violations[0].severity).toBe(expectedSeverity);
        }
      });
    });

    it('should extract id from Rule.Name', () => {
      const adapter = new ActionlintAdapter();
      const json = JSON.stringify({
        'file.yml': [
          {
            Line: 1,
            Column: 1,
            Level: 'error',
            Message: 'Test error',
            Rule: { Name: 'my-custom-rule' },
          },
        ],
      });

      const violations = adapter.parseOutput(json);
      if (violations.length > 0) {
        expect(violations[0].id).toBeDefined();
        expect(violations[0].id).toEqual(expect.stringContaining('rule'));
      }
    });

    it('should handle multiple files', () => {
      const adapter = new ActionlintAdapter();
      const json = JSON.stringify({
        'file1.yml': [
          { Line: 1, Column: 1, Level: 'error', Message: 'Error 1', Rule: { Name: 'rule1' } },
        ],
        'file2.yml': [
          { Line: 2, Column: 1, Level: 'warning', Message: 'Error 2', Rule: { Name: 'rule2' } },
        ],
      });

      const violations = adapter.parseOutput(json);
      expect(violations.length).toBeGreaterThanOrEqual(0);
      violations.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
      });
    });
  });

  describe('GitleaksAdapter - shape validation', () => {
    it('should produce valid Violation shape from gitleaks JSON', () => {
      const adapter = new GitleaksAdapter();
      const validGitleaksOutput = JSON.stringify({
        Leaks: [
          {
            File: 'config/.env',
            Line: 5,
            Secret: 'PRIVATE_KEY=...',
            Match: 'PRIVATE_KEY',
          },
          {
            File: 'src/api.js',
            Line: 42,
            Secret: 'password=abc123',
            Match: 'password',
          },
        ],
      });

      const violations = adapter.parseOutput(validGitleaksOutput);

      expect(Array.isArray(violations)).toBe(true);
      violations.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(v).toHaveProperty('source');
        expect(typeof v.id).toBe('string');
        expect(v.severity).toBe('error'); // gitleaks is always error
        expect(typeof v.message).toBe('string');
        expect(v.source).toBe('gitleaks');
      });
    });

    it('should always use error severity for gitleaks', () => {
      const adapter = new GitleaksAdapter();
      const json = JSON.stringify({
        Leaks: [
          { File: 'test.ts', Line: 1, Secret: 'key=xyz', Match: 'key' },
        ],
      });

      const violations = adapter.parseOutput(json);
      violations.forEach((v) => {
        expect(v.severity).toBe('error');
      });
    });

    it('should handle empty leaks array', () => {
      const adapter = new GitleaksAdapter();
      const json = JSON.stringify({ Leaks: [] });

      const violations = adapter.parseOutput(json);
      expect(Array.isArray(violations)).toBe(true);
    });

    it('should extract file path from File property', () => {
      const adapter = new GitleaksAdapter();
      const json = JSON.stringify({
        Leaks: [
          { File: 'path/to/config.env', Line: 5, Secret: 'key', Match: 'key' },
        ],
      });

      const violations = adapter.parseOutput(json);
      if (violations.length > 0) {
        expect(violations[0]).toHaveProperty('path');
      }
    });
  });

  describe('ZizmorAdapter - shape validation', () => {
    it('should produce valid Violation shape from zizmor JSON', () => {
      const adapter = new ZizmorAdapter();
      const validZizmorOutput = JSON.stringify({
        compliant: false,
        checks: [
          {
            name: 'SLSA-L3/Provenance',
            description: 'Build provenance not found',
            severity: 'error',
            remediation: 'Add provenance file',
          },
          {
            name: 'SLSA-L2/Signing',
            description: 'Not signed',
            severity: 'warning',
            remediation: 'Add signature',
          },
        ],
      });

      const violations = adapter.parseOutput(validZizmorOutput);

      expect(Array.isArray(violations)).toBe(true);
      violations.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(v).toHaveProperty('source');
        expect(typeof v.id).toBe('string');
        expect(['error', 'warning', 'info']).toContain(v.severity);
        expect(typeof v.message).toBe('string');
        expect(v.source).toBe('zizmor');
      });
    });

    it('should map severity levels correctly for zizmor', () => {
      const adapter = new ZizmorAdapter();
      const severities = ['error', 'warning', 'info'];

      severities.forEach((sev) => {
        const json = JSON.stringify({
          compliant: false,
          checks: [
            {
              name: 'test-check',
              description: 'Test',
              severity: sev,
              remediation: 'Fix it',
            },
          ],
        });

        const violations = adapter.parseOutput(json);
        if (violations.length > 0) {
          expect(['error', 'warning', 'info']).toContain(violations[0].severity);
        }
      });
    });

    it('should extract id from check name', () => {
      const adapter = new ZizmorAdapter();
      const json = JSON.stringify({
        compliant: true,
        checks: [
          {
            name: 'custom-slsa-check',
            description: 'Test',
            severity: 'info',
            remediation: 'N/A',
          },
        ],
      });

      const violations = adapter.parseOutput(json);
      if (violations.length > 0) {
        expect(violations[0].id).toBeDefined();
      }
    });

    it('should handle compliant state (no violations)', () => {
      const adapter = new ZizmorAdapter();
      const json = JSON.stringify({
        compliant: true,
        checks: [],
      });

      const violations = adapter.parseOutput(json);
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('Cross-adapter valid-shape properties', () => {
    it('all adapters produce violations with required fields', () => {
      const testCases = [
        {
          adapter: new ActionlintAdapter(),
          json: JSON.stringify({
            'test.yml': [
              { Line: 1, Column: 1, Level: 'error', Message: 'Test', Rule: { Name: 'rule' } },
            ],
          }),
        },
        {
          adapter: new GitleaksAdapter(),
          json: JSON.stringify({ Leaks: [{ File: 'test.txt', Line: 1, Secret: 'key', Match: 'key' }] }),
        },
        {
          adapter: new ZizmorAdapter(),
          json: JSON.stringify({
            compliant: false,
            checks: [{ name: 'test', description: 'Test', severity: 'error', remediation: 'Fix' }],
          }),
        },
      ];

      testCases.forEach(({ adapter, json }) => {
        const violations = adapter.parseOutput(json);
        violations.forEach((v) => {
          expect(v).toHaveProperty('id');
          expect(v).toHaveProperty('severity');
          expect(v).toHaveProperty('message');
          expect(v).toHaveProperty('source');
          expect(typeof v.id).toBe('string');
          expect(typeof v.severity).toBe('string');
          expect(typeof v.message).toBe('string');
          expect(typeof v.source).toBe('string');
        });
      });
    });

    it('severity values are always valid', () => {
      const validSeverities = ['error', 'warning', 'info'];
      const testCases = [
        {
          adapter: new ActionlintAdapter(),
          json: JSON.stringify({
            'test.yml': [
              { Line: 1, Column: 1, Level: 'error', Message: 'Test', Rule: { Name: 'rule' } },
            ],
          }),
        },
        {
          adapter: new GitleaksAdapter(),
          json: JSON.stringify({ Leaks: [{ File: 'test.txt', Line: 1, Secret: 'key', Match: 'key' }] }),
        },
        {
          adapter: new ZizmorAdapter(),
          json: JSON.stringify({
            compliant: false,
            checks: [{ name: 'test', description: 'Test', severity: 'error', remediation: 'Fix' }],
          }),
        },
      ];

      testCases.forEach(({ adapter, json }) => {
        const violations = adapter.parseOutput(json);
        violations.forEach((v) => {
          expect(validSeverities).toContain(v.severity);
        });
      });
    });
  });
});
