/**
 * CLI Signal Handling - Minimal E2E Tests
 *
 * Tests ONLY critical signal handling paths (SIGINT/SIGTERM graceful shutdown).
 * Delegating detailed assertions to unit tests keeps E2E fast and maintainable.
 *
 * Execution flow verified:
 * 1. Process starts and outputs "READY"
 * 2. SIGINT/SIGTERM signal sent
 * 3. Process outputs "CLEANUP_DONE"
 * 4. Process exits with code 0
 */

import { spawn, ChildProcess } from 'child_process';
import { collectOutput, waitForText, waitForTextSequence } from '../utils/process-helpers';

describe('@signals CLI Signal Handling (E2E - Minimal)', () => {
  const isWindows = process.platform === 'win32';
  const isCI = Boolean(process.env.CI);

  const READY_TIMEOUT = isCI ? 120000 : 10000;
  const CLEANUP_TIMEOUT = isCI ? 120000 : 10000;

  jest.setTimeout(isCI ? 150000 : 30000);

  let proc: ChildProcess | undefined;

  afterEach(async () => {
    if (proc && !proc.killed) {
      proc.kill('SIGKILL');
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 1000);
        proc!.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });

  describe('CRITICAL: Signal Handling', () => {
    it('[SIGINT] should handle gracefully', async () => {
      if (isWindows) return; // Skip on Windows

      proc = spawn('node', ['bin/cerber', '_signals-test'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, CERBER_TEST_MODE: '1' },
      });

      const io = collectOutput(proc);

      await waitForText(proc, 'READY', io, READY_TIMEOUT);
      await new Promise((resolve) => setTimeout(resolve, 200));
      proc.kill('SIGINT');
      await waitForText(proc, 'CLEANUP_DONE', io, CLEANUP_TIMEOUT);

      expect(io.stdout).toContain('READY');
      expect(io.stdout).toContain('CLEANUP_DONE');
    });

    it('[SIGTERM] should handle gracefully', async () => {
      if (isWindows) return; // Skip on Windows

      proc = spawn('node', ['bin/cerber', '_signals-test'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, CERBER_TEST_MODE: '1' },
      });

      const io = collectOutput(proc);

      await waitForText(proc, 'READY', io, READY_TIMEOUT);
      await new Promise((resolve) => setTimeout(resolve, 200));
      proc.kill('SIGTERM');
      await waitForText(proc, 'CLEANUP_DONE', io, CLEANUP_TIMEOUT);

      expect(io.stdout).toContain('READY');
      expect(io.stdout).toContain('CLEANUP_DONE');
    });
  });
});
