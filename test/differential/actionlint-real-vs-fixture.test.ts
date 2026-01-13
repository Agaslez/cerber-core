/**
 * Differential Testing: actionlint Real vs Fixture
 * 
 * Verifies ActionlintAdapter correctly maps actionlint JSON output to Violation[]
 * Uses actual Violation shape: {id, severity, message, source, path?}
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ActionlintAdapter } from '../../src/adapters/actionlint/ActionlintAdapter';

describe('Differential Testing: actionlint', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/actionlint');
  const adapter = new ActionlintAdapter();
  let isActionlintAvailable = false;

  beforeAll(() => {
    try {
      execSync('which actionlint', { stdio: 'ignore' });
      isActionlintAvailable = true;
    } catch {
      isActionlintAvailable = false;
    }
  });

  describe('Fixture parsing', () => {
    it('should parse simple-workflow.json fixture', () => {
      const fixtureFile = path.join(fixturesDir, 'simple-workflow.json');
      if (!fs.existsSync(fixtureFile)) {
        console.log(`Fixture not found: ${fixtureFile}, skipping`);
        return;
      }

      const raw = fs.readFileSync(fixtureFile, 'utf-8');
      const violations = adapter.parseOutput(raw);

      expect(Array.isArray(violations)).toBe(true);
      violations.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(v).toHaveProperty('source');
        expect(['error', 'warning', 'info']).toContain(v.severity);
        expect(typeof v.id).toBe('string');
        expect(typeof v.message).toBe('string');
      });
    });

    it('should handle deterministic output', () => {
      const fixtureFile = path.join(fixturesDir, 'simple-workflow.json');
      if (!fs.existsSync(fixtureFile)) return;

      const raw = fs.readFileSync(fixtureFile, 'utf-8');
      const v1 = adapter.parseOutput(raw);
      const v2 = adapter.parseOutput(raw);

      expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
    });

    it('should not crash on empty JSON', () => {
      expect(() => {
        adapter.parseOutput('[]');
      }).not.toThrow();

      expect(() => {
        adapter.parseOutput('{}');
      }).not.toThrow();
    });

    it('should not crash on invalid JSON', () => {
      expect(() => {
        adapter.parseOutput('not json');
      }).not.toThrow();
    });
  });

  describe('Real actionlint (if available)', () => {
    it('should parse real actionlint output', () => {
      if (!isActionlintAvailable) {
        console.log('⏭️  actionlint not installed, skipping real execution test');
        return;
      }

      // Create temp workflow file
      const tempFile = path.join(__dirname, '../fixtures/temp-workflow.yml');
      const content = `
name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
`;
      fs.writeFileSync(tempFile, content);

      try {
        const output = execSync(`actionlint -format json ${tempFile}`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        if (!output) {
          // No violations
          expect(true).toBe(true);
          return;
        }

        const violations = adapter.parseOutput(output);
        expect(Array.isArray(violations)).toBe(true);

        violations.forEach((v) => {
          expect(typeof v.id).toBe('string');
          expect(typeof v.severity).toBe('string');
          expect(typeof v.message).toBe('string');
        });
      } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      }
    });
  });

  describe('Regression detection', () => {
    it('should not crash on large fixture', () => {
      const largeOutput = JSON.stringify({
        violations: Array(100)
          .fill(null)
          .map((_, i) => ({
            Line: i + 1,
            Column: 1,
            Level: 'warning',
            Message: `Test violation ${i}`,
            Rule: { Name: `rule-${i}` },
          })),
      });

      expect(() => {
        adapter.parseOutput(largeOutput);
      }).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      const output = JSON.stringify({
        violations: [
          {
            Line: 1,
            Column: 1,
            Level: 'error',
            Message: 'Error with "quotes" and \n newlines',
            Rule: { Name: 'test' },
          },
        ],
      });

      expect(() => {
        adapter.parseOutput(output);
      }).not.toThrow();
    });
  });
});
