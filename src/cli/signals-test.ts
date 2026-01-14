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

  // Guard: prevent cleanup from running multiple times
  let cleanupStarted = false;

  // Cleanup handler with guaranteed stdout flush via callback
  const cleanup = (reason: string): void => {
    // CRITICAL: Guard against multiple cleanup calls
    if (cleanupStarted) {
      process.stderr.write(`[DEBUG] Cleanup already started, ignoring signal: ${reason}\n`);
      return;
    }
    cleanupStarted = true;

    try {
      process.stderr.write(`[DEBUG] Cleanup started for: ${reason}\n`);
      
      // Step 1: Clear timers immediately
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);

      // Step 2: Log signal received with callback-based flush guarantee
      process.stdout.write(`${reason}\n`, () => {
        process.stderr.write(`[DEBUG] Signal logged, performing cleanup work...\n`);
        
        // Step 3: Simulate cleanup work (100ms)
        setTimeout(() => {
          process.stderr.write(`[DEBUG] Cleanup work done, logging CLEANUP_DONE...\n`);
          
          // Step 4: Log cleanup done with callback-based flush guarantee
          process.stdout.write('CLEANUP_DONE\n', () => {
            process.stderr.write(`[DEBUG] CLEANUP_DONE logged, exiting process...\n`);
            // This callback fires ONLY after CLEANUP_DONE is flushed
            // Now safe to exit
            process.exit(0);
          });
        }, 100);
      });
    } catch (e) {
      process.stderr.write(`CLEANUP_ERROR: ${String(e)}\n`);
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);
      process.exit(1);
    }
  };

  // Write READY immediately with guaranteed flush via callback
  process.stdout.write('READY\n', () => {
    process.stderr.write(`[DEBUG] READY signal flushed, handlers registered\n`);
  });

  // Register signal handlers (synchronous, no async overhead)
  process.on('SIGINT', () => {
    process.stderr.write(`[DEBUG] Received SIGINT\n`);
    cleanup('SIGINT_RECEIVED');
  });
  
  process.on('SIGTERM', () => {
    process.stderr.write(`[DEBUG] Received SIGTERM\n`);
    cleanup('SIGTERM_RECEIVED');
  });

  // For test that triggers cleanup failure
  if (process.env.CERBER_SIGNAL_TEST_FAIL_CLEANUP === '1') {
    process.once('SIGUSR1', () => {
      throw new Error('FORCED_CLEANUP_ERROR');
    });
  }
}
