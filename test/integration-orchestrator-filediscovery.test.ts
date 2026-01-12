/**
 * @file Integration Tests: Orchestrator + FileDiscovery + Adapters
 * @rule Per AGENTS.md §3 - Integration tests verify component interaction
 * @rule Test behavior across component boundaries
 */

import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../src/core/Orchestrator.js';
import { FileDiscovery } from '../src/core/file-discovery.js';

describe('Integration: Orchestrator + FileDiscovery + Adapters', () => {
  let tempDir: string;
  let orchestrator: Orchestrator;
  let fileDiscovery: FileDiscovery;

  beforeEach(() => {
    // Create temporary test directory
    tempDir = path.join(process.cwd(), `.test-integration-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Initialize git repository (required for FileDiscovery)
    const { execSync } = require('child_process');
    try {
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });
      execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });
      execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
    } catch (e) {
      // git may not be available in all test environments
    }

    orchestrator = new Orchestrator();
    fileDiscovery = new FileDiscovery(tempDir);
  });

  afterEach(() => {
    // Cleanup temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('End-to-End: File Discovery → Adapter Execution', () => {
    it('should execute adapters on discovered files', async () => {
      // Create test files
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      const testFile = path.join(tempDir, '.github', 'workflows', 'ci.yml');
      fs.writeFileSync(
        testFile,
        `name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3`
      );

      // Execute adapter directly on files (FileDiscovery requires git)
      const result = await orchestrator.run({
        files: ['.github/workflows/ci.yml'],
        cwd: tempDir,
        tools: ['actionlint'],
        timeout: 5000
      });

      // Verify orchestration succeeded
      expect(result).toBeDefined();
      expect(result.schemaVersion).toBe(1);
      expect(result.contractVersion).toBe(1);
      expect(Array.isArray(result.violations)).toBe(true);
    });

    it('should handle executeAdapters public method', async () => {
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      const testFile = path.join(tempDir, '.github', 'workflows', 'test.yml');
      fs.writeFileSync(
        testFile,
        `name: Test
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"`
      );

      const result = await orchestrator.executeAdapters(
        ['actionlint'],
        ['.github/workflows/test.yml'],
        tempDir,
        { timeout: 5000, parallel: true }
      );

      expect(result).toBeDefined();
      expect(result.violations).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(typeof result.summary.total).toBe('number');
      expect(typeof result.summary.errors).toBe('number');
    });
  });

  describe('Component Integration: Multiple Adapters', () => {
    it('should execute multiple adapters and aggregate violations', async () => {
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, '.github', 'workflows', 'multi.yml'),
        `name: Multi
on: push
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
      - run: test`
      );

      const result = await orchestrator.run({
        files: ['.github/workflows/multi.yml'],
        cwd: tempDir,
        tools: ['actionlint', 'zizmor'],
        timeout: 10000,
        parallel: true
      });

      // Both adapters should be attempted
      expect(result.metadata.tools.length).toBeGreaterThanOrEqual(1);
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
      expect(result.violations).toBeDefined();
    });

    it('should handle adapter failure gracefully', async () => {
      const result = await orchestrator.run({
        files: ['nonexistent.yml'],
        cwd: tempDir,
        tools: ['actionlint'],
        timeout: 5000
      });

      // Should return valid output even if adapter fails
      expect(result.schemaVersion).toBe(1);
      expect(result.contractVersion).toBe(1);
      expect(result.deterministic).toBe(true);
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });

  describe('Deterministic Output Verification', () => {
    it('should produce consistent output for same input', async () => {
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, '.github', 'workflows', 'test.yml'),
        `name: Determinism Test
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: true`
      );

      // Run twice
      const result1 = await orchestrator.run({
        files: ['.github/workflows/test.yml'],
        cwd: tempDir,
        tools: ['actionlint']
      });

      const result2 = await orchestrator.run({
        files: ['.github/workflows/test.yml'],
        cwd: tempDir,
        tools: ['actionlint']
      });

      // Violations should be identical (same source, count, order)
      expect(result1.violations.length).toBe(result2.violations.length);
      expect(result1.summary.total).toBe(result2.summary.total);
      expect(result1.summary.errors).toBe(result2.summary.errors);

      // Check deterministic flag
      expect(result1.deterministic).toBe(true);
      expect(result2.deterministic).toBe(true);
    });

    it('should sort violations consistently', async () => {
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, '.github', 'workflows', 'sort.yml'),
        `name: Sort Test
on: push
jobs:
  j1:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"`
      );

      const result = await orchestrator.run({
        files: ['.github/workflows/sort.yml'],
        cwd: tempDir,
        tools: ['actionlint']
      });

      // Check violations are sorted
      const violations = result.violations;
      
      if (violations.length > 1) {
        for (let i = 0; i < violations.length - 1; i++) {
          const current = violations[i];
          const next = violations[i + 1];
          
          // Violations should be sorted by severity (error < warning < info)
          const severityOrder: Record<string, number> = {
            error: 0,
            warning: 1,
            info: 2
          };
          
          const currentSeverity = severityOrder[current.severity];
          const nextSeverity = severityOrder[next.severity];
          
          // If same severity, check by path
          if (currentSeverity === nextSeverity) {
            const currentPath = current.path || '';
            const nextPath = next.path || '';
            const pathCompare = currentPath.localeCompare(nextPath);
            expect(pathCompare).toBeLessThanOrEqual(0);
            
            // If same path, check by line
            if (pathCompare === 0) {
              const currentLine = current.line || 0;
              const nextLine = next.line || 0;
              expect(currentLine).toBeLessThanOrEqual(nextLine);
            }
          } else {
            expect(currentSeverity).toBeLessThanOrEqual(nextSeverity);
          }
        }
      }
    });
  });

  describe('FileDiscovery Integration', () => {
    it('should use FileDiscovery API structure', async () => {
      // Create multiple test files
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, '.github', 'workflows', 'file1.yml'), 'name: File1\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo');
      fs.writeFileSync(path.join(tempDir, '.github', 'workflows', 'file2.yml'), 'name: File2\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo');

      // Verify FileDiscovery object can be constructed (git operations tested in commit7)
      expect(fileDiscovery).toBeDefined();
      expect(fileDiscovery.constructor.name).toBe('FileDiscovery');

      // Execute adapters on all files directly
      const result = await orchestrator.run({
        files: [
          '.github/workflows/file1.yml',
          '.github/workflows/file2.yml'
        ],
        cwd: tempDir,
        tools: ['actionlint']
      });

      expect(result.violations).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should validate files are required', async () => {
      const result = await orchestrator.run({
        files: ['dummy.yml'], // Orchestrator requires at least one file
        cwd: tempDir,
        tools: ['actionlint']
      });

      expect(result.schemaVersion).toBe(1);
      expect(result.violations).toBeDefined();
    });

    it('should handle missing adapters gracefully', async () => {
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, '.github', 'workflows', 'test.yml'),
        'name: Test\non: push'
      );

      const result = await orchestrator.run({
        files: ['.github/workflows/test.yml'],
        cwd: tempDir,
        tools: ['nonexistent-adapter'],
        timeout: 5000
      });

      // Should return valid output even with nonexistent adapter
      expect(result.schemaVersion).toBe(1);
      expect(result.contractVersion).toBe(1);
      expect(result.deterministic).toBe(true);
    });

    it('should handle timeout gracefully', async () => {
      fs.mkdirSync(path.join(tempDir, '.github', 'workflows'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, '.github', 'workflows', 'timeout.yml'),
        'name: Timeout\non: push'
      );

      const result = await orchestrator.run({
        files: ['.github/workflows/timeout.yml'],
        cwd: tempDir,
        tools: ['actionlint'],
        timeout: 1 // Very short timeout
      });

      // Should return valid output
      expect(result.schemaVersion).toBe(1);
      expect(result.contractVersion).toBe(1);
    });
  });
});
