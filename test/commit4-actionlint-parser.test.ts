/**
 * @file Actionlint Parser Tests - COMMIT 4
 * @description Tests for actionlint output parsing (NDJSON, JSON array, text)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { ActionlintAdapter } from '../src/adapters/ActionlintAdapter.js';

describe('COMMIT 4: Actionlint Parser', () => {
  let adapter: ActionlintAdapter;

  beforeEach(() => {
    adapter = new ActionlintAdapter();
  });

  describe('Format Detection', () => {
    it('should detect NDJSON format (starts with {)', () => {
      const output = '{"message":"test","filepath":"test.yml","line":1,"column":1,"kind":"test"}';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].source).toBe('actionlint');
    });

    it('should detect JSON array format (starts with [)', () => {
      const output = '[{"message":"test","filepath":"test.yml","line":1,"column":1,"kind":"test"}]';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].source).toBe('actionlint');
    });

    it('should detect text format (neither { nor [)', () => {
      const output = 'test.yml:1:1: test message [test]';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].source).toBe('actionlint');
    });

    it('should handle empty output', () => {
      const violations = adapter.parse('');
      
      expect(violations).toHaveLength(0);
    });

    it('should handle whitespace-only output', () => {
      const violations = adapter.parse('   \n\n  ');
      
      expect(violations).toHaveLength(0);
    });
  });

  describe('NDJSON Format Parsing', () => {
    let fixtureOutput: string;

    beforeAll(() => {
      const fixturePath = join(process.cwd(), 'test', 'fixtures', 'actionlint-ndjson.txt');
      fixtureOutput = readFileSync(fixturePath, 'utf-8');
    });

    it('should parse NDJSON fixture correctly', () => {
      const violations = adapter.parse(fixtureOutput);
      
      expect(violations).toHaveLength(3);
    });

    it('should extract correct violation data from NDJSON', () => {
      const violations = adapter.parse(fixtureOutput);
      
      const first = violations[0];
      expect(first.id).toBe('actionlint/expression');
      expect(first.severity).toBe('error');
      expect(first.message).toContain('undefined step output');
      expect(first.source).toBe('actionlint');
      expect(first.path).toBe('.github/workflows/ci.yml');
      expect(first.line).toBe(42);
      expect(first.column).toBe(28);
    });

    it('should handle multiple NDJSON lines', () => {
      const violations = adapter.parse(fixtureOutput);
      
      expect(violations[0].id).toBe('actionlint/expression');
      expect(violations[1].id).toBe('actionlint/syntax-check');
      expect(violations[2].id).toBe('actionlint/runner-label');
    });

    it('should normalize Windows paths in NDJSON', () => {
      const output = '{"message":"test","filepath":".github\\\\workflows\\\\ci.yml","line":1,"column":1,"kind":"test"}';
      const violations = adapter.parse(output);
      
      expect(violations[0].path).toBe('.github/workflows/ci.yml');
    });

    it('should skip invalid NDJSON lines', () => {
      const output = `
{"message":"valid","filepath":"test.yml","line":1,"column":1,"kind":"test"}
invalid json line
{"message":"also valid","filepath":"test.yml","line":2,"column":1,"kind":"test"}
      `.trim();
      
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(2);
      expect(violations[0].line).toBe(1);
      expect(violations[1].line).toBe(2);
    });
  });

  describe('JSON Array Format Parsing', () => {
    let fixtureOutput: string;

    beforeAll(() => {
      const fixturePath = join(process.cwd(), 'test', 'fixtures', 'actionlint-json-array.txt');
      fixtureOutput = readFileSync(fixturePath, 'utf-8');
    });

    it('should parse JSON array fixture correctly', () => {
      const violations = adapter.parse(fixtureOutput);
      
      expect(violations).toHaveLength(3);
    });

    it('should extract correct violation data from JSON array', () => {
      const violations = adapter.parse(fixtureOutput);
      
      const first = violations[0];
      expect(first.id).toBe('actionlint/expression');
      expect(first.severity).toBe('error');
      expect(first.message).toContain('undefined step output');
      expect(first.source).toBe('actionlint');
      expect(first.path).toBe('.github/workflows/ci.yml');
      expect(first.line).toBe(42);
      expect(first.column).toBe(28);
    });

    it('should handle empty JSON array', () => {
      const violations = adapter.parse('[]');
      
      expect(violations).toHaveLength(0);
    });

    it('should handle invalid JSON array', () => {
      const violations = adapter.parse('[invalid json');
      
      expect(violations).toHaveLength(0);
    });

    it('should handle non-array JSON', () => {
      const violations = adapter.parse('{"not":"an array"}');
      
      // Should fall back to NDJSON parser, which will skip this invalid line
      expect(violations).toHaveLength(0);
    });
  });

  describe('Text Format Parsing', () => {
    let fixtureOutput: string;

    beforeAll(() => {
      const fixturePath = join(process.cwd(), 'test', 'fixtures', 'actionlint-text.txt');
      fixtureOutput = readFileSync(fixturePath, 'utf-8');
    });

    it('should parse text fixture correctly', () => {
      const violations = adapter.parse(fixtureOutput);
      
      expect(violations).toHaveLength(3);
    });

    it('should extract correct violation data from text', () => {
      const violations = adapter.parse(fixtureOutput);
      
      const first = violations[0];
      expect(first.id).toBe('actionlint/expression');
      expect(first.severity).toBe('error');
      expect(first.message).toContain('undefined step output');
      expect(first.source).toBe('actionlint');
      expect(first.path).toBe('.github/workflows/ci.yml');
      expect(first.line).toBe(42);
      expect(first.column).toBe(28);
    });

    it('should handle text without kind tag', () => {
      const output = '.github/workflows/ci.yml:10:5: error message without kind';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].id).toBe('actionlint/unknown');
      expect(violations[0].message).toBe('error message without kind');
    });

    it('should skip invalid text lines', () => {
      const output = `
.github/workflows/ci.yml:10:5: valid error [test]
this is not a valid line
.github/workflows/ci.yml:20:3: another valid error [test]
      `.trim();
      
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(2);
      expect(violations[0].line).toBe(10);
      expect(violations[1].line).toBe(20);
    });

    it('should normalize Windows paths in text', () => {
      const output = '.github\\workflows\\ci.yml:10:5: error message [test]';
      const violations = adapter.parse(output);
      
      expect(violations[0].path).toBe('.github/workflows/ci.yml');
    });
  });

  describe('Cross-Format Consistency', () => {
    it('should produce same violations from all 3 formats', () => {
      const ndjsonPath = join(process.cwd(), 'test', 'fixtures', 'actionlint-ndjson.txt');
      const jsonArrayPath = join(process.cwd(), 'test', 'fixtures', 'actionlint-json-array.txt');
      const textPath = join(process.cwd(), 'test', 'fixtures', 'actionlint-text.txt');

      const ndjson = readFileSync(ndjsonPath, 'utf-8');
      const jsonArray = readFileSync(jsonArrayPath, 'utf-8');
      const text = readFileSync(textPath, 'utf-8');

      const violationsNDJSON = adapter.parse(ndjson);
      const violationsJSONArray = adapter.parse(jsonArray);
      const violationsText = adapter.parse(text);

      expect(violationsNDJSON).toHaveLength(3);
      expect(violationsJSONArray).toHaveLength(3);
      expect(violationsText).toHaveLength(3);

      // Compare structure (all should have same data)
      for (let i = 0; i < 3; i++) {
        expect(violationsNDJSON[i].id).toBe(violationsJSONArray[i].id);
        expect(violationsNDJSON[i].id).toBe(violationsText[i].id);
        
        expect(violationsNDJSON[i].message).toContain(violationsJSONArray[i].message.split('[')[0].trim());
        expect(violationsText[i].message).toContain(violationsJSONArray[i].message.split('[')[0].trim());
        
        expect(violationsNDJSON[i].line).toBe(violationsJSONArray[i].line);
        expect(violationsNDJSON[i].line).toBe(violationsText[i].line);
        
        expect(violationsNDJSON[i].column).toBe(violationsJSONArray[i].column);
        expect(violationsNDJSON[i].column).toBe(violationsText[i].column);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'a'.repeat(1000);
      const output = `{"message":"${longMessage}","filepath":"test.yml","line":1,"column":1,"kind":"test"}`;
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toHaveLength(1000);
    });

    it('should handle special characters in messages', () => {
      const output = '{"message":"error with \\"quotes\\" and \\nnewlines","filepath":"test.yml","line":1,"column":1,"kind":"test"}';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].message).toContain('quotes');
    });

    it('should handle missing optional fields', () => {
      const output = '{"message":"test","filepath":"test.yml","line":1,"column":1,"kind":"test"}';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].hint).toBeUndefined();
    });

    it('should handle snippet field', () => {
      const output = '{"message":"test","filepath":"test.yml","line":1,"column":1,"kind":"test","snippet":"code snippet"}';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].hint).toBe('code snippet');
    });
  });

  describe('Violation Structure', () => {
    it('should produce valid Violation objects', () => {
      const output = '{"message":"test message","filepath":"test.yml","line":10,"column":5,"kind":"expression"}';
      const violations = adapter.parse(output);
      
      expect(violations).toHaveLength(1);
      
      const violation = violations[0];
      expect(violation).toHaveProperty('id');
      expect(violation).toHaveProperty('severity');
      expect(violation).toHaveProperty('message');
      expect(violation).toHaveProperty('source');
      expect(violation).toHaveProperty('path');
      expect(violation).toHaveProperty('line');
      expect(violation).toHaveProperty('column');
      
      expect(violation.id).toBe('actionlint/expression');
      expect(violation.severity).toBe('error');
      expect(violation.message).toBe('test message');
      expect(violation.source).toBe('actionlint');
      expect(violation.path).toBe('test.yml');
      expect(violation.line).toBe(10);
      expect(violation.column).toBe(5);
    });
  });
});
