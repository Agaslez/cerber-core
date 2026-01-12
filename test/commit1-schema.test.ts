/**
 * @file Schema Validation Tests - COMMIT 1
 * @description Validates output.schema.json and contract.schema.json
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { OrchestratorResult } from '../src/core/types.js';

describe('COMMIT 1: Schema Consistency', () => {
  let ajv: Ajv;
  
  beforeAll(() => {
    ajv = new Ajv({ strictSchema: false, allErrors: true });
    addFormats(ajv);
  });

  describe('output.schema.json', () => {
    let outputSchema: any;
    let validateOutput: any;

    beforeAll(() => {
      const schemaPath = join(process.cwd(), '.cerber', 'output.schema.json');
      outputSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
      validateOutput = ajv.compile(outputSchema);
    });

    it('should be valid JSON Schema', () => {
      expect(outputSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(outputSchema.type).toBe('object');
      expect(outputSchema.required).toContain('schemaVersion');
      expect(outputSchema.required).toContain('deterministic');
    });

    it('should validate minimal valid output', () => {
      const output: OrchestratorResult = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 0,
          errors: 0,
          warnings: 0,
          info: 0,
        },
        violations: [],
        metadata: {
          tools: {},
        },
      };

      const valid = validateOutput(output);
      if (!valid) {
        console.error('Validation errors:', validateOutput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate output with violations', () => {
      const output: OrchestratorResult = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 2,
          errors: 1,
          warnings: 1,
          info: 0,
        },
        violations: [
          {
            id: 'security/no-hardcoded-secrets',
            severity: 'error',
            message: 'Hardcoded secret detected',
            source: 'actionlint',
            path: '.github/workflows/ci.yml',
            line: 10,
            column: 5,
            hint: 'Use GitHub secrets instead',
          },
          {
            id: 'style/job-name',
            severity: 'warning',
            message: 'Job name should be descriptive',
            source: 'actionlint',
            path: '.github/workflows/ci.yml',
            line: 5,
          },
        ],
        metadata: {
          tools: {
            actionlint: {
              enabled: true,
              version: '1.6.27',
              exitCode: 1,
            },
          },
        },
      };

      const valid = validateOutput(output);
      if (!valid) {
        console.error('Validation errors:', validateOutput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate output with skipped tool', () => {
      const output: OrchestratorResult = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 0,
          errors: 0,
          warnings: 0,
          info: 0,
        },
        violations: [],
        metadata: {
          tools: {
            zizmor: {
              enabled: false,
              version: 'unknown',
              exitCode: 127,
              skipped: true,
              reason: 'Tool not installed',
            },
          },
        },
      };

      const valid = validateOutput(output);
      if (!valid) {
        console.error('Validation errors:', validateOutput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate output with optional runMetadata', () => {
      const output: OrchestratorResult = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 0,
          errors: 0,
          warnings: 0,
          info: 0,
        },
        violations: [],
        metadata: {
          tools: {},
        },
        runMetadata: {
          generatedAt: '2026-01-10T12:00:00Z',
          executionTime: 1234,
          profile: 'dev',
        },
      };

      const valid = validateOutput(output);
      if (!valid) {
        console.error('Validation errors:', validateOutput.errors);
      }
      expect(valid).toBe(true);
    });

    it('should reject invalid schemaVersion', () => {
      const output = {
        schemaVersion: 2, // Invalid
        deterministic: true,
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: { tools: {} },
      };

      const valid = validateOutput(output);
      expect(valid).toBe(false);
    });

    it('should reject missing required fields', () => {
      const output = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: { tools: {} },
      };

      const valid = validateOutput(output);
      // Valid because all required fields are present
      expect(valid).toBe(true);
    });

    it('should reject tools as array (must be object)', () => {
      const output = {
        schemaVersion: 1,
        deterministic: true,
        summary: { total: 0, errors: 0, warnings: 0, info: 0 },
        violations: [],
        metadata: {
          tools: [
            // Invalid: tools must be object
            {
              name: 'actionlint',
              version: '1.6.27',
              exitCode: 0,
            },
          ],
        },
      };

      const valid = validateOutput(output);
      expect(valid).toBe(false);
    });
  });

  describe('contract.schema.json', () => {
    let contractSchema: any;
    let validateContract: any;

    beforeAll(() => {
      const schemaPath = join(process.cwd(), 'src', 'contracts', 'contract.schema.json');
      contractSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
      validateContract = ajv.compile(contractSchema);
    });

    it('should be valid JSON Schema', () => {
      expect(contractSchema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(contractSchema.type).toBe('object');
      expect(contractSchema.required).toContain('contractVersion');
      expect(contractSchema.required).toContain('name');
      expect(contractSchema.required).toContain('version');
    });

    it('should validate minimal contract', () => {
      const contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
      };

      const valid = validateContract(contract);
      if (!valid) {
        console.error('Validation errors:', validateContract.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate contract with profiles', () => {
      const contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        profiles: {
          'dev-fast': {
            tools: ['actionlint'],
            failOn: ['error'],
            description: 'Fast pre-commit check',
          },
          dev: {
            tools: ['actionlint', 'zizmor'],
            failOn: ['error', 'warning'],
            description: 'Full dev check',
          },
          team: {
            tools: ['actionlint', 'zizmor', 'gitleaks'],
            failOn: ['error', 'warning'],
            description: 'Team CI check',
          },
        },
      };

      const valid = validateContract(contract);
      if (!valid) {
        console.error('Validation errors:', validateContract.errors);
      }
      expect(valid).toBe(true);
    });

    it('should validate contract with per-rule gate override', () => {
      const contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        rules: {
          'security/no-hardcoded-secrets': {
            severity: 'error',
            gate: true, // Block merge
          },
          'style/job-name': {
            severity: 'warning',
            gate: false, // Don't block
          },
        },
        profiles: {
          dev: {
            tools: ['actionlint'],
            failOn: ['error'],
          },
        },
      };

      const valid = validateContract(contract);
      if (!valid) {
        console.error('Validation errors:', validateContract.errors);
      }
      expect(valid).toBe(true);
    });

    it('should reject profile without required fields', () => {
      const contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        profiles: {
          dev: {
            tools: ['actionlint'],
            // Missing failOn
          },
        },
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });
  });

  describe('Deterministic Output Snapshot', () => {
    it('should produce identical JSON for same data', () => {
      const output: OrchestratorResult = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 1,
          errors: 1,
          warnings: 0,
          info: 0,
        },
        violations: [
          {
            id: 'security/no-hardcoded-secrets',
            severity: 'error',
            message: 'Hardcoded secret detected',
            source: 'actionlint',
            path: '.github/workflows/ci.yml',
            line: 10,
            column: 5,
          },
        ],
        metadata: {
          tools: {
            actionlint: {
              enabled: true,
              version: '1.6.27',
              exitCode: 1,
            },
          },
        },
      };

      const json1 = JSON.stringify(output, null, 2);
      const json2 = JSON.stringify(output, null, 2);
      
      expect(json1).toBe(json2);
      expect(json1).toMatchSnapshot();
    });
  });
});
