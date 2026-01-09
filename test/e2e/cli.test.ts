/**
 * E2E CLI Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 * @description End-to-end tests for CLI commands
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('CLI E2E Tests', () => {
  let tempDir: string;

  beforeAll(() => {
    // Create temp directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-e2e-'));
  });

  afterAll(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe.skip('cerber-validate', () => {
    it('should validate workflow and detect violations', () => {
      const workflowPath = path.join(tempDir, 'invalid-workflow.yml');
      
      // Create workflow with violations
      fs.writeFileSync(workflowPath, `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout # No version pinning
      - run: echo "test"
        env:
          API_KEY: sk_fake_THISISNOTAREALKEY1234567890 # Hardcoded secret
`);

      try {
        execSync(`node bin/cerber-validate ${workflowPath}`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
        throw new Error('Should have failed validation');
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        expect(output).toContain('Hardcoded secret');
        expect(output).toContain('not pinned');
        expect(error.status).toBe(1);
      }
    });

    it('should pass valid workflow', () => {
      const workflowPath = path.join(tempDir, 'valid-workflow.yml');
      
      fs.writeFileSync(workflowPath, `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4.1.0
        with:
          persist-credentials: false
      - uses: actions/setup-node@v4.0.0
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
        env:
          API_KEY: \${{ secrets.API_KEY }}
`);

      const output = execSync(`node bin/cerber-validate ${workflowPath}`, {
        cwd: process.cwd(),
        encoding: 'utf-8'
      });

      expect(output).toContain('passed');
    });

    it.skip('should output JSON format with --json flag', () => {
      const workflowPath = path.join(tempDir, 'test-workflow.yml');
      
      fs.writeFileSync(workflowPath, `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - run: echo test
`);

      try {
        execSync(`node bin/cerber-validate ${workflowPath} --json`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
      } catch (error: any) {
        const output = error.stdout || '';
        const json = JSON.parse(output);
        
        expect(json).toHaveProperty('valid');
        expect(json).toHaveProperty('violations');
        expect(json).toHaveProperty('summary');
      }
    });

    it('should show verbose output with -v flag', () => {
      const workflowPath = path.join(tempDir, 'test-verbose.yml');
      
      fs.writeFileSync(workflowPath, `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`);

      try {
        execSync(`node bin/cerber-validate ${workflowPath} -v`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        expect(output).toContain('Validating');
        expect(output).toContain('Level');
      }
    });
  });

  describe.skip('cerber-validate --fix', () => {
    it('should create backup before fixing', () => {
      const workflowPath = path.join(tempDir, 'fix-test.yml');
      
      fs.writeFileSync(workflowPath, `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - run: npm test
`);

      try {
        execSync(`node bin/cerber-validate ${workflowPath} --fix`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
      } catch (error) {
        // May fail due to violations, but backup should exist
      }

      // Check backup file exists
      const backupFiles = fs.readdirSync(tempDir).filter(f => f.startsWith('fix-test.yml.backup-'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should preview fixes with --dry-run', () => {
      const workflowPath = path.join(tempDir, 'dry-run-test.yml');
      const originalContent = `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout
      - run: npm test
`;
      
      fs.writeFileSync(workflowPath, originalContent);

      try {
        const output = execSync(`node bin/cerber-validate ${workflowPath} --fix --dry-run`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });

        expect(output).toContain('Would fix');
        
        // Content should NOT be changed
        const currentContent = fs.readFileSync(workflowPath, 'utf-8');
        expect(currentContent).toBe(originalContent);
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        expect(output).toContain('dry-run');
      }
    });

    it('should fix high-confidence violations', () => {
      const workflowPath = path.join(tempDir, 'auto-fix.yml');
      
      fs.writeFileSync(workflowPath, `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo test
        env:
          API_KEY: sk_fake_THISISNOTAREALKEY1234567890
`);

      try {
        execSync(`node bin/cerber-validate ${workflowPath} --fix`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
      } catch (error) {
        // May still have violations that can't be auto-fixed
      }

      const fixed = fs.readFileSync(workflowPath, 'utf-8');
      
      // Secret should be replaced with secrets reference
      expect(fixed).toContain('${{ secrets.API_KEY }}');
      expect(fixed).not.toContain('sk_fake_');
    });
  });

  describe('cerber init', () => {
    it('should create contract with nodejs template', () => {
      const projectDir = path.join(tempDir, 'nodejs-project');
      fs.mkdirSync(projectDir, { recursive: true });

      execSync(`node bin/cerber-init --template nodejs --dir ${projectDir}`, {
        cwd: process.cwd(),
        encoding: 'utf-8'
      });

      // Check contract file created
      const contractPath = path.join(projectDir, '.cerber', 'contract.yml');
      expect(fs.existsSync(contractPath)).toBe(true);

      const contract = fs.readFileSync(contractPath, 'utf-8');
      expect(contract).toContain('nodejs');
      expect(contract).toContain('security/no-hardcoded-secrets');
    });

    it('should create contract with docker template', () => {
      const projectDir = path.join(tempDir, 'docker-project');
      fs.mkdirSync(projectDir, { recursive: true });

      execSync(`node bin/cerber-init --template docker --dir ${projectDir}`, {
        cwd: process.cwd(),
        encoding: 'utf-8'
      });

      const contractPath = path.join(projectDir, '.cerber', 'contract.yml');
      expect(fs.existsSync(contractPath)).toBe(true);

      const contract = fs.readFileSync(contractPath, 'utf-8');
      expect(contract).toContain('docker');
    });

    it('should not overwrite existing contract without --force', () => {
      const projectDir = path.join(tempDir, 'existing-project');
      fs.mkdirSync(projectDir, { recursive: true });
      
      const cerberDir = path.join(projectDir, '.cerber');
      fs.mkdirSync(cerberDir, { recursive: true });
      
      const contractPath = path.join(cerberDir, 'contract.yml');
      fs.writeFileSync(contractPath, 'existing: content');

      try {
        execSync(`node bin/cerber-init --template nodejs --dir ${projectDir}`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
        throw new Error('Should have failed without --force');
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        expect(output).toContain('already exists');
        
        // Original content preserved
        const content = fs.readFileSync(contractPath, 'utf-8');
        expect(content).toBe('existing: content');
      }
    });
  });

  describe.skip('Integration: Full workflow validation', () => {
    it('should validate, detect issues, fix, and re-validate', () => {
      const workflowPath = path.join(tempDir, 'integration-test.yml');
      
      // Step 1: Create invalid workflow
      fs.writeFileSync(workflowPath, `
name: Integration Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
`);

      // Step 2: Validate (should fail)
      try {
        execSync(`node bin/cerber-validate ${workflowPath}`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
        throw new Error('Should have failed validation');
      } catch (error: any) {
        expect(error.status).toBe(1);
      }

      // Step 3: Auto-fix
      try {
        execSync(`node bin/cerber-validate ${workflowPath} --fix`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
      } catch (error) {
        // May still have some violations
      }

      // Step 4: Re-validate (should have fewer issues)
      const fixed = fs.readFileSync(workflowPath, 'utf-8');
      expect(fixed).toContain('@v4.');
      expect(fixed).toContain('node-version');
    });
  });

  describe.skip('Error handling', () => {
    it('should handle missing workflow file', () => {
      try {
        execSync('node bin/cerber-validate non-existent.yml', {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
        throw new Error('Should have failed');
      } catch (error: any) {
        expect(error.status).toBeGreaterThan(0);
        const output = error.stdout || error.stderr || '';
        expect(output).toMatch(/not found|No workflow files found/i);
      }
    });

    it('should handle invalid YAML', () => {
      const workflowPath = path.join(tempDir, 'invalid-yaml.yml');
      fs.writeFileSync(workflowPath, 'invalid: yaml: syntax::: error');

      try {
        execSync(`node bin/cerber-validate ${workflowPath}`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
        throw new Error('Should have failed');
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        expect(output).toMatch(/YAML|Failed to parse|parse error/i);
      }
    });

    it('should handle invalid contract file', () => {
      const workflowPath = path.join(tempDir, 'test.yml');
      const contractPath = path.join(tempDir, 'invalid-contract.yml');
      
      fs.writeFileSync(workflowPath, 'name: Test\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo test');
      fs.writeFileSync(contractPath, 'invalid contract format');

      try {
        execSync(`node bin/cerber-validate ${workflowPath} --contract ${contractPath}`, {
          cwd: process.cwd(),
          encoding: 'utf-8'
        });
        throw new Error('Should have failed');
      } catch (error: any) {
        const output = error.stdout || error.stderr || '';
        expect(output).toContain('contract');
      }
    });
  });
});
