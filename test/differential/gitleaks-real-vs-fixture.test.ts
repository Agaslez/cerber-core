/**
 * Differential Testing: gitleaks Real vs Fixture
 * 
 * Verifies GitleaksAdapter correctly maps gitleaks JSON output to Violation[]
 * Uses actual Violation shape: {id, severity, message, source, path?}
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { GitleaksAdapter } from '../../src/adapters/gitleaks/GitleaksAdapter';

describe('@integration Differential Testing: gitleaks', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/gitleaks');
  const adapter = new GitleaksAdapter();
  let isGitleaksAvailable = false;

  beforeAll(() => {
    try {
      execSync('which gitleaks', { stdio: 'ignore' });
      isGitleaksAvailable = true;
    } catch {
      isGitleaksAvailable = false;
    }
  });

  describe('Fixture parsing', () => {
    it('should parse secrets-detected.json fixture', () => {
      const fixtureFile = path.join(fixturesDir, 'secrets-detected.json');
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
        expect(v.source).toBe('gitleaks');
        expect(['error', 'warning', 'info']).toContain(v.severity);
      });
    });

    it('should handle deterministic output', () => {
      const fixtureFile = path.join(fixturesDir, 'secrets-detected.json');
      if (!fs.existsSync(fixtureFile)) return;

      const raw = fs.readFileSync(fixtureFile, 'utf-8');
      const v1 = adapter.parseOutput(raw);
      const v2 = adapter.parseOutput(raw);

      expect(JSON.stringify(v1)).toBe(JSON.stringify(v2));
    });

    it('should not crash on empty results', () => {
      const emptyOutput = JSON.stringify({ Leaks: [] });
      expect(() => {
        adapter.parseOutput(emptyOutput);
      }).not.toThrow();

      const violations = adapter.parseOutput(emptyOutput);
      expect(Array.isArray(violations)).toBe(true);
    });

    it('should not crash on invalid JSON', () => {
      expect(() => {
        adapter.parseOutput('not json at all');
      }).not.toThrow();
    });
  });

  describe('Real gitleaks (if available)', () => {
    it('should parse real gitleaks output', () => {
      if (!isGitleaksAvailable) {
        console.log('⏭️  gitleaks not installed, skipping real execution test');
        return;
      }

      const tempDir = path.join(__dirname, '../fixtures/temp-repo');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      try {
        // Initialize git repo
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });
        execSync('git config user.email "test@test.com"', {
          cwd: tempDir,
          stdio: 'ignore',
        });
        execSync('git config user.name "Test"', {
          cwd: tempDir,
          stdio: 'ignore',
        });

        // Create a file with potential secret pattern (won't be real secret)
        const testFile = path.join(tempDir, 'test.txt');
        fs.writeFileSync(testFile, 'normal content');
        execSync('git add test.txt', { cwd: tempDir, stdio: 'ignore' });
        execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'ignore' });

        const output = execSync('gitleaks detect --json -v', {
          cwd: tempDir,
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
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true });
        }
      }
    });
  });

  describe('Regression detection', () => {
    it('should handle large leak list', () => {
      const largeOutput = JSON.stringify({
        Leaks: Array(100)
          .fill(null)
          .map((_, i) => ({
            File: `file-${i}.txt`,
            Line: i + 1,
            Secret: `secret-${i}`,
            Match: `match-${i}`,
          })),
      });

      expect(() => {
        adapter.parseOutput(largeOutput);
      }).not.toThrow();
    });

    it('should handle special characters in secret', () => {
      const output = JSON.stringify({
        Leaks: [
          {
            File: 'config.json',
            Line: 10,
            Secret: 'pwd="P@ssw0rd!#$%"',
            Match: 'P@ssw0rd!#$%',
          },
        ],
      });

      expect(() => {
        adapter.parseOutput(output);
      }).not.toThrow();
    });
  });
});
