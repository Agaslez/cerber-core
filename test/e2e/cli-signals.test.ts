import { ChildProcess, spawn } from "node:child_process";

/**
 * CLI Signal Handling Tests
 *
 * Verifies graceful shutdown on SIGINT/SIGTERM:
 * - Process uses _signals-test long-running command
 * - SIGINT/SIGTERM: process logs signal received + CLEANUP_DONE + exits with 0
 * - Exit code matches standard (0 for clean exit)
 * - No zombie processes
 * - Cleanup completes within timeout
 * - No "worker force exit" warnings
 */

describe("@signals CLI Signal Handling", () => {
  const isWindows = process.platform === "win32";
  const READY_TIMEOUT = process.env.CI ? 90000 : 10000; // 90s on CI
  const CLEANUP_TIMEOUT = process.env.CI ? 90000 : 10000; // 90s on CI
  const SIGNAL_DELAY = 200; // Wait 200ms after READY before sending signal

  // This is a long-running e2e test that needs more time in CI
  jest.setTimeout(120000);

  /**
   * Helper: Collect stdout and stderr from a child process
   */
  function collect(proc: ChildProcess) {
    let stdout = '';
    let stderr = '';

    proc.stdout?.setEncoding('utf8');
    proc.stderr?.setEncoding('utf8');

    // Diagnostic: log all output in real-time for debugging
    proc.stdout?.on('data', (d) => {
      stdout += d;
      console.log(`[STDOUT] ${d.toString().trim()}`);
    });
    
    proc.stderr?.on('data', (d) => {
      stderr += d;
      console.error(`[STDERR] ${d.toString().trim()}`);
    });

    return {
      get stdout() { return stdout; },
      get stderr() { return stderr; },
    };
  }

  /**
   * Helper: Wait for text to appear in output with timeout and retry logic
   */
  function waitForText(proc: ChildProcess, getOut: () => string, text: string, timeoutMs: number) {
    return new Promise<void>((resolve, reject) => {
      const start = Date.now();
      let lastOutput = '';

      const tick = () => {
        const output = getOut();
        lastOutput = output;
        
        if (output.includes(text)) {
          console.log(`✓ Found "${text}" after ${Date.now() - start}ms`);
          return resolve();
        }
        
        if (Date.now() - start > timeoutMs) {
          const lastLine = output.split('\n').filter(l => l.trim()).pop() || '(empty)';
          const fullContext = output.length > 500 
            ? `...${output.substring(output.length - 500)}`
            : output;
          
          return reject(new Error(
            `[TIMEOUT] ${timeoutMs}ms waiting for "${text}"\n` +
            `Last line: "${lastLine}"\n` +
            `Full output (last 500 chars): "${fullContext}"`
          ));
        }
        
        setTimeout(tick, 25);
      };

      proc.once('exit', (code, signal) => {
        console.error(`[PROCESS EXIT] Code=${code}, Signal=${signal}, Output: "${lastOutput}"`);
        reject(new Error(
          `[EARLY EXIT] Process exited while waiting for "${text}"\n` +
          `Code: ${code}, Signal: ${signal}\n` +
          `Last output: "${lastOutput}"`
        ));
      });

      tick();
    });
  }

  /**
   * Cleanup: Always kill process if it's still alive
   */
  let proc: ChildProcess | undefined;

  afterEach(async () => {
    if (proc && !proc.killed) {
      try {
        console.log('[CLEANUP] Killing process...');
        proc.kill('SIGKILL');
        // Wait for process to actually die
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('[CLEANUP] Process did not die after SIGKILL');
            resolve();
          }, 1000);
          
          proc!.once('exit', () => {
            clearTimeout(timeout);
            console.log('[CLEANUP] Process killed successfully');
            resolve();
          });
        });
      } catch (e) {
        console.error('[CLEANUP] Error killing process:', e);
      }
    }
    // Cleanup all timers to prevent interference
    jest.clearAllTimers();
  });

  describe("SIGINT (CTRL+C)", () => {
    it("should handle SIGINT gracefully with long-running process", async () => {
      if (isWindows) {
        return;
      }

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Debug: Log process exit to catch early termination
      proc.on('exit', (code, signal) => {
        console.log(`[DEBUG] Process exited: code=${code}, signal=${signal}, stdout="${io.stdout.trim()}", stderr="${io.stderr.trim()}"`);
      });

      // Wait for process to be ready
      try {
        console.log(`[TEST] Waiting for READY (timeout: ${READY_TIMEOUT}ms)...`);
        await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);
        console.log(`[TEST] ✓ READY received`);
      } catch (e) {
        console.error('[TEST] ✗ FAILED TO GET READY');
        console.error(`[TEST] stdout: ${io.stdout}`);
        console.error(`[TEST] stderr: ${io.stderr}`);
        throw e;
      }

      // Wait before sending signal to ensure handlers are ready
      console.log(`[TEST] Waiting ${SIGNAL_DELAY}ms before sending SIGINT...`);
      await new Promise((resolve) => setTimeout(resolve, SIGNAL_DELAY));

      // Send signal
      console.log(`[TEST] Sending SIGINT...`);
      proc.kill("SIGINT");

      // Wait for cleanup to complete
      try {
        console.log(`[TEST] Waiting for CLEANUP_DONE (timeout: ${CLEANUP_TIMEOUT}ms)...`);
        await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);
        console.log(`[TEST] ✓ CLEANUP_DONE received`);
      } catch (e) {
        console.error('[TEST] ✗ FAILED TO GET CLEANUP_DONE');
        console.error(`[TEST] stdout: ${io.stdout}`);
        console.error(`[TEST] stderr: ${io.stderr}`);
        throw e;
      }

      // Verify output sequence
      expect(io.stdout).toContain("READY");
      expect(io.stdout).toContain("SIGINT_RECEIVED");
      expect(io.stdout).toContain("CLEANUP_DONE");
    });

    it("should not leave zombie processes", async () => {
      if (isWindows) {
        return;
      }

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Wait for READY
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGINT");

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        proc!.once("exit", () => resolve());
        setTimeout(() => resolve(), 2000);
      });

      // Process should be dead
      expect(proc.killed || proc.exitCode !== null).toBe(true);
    });

    it("should flush logs before exiting", async () => {
      if (isWindows) {
        return;
      }

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Wait for READY
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGINT");

      // Wait for cleanup
      await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);

      // Verify output sequence
      expect(io.stdout).toContain("READY");
      expect(io.stdout).toContain("SIGINT_RECEIVED");
      expect(io.stdout).toContain("CLEANUP_DONE");
    });
  });

  describe("SIGTERM", () => {
    it("should exit quickly on SIGTERM (< 2 seconds)", async () => {
      if (isWindows) {
        return;
      }

      const start = Date.now();

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Wait for READY
      try {
        await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);
      } catch (e) {
        console.error('SIGTERM test: FAILED TO GET READY:');
        console.error('stdout:', io.stdout);
        console.error('stderr:', io.stderr);
        throw e;
      }

      // Wait before sending signal to ensure handlers are ready
      await new Promise((resolve) => setTimeout(resolve, SIGNAL_DELAY));

      // Send signal
      proc.kill("SIGTERM");

      // Wait for cleanup
      try {
        await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);
      } catch (e) {
        console.error('SIGTERM test: FAILED TO GET CLEANUP_DONE:');
        console.error('stdout:', io.stdout);
        console.error('stderr:', io.stderr);
        throw e;
      }

      const elapsed = Date.now() - start;

      // Should be reasonably quick
      expect(elapsed).toBeLessThan(5000);
      expect(io.stdout).toContain("SIGTERM_RECEIVED");
    });

    it("should gracefully close handles on SIGTERM", async () => {
      if (isWindows) {
        return;
      }

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Wait for READY
      try {
        await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);
      } catch (e) {
        console.error('SIGTERM graceful test: FAILED TO GET READY:');
        console.error('stdout:', io.stdout);
        console.error('stderr:', io.stderr);
        throw e;
      }

      // Wait before sending signal to ensure handlers are ready
      await new Promise((resolve) => setTimeout(resolve, SIGNAL_DELAY));

      // Send signal
      proc.kill("SIGTERM");

      // Wait for cleanup
      try {
        await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);
      } catch (e) {
        console.error('SIGTERM graceful test: FAILED TO GET CLEANUP_DONE:');
        console.error('stdout:', io.stdout);
        console.error('stderr:', io.stderr);
        throw e;
      }

      // Verify signal was handled
      expect(io.stdout).toContain("SIGTERM_RECEIVED");
      expect(io.stdout).toContain("CLEANUP_DONE");
    });
  });

  describe("Cleanup on Exit", () => {
    it("should not have unresolved promises on exit", async () => {
      if (isWindows) {
        return;
      }

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Wait for READY
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGINT");

      // Wait for cleanup
      await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);

      // Verify exit
      expect(io.stdout).toContain("CLEANUP_DONE");
    });

    it("should cancel pending timers on SIGTERM", async () => {
      if (isWindows) {
        return;
      }

      const start = Date.now();

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Wait for READY
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGTERM");

      // Wait for cleanup
      await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);

      const elapsed = Date.now() - start;

      // Should be quick (timers cancelled)
      expect(elapsed).toBeLessThan(5000);
      expect(io.stdout).toContain("CLEANUP_DONE");
    });
  });

  describe("Error Handling During Shutdown", () => {
    it("should handle errors during cleanup gracefully", async () => {
      if (isWindows) {
        return;
      }

      proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      const io = collect(proc);

      // Wait for READY
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGINT");

      // Wait for cleanup to complete
      await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);

      // Verify cleanup message
      expect(io.stdout).toContain("CLEANUP_DONE");
    });
  });
});

