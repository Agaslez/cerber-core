/**
 * Signals Test Command - Test-only CLI command
 *
 * Long-running process for testing signal handling (SIGINT/SIGTERM)
 * Only available when CERBER_TEST_MODE=1
 *
 * Output sequence:
 * 1. READY (process is running and ready to receive signals)
 * 2. SIGINT_RECEIVED (signal caught)
 * 3. CLEANUP_DONE (cleanup completed, exiting)
 */

export async function runSignalsTest(): Promise<void> {
  // Gate: only available in test mode
  if (process.env.CERBER_TEST_MODE !== '1') {
    process.stderr.write('❌ _signals-test is disabled (test mode only)\n');
    process.exit(2); // 2 = blocker/forbidden
  }

  // Keep process alive until a signal arrives
  // This is critical: without keepAlive, GitHub runners can kill the process
  // because the event loop appears idle
  const keepAlive = setInterval(() => {
    // do nothing - keeps event loop alive
  }, 1000);
  
  // Don't let this timer block process exit
  keepAlive.unref();

  // Cleanup handler for SIGINT/SIGTERM
  const cleanup = async (reason: string) => {
    try {
      process.stdout.write(`${reason}\n`);
      clearInterval(keepAlive);

      // Simulate cleanup / flush steps
      process.stdout.write('CLEANUP_DONE\n');
      process.exit(0);
    } catch (e) {
      process.stderr.write(`CLEANUP_ERROR: ${String(e)}\n`);
      clearInterval(keepAlive);
      process.exit(1);
    }
  };

  // Signal ready to receive signals - IMMEDIATELY and guaranteed
  process.stdout.write('READY\n');

  // Register signal handlers (using once to prevent double handling)
  process.once('SIGINT', () => void cleanup('SIGINT_RECEIVED'));
  process.once('SIGTERM', () => void cleanup('SIGTERM_RECEIVED'));

  // For the "handle errors during cleanup" test (if you use env toggle)
  if (process.env.CERBER_SIGNAL_TEST_FAIL_CLEANUP === '1') {
    process.once('SIGUSR1', () => {
      // force error path deterministically
      throw new Error('FORCED_CLEANUP_ERROR');
    });
  }
}
