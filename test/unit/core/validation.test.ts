/**
 * @file Validation Tests
 * @rule Per PRODUCTION HARDENING - P1: Input Validation & Security
 */

import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import {
    AdapterNameSchema,
    CLIArgsSchema,
    ContractSchema,
    FilePathSchema,
    formatValidationError,
    OrchestratorOptionsSchema,
    ProfileNameSchema,
    safeValidate,
    TimeoutSchema,
    validateOrchestratorOptions
} from '../../../src/core/validation.js';

describe('@fast Validation', () => {
  describe('FilePathSchema', () => {
    it('should accept valid file paths', () => {
      expect(() => FilePathSchema.parse('/path/to/file.txt')).not.toThrow();
      expect(() => FilePathSchema.parse('relative/path.txt')).not.toThrow();
      expect(() => FilePathSchema.parse('file.yml')).not.toThrow();
    });

    it('should reject empty paths', () => {
      expect(() => FilePathSchema.parse('')).toThrow('File path cannot be empty');
    });

    it('should reject paths with null bytes', () => {
      expect(() => FilePathSchema.parse('file\0.txt')).toThrow('null bytes');
    });

    it('should reject paths that are too long', () => {
      const longPath = 'a'.repeat(5000);
      expect(() => FilePathSchema.parse(longPath)).toThrow('too long');
    });
  });

  describe('ProfileNameSchema', () => {
    it('should accept valid profile names', () => {
      expect(() => ProfileNameSchema.parse('dev')).not.toThrow();
      expect(() => ProfileNameSchema.parse('team-mode')).not.toThrow();
      expect(() => ProfileNameSchema.parse('prod_env')).not.toThrow();
      expect(() => ProfileNameSchema.parse('test123')).not.toThrow();
    });

    it('should reject empty profile names', () => {
      expect(() => ProfileNameSchema.parse('')).toThrow('cannot be empty');
    });

    it('should reject profiles with special characters', () => {
      expect(() => ProfileNameSchema.parse('dev;rm -rf /')).toThrow('alphanumeric');
      expect(() => ProfileNameSchema.parse('prod$var')).toThrow('alphanumeric');
      expect(() => ProfileNameSchema.parse('test space')).toThrow('alphanumeric');
      expect(() => ProfileNameSchema.parse('../etc/passwd')).toThrow('alphanumeric');
    });

    it('should reject profiles that are too long', () => {
      const longName = 'a'.repeat(100);
      expect(() => ProfileNameSchema.parse(longName)).toThrow('too long');
    });
  });

  describe('AdapterNameSchema', () => {
    it('should accept valid adapter names', () => {
      expect(() => AdapterNameSchema.parse('actionlint')).not.toThrow();
      expect(() => AdapterNameSchema.parse('zizmor')).not.toThrow();
      expect(() => AdapterNameSchema.parse('custom-tool')).not.toThrow();
      expect(() => AdapterNameSchema.parse('tool_v2')).not.toThrow();
    });

    it('should reject adapter names with command injection attempts', () => {
      expect(() => AdapterNameSchema.parse('tool;ls')).toThrow();
      expect(() => AdapterNameSchema.parse('tool&&rm')).toThrow();
      expect(() => AdapterNameSchema.parse('tool|cat')).toThrow();
      expect(() => AdapterNameSchema.parse('$(echo hack)')).toThrow();
    });
  });

  describe('TimeoutSchema', () => {
    it('should accept valid timeouts', () => {
      expect(() => TimeoutSchema.parse(1000)).not.toThrow();
      expect(() => TimeoutSchema.parse(30000)).not.toThrow();
      expect(() => TimeoutSchema.parse(300000)).not.toThrow();
    });

    it('should reject negative timeouts', () => {
      expect(() => TimeoutSchema.parse(-1000)).toThrow('positive');
    });

    it('should reject zero timeout', () => {
      expect(() => TimeoutSchema.parse(0)).toThrow('positive');
    });

    it('should reject timeouts that are too large', () => {
      expect(() => TimeoutSchema.parse(700000)).toThrow('too large');
    });

    it('should reject non-integer timeouts', () => {
      expect(() => TimeoutSchema.parse(1000.5)).toThrow('integer');
    });
  });

  describe('OrchestratorOptionsSchema', () => {
    it('should accept valid orchestrator options', () => {
      const options = {
        files: ['.github/workflows/test.yml'],
        tools: ['actionlint'],
        profile: 'dev',
        parallel: true,
        timeout: 30000
      };
      
      expect(() => OrchestratorOptionsSchema.parse(options)).not.toThrow();
    });

    it('should require at least one file', () => {
      const options = {
        files: [],
        tools: ['actionlint']
      };
      
      expect(() => OrchestratorOptionsSchema.parse(options)).toThrow('At least one file');
    });

    it('should validate all file paths in array', () => {
      const options = {
        files: ['valid.yml', 'file\0.yml'],
        tools: ['actionlint']
      };
      
      expect(() => OrchestratorOptionsSchema.parse(options)).toThrow('null bytes');
    });

    it('should accept optional fields', () => {
      const options = {
        files: ['test.yml']
      };
      
      expect(() => OrchestratorOptionsSchema.parse(options)).not.toThrow();
    });
  });

  describe('CLIArgsSchema', () => {
    it('should accept valid CLI arguments', () => {
      const args = {
        files: ['test.yml'],
        tools: ['actionlint'],
        profile: 'dev',
        parallel: true
      };
      
      expect(() => CLIArgsSchema.parse(args)).not.toThrow();
    });

    it('should accept flags', () => {
      const args = {
        files: ['test.yml'],
        init: true,
        version: false,
        help: false
      };
      
      expect(() => CLIArgsSchema.parse(args)).not.toThrow();
    });
  });

  describe('ContractSchema', () => {
    it('should accept valid contract', () => {
      const contract = {
        version: '1.0.0',
        profiles: [
          {
            name: 'dev',
            tools: ['actionlint', 'zizmor'],
            rules: [
              {
                id: 'GHA001',
                name: 'Test rule',
                description: 'Test description',
                severity: 'error' as const
              }
            ]
          }
        ]
      };
      
      expect(() => ContractSchema.parse(contract)).not.toThrow();
    });

    it('should reject invalid version format', () => {
      const contract = {
        version: 'v1.0',
        profiles: [
          {
            name: 'dev',
            tools: ['actionlint']
          }
        ]
      };
      
      expect(() => ContractSchema.parse(contract)).toThrow('Invalid version format');
    });

    it('should require at least one profile', () => {
      const contract = {
        version: '1.0.0',
        profiles: []
      };
      
      expect(() => ContractSchema.parse(contract)).toThrow('at least one profile');
    });

    it('should validate severity enum', () => {
      const contract = {
        version: '1.0.0',
        profiles: [
          {
            name: 'dev',
            tools: ['actionlint'],
            rules: [
              {
                id: 'TEST',
                name: 'Test',
                description: 'Test',
                severity: 'critical' // Invalid - should be error/warning/info
              }
            ]
          }
        ]
      };
      
      expect(() => ContractSchema.parse(contract)).toThrow();
    });
  });

  describe('validateOrchestratorOptions', () => {
    it('should validate and return parsed options', () => {
      const options = {
        files: ['test.yml'],
        tools: ['actionlint']
      };
      
      const result = validateOrchestratorOptions(options);
      expect(result.files).toEqual(['test.yml']);
      expect(result.tools).toEqual(['actionlint']);
    });

    it('should throw on invalid options', () => {
      const options = {
        files: []
      };
      
      expect(() => validateOrchestratorOptions(options)).toThrow();
    });
  });

  describe('safeValidate', () => {
    it('should return success result for valid data', () => {
      const result = safeValidate(ProfileNameSchema, 'dev');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('dev');
      }
    });

    it('should return error result for invalid data', () => {
      const result = safeValidate(ProfileNameSchema, 'dev;rm -rf');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
      }
    });
  });

  describe('formatValidationError', () => {
    it('should format zod errors as readable string', () => {
      try {
        OrchestratorOptionsSchema.parse({ files: [] });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationError(error);
          expect(formatted).toContain('files');
          expect(formatted).toContain('At least one file');
        }
      }
    });

    it('should format nested errors', () => {
      try {
        ContractSchema.parse({
          version: 'invalid',
          profiles: []
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formatted = formatValidationError(error);
          expect(formatted).toContain('version');
          expect(formatted).toContain('profiles');
        }
      }
    });
  });
});
