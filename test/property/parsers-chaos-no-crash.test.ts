/**
 * Property-Based Chaos Testing: No-Crash Invariant
 * 
 * Generates random/malformed input and verifies parsers NEVER crash
 * Goal: Defensive programming - handle any input gracefully
 * 
 * Generators: random strings, unicode, control chars, huge payloads
 * Assertions: No exceptions thrown, always returns array
 */

import { ActionlintAdapter } from '../../src/adapters/actionlint/ActionlintAdapter';
import { GitleaksAdapter } from '../../src/adapters/gitleaks/GitleaksAdapter';
import { ZizmorAdapter } from '../../src/adapters/zizmor/ZizmorAdapter';

// Simple random generators
function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function randomUnicode(length: number): string {
  const ranges = [
    [0x20, 0x7e], // ASCII
    [0xa0, 0xff], // Latin Extended
    [0x4e00, 0x9fff], // Chinese
    [0x0600, 0x06ff], // Arabic
    [0x0400, 0x04ff], // Cyrillic
  ];
  let result = '';
  for (let i = 0; i < length; i++) {
    const range = ranges[Math.floor(Math.random() * ranges.length)];
    const code = range[0] + Math.floor(Math.random() * (range[1] - range[0]));
    result += String.fromCharCode(code);
  }
  return result;
}

describe('@integration Property-Based Chaos Testing: No-Crash', () => {
  const iterations = process.env.CHAOS_ITERATIONS ? parseInt(process.env.CHAOS_ITERATIONS) : 50;

  describe('ActionlintAdapter - chaos no-crash', () => {
    it('should never crash on random string', () => {
      const adapter = new ActionlintAdapter();
      for (let i = 0; i < iterations; i++) {
        expect(() => {
          const input = randomString(Math.floor(Math.random() * 500));
          adapter.parseOutput(input);
        }).not.toThrow();
      }
    });

    it('should never crash on random unicode', () => {
      const adapter = new ActionlintAdapter();
      for (let i = 0; i < iterations; i++) {
        expect(() => {
          const input = randomUnicode(Math.floor(Math.random() * 200));
          adapter.parseOutput(input);
        }).not.toThrow();
      }
    });

    it('should never crash on control characters', () => {
      const adapter = new ActionlintAdapter();
      const ctrlChars = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\n\x0b\x0c\r\x1b\x7f';
      for (let i = 0; i < 20; i++) {
        expect(() => {
          let input = '';
          for (let j = 0; j < 50; j++) {
            input += ctrlChars.charAt(Math.floor(Math.random() * ctrlChars.length));
          }
          adapter.parseOutput(input);
        }).not.toThrow();
      }
    });

    it('should never crash on deeply nested JSON', () => {
      const adapter = new ActionlintAdapter();
      let nested: any = { value: 'bottom' };
      for (let i = 0; i < 50; i++) {
        nested = { level: i, child: nested };
      }
      expect(() => {
        adapter.parseOutput(JSON.stringify(nested));
      }).not.toThrow();
    });

    it('should return array-like result for all inputs', () => {
      const adapter = new ActionlintAdapter();
      const inputs = [
        'completely invalid',
        '{}',
        '[]',
        'null',
        'undefined',
        randomString(100),
        '\x00\x01\x02',
      ];

      inputs.forEach((input) => {
        const result = adapter.parseOutput(input);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('GitleaksAdapter - chaos no-crash', () => {
    it('should never crash on random string', () => {
      const adapter = new GitleaksAdapter();
      for (let i = 0; i < iterations; i++) {
        expect(() => {
          const input = randomString(Math.floor(Math.random() * 500));
          adapter.parseOutput(input);
        }).not.toThrow();
      }
    });

    it('should never crash on huge payloads', () => {
      const adapter = new GitleaksAdapter();
      const hugeInput = JSON.stringify({
        Leaks: Array(1000)
          .fill(null)
          .map(() => ({
            File: randomString(50),
            Line: Math.floor(Math.random() * 10000),
            Secret: randomString(100),
            Match: randomString(50),
          })),
      });

      expect(() => {
        adapter.parseOutput(hugeInput);
      }).not.toThrow();

      const result = adapter.parseOutput(hugeInput);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should never crash on mixed valid/invalid JSON', () => {
      const adapter = new GitleaksAdapter();
      const inputs = [
        '{"Leaks": [',
        '{"Leaks": [{}]}',
        '{"Leaks": "not-array"}',
        'trailing garbage } }',
      ];

      inputs.forEach((input) => {
        expect(() => {
          adapter.parseOutput(input);
        }).not.toThrow();
      });
    });

    it('should always return array', () => {
      const adapter = new GitleaksAdapter();
      const inputs = [
        '',
        '   ',
        'null',
        '{"Leaks":[]}',
        '{"Leaks":null}',
      ];

      inputs.forEach((input) => {
        const result = adapter.parseOutput(input);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('ZizmorAdapter - chaos no-crash', () => {
    it('should never crash on random string', () => {
      const adapter = new ZizmorAdapter();
      for (let i = 0; i < iterations; i++) {
        expect(() => {
          const input = randomString(Math.floor(Math.random() * 500));
          adapter.parseOutput(input);
        }).not.toThrow();
      }
    });

    it('should never crash on malformed arrays', () => {
      const adapter = new ZizmorAdapter();
      const inputs = [
        '{"checks": [',
        '{"checks": {}}',
        '{"checks": "string"}',
        '[1,2,3]',
        'null',
      ];

      inputs.forEach((input) => {
        expect(() => {
          adapter.parseOutput(input);
        }).not.toThrow();
      });
    });

    it('should never crash on missing properties', () => {
      const adapter = new ZizmorAdapter();
      const inputs = [
        '{}',
        '{"compliant": true}',
        '{"checks": []}',
        '{"checks": [{}]}',
      ];

      inputs.forEach((input) => {
        expect(() => {
          adapter.parseOutput(input);
        }).not.toThrow();
      });
    });

    it('should always return array', () => {
      const adapter = new ZizmorAdapter();
      const inputs = [
        '',
        'garbage',
        '{"compliant": true, "checks": []}',
        '[{"name": "test"}]',
      ];

      inputs.forEach((input) => {
        const result = adapter.parseOutput(input);
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Cross-adapter chaos properties', () => {
    it('all adapters should handle empty input gracefully', () => {
      const adapters = [
        new ActionlintAdapter(),
        new GitleaksAdapter(),
        new ZizmorAdapter(),
      ];

      adapters.forEach((adapter) => {
        const result = adapter.parseOutput('');
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('all adapters should handle random unicode gracefully', () => {
      const adapters = [
        new ActionlintAdapter(),
        new GitleaksAdapter(),
        new ZizmorAdapter(),
      ];

      for (let i = 0; i < 30; i++) {
        const input = randomUnicode(100);
        adapters.forEach((adapter) => {
          expect(() => {
            const result = adapter.parseOutput(input);
            expect(Array.isArray(result)).toBe(true);
          }).not.toThrow();
        });
      }
    });

    it('all adapters should handle 10KB+ payloads', () => {
      const adapters = [
        new ActionlintAdapter(),
        new GitleaksAdapter(),
        new ZizmorAdapter(),
      ];

      const largePayload = JSON.stringify({
        data: randomString(10000),
      });

      adapters.forEach((adapter) => {
        expect(() => {
          const result = adapter.parseOutput(largePayload);
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      });
    });
  });
});
