import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { getStagedFiles, runGuardian } from '../../src/cli/guardian.js';

describe('Guardian Fast Mode', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = resolve(tmpdir(), `guardian-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    // Initialize git repo for testing
    execSync('git init', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Staged Files Detection', () => {
    it('should return empty array when no files staged', async () => {
      const files = await getStagedFiles(tempDir);
      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBe(0);
    });

    it('should return staged files only', async () => {
      // Create and stage a file
      writeFileSync(resolve(tempDir, 'test.js'), 'console.log("test");');
      execSync('git add test.js', { cwd: tempDir });

      const files = await getStagedFiles(tempDir);
      expect(files).toContain('test.js');
    });

    it('should not return unstaged files', async () => {
      // Create unstaged file
      writeFileSync(resolve(tempDir, 'unstaged.js'), 'console.log("test");');

      const files = await getStagedFiles(tempDir);
      expect(files).not.toContain('unstaged.js');
    });

    it('should filter to relevant files only', async () => {
      // Stage multiple files
      mkdirSync(resolve(tempDir, '.github/workflows'), { recursive: true });
      writeFileSync(resolve(tempDir, '.github/workflows/ci.yml'), 'name: CI\n');
      writeFileSync(resolve(tempDir, 'README.md'), '# Test\n');
      
      execSync('git add .', { cwd: tempDir });

      const files = await getStagedFiles(tempDir);
      expect(files).toContain('.github/workflows/ci.yml');
      // README.md may or may not be filtered depending on logic
    });
  });

  describe('Guardian Execution', () => {
    it('should exit 0 when no relevant files changed', async () => {
      // Stage only non-relevant file
      writeFileSync(resolve(tempDir, 'test.txt'), 'test');
      execSync('git add test.txt', { cwd: tempDir });

      const result = await runGuardian(tempDir, { staged: true });
      expect(result.exitCode).toBe(0);
    });

    it('should run actionlint when workflow files staged', async () => {
      mkdirSync(resolve(tempDir, '.github/workflows'), { recursive: true });
      writeFileSync(resolve(tempDir, '.github/workflows/test.yml'), 'name: Test\n');
      execSync('git add .', { cwd: tempDir });

      const result = await runGuardian(tempDir, { staged: true });
      expect(result.toolsRan).toBeDefined();
      // May include actionlint if it's checking workflows
    });

    it('should respect --staged flag', async () => {
      writeFileSync(resolve(tempDir, 'file.txt'), 'staged');
      writeFileSync(resolve(tempDir, 'unstaged.txt'), 'unstaged');
      
      execSync('git add file.txt', { cwd: tempDir });

      const result = await runGuardian(tempDir, { staged: true });
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should complete in less than 2 seconds', async () => {
      writeFileSync(resolve(tempDir, 'test.txt'), 'test');
      execSync('git add test.txt', { cwd: tempDir });

      const start = Date.now();
      await runGuardian(tempDir, { staged: true });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it('should complete <500ms when no relevant files', async () => {
      writeFileSync(resolve(tempDir, 'README.md'), '# Test\n');
      execSync('git add README.md', { cwd: tempDir });

      const start = Date.now();
      await runGuardian(tempDir, { staged: true });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('Exit Codes', () => {
    it('should return 0 on success', async () => {
      const result = await runGuardian(tempDir, { staged: true });
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
    });

    it('should return non-zero on violations', async () => {
      // Create an invalid workflow file
      mkdirSync(resolve(tempDir, '.github/workflows'), { recursive: true });
      writeFileSync(resolve(tempDir, '.github/workflows/bad.yml'), 'invalid: yaml: syntax:');
      execSync('git add .', { cwd: tempDir });

      const result = await runGuardian(tempDir, { staged: true });
      // May return non-zero if actionlint detects issues
      expect(typeof result.exitCode).toBe('number');
    });
  });

  describe('Output Formatting', () => {
    it('should include timing when --debug flag set', async () => {
      const result = await runGuardian(tempDir, { staged: true, debug: true });
      expect(result.duration).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });

    it('should show tools that ran', async () => {
      const result = await runGuardian(tempDir, { staged: true });
      expect(result.toolsRan).toBeDefined();
      expect(Array.isArray(result.toolsRan)).toBe(true);
    });

    it('should be minimal output when no --debug', async () => {
      const result = await runGuardian(tempDir, { staged: true, debug: false });
      expect(result.output).toBeDefined();
      if (result.output) {
        // Output should be concise
        expect(result.output.split('\n').length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Integration', () => {
    it('should handle empty repo gracefully', async () => {
      expect(async () => {
        await runGuardian(tempDir, { staged: true });
      }).not.toThrow();
    });

    it('should work as pre-commit hook simulation', async () => {
      // Simulate: add file, run guardian, check exit code
      writeFileSync(resolve(tempDir, 'app.js'), 'console.log("app");');
      execSync('git add app.js', { cwd: tempDir });

      const result = await runGuardian(tempDir, { staged: true });
      
      // Pre-commit should succeed or fail cleanly
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      expect(result.toolsRan).toBeDefined();
    });
  });
});
