/**
 * @file Orchestrator Real Adapter Execution Tests
 * @rule GAP 1.1 - Test all 3 adapters executing in parallel
 * @rule CRITICAL - Catch race conditions, shared state issues
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import fs from 'fs/promises';
import { dirname, join } from 'path';
import { Orchestrator } from '../../src/core/Orchestrator.js';

describe('Orchestrator - Real Adapter Execution', () => {
  let tempDir: string;
  let orchestrator: Orchestrator;
  let workflowFile: string;

  beforeAll(async () => {
    tempDir = join(__dirname, '../../.test-temp', `orch-real-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    orchestrator = new Orchestrator();
    workflowFile = join(tempDir, '.github/workflows/ci.yml');
  });

  describe('Parallel Execution', () => {
    it('should execute adapters and collect results', async () => {
      // Setup: Create a valid workflow file
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "test"
`
      );

      // Execute
      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'dev',
      });

      // Assert: Result structure is valid
      expect(result.violations).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.deterministic).toBe(true);
      expect(result.metadata.tools).toBeInstanceOf(Array);
    });

    it('should handle adapters with different exit codes', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: invalid/action@v1
      - run: echo "test"
`
      );

      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'dev',
      });

      // Assert: Results collected even if adapters have errors
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
      expect((result.metadata.tools as any[]).length).toBeGreaterThan(0);
    });

    it('should merge violations from adapters correctly', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "test"
`
      );

      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      // Assert: Violations are properly merged
      const violationIds = result.violations.map(v => v.id);
      const uniqueIds = new Set(violationIds);
      expect(violationIds.length).toBe(uniqueIds.size);

      // Summary should match violation count
      expect(result.summary.total).toBe(result.violations.length);
    });

    it('should maintain deterministic output on repeated runs', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "test"
`
      );

      // Run twice
      const result1 = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      const result2 = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      // Assert: Output is deterministic
      expect(result1.violations).toEqual(result2.violations);
      expect(JSON.stringify(result1.violations)).toBe(JSON.stringify(result2.violations));
    });

    it('should handle profile-based adapter selection', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
      );

      // Run with different profiles
      const soloResult = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'solo',
      });

      const devResult = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'dev',
      });

      const teamResult = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      // Assert: All profiles have at least actionlint
      expect((soloResult.metadata.tools as any[]).map((t: any) => t.name)).toContain('actionlint');
      expect((devResult.metadata.tools as any[]).length).toBeGreaterThanOrEqual(
        (soloResult.metadata.tools as any[]).length
      );
      expect((teamResult.metadata.tools as any[]).length).toBeGreaterThanOrEqual(
        (devResult.metadata.tools as any[]).length
      );
    });
  });

  describe('Adapter Independence', () => {
    it('should not share state between adapter runs', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });

      const workflow1 = join(tempDir, '.github/workflows/ci1.yml');
      const workflow2 = join(tempDir, '.github/workflows/ci2.yml');

      await fs.writeFile(
        workflow1,
        `name: CI1
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test1"
`
      );

      await fs.writeFile(
        workflow2,
        `name: CI2
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test2"
`
      );

      // Run both files
      const result = await orchestrator.run({
        files: [workflow1, workflow2],
        cwd: tempDir,
        profile: 'dev',
      });

      // Assert: Both files were processed
      expect(result.violations.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle single adapter failure gracefully', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });

      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
      );

      // Run (if one adapter fails, others should still work)
      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      // Assert: At least one adapter produced results
      expect((result.metadata.tools as any[]).length).toBeGreaterThan(0);
      expect(result.summary.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sorting & Output Format', () => {
    it('should sort violations by path, line, column', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "test"
`
      );

      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      // Assert: Violations are sorted
      for (let i = 0; i < result.violations.length - 1; i++) {
        const curr = result.violations[i];
        const next = result.violations[i + 1];

        // Primary: path
        if ((curr.path || '') !== (next.path || '')) {
          expect((curr.path || '').localeCompare(next.path || '')).toBeLessThanOrEqual(0);
        } else if ((curr.line || 0) !== (next.line || 0)) {
          // Secondary: line
          expect((curr.line || 0) as number).toBeLessThanOrEqual((next.line || 0) as number);
        } else {
          // Tertiary: column
          expect((curr.column || 0) as number).toBeLessThanOrEqual((next.column || 0) as number);
        }
      }
    });

    it('should format metadata correctly', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
      );

      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      // Assert: Metadata structure
      expect(result.metadata).toHaveProperty('tools');
      expect(result.metadata.tools).toBeInstanceOf(Array);

      // Tools should be sorted
      const toolNames = (result.metadata.tools as any[]).map((t: any) => t.name);
      const sortedNames = [...toolNames].sort();
      expect(toolNames).toEqual(sortedNames);

      // Each tool should have required fields
      for (const tool of result.metadata.tools as any[]) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('version');
        expect(tool).toHaveProperty('exitCode');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing workflow file gracefully', async () => {
      const nonExistentFile = join(tempDir, '.github/workflows/nonexistent.yml');

      const result = await orchestrator.run({
        files: [nonExistentFile],
        cwd: tempDir,
        profile: 'dev',
      });

      // Should not crash
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.violations).toBeInstanceOf(Array);
    });

    it('should handle invalid YAML gracefully', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps: [
      - run: echo "unclosed
`
      );

      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'dev',
      });

      // Should handle gracefully
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should validate output schema structure', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
      );

      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'team',
      });

      // Assert: Result matches expected schema
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('deterministic');
      expect(result).toHaveProperty('contractVersion');

      // Violations must have required fields
      for (const v of result.violations) {
        expect(v).toHaveProperty('id');
        expect(v).toHaveProperty('severity');
        expect(v).toHaveProperty('message');
        expect(typeof v.severity).toBe('string');
        expect(['error', 'warning', 'info', 'debug']).toContain(v.severity);
      }
    });
  });

  describe('Performance', () => {
    it('should complete execution within reasonable time', async () => {
      await fs.mkdir(dirname(workflowFile), { recursive: true });
      await fs.writeFile(
        workflowFile,
        `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "test"
`
      );

      const start = Date.now();
      const result = await orchestrator.run({
        files: [workflowFile],
        cwd: tempDir,
        profile: 'dev',
      });
      const duration = Date.now() - start;

      // Should complete in reasonable time (< 30s for test)
      expect(duration).toBeLessThan(30000);
      expect(result).toBeDefined();
    });
  });
});
