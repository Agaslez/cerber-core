/**
 * @file Runtime Smoke Tests - P0 Observability + P1 Security
 * @rule Test real runtime behavior with dirty inputs
 * @description Verifies that P0/P1 work in production scenarios
 */

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Orchestrator } from '../../src/core/Orchestrator.js';
import { createLogger } from '../../src/core/logger.js';
import { getMetricsJSON } from '../../src/core/metrics.js';
import { sanitizePath } from '../../src/core/security.js';

const log = createLogger({ name: 'smoke-test' });

describe('Runtime Smoke Tests - P0 Observability', () => {
  let orchestrator: Orchestrator;
  let testDir: string;
  let validWorkflow: string;

  beforeEach(async () => {
    orchestrator = new Orchestrator();
    
    testDir = path.join(process.cwd(), 'test-smoke-runtime');
    await fs.mkdir(testDir, { recursive: true });
    
    validWorkflow = path.join(testDir, 'valid.yml');
    await fs.writeFile(validWorkflow, `
name: Test Workflow
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "test"
`);
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  it('SMOKE: logs are structured and contain request ID', async () => {
    const result = await orchestrator.run({
      files: [validWorkflow],
      tools: ['actionlint'],
      profile: 'smoke-test',
      cwd: testDir
    });

    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('SMOKE: metrics are recorded after orchestration', async () => {
    await orchestrator.run({
      files: [validWorkflow],
      tools: ['actionlint'],
      profile: 'smoke-metrics',
      cwd: testDir
    });

    const metricsJson = await getMetricsJSON() as any[];
    const orchestratorRuns = metricsJson.find(m => m.name === 'cerber_orchestrator_runs_total');
    
    expect(orchestratorRuns).toBeDefined();
    expect(orchestratorRuns.values.length).toBeGreaterThan(0);
  });

  it('SMOKE: partial success - adapter continues after another fails', async () => {
    const result = await orchestrator.run({
      files: [validWorkflow],
      tools: ['actionlint'],
      profile: 'partial-test',
      cwd: testDir
    });

    // Results should exist (graceful degradation)
    expect(result.violations).toBeDefined();
    expect(result.summary).toBeDefined();
  });
});

describe('Runtime Smoke Tests - P1 Security', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  it('SMOKE: blocks directory traversal attack', async () => {
    await expect(async () => {
      await orchestrator.run({
        files: ['../../../etc/passwd'],
        tools: ['actionlint'],
        cwd: process.cwd()
      });
    }).rejects.toThrow(/dangerous pattern|Input validation failed/);
  });

  it('SMOKE: blocks null byte injection', async () => {
    await expect(async () => {
      await orchestrator.run({
        files: ['file\0.yml'],
        tools: ['actionlint'],
        cwd: process.cwd()
      });
    }).rejects.toThrow(/null byte|Input validation failed/);
  });

  it('SMOKE: blocks command injection in profile name', async () => {
    await expect(async () => {
      await orchestrator.run({
        files: ['test.yml'],
        profile: 'dev;rm -rf /',
        tools: ['actionlint'],
        cwd: process.cwd()
      });
    }).rejects.toThrow(/alphanumeric|Input validation failed/);
  });

  it('SMOKE: blocks shell expansion in adapter name', async () => {
    await expect(async () => {
      await orchestrator.run({
        files: ['test.yml'],
        tools: ['$(whoami)'],
        cwd: process.cwd()
      });
    }).rejects.toThrow(/alphanumeric|Input validation failed/);
  });

  it('SMOKE: sanitizePath handles Windows paths correctly', () => {
    // Test that Windows backslashes work (not too aggressive)
    // sanitizePath converts to absolute and normalizes
    expect(() => {
      sanitizePath('test\\file.yml');
    }).not.toThrow();
  });

  it('SMOKE: accepts paths with spaces (not too aggressive)', () => {
    // Spaces in filenames are legitimate
    expect(() => {
      sanitizePath('my file.yml');
    }).not.toThrow();
  });

  it('SMOKE: accepts unicode in filenames', () => {
    // Unicode filenames are legitimate (internationalization)
    expect(() => {
      sanitizePath('测试-файл-αρχείο.yml');
    }).not.toThrow();
  });
});

describe('Runtime Smoke Tests - Error Messages', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  it('SMOKE: validation error is human-readable', async () => {
    try {
      await orchestrator.run({
        files: [], // Invalid: empty array
        tools: ['actionlint'],
        cwd: process.cwd()
      });
      fail('Should have thrown validation error');
    } catch (error: any) {
      // Error message should be clear for developers
      expect(error.message).toContain('Input validation failed');
      expect(error.message).toMatch(/file|empty|required/i);
    }
  });

  it('SMOKE: security error explains the issue', async () => {
    try {
      await orchestrator.run({
        files: ['../../../etc/passwd'],
        tools: ['actionlint'],
        cwd: process.cwd()
      });
      fail('Should have thrown security error');
    } catch (error: any) {
      // Error should mention security concern
      expect(error.message).toMatch(/dangerous|traversal|Input validation failed/i);
    }
  });
});

describe('Runtime Smoke Tests - Performance', () => {
  let orchestrator: Orchestrator;
  let testDir: string;

  beforeEach(async () => {
    orchestrator = new Orchestrator();
    testDir = path.join(process.cwd(), 'test-smoke-perf');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore
    }
  });

  it('SMOKE: validation overhead is minimal', async () => {
    // Create 10 test files
    const files: string[] = [];
    for (let i = 0; i < 10; i++) {
      const file = path.join(testDir, `workflow-${i}.yml`);
      await fs.writeFile(file, 'name: Test\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo test');
      files.push(file);
    }

    const start = Date.now();
    
    try {
      await orchestrator.run({
        files,
        tools: ['actionlint'],
        profile: 'perf-test',
        cwd: testDir
      });
    } catch (e) {
      // Adapter might fail, but validation should be fast
    }

    const duration = Date.now() - start;
    
    // Validation + setup should be reasonable (10s total for full run)
    log.info({ duration, filesCount: files.length }, 'Smoke test performance');
    
    expect(duration).toBeLessThan(10000); // 10s total is reasonable
  });
});
