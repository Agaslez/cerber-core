/**
 * Process Cleanup Management
 *
 * Centralized signal handling and graceful shutdown logic.
 * Ensures deterministic process termination with proper stdout/stderr flushing.
 *
 * Features:
 * - Prevents multiple concurrent cleanup invocations via guard flag
 * - Atomic stdout writes using cork/uncork pattern
 * - Configurable timeout buffers for OS-level flushing
 * - Production-ready error handling with fallback paths
 * - Full diagnostic logging (separate from application output)
 */

let cleanupStarted = false;

export function resetCleanupGuard(): void {
  cleanupStarted = false;
}

function now(): string {
  return new Date().toISOString();
}

export function cleanup(
  reason: string,
  options: { timeout?: number; stderr?: boolean } = {}
): void {
  const { timeout = 50, stderr: writeDiagnostics = true } = options;

  if (cleanupStarted) {
    if (writeDiagnostics) {
      process.stderr.write(`[${now()}] [DEBUG] Cleanup already started, ignoring: ${reason}\n`);
    }
    return;
  }
  cleanupStarted = true;

  try {
    if (writeDiagnostics) {
      process.stderr.write(`[${now()}] [DEBUG] Cleanup STARTED for reason=${reason}\n`);
    }

    process.stdin.destroy();
    if (writeDiagnostics) {
      process.stderr.write(`[${now()}] [DEBUG] Step 1: stdin destroyed\n`);
    }

    if (writeDiagnostics) {
      process.stderr.write(`[${now()}] [DEBUG] Step 2: Timer management delegated to caller\n`);
    }

    process.stdout.cork();
    process.stdout.write('CLEANUP_DONE\n');
    if (writeDiagnostics) {
      process.stderr.write(`[${now()}] [DEBUG] Step 3-4: CLEANUP_DONE message corked\n`);
    }

    process.stdout.uncork();
    if (writeDiagnostics) {
      process.stderr.write(`[${now()}] [DEBUG] Step 5: uncork() called - stdout flushing...\n`);
    }

    if (writeDiagnostics) {
      process.stderr.write(`[${now()}] [DEBUG] Step 6: Scheduling exit after ${timeout}ms delay\n`);
    }

    setTimeout(() => {
      if (writeDiagnostics) {
        process.stderr.write(`[${now()}] [DEBUG] Step 6b: ${timeout}ms elapsed - calling process.exit(0)\n`);
      }
      process.exit(0);
    }, timeout);
  } catch (error) {
    if (writeDiagnostics) {
      process.stderr.write(
        `[${now()}] [ERROR] Cleanup exception: ${error instanceof Error ? error.message : String(error)}\n`
      );
    }

    try {
      process.stdin.destroy();
    } catch {
      // Ignore
    }

    process.exit(1);
  }
}

export function registerSignalHandlers(): void {
  const signalHandler = (signal: NodeJS.Signals) => {
    process.stderr.write(
      `[${now()}] [DEBUG] Signal handler: ${signal} received, starting cleanup\n`
    );
    cleanup(signal);
  };

  process.on('SIGINT', () => signalHandler('SIGINT'));
  process.on('SIGTERM', () => signalHandler('SIGTERM'));

  process.stderr.write(`[${now()}] [DEBUG] Signal handlers registered (SIGINT, SIGTERM)\n`);
}
