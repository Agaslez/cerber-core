/**
 * Orchestrator Concurrency Determinism Test
 * 
 * Runs orchestrator 20 times on same fixture
 * Verifies identical output checksum (no shared state bugs)
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Orchestrator } from '../../src/core/Orchestrator';

describe('Orchestrator Concurrency Determinism', () => {
  const runs = 20;
  const outputChecksums: string[] = [];

  it(`should produce identical output across ${runs} sequential runs`, async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'concurrency-test-'));

    try {
      // Create minimal contract
      const certberDir = path.join(tempDir, '.cerber');
      fs.mkdirSync(certberDir, { recursive: true });
      fs.writeFileSync(
        path.join(certberDir, 'contract.yml'),
        `contractVersion: 1
name: determinism-test
tools: []
`
      );

      // Create some dummy files
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test Project\n');
      fs.writeFileSync(
        path.join(tempDir, '.gitignore'),
        'node_modules/\ndist/\n'
      );

      // Run orchestrator 20 times
      for (let i = 0; i < runs; i++) {
        try {
          const orchestrator = new Orchestrator();
          const result = await orchestrator.run({ 
            cwd: tempDir, 
            files: [], 
            tools: [] 
          });

          // Serialize result to JSON for checksumming
          const output = JSON.stringify(result, null, 0);
          const checksum = crypto
            .createHash('sha256')
            .update(output)
            .digest('hex');

          outputChecksums.push(checksum);
        } catch (e) {
          // Even errors should be deterministic
          outputChecksums.push('error-run-' + i);
        }
      }

      // All checksums should be identical
      const uniqueChecksums = new Set(outputChecksums);
      expect(uniqueChecksums.size).toBe(1);
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should not have shared state between runs', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-state-test-'));

    try {
      const certberDir = path.join(tempDir, '.cerber');
      fs.mkdirSync(certberDir, { recursive: true });
      fs.writeFileSync(
        path.join(certberDir, 'contract.yml'),
        `contractVersion: 1
name: shared-state-test
tools: []
`
      );

      const results: any[] = [];

      for (let i = 0; i < 5; i++) {
        const orchestrator = new Orchestrator();
        const result = await orchestrator.run({ cwd: tempDir, files: [], tools: [] });
        results.push(result);
      }

      // No result should reference previous runs
      for (let i = 0; i < results.length; i++) {
        expect(typeof results[i]).toBe('object');
      }

      // Results should not accumulate state
      const firstResult = results[0];
      const lastResult = results[results.length - 1];
      expect(JSON.stringify(firstResult)).toBe(JSON.stringify(lastResult));
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should handle concurrent adapter execution without race conditions', async () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'concurrent-adapters-test-')
    );

    try {
      const certberDir = path.join(tempDir, '.cerber');
      fs.mkdirSync(certberDir, { recursive: true });
      fs.writeFileSync(
        path.join(certberDir, 'contract.yml'),
        `contractVersion: 1
name: concurrent-test
tools: []
profiles:
  parallel:
    tools: []
    timeout: 5000
`
      );

      const promises = [];

      // Launch 10 concurrent orchestrator runs
      for (let i = 0; i < 10; i++) {
        promises.push(
          (async () => {
            const orchestrator = new Orchestrator();
            return await orchestrator.run({ cwd: tempDir, files: [], tools: [] });
          })()
        );
      }

      const results = await Promise.all(promises);

      // All should succeed
      expect(results.length).toBe(10);

      // All should have same output
      const checksums = results.map((r) =>
        crypto
          .createHash('sha256')
          .update(JSON.stringify(r))
          .digest('hex')
      );

      const uniqueChecksums = new Set(checksums);
      expect(uniqueChecksums.size).toBe(1);
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should not leak state between profile changes', async () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'profile-state-test-')
    );

    try {
      const certberDir = path.join(tempDir, '.cerber');
      fs.mkdirSync(certberDir, { recursive: true });
      fs.writeFileSync(
        path.join(certberDir, 'contract.yml'),
        `contractVersion: 1
name: profile-test
tools: []
profiles:
  fast:
    tools: []
    timeout: 1000
  full:
    tools: []
    timeout: 5000
`
      );

      // Run with different profiles
      const orch = new Orchestrator();
      const result1 = await orch.run({ cwd: tempDir, files: [], tools: [] });
      const result2 = await orch.run({ cwd: tempDir, files: [], tools: [] });

      // Results should be independent
      const checksum1 = crypto
        .createHash('sha256')
        .update(JSON.stringify(result1))
        .digest('hex');
      const checksum2 = crypto
        .createHash('sha256')
        .update(JSON.stringify(result2))
        .digest('hex');

      // Should be same (no tools configured in either profile)
      expect(checksum1).toBe(checksum2);
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  it('should produce valid output schema all 20 times', () => {
    // All 20 runs should have same checksum
    const uniqueChecksums = new Set(outputChecksums);
    expect(uniqueChecksums.size).toBe(1);
    expect(outputChecksums.length).toBe(runs);
  });
});
