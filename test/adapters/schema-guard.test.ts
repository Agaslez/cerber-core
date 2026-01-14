/**
 * Output Schema Guard Test
 * 
 * Verifies adapter outputs conform to schema
 * Handles adapter throws, missing fields, invalid types
 */

import { ActionlintAdapter } from '../../src/adapters/actionlint/ActionlintAdapter';
import { GitleaksAdapter } from '../../src/adapters/gitleaks/GitleaksAdapter';
import { ZizmorAdapter } from '../../src/adapters/zizmor/ZizmorAdapter';

describe('@fast Output Schema Guard (Adapter Throws)', () => {
  describe('ActionlintAdapter schema validation', () => {
    it('should return array even if input is invalid', () => {
      const adapter = new ActionlintAdapter();
      const result = adapter.parseOutput('not json');
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should not throw on null/undefined input', () => {
      const adapter = new ActionlintAdapter();
      
      expect(() => {
        adapter.parseOutput(null as any);
      }).not.toThrow();
      
      expect(() => {
        adapter.parseOutput(undefined as any);
      }).not.toThrow();
    });

    it('should have no stack trace in normal output', () => {
      const adapter = new ActionlintAdapter();
      
      try {
        adapter.parseOutput('invalid {');
      } catch (e) {
        // If it throws, error should be clean
        expect((e as Error).message).not.toMatch(/at \S+:\d+:\d+/);
      }
    });

    it('should return valid Violation[] shape', () => {
      const adapter = new ActionlintAdapter();
      const result = adapter.parseOutput(JSON.stringify({
        'test.yml': [
          {
            Line: 1,
            Column: 1,
            Level: 'error',
            Message: 'Test',
            Rule: { Name: 'test' }
          }
        ]
      }));

      result.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(v).toHaveProperty('source');
        expect(typeof v.id).toBe('string');
        expect(typeof v.severity).toBe('string');
        expect(typeof v.message).toBe('string');
      });
    });

    it('should handle violations with missing optional fields', () => {
      const adapter = new ActionlintAdapter();
      const result = adapter.parseOutput(JSON.stringify({
        'test.yml': [
          {
            Line: 1,
            Column: 1,
            Level: 'error',
            Message: 'Test'
            // Missing Rule
          }
        ]
      }));

      // Should still return array
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('GitleaksAdapter schema validation', () => {
    it('should return array for empty leaks', () => {
      const adapter = new GitleaksAdapter();
      const result = adapter.parseOutput(JSON.stringify({ Leaks: [] }));

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle null Leaks field', () => {
      const adapter = new GitleaksAdapter();
      const result = adapter.parseOutput(JSON.stringify({ Leaks: null }));

      expect(Array.isArray(result)).toBe(true);
    });

    it('should not throw on missing properties', () => {
      const adapter = new GitleaksAdapter();

      expect(() => {
        adapter.parseOutput(JSON.stringify({
          Leaks: [
            {
              File: 'test.txt'
              // Missing Line, Secret, Match
            }
          ]
        }));
      }).not.toThrow();
    });

    it('should return valid schema', () => {
      const adapter = new GitleaksAdapter();
      const result = adapter.parseOutput(JSON.stringify({
        Leaks: [
          {
            File: 'config.env',
            Line: 1,
            Secret: 'key=xyz',
            Match: 'key'
          }
        ]
      }));

      result.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(v.source).toBe('gitleaks');
      });
    });
  });

  describe('ZizmorAdapter schema validation', () => {
    it('should return array for empty checks', () => {
      const adapter = new ZizmorAdapter();
      const result = adapter.parseOutput(JSON.stringify({
        compliant: true,
        checks: []
      }));

      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle missing compliant field', () => {
      const adapter = new ZizmorAdapter();
      const result = adapter.parseOutput(JSON.stringify({
        checks: []
      }));

      expect(Array.isArray(result)).toBe(true);
    });

    it('should not throw on invalid severity', () => {
      const adapter = new ZizmorAdapter();

      expect(() => {
        adapter.parseOutput(JSON.stringify({
          compliant: false,
          checks: [
            {
              name: 'test',
              severity: 'invalid-severity'
            }
          ]
        }));
      }).not.toThrow();
    });

    it('should return valid schema', () => {
      const adapter = new ZizmorAdapter();
      const result = adapter.parseOutput(JSON.stringify({
        compliant: false,
        checks: [
          {
            name: 'SLSA-L3',
            severity: 'error'
          }
        ]
      }));

      result.forEach((v) => {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(v.source).toBe('zizmor');
      });
    });
  });

  describe('Error classification', () => {
    it('should classify parse error as adapter-level not fatal', () => {
      const adapter = new ActionlintAdapter();

      // Should not throw
      const result = adapter.parseOutput('not json at all');

      // Should return empty array, not throw
      expect(Array.isArray(result)).toBe(true);
    });

    it('should not leak stack trace to normal output', () => {
      const adapter = new GitleaksAdapter();
      const result = adapter.parseOutput('{ incomplete json');

      // Even if there's an error, output should be safe
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
