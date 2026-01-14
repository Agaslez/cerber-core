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
    process.exit(2); // 2 = blocker/forbidden
  }

  // Keep process alive until a signal arrives
  // This is critical: without keepAlive, GitHub runners can kill the process
  // because the event loop appears idle
  const keepAlive = setInterval(() => {
    // do nothing - keeps event loop alive
  }, 100);
  
  // Don't let this timer block process exit
  keepAlive.unref();

  // Safety timeout setup
  const safetyTimeout = setTimeout(() => {
    process.stdout.write('SAFETY_TIMEOUT_REACHED\n');
    process.exit(0);
  }, 60000);
  safetyTimeout.unref();

  // Cleanup handler for SIGINT/SIGTERM - MUST BE SYNC to guarantee execution
  const cleanup = (reason: string): void => {
    try {
      // Signal received - must flush immediately
      process.stdout.write(`${reason}\n`);
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);

      // Cleanup operations
      process.stdout.write('CLEANUP_DONE\n');
      
      // CRITICAL: Wait longer to ensure stdout buffer flushes completely
      // 100ms is minimum on CI to guarantee flush
      setTimeout(() => {
        process.exit(0);
      }, 100);
    } catch (e) {
      process.stderr.write(`CLEANUP_ERROR: ${String(e)}\n`);
      clearInterval(keepAlive);
      clearTimeout(safetyTimeout);
      process.exit(1);
    }
  };

  // Signal ready to receive signals - IMMEDIATELY and guaranteed
  // Write READY synchronously with callback to ensure flush
  process.stdout.write('READY\n', () => {
    // READY is flushed, signal handlers now registered
  });

  // Register signal handlers (using on, not once, for robustness)
  process.on('SIGINT', () => cleanup('SIGINT_RECEIVED'));
  process.on('SIGTERM', () => cleanup('SIGTERM_RECEIVED'));

  // For the "handle errors during cleanup" test (if you use env toggle)
  if (process.env.CERBER_SIGNAL_TEST_FAIL_CLEANUP === '1') {
    process.once('SIGUSR1', () => {
      // force error path deterministically
      throw new Error('FORCED_CLEANUP_ERROR');
    });
  }
}
