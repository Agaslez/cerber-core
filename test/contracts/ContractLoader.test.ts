/**
 * Contract Loader Tests
 * Tests for loading contracts from JSON/YAML files and resolving inheritance
 * 
 * @package cerber-core
 * @version 2.0.0
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ContractValidator } from '../../src/contracts/ContractValidator';

describe('@e2e ContractLoader', () => {
  let validator: ContractValidator;
  let tmpDir: string;

  beforeEach(() => {
    validator = new ContractValidator();
    tmpDir = join(__dirname, '__tmp_contracts__');
    
    // Create temp directory
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('File Loading', () => {
    it('loads valid YAML contract', async () => {
      const contractPath = join(tmpDir, 'test.yml');
      const contractContent = `
contractVersion: 1
name: test-contract
version: 1.0.0
rules:
  security/no-hardcoded-secrets:
    severity: error
    gate: true
`;
      writeFileSync(contractPath, contractContent);

      const contract = await validator.loadContract(contractPath);

      expect(contract).toBeDefined();
      expect(contract.contractVersion).toBe(1);
      expect(contract.name).toBe('test-contract');
      expect(contract.version).toBe('1.0.0');
      expect(contract.rules?.['security/no-hardcoded-secrets']).toMatchObject({
        severity: 'error',
        gate: true,
      });
    });

    it('loads valid JSON contract', async () => {
      const contractPath = join(tmpDir, 'test.json');
      const contractContent = {
        contractVersion: 1,
        name: 'test-contract',
        version: '1.0.0',
        rules: {
          'security/no-hardcoded-secrets': {
            severity: 'error',
            gate: true,
          },
        },
      };
      writeFileSync(contractPath, JSON.stringify(contractContent, null, 2));

      const contract = await validator.loadContract(contractPath);

      expect(contract).toBeDefined();
      expect(contract.contractVersion).toBe(1);
      expect(contract.name).toBe('test-contract');
    });

    it('throws error for non-existent file', async () => {
      const nonExistentPath = join(tmpDir, 'non-existent.yml');

      await expect(validator.loadContract(nonExistentPath)).rejects.toThrow();
    });

    it('throws error for invalid contract in YAML', async () => {
      const contractPath = join(tmpDir, 'invalid.yml');
      const invalidContent = `
name: test-contract
version: 1.0.0
`;
      writeFileSync(contractPath, invalidContent);

      // Missing contractVersion should cause validation error
      await expect(validator.loadContract(contractPath)).rejects.toThrow('Contract validation failed');
    });

    it('throws error for malformed JSON', async () => {
      const contractPath = join(tmpDir, 'malformed.json');
      const malformedContent = '{ "contractVersion": 1, "name": "test" '; // Missing closing brace
      writeFileSync(contractPath, malformedContent);

      await expect(validator.loadContract(contractPath)).rejects.toThrow();
    });

    it('throws error for unsupported file extension', async () => {
      const contractPath = join(tmpDir, 'test.txt');
      writeFileSync(contractPath, 'some content');

      await expect(validator.loadContract(contractPath)).rejects.toThrow('Unsupported file format');
    });
  });

  describe('Contract Inheritance', () => {
    it('resolves simple inheritance', async () => {
      // Create base contract
      const basePath = join(tmpDir, 'base.yml');
      const baseContent = `
contractVersion: 1
name: base-contract
version: 1.0.0
defaults:
  actionPinning: required
rules:
  security/no-hardcoded-secrets:
    severity: error
`;
      writeFileSync(basePath, baseContent);

      // Create child contract extending base
      const childPath = join(tmpDir, 'child.yml');
      const childContent = `
contractVersion: 1
name: child-contract
version: 1.0.0
extends: ./base.yml
rules:
  best-practices/cache-dependencies:
    severity: warning
`;
      writeFileSync(childPath, childContent);

      const child = await validator.loadContract(childPath);
      const resolved = await validator.resolveContract(child, tmpDir);

      expect(resolved.name).toBe('child-contract');
      expect(resolved.defaults?.actionPinning).toBe('required'); // From base
      expect(resolved.rules?.['security/no-hardcoded-secrets']).toMatchObject({ severity: 'error' }); // From base
      expect(resolved.rules?.['best-practices/cache-dependencies']).toMatchObject({ severity: 'warning' }); // From child
    });

    it('resolves multi-level inheritance', async () => {
      // Create grandparent contract
      const grandparentPath = join(tmpDir, 'grandparent.yml');
      const grandparentContent = `
contractVersion: 1
name: grandparent
version: 1.0.0
defaults:
  actionPinning: required
rules:
  security/no-hardcoded-secrets:
    severity: error
`;
      writeFileSync(grandparentPath, grandparentContent);

      // Create parent contract
      const parentPath = join(tmpDir, 'parent.yml');
      const parentContent = `
contractVersion: 1
name: parent
version: 1.0.0
extends: ./grandparent.yml
rules:
  security/require-action-pinning:
    severity: error
`;
      writeFileSync(parentPath, parentContent);

      // Create child contract
      const childPath = join(tmpDir, 'child.yml');
      const childContent = `
contractVersion: 1
name: child
version: 1.0.0
extends: ./parent.yml
rules:
  best-practices/cache-dependencies:
    severity: warning
`;
      writeFileSync(childPath, childContent);

      const child = await validator.loadContract(childPath);
      const resolved = await validator.resolveContract(child, tmpDir);

      expect(resolved.name).toBe('child');
      expect(resolved.defaults?.actionPinning).toBe('required'); // From grandparent
      expect(resolved.rules?.['security/no-hardcoded-secrets']).toMatchObject({ severity: 'error' }); // From grandparent
      expect(resolved.rules?.['security/require-action-pinning']).toMatchObject({ severity: 'error' }); // From parent
      expect(resolved.rules?.['best-practices/cache-dependencies']).toMatchObject({ severity: 'warning' }); // From child
    });

    it('allows child to override parent rules', async () => {
      // Create base contract
      const basePath = join(tmpDir, 'base.yml');
      const baseContent = `
contractVersion: 1
name: base
version: 1.0.0
rules:
  security/no-hardcoded-secrets:
    severity: warning
`;
      writeFileSync(basePath, baseContent);

      // Create child contract overriding base
      const childPath = join(tmpDir, 'child.yml');
      const childContent = `
contractVersion: 1
name: child
version: 1.0.0
extends: ./base.yml
rules:
  security/no-hardcoded-secrets:
    severity: error
`;
      writeFileSync(childPath, childContent);

      const child = await validator.loadContract(childPath);
      const resolved = await validator.resolveContract(child, tmpDir);

      expect(resolved.rules?.['security/no-hardcoded-secrets']).toMatchObject({ severity: 'error' }); // Child overrides
    });

    it('handles built-in contract references', async () => {
      // Mock built-in contract path resolution
      const childPath = join(tmpDir, 'child.yml');
      const childContent = `
contractVersion: 1
name: child
version: 1.0.0
extends: '@cerber-core/contracts/nodejs-base'
rules:
  best-practices/cache-dependencies:
    severity: warning
`;
      writeFileSync(childPath, childContent);

      // Should load from src/contracts/templates/
      const child = await validator.loadContract(childPath);
      const resolved = await validator.resolveContract(child, tmpDir);

      expect(resolved.name).toBe('child');
      // Should have merged with nodejs-base defaults
      expect(resolved.defaults?.nodeVersion?.required).toBe(true);
    });

    it('throws error for circular inheritance', async () => {
      // Create contract A
      const pathA = join(tmpDir, 'a.yml');
      const contentA = `
contractVersion: 1
name: contract-a
version: 1.0.0
extends: ./b.yml
`;
      writeFileSync(pathA, contentA);

      // Create contract B
      const pathB = join(tmpDir, 'b.yml');
      const contentB = `
contractVersion: 1
name: contract-b
version: 1.0.0
extends: ./a.yml
`;
      writeFileSync(pathB, contentB);

      const contract = await validator.loadContract(pathA);

      await expect(validator.resolveContract(contract, tmpDir)).rejects.toThrow('Circular');
    });
  });

  describe('Real World Scenarios', () => {
    it('loads and validates example contract from repo', async () => {
      const examplePath = join(__dirname, '../../.cerber-example/contract.yml');
      
      if (existsSync(examplePath)) {
        const contract = await validator.loadContract(examplePath);
        const validation = validator.validate(contract);

        expect(validation.valid).toBe(true);
        expect(contract.contractVersion).toBe(1);
        expect(contract.name).toBe('nodejs-ci-contract');
      }
    });

    it('loads nodejs-base template', async () => {
      const templatePath = join(__dirname, '../../src/contracts/templates/nodejs-base.yml');
      
      if (existsSync(templatePath)) {
        const contract = await validator.loadContract(templatePath);
        const validation = validator.validate(contract);

        expect(validation.valid).toBe(true);
        expect(contract.name).toBe('nodejs-ci-base');
        expect(contract.defaults?.nodeVersion?.required).toBe(true);
      }
    });
  });
});
