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
    console.error('❌ _signals-test is disabled (test mode only)');
    process.exit(2); // 2 = blocker/forbidden
  }

  // Signal ready to receive signals
  console.log('READY');

  // Track cleanup state
  let isCleaningUp = false;

  /**
   * Cleanup handler for SIGINT/SIGTERM
   */
  const cleanup = async () => {
    if (isCleaningUp) {
      return; // Prevent double cleanup
    }
    isCleaningUp = true;

    console.log('SIGINT_RECEIVED');

    // Simulate cleanup work (close connections, flush logs, etc)
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('CLEANUP_DONE');
    process.exit(0);
  };

  // Register signal handlers
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Long-running loop (60 seconds or until interrupted)
  let running = true;
  const startTime = Date.now();

  const interval = setInterval(() => {
    if (!running || Date.now() - startTime > 60000) {
      clearInterval(interval);
      running = false;
      process.exit(0);
    }
  }, 1000);

  // Prevent immediate exit - wait for signal
  await new Promise(() => {
    // Never resolves - intentional, waiting for signal or timeout
  });
}
