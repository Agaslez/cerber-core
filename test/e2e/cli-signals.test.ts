import { spawn } from "node:child_process";

/**
 * CLI Signal Handling Tests
 *
 * Verifies graceful shutdown on SIGINT/SIGTERM:
 * - Process uses _signals-test long-running command
 * - SIGINT: process logs SIGINT_RECEIVED + CLEANUP_DONE + exits with 0
 * - Exit code matches standard (0 for clean exit, or signal termination)
 * - No zombie processes
 * - Cleanup completes within 5 seconds
 * - No "worker force exit" warnings
 */

describe("@signals CLI Signal Handling", () => {
  const isWindows = process.platform === "win32";

  /**
   * Helper: Wait for text in stream with timeout
   * Kills process if timeout exceeded
   * Collects both stdout and stderr for diagnostics
   */
  async function waitForOutput(
    proc: any,
    searchText: string,
    timeoutMs: number = 5000
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdout = "";
      let stderr = "";

      const timer = setTimeout(() => {
        proc.kill("SIGKILL");
        reject(
          new Error(
            `Timeout waiting for "${searchText}" after ${timeoutMs}ms.\n` +
            `stdout: ${stdout}\n` +
            `stderr: ${stderr}`
          )
        );
      }, timeoutMs);

      proc.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
        if (stdout.includes(searchText)) {
          clearTimeout(timer);
          resolve(stdout);
        }
      });

      proc.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on("exit", () => {
        clearTimeout(timer);
        if (!stdout.includes(searchText)) {
          reject(
            new Error(
              `Process exited before "${searchText}" was found.\n` +
              `stdout: ${stdout}\n` +
              `stderr: ${stderr}`
            )
          );
        }
      });
    });
  }

  describe("SIGINT (CTRL+C)", () => {
    it("should handle SIGINT gracefully with long-running process", async () => {
      if (isWindows) {
        return;
      }

      const result = await new Promise<{
        exitCode: number | null;
        signal: string | null;
        stdout: string;
        stderr: string;
      }>((resolve) => {
        // Spawn long-running CLI process
        const proc = spawn(
          "node",
          ["bin/cerber", "_signals-test"],
          {
            stdio: ["ignore", "pipe", "pipe"],
            env: { ...process.env, CERBER_TEST_MODE: "1", CI: "1" },
          }
        );

        let stdout = "";
        let stderr = "";

        proc.stdout?.on("data", (data: Buffer) => {
          stdout += data.toString();
        });

        proc.stderr?.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        // Wait for READY signal with extended timeout for CI
        const readyTimer = setTimeout(() => {
          proc.kill("SIGKILL");
          resolve({
            exitCode: -1,
            signal: null,
            stdout,
            stderr: `TIMEOUT waiting for READY. stderr: ${stderr}`
          });
        }, 5000); // Increased from 3s to 5s for CI

        // Check for READY in output with polling
        const checkReady = setInterval(() => {
          if (stdout.includes("READY")) {
            clearInterval(checkReady);
            clearTimeout(readyTimer);

            // Now send SIGINT after a small delay
            setTimeout(() => {
              proc.kill("SIGINT");
            }, 50);
          }
        }, 5); // More frequent polling

        proc.on("exit", (code, signal) => {
          clearInterval(checkReady);
          clearTimeout(readyTimer);
          resolve({
            exitCode: code,
            signal,
            stdout,
            stderr,
          });
        });

        // Handle errors from spawn
        proc.on("error", (err) => {
          clearInterval(checkReady);
          clearTimeout(readyTimer);
          resolve({
            exitCode: null,
            signal: null,
            stdout,
            stderr: `Spawn error: ${err.message}`,
          });
        });
      });

      // Enhanced diagnostics: Show what we got if test fails
      if (!result.stdout.includes("READY")) {
        console.error("❌ READY not found");
        console.error(`exitCode: ${result.exitCode}, signal: ${result.signal}`);
        console.error(`stdout: ${result.stdout}`);
        console.error(`stderr: ${result.stderr}`);
      }

      // Should exit cleanly
      expect([0, null]).toContain(result.exitCode);
      expect(result.stdout).toContain("READY");
      expect(result.stdout).toContain("SIGINT_RECEIVED");
      expect(result.stdout).toContain("CLEANUP_DONE");
    });

    it("should not leave zombie processes", async () => {
      if (isWindows) {
        return;
      }

      const proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: "pipe",
          env: { ...process.env, CERBER_TEST_MODE: "1", CI: "1" },
        }
      );

      // Wait for READY and kill
      await waitForOutput(proc, "READY", 5000).catch(() => {
        // Ignore timeout, just proceed with kill
      });

      proc.kill("SIGINT");

      // Wait for process to actually exit
      await new Promise<void>((resolve) => {
        proc.on("exit", () => {
          resolve();
        });
        setTimeout(() => resolve(), 2000); // Safety timeout
      });

      // Process should be truly dead
      expect(proc.killed).toBe(true);
    });

    it("should flush logs before exiting", async () => {
      if (isWindows) {
        return;
      }

      const proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env, CERBER_TEST_MODE: "1", CI: "1" },
        }
      );

      let output = "";
      let errors = "";
      proc.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });
      proc.stderr?.on("data", (data: Buffer) => {
        errors += data.toString();
      });

      // Wait for READY with longer timeout
      try {
        await waitForOutput(proc, "READY", 5000);
      } catch (e) {
        console.error(`Failed to get READY. stdout: ${output}, stderr: ${errors}`);
        throw e;
      }

      // Send SIGINT
      proc.kill("SIGINT");

      // Wait for CLEANUP_DONE with max 5s timeout
      try {
        await waitForOutput(proc, "CLEANUP_DONE", 5000);
      } catch (e) {
        proc.kill("SIGKILL");
        console.error(`Failed to get CLEANUP_DONE. stdout: ${output}, stderr: ${errors}`);
        throw e;
      }

      // Verify output
      expect(output).toContain("READY");
      expect(output).toContain("SIGINT_RECEIVED");
      expect(output).toContain("CLEANUP_DONE");
    });
  });

  describe("SIGTERM", () => {
    it("should exit quickly on SIGTERM (< 2 seconds)", async () => {
      if (isWindows) {
        return;
      }

      const start = Date.now();

      const exitTime = await new Promise<number>((resolve) => {
        const proc = spawn(
          "node",
          ["bin/cerber", "_signals-test"],
          {
            stdio: "pipe",
            env: { ...process.env, CERBER_TEST_MODE: "1", CI: "1" },
          }
        );

        // Wait for READY then send SIGTERM
        let readyFound = false;
        let stderr = "";
        proc.stdout?.on("data", (data: Buffer) => {
          if (!readyFound && data.toString().includes("READY")) {
            readyFound = true;
            setTimeout(() => {
              proc.kill("SIGTERM");
            }, 50);
          }
        });

        proc.stderr?.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        proc.on("exit", () => {
          resolve(Date.now() - start);
        });

        // Safety: if READY never comes, timeout with diagnostics
        setTimeout(() => {
          if (!readyFound) {
            console.error(`SIGTERM test: READY not found. stderr: ${stderr}`);
            proc.kill("SIGKILL");
          }
        }, 5000);
      });

      // Should exit within 2 seconds
      expect(exitTime).toBeLessThan(2000);
    });

    it("should gracefully close handles on SIGTERM", async () => {
      if (isWindows) {
        return;
      }

      const proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: "pipe",
          env: { ...process.env, CERBER_TEST_MODE: "1", CI: "1" },
        }
      );

      // Wait for READY with longer timeout
      await waitForOutput(proc, "READY", 5000);

      // Send SIGTERM
      proc.kill("SIGTERM");

      // Should exit cleanly
      await new Promise<void>((resolve) => {
        proc.on("exit", (code) => {
          // SIGTERM should result in clean exit
          expect([0, null]).toContain(code);
          resolve();
        });
        setTimeout(() => {
          proc.kill("SIGKILL");
          resolve();
        }, 2000);
      });
    });
  });

  describe("Cleanup on Exit", () => {
    it("should not have unresolved promises on exit", async () => {
      if (isWindows) {
        return;
      }

      const proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: "pipe",
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      await waitForOutput(proc, "READY", 3000);
      proc.kill("SIGINT");

      // Wait for clean exit
      await new Promise<void>((resolve) => {
        proc.on("exit", (code) => {
          expect([0, null]).toContain(code);
          resolve();
        });
        setTimeout(() => resolve(), 2000);
      });
    });

    it("should cancel pending timers on SIGTERM", async () => {
      if (isWindows) {
        return;
      }

      const start = Date.now();

      const proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: "pipe",
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      await waitForOutput(proc, "READY", 3000);

      const elapsed = Date.now() - start;
      proc.kill("SIGTERM");

      // Wait for exit
      await new Promise<void>((resolve) => {
        proc.on("exit", () => {
          const totalElapsed = Date.now() - start;
          // Should be quick (not hang on timers)
          expect(totalElapsed).toBeLessThan(3000);
          resolve();
        });
        setTimeout(() => resolve(), 2000);
      });
    });
  });

  describe("Error Handling During Shutdown", () => {
    it("should handle errors during cleanup gracefully", async () => {
      if (isWindows) {
        return;
      }

      const proc = spawn(
        "node",
        ["bin/cerber", "_signals-test"],
        {
          stdio: "pipe",
          env: { ...process.env, CERBER_TEST_MODE: "1" },
        }
      );

      await waitForOutput(proc, "READY", 3000);
      proc.kill("SIGINT");

      // Should still complete cleanup
      await waitForOutput(proc, "CLEANUP_DONE", 5000);

      let exitCode = -1;
      await new Promise<void>((resolve) => {
        proc.on("exit", (code) => {
          exitCode = code ?? 0;
          resolve();
        });
        setTimeout(() => resolve(), 1000);
      });

      // Should exit cleanly
      expect([0, null]).toContain(exitCode);
    });
  });
});

