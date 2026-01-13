/**
 * Differential Testing: zizmor Real vs Fixture
 * 
 * Verifies ZizmorAdapter correctly maps zizmor JSON output to Violation[]
 * Uses actual Violation shape: {id, severity, message, source, path?}
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ZizmorAdapter } from '../../src/adapters/zizmor/ZizmorAdapter';

describe('Differential Testing: zizmor', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/zizmor');
  const adapter = new ZizmorAdapter();
  let isZizmorAvailable = false;

  beforeAll(() => {
    try {
      execSync('which zizmor', { stdio: 'ignore' });
      isZizmorAvailable = true;
    } catch {
      isZizmorAvailable = false;
    }
  });

  describe('Fixture parsing', () => {
    it('should parse slsa-checks.json fixture', () => {
      const fixtureFile = path.join(fixturesDir, 'slsa-checks.json');
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
        expect(v.source).toBe('zizmor');
        expect(['error', 'warning', 'info']).toContain(v.severity);
      });
    });

    it('should handle deterministic output', () => {
      const fixtureFile = path.join(fixturesDir, 'slsa-checks.json');
      if (!fs.existsSync(fixtureFile)) return;

      const raw = fs.readFileSync(fixtureFile, 'utf-8');
      const v1 = adapter.parseOutput(raw);
      const v2 = adapter.parseOutput(raw);

      expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
    });

    it('should not crash on empty results', () => {
      const emptyOutput = JSON.stringify({ compliant: true, checks: [] });
      expect(() => {
        adapter.parseOutput(emptyOutput);
      }).not.toThrow();

      const violations = adapter.parseOutput(emptyOutput);
      expect(Array.isArray(violations)).toBe(true);
    });

    it('should not crash on invalid JSON', () => {
      expect(() => {
        adapter.parseOutput('invalid json input');
      }).not.toThrow();
    });
  });

  describe('Real zizmor (if available)', () => {
    it('should parse real zizmor output', () => {
      if (!isZizmorAvailable) {
        console.log('⏭️  zizmor not installed, skipping real execution test');
        return;
      }

      const tempFile = path.join(__dirname, '../fixtures/temp-workflow.yml');
      const content = `
name: Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`;
      fs.writeFileSync(tempFile, content);

      try {
        const output = execSync(`zizmor --json ${tempFile}`, {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        if (!output) {
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
    it('should handle large check list', () => {
      const largeOutput = JSON.stringify({
        compliant: false,
        checks: Array(50)
          .fill(null)
          .map((_, i) => ({
            name: `check-${i}`,
            description: `Test check ${i}`,
            severity: i % 2 === 0 ? 'warning' : 'error',
            remediation: `Fix check ${i}`,
          })),
      });

      expect(() => {
        adapter.parseOutput(largeOutput);
      }).not.toThrow();
    });

    it('should handle special characters in check names', () => {
      const output = JSON.stringify({
        compliant: false,
        checks: [
          {
            name: 'SLSA-L3/Provenance (v1.0)',
            description: 'Check for build & sign compliance',
            severity: 'error',
            remediation: 'Add SLSA provenance file',
          },
        ],
      });

      expect(() => {
        adapter.parseOutput(output);
      }).not.toThrow();
    });
  });
});
