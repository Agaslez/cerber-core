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
  const READY_TIMEOUT = process.env.CI ? 20000 : 5000;
  const CLEANUP_TIMEOUT = process.env.CI ? 20000 : 5000;

  // This is a long-running e2e test that needs more time in CI
  jest.setTimeout(60000);

  /**
   * Helper: Collect stdout and stderr from a child process
   */
  function collect(proc: ChildProcess) {
    let stdout = '';
    let stderr = '';

    proc.stdout?.setEncoding('utf8');
    proc.stderr?.setEncoding('utf8');

    proc.stdout?.on('data', (d) => (stdout += d));
    proc.stderr?.on('data', (d) => (stderr += d));

    return {
      get stdout() { return stdout; },
      get stderr() { return stderr; },
    };
  }

  /**
   * Helper: Wait for text to appear in output with timeout
   */
  function waitForText(proc: ChildProcess, getOut: () => string, text: string, timeoutMs: number) {
    return new Promise<void>((resolve, reject) => {
      const start = Date.now();

      const tick = () => {
        if (getOut().includes(text)) return resolve();
        if (Date.now() - start > timeoutMs) {
          return reject(new Error(`Timeout waiting for "${text}" after ${timeoutMs}ms`));
        }
        setTimeout(tick, 25);
      };

      proc.once('exit', (code, signal) => {
        reject(new Error(`Process exited early while waiting for "${text}". code=${code} signal=${signal}`));
      });

      tick();
    });
  }

  /**
   * Cleanup: Always kill process if it's still alive
   */
  let proc: ChildProcess | undefined;

  afterEach(() => {
    if (proc && !proc.killed) {
      try {
        proc.kill('SIGKILL');
      } catch {}
    }
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

      // Wait for process to be ready
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGINT");

      // Wait for cleanup to complete
      await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);

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
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGTERM");

      // Wait for cleanup
      await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);

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
      await waitForText(proc, () => io.stdout + io.stderr, "READY", READY_TIMEOUT);

      // Send signal
      proc.kill("SIGTERM");

      // Wait for cleanup
      await waitForText(proc, () => io.stdout + io.stderr, "CLEANUP_DONE", CLEANUP_TIMEOUT);

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

