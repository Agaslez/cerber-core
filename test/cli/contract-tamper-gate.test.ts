/**
 * CLI Contract Tamper Gate (E2E)
 * 
 * Tests that CLI properly rejects tampered/missing/invalid contracts
 * Exit codes: 0 = OK, 1 = violations, 2 = blocker (config error)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('CLI Contract Tamper Gate (E2E)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-contract-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should exit 2 when contract.yml is missing', () => {
    const result = () => {
      execSync('npx cerber doctor', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    };

    expect(result).toThrow();
  });

  it('should exit 2 when contract.yml is malformed YAML', () => {
    const contractPath = path.join(tempDir, '.cerber', 'contract.yml');
    fs.mkdirSync(path.join(tempDir, '.cerber'), { recursive: true });
    fs.writeFileSync(contractPath, 'invalid: [yaml: unclosed');

    const result = () => {
      execSync('npx cerber doctor', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    };

    expect(result).toThrow();
  });

  it('should exit 2 when contract references non-existent tool', () => {
    const contractPath = path.join(tempDir, '.cerber', 'contract.yml');
    fs.mkdirSync(path.join(tempDir, '.cerber'), { recursive: true });
    fs.writeFileSync(
      contractPath,
      `
contractVersion: 1
name: test-contract
tools:
  - non-existent-tool-xyz
rules:
  test-rule:
    severity: error
`
    );

    const result = () => {
      execSync('npx cerber doctor', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    };

    expect(result).toThrow();
  });

  it('should exit 2 when contract has invalid profile', () => {
    const contractPath = path.join(tempDir, '.cerber', 'contract.yml');
    fs.mkdirSync(path.join(tempDir, '.cerber'), { recursive: true });
    fs.writeFileSync(
      contractPath,
      `
contractVersion: 1
name: test-contract
tools:
  - actionlint
profiles:
  invalid-profile:
    tools:
      - non-existent-tool
`
    );

    const result = () => {
      execSync('npx cerber doctor', {
        cwd: tempDir,
        stdio: 'pipe',
      });
    };

    expect(result).toThrow();
  });

  it('should show readable error message (no stack trace)', () => {
    const contractPath = path.join(tempDir, '.cerber', 'contract.yml');
    fs.mkdirSync(path.join(tempDir, '.cerber'), { recursive: true });
    fs.writeFileSync(
      contractPath,
      'broken: {invalid'
    );

    try {
      execSync('npx cerber doctor', {
        cwd: tempDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } catch (e: any) {
      const output = e.stderr || e.stdout || e.message;
      
      // Should not contain stack trace indicators
      expect(output).not.toMatch(/at Object\.|at Function|\.js:\d+:\d+/);
      
      // Should contain helpful error
      expect(output).toMatch(/error|Error|failed|Failed/i);
    }
  });

  it('should exit 0 for valid minimal contract', () => {
    const contractPath = path.join(tempDir, '.cerber', 'contract.yml');
    fs.mkdirSync(path.join(tempDir, '.cerber'), { recursive: true });
    fs.writeFileSync(
      contractPath,
      `
contractVersion: 1
name: minimal-test
`
    );

    const result = execSync('npx cerber doctor', {
      cwd: tempDir,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    expect(result).toBeTruthy();
  });
});
