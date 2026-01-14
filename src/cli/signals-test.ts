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

  // Helper: Get current timestamp for diagnostic logs
  const now = () => new Date().toISOString();

  // Cleanup handler with socket + stdin destruction for complete isolation
  const cleanup = (reason: string): void => {
    // CRITICAL: Guard against multiple cleanup calls
    if (cleanupStarted) {
      process.stderr.write(`[${now()}] [DEBUG] Cleanup already started, ignoring: ${reason}\n`);
      return;
    }
    cleanupStarted = true;

    try {
      process.stderr.write(`[${now()}] [DEBUG] Cleanup STARTED for reason=${reason}\n`);
      
      // Step 1: Destroy stdin immediately (prevents hanging on input)
      process.stdin.destroy();
      process.stderr.write(`[${now()}] [DEBUG] Step 1: stdin destroyed\n`);
      
      // Step 2: Clear all timers
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);
      process.stderr.write(`[${now()}] [DEBUG] Step 2: All timers cleared\n`);

      // Step 3: Cork stdout for atomic writes
      process.stdout.cork();
      process.stdout.write(`${reason}\n`);
      process.stderr.write(`[${now()}] [DEBUG] Step 3a: Signal message corked\n`);

      // Step 4: After 100ms delay, write cleanup_done and uncork
      setTimeout(() => {
        process.stderr.write(`[${now()}] [DEBUG] Step 4a: 100ms elapsed, writing CLEANUP_DONE\n`);
        
        process.stdout.write('CLEANUP_DONE\n');
        process.stderr.write(`[${now()}] [DEBUG] Step 4b: CLEANUP_DONE written (still corked)\n`);
        
        // Uncork to flush atomically
        process.stdout.uncork();
        process.stderr.write(`[${now()}] [DEBUG] Step 4c: uncork() called - flushing...\n`);
        
        // Step 5: Final timeout before exit (50ms for OS to flush)
        process.stderr.write(`[${now()}] [DEBUG] Step 5: Scheduling final exit via setTimeout(50)\n`);
        setTimeout(() => {
          process.stderr.write(`[${now()}] [DEBUG] Step 5b: setTimeout(50) fired - calling process.exit(0)\n`);
          process.exit(0);
        }, 50);
      }, 100);
    } catch (e) {
      process.stderr.write(`[${now()}] [ERROR] CLEANUP_ERROR: ${String(e)}\n`);
      try {
        clearInterval(keepAlive);
        clearTimeout(safetyTimeout);
        process.stdin.destroy();
      } catch {
        // Ignore errors during emergency cleanup
      }
      process.exit(1);
    }
  };

  // Write READY immediately with cork/uncork guarantee
  process.stdout.cork();
  process.stdout.write('READY\n');
  process.stdout.uncork();
  process.stderr.write(`[${now()}] [DEBUG] READY flushed, handlers registered\n`);

  // Register signal handlers (synchronous, no async overhead)
  process.on('SIGINT', () => {
    process.stderr.write(`[${now()}] [DEBUG] Signal handler: SIGINT received\n`);
    cleanup('SIGINT_RECEIVED');
  });
  
  process.on('SIGTERM', () => {
    process.stderr.write(`[${now()}] [DEBUG] Signal handler: SIGTERM received\n`);
    cleanup('SIGTERM_RECEIVED');
  });

  // For test that triggers cleanup failure
  if (process.env.CERBER_SIGNAL_TEST_FAIL_CLEANUP === '1') {
    process.once('SIGUSR1', () => {
      throw new Error('FORCED_CLEANUP_ERROR');
    });
  }
}
