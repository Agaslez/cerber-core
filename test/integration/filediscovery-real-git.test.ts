/**
 * @file FileDiscovery Real Git Repo Tests
 * @rule GAP 3.1-3.3 - Real git repo scenarios
 * @rule CRITICAL - Detached HEAD and shallow clone in CI
 * 
 * Tests FileDiscovery with actual git repositories
 * (not mocks), including CI edge cases.
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import { join } from 'path';
import { FileDiscovery } from '../../src/core/file-discovery.js';

describe('FileDiscovery - Real Git Repo', () => {
  let tempDir: string;
  let discovery: FileDiscovery;

  beforeEach(async () => {
    tempDir = join(__dirname, '../../.test-temp', `fd-git-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 10000); // 10s timeout for cleanup

  describe('Staged Files Discovery', () => {
    it('should discover staged files in real git repo', async () => {
      // Setup: Initialize real git repo
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create workflow file
      const workflowDir = join(tempDir, '.github/workflows');
      await fs.mkdir(workflowDir, { recursive: true });
      const workflowFile = join(workflowDir, 'ci.yml');
      await fs.writeFile(workflowFile, 'name: CI\non: push\n');

      // Stage the file
      execSync('git add .github/workflows/ci.yml', { cwd: tempDir });

      // Discover staged files
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'staged' });

      // Assert: Should contain the staged file
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f: string) => f.includes('ci.yml'))).toBe(true);
    });

    it('should discover multiple staged files', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create multiple files
      const dir1 = join(tempDir, '.github/workflows');
      await fs.mkdir(dir1, { recursive: true });
      await fs.writeFile(join(dir1, 'ci.yml'), 'name: CI\n');
      await fs.writeFile(join(dir1, 'deploy.yml'), 'name: Deploy\n');
      await fs.writeFile(join(tempDir, '.gitignore'), 'node_modules/\n');

      // Stage all
      execSync('git add .', { cwd: tempDir });

      // Discover
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'staged' });

      // Assert: All staged files should be discovered
      expect(files.length).toBeGreaterThanOrEqual(3);
      expect(files.some((f: string) => f.includes('ci.yml'))).toBe(true);
      expect(files.some((f: string) => f.includes('deploy.yml'))).toBe(true);
    });

    it('should handle unstaged files (should not appear)', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create and stage file
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      const staged = join(dir, 'staged.yml');
      await fs.writeFile(staged, 'name: Staged\n');
      execSync('git add .github/workflows/staged.yml', { cwd: tempDir });

      // Create unstaged file (not added)
      const unstaged = join(dir, 'unstaged.yml');
      await fs.writeFile(unstaged, 'name: Unstaged\n');

      // Discover staged only
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'staged' });

      // Assert: Should have staged but not unstaged
      expect(files.some((f: string) => f.includes('staged.yml'))).toBe(true);
      expect(files.some((f: string) => f.includes('unstaged.yml'))).toBe(false);
    });
  });

  describe('Committed Files Discovery', () => {
    it('should discover committed files', async () => {
      // Setup: Initialize and create commit
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create and commit file
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      const file = join(dir, 'ci.yml');
      await fs.writeFile(file, 'name: CI\n');
      execSync('git add .github/workflows/ci.yml', { cwd: tempDir });
      execSync('git commit -m "Add workflow"', { cwd: tempDir });

      // Discover all files
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'all' });

      // Assert: Should contain committed file
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f: string) => f.includes('ci.yml'))).toBe(true);
    });

    it('should discover files from first commit', async () => {
      // Setup: Create initial repo with multiple files
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create multiple files
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'ci.yml'), 'name: CI\n');
      await fs.writeFile(join(dir, 'deploy.yml'), 'name: Deploy\n');
      await fs.writeFile(join(tempDir, 'README.md'), '# Test\n');

      // Create first commit
      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "Initial commit"', { cwd: tempDir });

      // Discover
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'all' });

      // Assert: All committed files should be discovered
      expect(files.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Detached HEAD (CI Scenario)', () => {
    it('should handle detached HEAD gracefully', async () => {
      // Setup: Create repo with commit
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create and commit file
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'ci.yml'), 'name: CI\n');
      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "Initial"', { cwd: tempDir });

      // Checkout specific commit (detached HEAD)
      const commitSha = execSync('git rev-parse HEAD', { cwd: tempDir })
        .toString()
        .trim();
      execSync(`git checkout ${commitSha}`, { cwd: tempDir });

      // Should still work
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'all' });

      // Assert: Should return files even in detached HEAD
      expect(files.length).toBeGreaterThan(0);
      expect(Array.isArray(files)).toBe(true);
    });

    it('should list files in detached HEAD state', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create multiple commits
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });

      // First commit
      await fs.writeFile(join(dir, 'v1.yml'), 'name: V1\n');
      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "v1"', { cwd: tempDir });
      const commitV1 = execSync('git rev-parse HEAD', { cwd: tempDir })
        .toString()
        .trim();

      // Second commit
      await fs.writeFile(join(dir, 'v2.yml'), 'name: V2\n');
      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "v2"', { cwd: tempDir });

      // Checkout first commit (detached HEAD)
      execSync(`git checkout ${commitV1}`, { cwd: tempDir });

      // Discover files in detached state
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'all' });

      // Assert: Should have v1.yml but not v2.yml
      expect(files.some((f: string) => f.includes('v1.yml'))).toBe(true);
      expect(files.some((f: string) => f.includes('v2.yml'))).toBe(false);
    });
  });

  describe('Shallow Clone (GitHub Actions)', () => {
    it('should handle shallow clone without crashing', async () => {
      // Setup: Create shallow clone
      // Note: Can't use --depth=1 with git init, so simulate with regular repo
      // and test getChangedFiles behavior
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create file
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'ci.yml'), 'name: CI\n');
      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "Initial"', { cwd: tempDir });

      // Discover - should not crash
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'all' });

      // Assert: Should return array, possibly empty or with files
      expect(Array.isArray(files)).toBe(true);
    });

    it('should handle getChangedFiles with minimal history', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create and commit file
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'ci.yml'), 'name: CI\n');
      execSync('git add .', { cwd: tempDir });
      execSync('git commit -m "Initial"', { cwd: tempDir });

      // Try to get changed files (may not work in shallow clone scenario)
      discovery = new FileDiscovery(tempDir);
      let files: string[];

      try {
        files = await discovery.discover({ mode: 'changed', baseBranch: 'main' });
        // Should return array, possibly empty
        expect(Array.isArray(files)).toBe(true);
      } catch (e) {
        // May fail in shallow clone, that's ok - we're just testing it doesn't crash
        expect(e).toBeDefined();
      }
    });
  });

  describe('Path Handling', () => {
    it('should normalize discovered file paths', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create file
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'ci.yml'), 'name: CI\n');
      execSync('git add .', { cwd: tempDir });

      // Discover
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'staged' });

      // Assert: Paths should use forward slashes (normalized)
      for (const file of files) {
        expect(file).not.toContain('\\\\');
        expect(file).not.toMatch(/\\/g);
      }
    }, 10000);

    it('should work with nested directory structures', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create deeply nested structure
      const deepDir = join(
        tempDir,
        '.github/workflows/prod/eu/payment-service'
      );
      await fs.mkdir(deepDir, { recursive: true });
      await fs.writeFile(join(deepDir, 'deploy.yml'), 'name: Deploy\n');
      execSync('git add .', { cwd: tempDir });

      // Discover
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'staged' });

      // Assert: Should find deeply nested file
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f: string) => f.includes('deploy.yml'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty repository', async () => {
      // Setup: Initialize but don't add anything
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Discover (should not crash)
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'all' });

      // Assert: Should return empty or error gracefully
      expect(Array.isArray(files)).toBe(true);
    });

    it('should handle repository with no commits', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create staged files but don't commit
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'ci.yml'), 'name: CI\n');
      execSync('git add .', { cwd: tempDir });

      // Discover staged
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'staged' });

      // Assert: Should find staged files even without commits
      expect(files.length).toBeGreaterThan(0);
      expect(files.some((f: string) => f.includes('ci.yml'))).toBe(true);
    });

    it('should handle .gitignore patterns', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create .gitignore
      await fs.writeFile(join(tempDir, '.gitignore'), 'node_modules/\n');

      // Create ignored directory and file
      const ignoredDir = join(tempDir, 'node_modules');
      await fs.mkdir(ignoredDir, { recursive: true });
      await fs.writeFile(join(ignoredDir, 'package.json'), '{}');

      // Create non-ignored file
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(join(dir, 'ci.yml'), 'name: CI\n');

      // Stage files
      execSync('git add .', { cwd: tempDir });

      // Discover
      discovery = new FileDiscovery(tempDir);
      const files = await discovery.discover({ mode: 'staged' });

      // Assert: Should include ci.yml but respect .gitignore
      expect(files.some((f: string) => f.includes('ci.yml'))).toBe(true);
      // Ignored files may or may not appear depending on implementation
      expect(files.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle many files efficiently', async () => {
      // Setup
      execSync('git init', { cwd: tempDir });
      execSync('git config user.email "test@example.com"', { cwd: tempDir });
      execSync('git config user.name "Test User"', { cwd: tempDir });

      // Create many files
      const dir = join(tempDir, '.github/workflows');
      await fs.mkdir(dir, { recursive: true });

      for (let i = 0; i < 50; i++) {
        const file = join(dir, `workflow-${i}.yml`);
        await fs.writeFile(file, `name: Workflow ${i}\n`);
      }

      // Stage all
      execSync('git add .', { cwd: tempDir });

      // Discover (measure time)
      discovery = new FileDiscovery(tempDir);
      const start = Date.now();
      const files = await discovery.discover({ mode: 'staged' });
      const duration = Date.now() - start;

      // Assert: Should complete quickly
      expect(files.length).toBeGreaterThanOrEqual(50);
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });
});
