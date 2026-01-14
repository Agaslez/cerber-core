/**
 * Test Utilities for Process Output Verification
 *
 * Provides helpers for waiting on specific text patterns in child process output.
 * Reduces flakiness by implementing robust polling with configurable timeouts.
 */

import { ChildProcess } from 'child_process';

export interface ProcessOutput {
  stdout: string;
  stderr: string;
}

export function collectOutput(proc: ChildProcess): ProcessOutput {
  let stdout = '';
  let stderr = '';

  proc.stdout?.setEncoding('utf8');
  proc.stderr?.setEncoding('utf8');

  proc.stdout?.on('data', (chunk) => {
    stdout += chunk;
  });

  proc.stderr?.on('data', (chunk) => {
    stderr += chunk;
  });

  return {
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
  };
}

export function waitForText(
  proc: ChildProcess,
  text: string,
  io: ProcessOutput,
  timeoutMs: number = 10000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      const elapsed = Date.now() - startTime;
      const context = io.stdout + io.stderr;
      const lastLine = context.split('\n').filter((l) => l.trim()).pop() || '(empty)';

      cleanup();
      reject(
        new Error(
          `[EARLY EXIT] Process exited while waiting for "${text}"\n` +
            `Code: ${code}, Signal: ${signal}\n` +
            `Elapsed: ${elapsed}ms\n` +
            `Last line: "${lastLine}"\n` +
            `Full output: "${context}"`
        )
      );
    };

    const tick = () => {
      const combined = io.stdout + io.stderr;

      if (combined.includes(text)) {
        cleanup();
        resolve();
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed > timeoutMs) {
        const context =
          combined.length > 500 ? `...${combined.substring(combined.length - 500)}` : combined;
        const lastLine = combined.split('\n').filter((l) => l.trim()).pop() || '(empty)';

        cleanup();
        reject(
          new Error(
            `[TIMEOUT] ${timeoutMs}ms waiting for "${text}"\n` +
              `Elapsed: ${elapsed}ms\n` +
              `Last line: "${lastLine}"\n` +
              `Full output (last 500 chars): "${context}"`
          )
        );
        return;
      }

      setTimeout(tick, 25);
    };

    const cleanup = () => {
      proc.removeListener('exit', onExit);
    };

    proc.once('exit', onExit);
    tick();
  });
}

export async function waitForTextSequence(
  proc: ChildProcess,
  texts: string[],
  io: ProcessOutput,
  timeoutMs: number = 10000
): Promise<void> {
  for (const text of texts) {
    await waitForText(proc, text, io, timeoutMs);
  }
}
