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

export function runSignalsTest(): void {
  // Gate: only available in test mode
  if (process.env.CERBER_TEST_MODE !== '1') {
    process.stderr.write('❌ _signals-test is disabled (test mode only)\n');
    process.exit(2);
  }

  // Keep process alive
  const keepAlive = setInterval(() => {
    // do nothing - keeps event loop alive
  }, 100);
  keepAlive.unref();

  // Safety timeout - prevent hanging forever
  const safetyTimeout = setTimeout(() => {
    process.stdout.write('SAFETY_TIMEOUT_REACHED\n');
    process.exit(0);
  }, 60000);
  safetyTimeout.unref();

  // Cleanup handler - ASYNC to properly handle signal completion
  const cleanup = async (reason: string): Promise<void> => {
    try {
      // Step 1: Log signal received
      process.stdout.write(`${reason}\n`);
      
      // Step 2: Clear timers
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);

      // Step 3: Simulate cleanup work (100ms)
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Step 4: Log cleanup done
      process.stdout.write('CLEANUP_DONE\n');
      
      // Step 5: Exit after another 100ms to ensure flush
      await new Promise((resolve) => setTimeout(resolve, 100));
      process.exit(0);
    } catch (e) {
      process.stderr.write(`CLEANUP_ERROR: ${String(e)}\n`);
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);
      process.exit(1);
    }
  };

  // Write READY immediately
  process.stdout.write('READY\n');

  // Register signal handlers with proper async handling
  process.on('SIGINT', () => {
    cleanup('SIGINT_RECEIVED').catch(() => process.exit(1));
  });
  
  process.on('SIGTERM', () => {
    cleanup('SIGTERM_RECEIVED').catch(() => process.exit(1));
  });

  // For test that triggers cleanup failure
  if (process.env.CERBER_SIGNAL_TEST_FAIL_CLEANUP === '1') {
    process.once('SIGUSR1', () => {
      throw new Error('FORCED_CLEANUP_ERROR');
    });
  }
}
