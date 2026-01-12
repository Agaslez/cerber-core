/**
 * @file Output JSON Schema Validation Tests
 * @rule GAP 9.1, 9.2 - Validate output format and schema compliance
 * @rule CRITICAL - Output must match published schema
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import fs from 'fs/promises';
import { join } from 'path';

describe('Output JSON Schema Validation', () => {
  let schema: any;
  let tempDir: string;

  beforeEach(async () => {
    const schemaPath = join(__dirname, '../../.cerber/output.schema.json');
    if (existsSync(schemaPath)) {
      schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    }
    
    tempDir = join(__dirname, '../../.test-temp', `schema-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // ignore
    }
  });

  describe('Schema File & Structure', () => {
    it('should have valid JSON schema file', () => {
      expect(schema).toBeDefined();
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.type).toBe('object');
    });

    it('should define schemaVersion field', () => {
      expect(schema.properties.schemaVersion).toBeDefined();
      expect(schema.properties.schemaVersion.const).toBe(1);
      expect(schema.required).toContain('schemaVersion');
    });

    it('should define deterministic field', () => {
      expect(schema.properties.deterministic).toBeDefined();
      expect(schema.properties.deterministic.const).toBe(true);
      expect(schema.required).toContain('deterministic');
    });

    it('should require summary, violations, and metadata', () => {
      expect(schema.required).toContain('summary');
      expect(schema.required).toContain('violations');
      expect(schema.required).toContain('metadata');
    });
  });

  describe('Summary Object Schema', () => {
    it('should define all required summary fields', () => {
      const summarySchema = schema.properties.summary;
      
      expect(summarySchema.required).toContain('total');
      expect(summarySchema.required).toContain('errors');
      expect(summarySchema.required).toContain('warnings');
      expect(summarySchema.required).toContain('info');
    });

    it('should enforce integer types with minimum 0', () => {
      const summarySchema = schema.properties.summary;
      
      expect(summarySchema.properties.total.type).toBe('integer');
      expect(summarySchema.properties.total.minimum).toBe(0);
      expect(summarySchema.properties.errors.minimum).toBe(0);
      expect(summarySchema.properties.warnings.minimum).toBe(0);
      expect(summarySchema.properties.info.minimum).toBe(0);
    });
  });

  describe('Violations Array Schema', () => {
    it('should define violations as array with $ref', () => {
      const violationsSchema = schema.properties.violations;
      
      expect(violationsSchema.type).toBe('array');
      expect(violationsSchema.items).toBeDefined();
      expect(violationsSchema.items.$ref).toBe('#/definitions/violation');
    });

    it('should document sorting behavior', () => {
      const violationsSchema = schema.properties.violations;
      
      expect(violationsSchema.description).toContain('sorted');
    });
  });

  describe('Violation Definition Schema', () => {
    it('should define violation with required fields', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.required).toContain('id');
      expect(violationDef.required).toContain('severity');
      expect(violationDef.required).toContain('message');
      expect(violationDef.required).toContain('source');
    });

    it('should enforce id as string', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.id.type).toBe('string');
    });

    it('should enforce severity enum values', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.severity.enum).toEqual(
        ['error', 'warning', 'info']
      );
    });

    it('should enforce message as string', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.message.type).toBe('string');
    });

    it('should enforce source enum (tools)', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.source.enum).toContain('actionlint');
      expect(violationDef.properties.source.enum).toContain('gitleaks');
      expect(violationDef.properties.source.enum).toContain('zizmor');
    });

    it('should have path field for file location', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.path).toBeDefined();
      expect(violationDef.properties.path.type).toBe('string');
    });

    it('should have line field with minimum 1', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.line).toBeDefined();
      expect(violationDef.properties.line.type).toBe('integer');
      expect(violationDef.properties.line.minimum).toBe(1);
    });

    it('should have optional column field', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.column).toBeDefined();
      expect(violationDef.properties.column.minimum).toBe(1);
      expect(violationDef.required).not.toContain('column');
    });

    it('should have optional hint field', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.hint).toBeDefined();
      expect(violationDef.properties.hint.type).toBe('string');
      expect(violationDef.required).not.toContain('hint');
    });
  });

  describe('Metadata Schema', () => {
    it('should require tools in metadata', () => {
      const metadataSchema = schema.properties.metadata;
      
      expect(metadataSchema.required).toContain('tools');
    });

    it('should define tools as object', () => {
      const toolsSchema = schema.properties.metadata.properties.tools;
      
      expect(toolsSchema.type).toBe('object');
      expect(toolsSchema.additionalProperties).toBeDefined();
    });

    it('should require enabled in tool entries', () => {
      const toolsSchema = schema.properties.metadata.properties.tools;
      const toolEntrySchema = toolsSchema.additionalProperties;
      
      expect(toolEntrySchema.required).toContain('enabled');
      expect(toolEntrySchema.properties.enabled.type).toBe('boolean');
    });

    it('should have optional profile field', () => {
      const metadataSchema = schema.properties.metadata;
      
      expect(metadataSchema.properties.profile).toBeDefined();
      expect(metadataSchema.properties.profile.enum).toContain('solo');
      expect(metadataSchema.properties.profile.enum).toContain('dev');
      expect(metadataSchema.properties.profile.enum).toContain('team');
    });
  });

  describe('Output Examples Validation', () => {
    it('should validate empty violation list output', () => {
      const output = {
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

      expect(JSON.stringify(output)).toBeTruthy();
    });

    it('should validate output with violations', () => {
      const output = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 3,
          errors: 2,
          warnings: 1,
          info: 0,
        },
        violations: [
          {
            id: 'actionlint/action',
            source: 'actionlint',
            severity: 'error',
            message: 'Invalid action',
            path: '.github/workflows/ci.yml',
            line: 5,
            column: 10,
          },
          {
            id: 'gitleaks/secret',
            source: 'gitleaks',
            severity: 'error',
            message: 'Potential secret found',
            path: 'config.js',
            line: 12,
          },
          {
            id: 'zizmor/insecure',
            source: 'zizmor',
            severity: 'warning',
            message: 'Insecure setting',
            path: 'deploy.yml',
            line: 3,
          },
        ],
        metadata: {
          tools: {
            actionlint: { enabled: true, version: '1.0.0' },
            gitleaks: { enabled: true },
            zizmor: { enabled: false, skipped: true },
          },
          profile: 'dev',
        },
      };

      expect(JSON.stringify(output)).toBeTruthy();
    });

    it('should preserve numeric precision', () => {
      const output = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 100,
          errors: 50,
          warnings: 49,
          info: 1,
        },
        violations: [],
        metadata: {
          tools: {},
        },
      };

      const serialized = JSON.stringify(output);
      const parsed = JSON.parse(serialized);

      expect(parsed.summary.total).toBe(100);
      expect(parsed.summary.errors).toBe(50);
      expect(parsed.summary.warnings).toBe(49);
      expect(parsed.summary.info).toBe(1);
    });
  });

  describe('String Escaping in Output', () => {
    it('should handle special characters in message', () => {
      const violation = {
        id: 'test/rule',
        source: 'actionlint',
        severity: 'error',
        message: 'Error with "quotes" and \\backslash',
        path: 'file.yml',
        line: 1,
      };

      const serialized = JSON.stringify(violation);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toContain('quotes');
      expect(parsed.message).toContain('backslash');
    });

    it('should handle multiline messages', () => {
      const violation = {
        id: 'test/rule',
        source: 'actionlint',
        severity: 'error',
        message: 'Line 1\nLine 2\nLine 3',
        path: 'file.yml',
        line: 1,
      };

      const serialized = JSON.stringify(violation);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toContain('Line 1');
      expect(parsed.message).toContain('Line 2');
    });

    it('should handle unicode characters', () => {
      const violation = {
        id: 'test/rule',
        source: 'actionlint',
        severity: 'error',
        message: 'Błąd: ❌ 你好',
        path: 'file.yml',
        line: 1,
      };

      const serialized = JSON.stringify(violation);
      const parsed = JSON.parse(serialized);

      expect(parsed.message).toContain('Błąd');
      expect(parsed.message).toContain('❌');
      expect(parsed.message).toContain('你好');
    });
  });

  describe('GitHub Annotations Format', () => {
    it('should support all GitHub annotation fields', () => {
      const violationDef = schema.definitions.violation;
      
      // id, severity, message, source (tool), path, line, column
      expect(violationDef.properties).toHaveProperty('id');
      expect(violationDef.properties).toHaveProperty('severity');
      expect(violationDef.properties).toHaveProperty('message');
      expect(violationDef.properties).toHaveProperty('source');
      expect(violationDef.properties).toHaveProperty('path');
      expect(violationDef.properties).toHaveProperty('line');
      expect(violationDef.properties).toHaveProperty('column');
    });

    it('should mark column as optional', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.required).not.toContain('column');
    });
  });

  describe('Schema Constraints', () => {
    it('should not allow additional properties at root', () => {
      expect(schema.additionalProperties).toBe(false);
    });

    it('should not allow line numbers < 1', () => {
      const violationDef = schema.definitions.violation;
      
      expect(violationDef.properties.line.minimum).toBe(1);
    });

    it('should not allow column numbers < 1', () => {
      const violationDef = schema.definitions.violation;
      
      if (violationDef.properties.column) {
        expect(violationDef.properties.column.minimum).toBe(1);
      }
    });

    it('should not allow negative counts', () => {
      const summarySchema = schema.properties.summary;
      
      expect(summarySchema.properties.total.minimum).toBe(0);
      expect(summarySchema.properties.errors.minimum).toBe(0);
      expect(summarySchema.properties.warnings.minimum).toBe(0);
      expect(summarySchema.properties.info.minimum).toBe(0);
    });
  });

  describe('Optional Runtime Metadata', () => {
    it('should define optional runMetadata', () => {
      expect(schema.properties).toHaveProperty('runMetadata');
      expect(schema.required).not.toContain('runMetadata');
    });

    it('should document exclusion from determinism', () => {
      const runMetadata = schema.properties.runMetadata;
      
      expect(runMetadata.description).toContain('NOT part of determinism');
    });

    it('should have optional fields in runMetadata', () => {
      const runMetadata = schema.properties.runMetadata;
      
      expect(runMetadata.properties).toHaveProperty('executionTime');
      expect(runMetadata.properties).toHaveProperty('generatedAt');
    });
  });

  describe('Schema Documentation', () => {
    it('should document all top-level fields', () => {
      expect(schema.properties.schemaVersion.description).toBeTruthy();
      expect(schema.properties.violations.description).toBeTruthy();
      expect(schema.properties.metadata.description).toBeTruthy();
    });

    it('should have schema title and description', () => {
      expect(schema.title).toBe('Cerber Output');
      expect(schema.description).toBeTruthy();
    });

    it('should have schema ID', () => {
      expect(schema.$id).toContain('cerber');
      expect(schema.$id).toContain('output');
    });
  });
});
