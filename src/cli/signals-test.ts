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

  // Cleanup handler with cork/uncork for atomic flush guarantee
  const cleanup = (reason: string): void => {
    // CRITICAL: Guard against multiple cleanup calls
    if (cleanupStarted) {
      process.stderr.write(`[DEBUG] Cleanup already started, ignoring signal: ${reason}\n`);
      return;
    }
    cleanupStarted = true;

    try {
      process.stderr.write(`[DEBUG] Cleanup START for: ${reason}\n`);
      
      // Step 1: Clear timers immediately
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);
      process.stderr.write(`[DEBUG] Step 1: Timers cleared\n`);

      // Step 2: Atomically write signal with cork/uncork
      process.stdout.cork();
      process.stdout.write(`${reason}\n`);
      process.stderr.write(`[DEBUG] Step 2a: Signal message written (corked)\n`);

      // Step 3: Simulate cleanup work (100ms delay BEFORE cleanup_done)
      setTimeout(() => {
        process.stderr.write(`[DEBUG] Step 3: Cleanup work simulation done\n`);
        
        // Step 4: Write cleanup_done THEN uncork to flush atomically
        process.stdout.write('CLEANUP_DONE\n');
        process.stderr.write(`[DEBUG] Step 4a: CLEANUP_DONE written (still corked)\n`);
        
        // CRITICAL: uncork() flushes the corked writes atomically
        process.stdout.uncork();
        process.stderr.write(`[DEBUG] Step 4b: uncork() called - buffer will flush\n`);
        
        // Step 5: Exit AFTER uncork to allow flush
        process.stderr.write(`[DEBUG] Step 5: Scheduling exit via setImmediate\n`);
        setImmediate(() => {
          process.stderr.write(`[DEBUG] Step 5b: setImmediate fired - calling process.exit(0)\n`);
          process.exit(0);
        });
      }, 100);
    } catch (e) {
      process.stderr.write(`CLEANUP_ERROR: ${String(e)}\n`);
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);
      process.exit(1);
    }
  };

  // Write READY immediately with cork/uncork guarantee
  process.stdout.cork();
  process.stdout.write('READY\n');
  process.stdout.uncork();
  process.stderr.write(`[DEBUG] READY flushed, handlers registered\n`);

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
