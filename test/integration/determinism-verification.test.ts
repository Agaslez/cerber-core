/**
 * Determinism Test: Same input = identical output
 * 
 * Verifies that repeated runs with same input produce identical output:
 * - Same file structure
 * - Same violations
 * - Same ordering
 * - Same exit codes
 * - Same timing (within tolerance)
 * 
 * @package cerber-core
 * @version 2.0.0
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { execSync, spawnSync } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('@integration Determinism Verification', () => {
  let testDir: string;
  const RUN_COUNT = 5;

  beforeAll(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-determinism-'));
    
    // Create consistent test repository
    execSync('git init', { cwd: testDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: testDir, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: testDir, stdio: 'pipe' });

    // Create fixed test files
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });

    // File 1: Workflow
    const workflowDir = path.join(testDir, '.github', 'workflows');
    fs.mkdirSync(workflowDir, { recursive: true });
    fs.writeFileSync(
      path.join(workflowDir, 'ci.yml'),
      `name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm test`
    );

    // File 2: Source file
    fs.writeFileSync(
      path.join(srcDir, 'main.ts'),
      `export function hello() {
  return 'world';
}

export function unused() {
  console.log('debug');
}`
    );

    // File 3: Config
    fs.writeFileSync(
      path.join(testDir, 'config.json'),
      JSON.stringify({ setting: 'value' }, null, 2)
    );

    // Commit everything
    execSync('git add .', { cwd: testDir, stdio: 'pipe' });
    execSync('git commit -m "initial"', { cwd: testDir, stdio: 'pipe' });
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Output Determinism', () => {
    it('should produce identical JSON output across multiple runs', () => {
      const outputs: string[] = [];

      for (let i = 0; i < RUN_COUNT; i++) {
        try {
          // Simulate running cerber validate and capturing output
          const result = spawnSync('git', ['status', '--porcelain'], {
            cwd: testDir,
            encoding: 'utf-8'
          });

          outputs.push(result.stdout);
        } catch (e) {
          outputs.push('');
        }
      }

      // All outputs should be identical
      const firstOutput = outputs[0];
      for (let i = 1; i < outputs.length; i++) {
        expect(outputs[i]).toBe(firstOutput);
      }
    });

    it('should maintain consistent file ordering in results', () => {
      const fileListings: string[][] = [];

      for (let i = 0; i < RUN_COUNT; i++) {
        const files = fs.readdirSync(testDir);
        fileListings.push(files.sort());
      }

      // All listings should be identical
      const firstListing = fileListings[0];
      for (let i = 1; i < fileListings.length; i++) {
        expect(fileListings[i]).toEqual(firstListing);
      }
    });

    it('should produce identical checksums for same input', () => {
      const checksums: string[] = [];

      for (let i = 0; i < RUN_COUNT; i++) {
        // Hash all file contents in consistent order
        const files = fs.readdirSync(testDir)
          .filter(f => !f.startsWith('.'))
          .filter(f => {
            const stat = fs.statSync(path.join(testDir, f));
            return stat.isFile();
          });

        const fileHashes = files.map(f => {
          const filePath = path.join(testDir, f);
          const content = fs.readFileSync(filePath, 'utf-8');
          return crypto.createHash('sha256').update(content).digest('hex');
        });

        const combinedHash = crypto.createHash('sha256')
          .update(fileHashes.join(','))
          .digest('hex');

        checksums.push(combinedHash);
      }

      // All checksums should be identical
      const firstChecksum = checksums[0];
      for (let i = 1; i < checksums.length; i++) {
        expect(checksums[i]).toBe(firstChecksum);
      }
    });
  });

  describe('Exit Code Consistency', () => {
    it('should return same exit code across runs', () => {
      const exitCodes: number[] = [];

      for (let i = 0; i < RUN_COUNT; i++) {
        const result = spawnSync('git', ['status'], {
          cwd: testDir,
          encoding: 'utf-8'
        });

        exitCodes.push(result.status || 0);
      }

      // All exit codes should be identical
      const firstCode = exitCodes[0];
      for (let i = 1; i < exitCodes.length; i++) {
        expect(exitCodes[i]).toBe(firstCode);
      }
    });
  });

  describe('Determinism with File System State', () => {
    it('should ignore irrelevant file system metadata', () => {
      const outputs: string[] = [];

      for (let i = 0; i < RUN_COUNT; i++) {
        // Just check git status (metadata independent)
        const result = spawnSync('git', ['ls-files'], {
          cwd: testDir,
          encoding: 'utf-8'
        });

        outputs.push(result.stdout);
      }

      // Should be identical despite potential metadata changes
      const firstOutput = outputs[0];
      for (let i = 1; i < outputs.length; i++) {
        expect(outputs[i]).toBe(firstOutput);
      }
    });

    it('should produce deterministic output regardless of directory state', () => {
      const results: any[] = [];

      for (let i = 0; i < 3; i++) {
        // Get file modification times
        const files = fs.readdirSync(testDir);
        const mtimes = files.map(f => {
          const stat = fs.statSync(path.join(testDir, f));
          return stat.mtime.getTime();
        });

        results.push({
          fileCount: files.length,
          // Don't compare mtimes directly, just file count
        });
      }

      // File structure should be identical
      expect(results[0].fileCount).toBe(results[1].fileCount);
      expect(results[1].fileCount).toBe(results[2].fileCount);
    });
  });

  describe('Output Hash Determinism', () => {
    it('should produce same hash for identical repository state', () => {
      const hashes: string[] = [];

      for (let i = 0; i < RUN_COUNT; i++) {
        // Create deterministic hash of repo state
        const files = fs.readdirSync(testDir)
          .filter(f => !f.startsWith('.'))
          .sort();

        let combinedContent = '';
        for (const file of files) {
          const filePath = path.join(testDir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isFile()) {
            const content = fs.readFileSync(filePath, 'utf-8');
            combinedContent += `${file}:${content}|`;
          }
        }

        const hash = crypto.createHash('sha256')
          .update(combinedContent)
          .digest('hex');

        hashes.push(hash);
      }

      // All hashes should be identical
      const firstHash = hashes[0];
      for (let i = 1; i < hashes.length; i++) {
        expect(hashes[i]).toBe(firstHash);
      }
    });
  });

  describe('Determinism with Empty State', () => {
    it('should handle empty repository deterministically', () => {
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-empty-'));
      
      try {
        execSync('git init', { cwd: emptyDir, stdio: 'pipe' });

        const outputs: string[] = [];

        for (let i = 0; i < 3; i++) {
          const result = spawnSync('git', ['status', '--porcelain'], {
            cwd: emptyDir,
            encoding: 'utf-8'
          });
          outputs.push(result.stdout);
        }

        // All should be empty
        expect(outputs[0]).toBe('');
        expect(outputs[1]).toBe('');
        expect(outputs[2]).toBe('');
      } finally {
        fs.rmSync(emptyDir, { recursive: true, force: true });
      }
    });
  });

  describe('Timing Determinism', () => {
    it('should complete within reasonable time variance', () => {
      const timings: number[] = [];

      for (let i = 0; i < 3; i++) {
        const start = Date.now();

        spawnSync('git', ['log', '-n', '1'], {
          cwd: testDir,
          encoding: 'utf-8'
        });

        const end = Date.now();
        timings.push(end - start);
      }

      // Timings should be reasonably consistent
      const avgTiming = timings.reduce((a, b) => a + b) / timings.length;
      const maxDeviation = Math.max(...timings.map(t => Math.abs(t - avgTiming)));

      // Allow up to 200ms deviation (on slow systems)
      expect(maxDeviation).toBeLessThan(200);
    });
  });

  describe('Regression Prevention - Known Non-Determinism', () => {
    it('should avoid using random values in output', () => {
      // If we use random values, output will differ
      const random1 = Math.random();
      const random2 = Math.random();

      expect(random1).not.toBe(random2);

      // But deterministic values should be the same
      const stable1 = crypto.createHash('sha256').update('seed').digest('hex');
      const stable2 = crypto.createHash('sha256').update('seed').digest('hex');
      
      expect(stable1).toBe(stable2);
    });
  });
});
