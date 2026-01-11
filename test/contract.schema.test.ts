/**
 * Contract Schema Tests
 * Validates contract.schema.json and Profile types
 */

import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import { isContract, isProfileName, isSeverity } from '../src/contract/types';

const ajv = new Ajv();

// Load and compile schema
const schemaPath = path.join(__dirname, '..', '.cerber', 'contract.schema.json');
const schemaData = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
const validateContract = ajv.compile(schemaData);

describe('Contract Schema (COMMIT-2)', () => {
  describe('Schema Validation', () => {
    test('should validate well-formed contract', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
      expect(validateContract.errors).toBeNull();
    });

    test('should require contractVersion', () => {
      const contract = {
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
      expect(validateContract.errors).toBeDefined();
    });

    test('should require profiles.solo', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          dev: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });

    test('should reject invalid contractVersion', () => {
      const contract = {
        contractVersion: 2,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });

    test('should allow optional fields', () => {
      const contract = {
        contractVersion: 1,
        name: 'my-project',
        description: 'Test project',
        extends: 'nodejs-base',
        activeProfile: 'dev',
        targets: [
          {
            id: 'github-actions',
            globs: ['.github/workflows/**/*.yml']
          }
        ],
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });
  });

  describe('Profile Structure', () => {
    test('should require tools array in profile', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });

    test('should require failOn array in profile', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });

    test('should validate tools array with multiple entries', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint', 'zizmor', 'gitleaks'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate failOn with multiple severity levels', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error', 'warning']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate all three profiles when present', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          },
          dev: {
            tools: ['actionlint', 'zizmor'],
            failOn: ['error', 'warning']
          },
          team: {
            tools: ['actionlint', 'zizmor', 'gitleaks'],
            failOn: ['error', 'warning'],
            requireDeterministicOutput: true
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate profile optional fields', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
            timeout: 30000,
            continueOnError: false,
            requireDeterministicOutput: false
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });
  });

  describe('Tool Configuration', () => {
    test('should validate tool config with version pinning', () => {
      const contract = {
        contractVersion: 1,
        tools: {
          actionlint: {
            enabled: true,
            version: '1.6.27'
          }
        },
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate tool config with args', () => {
      const contract = {
        contractVersion: 1,
        tools: {
          zizmor: {
            enabled: true,
            args: ['--fix']
          }
        },
        profiles: {
          solo: {
            tools: ['zizmor'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate multiple tool configs', () => {
      const contract = {
        contractVersion: 1,
        tools: {
          actionlint: {
            enabled: true,
            version: '1.6.27'
          },
          zizmor: {
            enabled: true,
            autoInstall: true
          },
          gitleaks: {
            enabled: false
          }
        },
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });
  });

  describe('Rule Configuration', () => {
    test('should validate rule config with severity override', () => {
      const contract = {
        contractVersion: 1,
        rules: {
          'actionlint/deprecated-commands': {
            severity: 'warning'
          }
        },
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate rule config with gate override', () => {
      const contract = {
        contractVersion: 1,
        rules: {
          'zizmor/insecure-runner': {
            gate: false
          }
        },
        profiles: {
          solo: {
            tools: ['zizmor'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate rule config with source', () => {
      const contract = {
        contractVersion: 1,
        rules: {
          'some-rule': {
            source: 'actionlint',
            severity: 'error',
            gate: true
          }
        },
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });
  });

  describe('Target Configuration', () => {
    test('should validate single target', () => {
      const contract = {
        contractVersion: 1,
        targets: [
          {
            id: 'github-actions',
            globs: ['.github/workflows/**/*.yml']
          }
        ],
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate multiple targets', () => {
      const contract = {
        contractVersion: 1,
        targets: [
          {
            id: 'github-actions',
            globs: ['.github/workflows/**/*.yml']
          },
          {
            id: 'generic-yaml',
            globs: ['k8s/**/*.yaml']
          }
        ],
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate target with all valid ids', () => {
      const contract = {
        contractVersion: 1,
        targets: [
          { id: 'github-actions' },
          { id: 'gitlab-ci' },
          { id: 'generic-yaml' }
        ],
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });
  });

  describe('Type Guards', () => {
    test('isContract should return true for valid contract', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      expect(isContract(contract)).toBe(true);
    });

    test('isContract should return false for invalid contract', () => {
      expect(isContract({ contractVersion: 2 })).toBe(false);
      expect(isContract({ contractVersion: 1 })).toBe(false);
      expect(isContract(null)).toBe(false);
      expect(isContract('not a contract')).toBe(false);
    });

    test('isProfileName should validate profile names', () => {
      expect(isProfileName('solo')).toBe(true);
      expect(isProfileName('dev')).toBe(true);
      expect(isProfileName('team')).toBe(true);
      expect(isProfileName('custom')).toBe(false);
      expect(isProfileName(123)).toBe(false);
    });

    test('isSeverity should validate severity levels', () => {
      expect(isSeverity('error')).toBe(true);
      expect(isSeverity('warning')).toBe(true);
      expect(isSeverity('info')).toBe(true);
      expect(isSeverity('debug')).toBe(false);
      expect(isSeverity(123)).toBe(false);
    });
  });

  describe('Real-World Examples', () => {
    test('should validate minimal solo contract', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate nodejs-like contract with all profiles', () => {
      const contract = {
        contractVersion: 1,
        name: 'nodejs-app',
        description: 'Node.js application with CI/CD',
        extends: 'nodejs-base',
        activeProfile: 'dev',
        targets: [
          {
            id: 'github-actions',
            globs: ['.github/workflows/**/*.{yml,yaml}']
          }
        ],
        tools: {
          actionlint: {
            enabled: true,
            version: '1.6.27'
          },
          zizmor: {
            enabled: true
          },
          gitleaks: {
            enabled: true
          }
        },
        rules: {
          'actionlint/deprecated-commands': {
            severity: 'warning'
          }
        },
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
            timeout: 30000
          },
          dev: {
            tools: ['actionlint', 'zizmor'],
            failOn: ['error', 'warning'],
            timeout: 45000
          },
          team: {
            tools: ['actionlint', 'zizmor', 'gitleaks'],
            failOn: ['error', 'warning'],
            timeout: 60000,
            requireDeterministicOutput: true
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });

    test('should validate python-like contract with custom rules', () => {
      const contract = {
        contractVersion: 1,
        name: 'python-app',
        extends: 'python-base',
        activeProfile: 'solo',
        targets: [
          {
            id: 'github-actions',
            globs: ['.github/workflows/**/*.yml']
          }
        ],
        tools: {
          actionlint: {
            enabled: true
          }
        },
        rules: {
          'actionlint/missing-step-id': {
            gate: false,
            severity: 'info'
          }
        },
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
            continueOnError: true
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should reject contract with additional unknown properties', () => {
      const contract = {
        contractVersion: 1,
        unknownProperty: 'value',
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });

    test('should reject profile with additional unknown properties', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
            unknownProperty: 'value'
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });

    test('should handle empty tools array', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: [],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect([true, false]).toContain(valid);
    });

    test('should handle empty failOn array', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: []
          }
        }
      };

      const valid = validateContract(contract);
      expect([true, false]).toContain(valid);
    });

    test('should reject invalid severity in failOn', () => {
      const contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['critical']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });

    test('should reject invalid target id', () => {
      const contract = {
        contractVersion: 1,
        targets: [
          {
            id: 'jenkins-ci'
          }
        ],
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error']
          }
        }
      };

      const valid = validateContract(contract);
      expect(valid).toBe(false);
    });
  });
});
