/**
 * Contract Validator Tests
 * Tests for contract schema validation and inheritance
 * 
 * @package cerber-core
 * @version 2.0.0
 */

import { ContractValidator } from '../../src/contracts/ContractValidator';
import type { Contract } from '../../src/contracts/types';

describe('@e2e ContractValidator', () => {
  let validator: ContractValidator;

  beforeEach(() => {
    validator = new ContractValidator();
  });

  describe('Schema Validation', () => {
    it('validates correct contract', () => {
      const contract: Contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        rules: {
          'security/no-hardcoded-secrets': { severity: 'error', gate: true }
        }
      };

      const result = validator.validate(contract);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects contract without contractVersion', () => {
      const invalid = {
        name: 'test-contract',
        version: '1.0.0'
      };

      const result = validator.validate(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('contractVersion');
    });

    it('rejects contract without name', () => {
      const invalid = {
        contractVersion: 1,
        version: '1.0.0'
      };

      const result = validator.validate(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name'))).toBe(true);
    });

    it('rejects contract with invalid version format', () => {
      const invalid = {
        contractVersion: 1,
        name: 'test',
        version: 'invalid'  // Should be semantic version
      };

      const result = validator.validate(invalid);

      expect(result.valid).toBe(false);
      // Check error message contains pattern or version reference
      const errorStr = result.errors.join(' ');
      expect(errorStr).toMatch(/version|pattern/i);
    });

    it('validates contract with defaults', () => {
      const contract: Contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        defaults: {
          permissionsPolicy: {
            maxLevel: 'read',
            allowedScopes: ['contents', 'pull-requests']
          },
          actionPinning: 'required',
          secretsPolicy: 'no-hardcoded',
          nodeVersion: {
            required: true,
            minVersion: '18.0.0'
          }
        }
      };

      const result = validator.validate(contract);

      expect(result.valid).toBe(true);
    });

    it('rejects invalid permission level', () => {
      const invalid = {
        contractVersion: 1,
        name: 'test',
        version: '1.0.0',
        defaults: {
          permissionsPolicy: {
            maxLevel: 'invalid'  // Should be read/write/none
          }
        }
      };

      const result = validator.validate(invalid);

      expect(result.valid).toBe(false);
      // Check error message contains maxLevel or enum reference
      const errorStr = result.errors.join(' ');
      expect(errorStr).toMatch(/maxLevel|enum|must be equal to one of|should be equal/i);
    });

    it('validates requiredActions array', () => {
      const contract: Contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        requiredActions: [
          {
            action: 'actions/checkout@v4',
            minVersion: '4',
            allowedVersions: ['v3', 'v4']
          }
        ]
      };

      const result = validator.validate(contract);

      expect(result.valid).toBe(true);
    });

    it('rejects requiredAction without action field', () => {
      const invalid = {
        contractVersion: 1,
        name: 'test',
        version: '1.0.0',
        requiredActions: [
          {
            minVersion: '4'  // Missing 'action' field
          }
        ]
      };

      const result = validator.validate(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('action'))).toBe(true);
    });

    it('validates metadata', () => {
      const contract: Contract = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        metadata: {
          description: 'Test contract',
          author: 'Test Author',
          repository: 'https://github.com/test/repo',
          tags: ['test', 'ci']
        }
      };

      const result = validator.validate(contract);

      expect(result.valid).toBe(true);
    });
  });

  describe('Contract Versioning', () => {
    it('accepts contractVersion 1', () => {
      const contract: Contract = {
        contractVersion: 1,
        name: 'test',
        version: '1.0.0'
      };

      const versionResult = validator.validateVersion(contract);

      expect(versionResult.supported).toBe(true);
    });

    it('rejects unsupported contractVersion', () => {
      const contract: any = {
        contractVersion: 99,
        name: 'test',
        version: '1.0.0'
      };

      const versionResult = validator.validateVersion(contract);

      expect(versionResult.supported).toBe(false);
      expect(versionResult.message).toContain('Unsupported contract version');
    });
  });

  describe('Contract Merging', () => {
    it('merges child contract with parent', async () => {
      const parent: Contract = {
        contractVersion: 1,
        name: 'parent',
        version: '1.0.0',
        defaults: {
          permissionsPolicy: { maxLevel: 'read' },
          actionPinning: 'required'
        },
        rules: {
          'security/no-hardcoded-secrets': { severity: 'error', gate: true },
          'best-practices/cache-dependencies': { severity: 'warning' }
        }
      };

      const child: Contract = {
        contractVersion: 1,
        name: 'child',
        version: '1.0.0',
        defaults: {
          actionPinning: 'recommended'  // Override parent
        },
        rules: {
          'best-practices/cache-dependencies': { severity: 'error' }  // Override parent
        }
      };

      const merged = (validator as any).mergeContracts(parent, child);

      // Child overrides parent
      expect(merged.defaults?.actionPinning).toBe('recommended');
      expect(merged.rules?.['best-practices/cache-dependencies']).toMatchObject({ severity: 'error' });
      
      // Parent values preserved
      expect(merged.defaults?.permissionsPolicy?.maxLevel).toBe('read');
      expect(merged.rules?.['security/no-hardcoded-secrets']).toMatchObject({ severity: 'error' });
    });

    it('combines requiredActions from parent and child', () => {
      const parent: Contract = {
        contractVersion: 1,
        name: 'parent',
        version: '1.0.0',
        requiredActions: [
          { action: 'actions/checkout@v4' }
        ]
      };

      const child: Contract = {
        contractVersion: 1,
        name: 'child',
        version: '1.0.0',
        requiredActions: [
          { action: 'actions/setup-node@v4' }
        ]
      };

      const merged = (validator as any).mergeContracts(parent, child);

      expect(merged.requiredActions).toHaveLength(2);
      expect(merged.requiredActions?.some((a: any) => a.action === 'actions/checkout@v4')).toBe(true);
      expect(merged.requiredActions?.some((a: any) => a.action === 'actions/setup-node@v4')).toBe(true);
    });
  });

  describe('Real Contract Examples', () => {
    it('validates nodejs-base contract', () => {
      const nodejsBase: Contract = {
        contractVersion: 1,
        name: 'nodejs-ci-base',
        version: '1.0.0',
        defaults: {
          permissionsPolicy: {
            maxLevel: 'read',
            allowedScopes: ['contents', 'pull-requests']
          },
          actionPinning: 'required',
          secretsPolicy: 'no-hardcoded',
          nodeVersion: {
            required: true,
            minVersion: '18.0.0'
          }
        },
        rules: {
          'security/no-hardcoded-secrets': { severity: 'error', gate: true },
          'security/require-action-pinning': { severity: 'error' },
          'best-practices/cache-dependencies': { severity: 'warning' }
        },
        requiredActions: [
          { action: 'actions/checkout@v4', minVersion: '4' },
          { action: 'actions/setup-node@v4', minVersion: '4' }
        ],
        requiredSteps: [
          { name: 'Install dependencies', command: 'npm ci' },
          { name: 'Run tests', command: 'npm test' }
        ],
        allowedTriggers: ['push', 'pull_request', 'workflow_dispatch']
      };

      const result = validator.validate(nodejsBase);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
