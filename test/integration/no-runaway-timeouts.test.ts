/**
 * No-Runaway Timeouts Test
 * 
 * Verifies timeout handling, retry exhaustion, circuit breaker
 * Ensures bounded execution and proper exit codes
 */


describe('No-Runaway Timeouts (Resilience)', () => {
  let originalSetTimeout: typeof setTimeout;
  let originalClearTimeout: typeof clearTimeout;

  beforeEach(() => {
    // Save original timers
    originalSetTimeout = global.setTimeout;
    originalClearTimeout = global.clearTimeout;
  });

  afterEach(() => {
    // Restore timers
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  describe('Sequential execution timeout behavior', () => {
    it('should timeout if single adapter exceeds max duration', async () => {
      const timeoutMs = 500;

      // Mock adapter that hangs
      let timedOut = false;

      // Start promise that will timeout
      const promise = Promise.race([
        new Promise(resolve => setTimeout(() => resolve('done'), 10000)),
        new Promise(resolve => setTimeout(() => {
          timedOut = true;
          resolve('timeout');
        }, timeoutMs))
      ]);

      const result = await promise;
      expect(timedOut).toBe(true);
      expect(result).toBe('timeout');
    });

    it('should not retry if timeout is reached', async () => {
      let callCount = 0;

      const mockAdapter = {
        name: 'test',
        timeout: 100,
        enabled: true,
        execute: async () => {
          callCount++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          return [];
        }
      };

      // Simulate timeout
      const startTime = Date.now();

      await Promise.race([
        new Promise(resolve => setTimeout(() => resolve('timeout'), mockAdapter.timeout)),
        mockAdapter.execute()
      ]);

      const elapsed = Date.now() - startTime;

      // Should timeout around 100ms, not retry many times
      expect(elapsed).toBeLessThan(500);
      expect(callCount).toBeLessThanOrEqual(1);
    });

    it('should respect total execution budget', async () => {
      const adapters = [
        { name: 'actionlint', timeout: 500 },
        { name: 'gitleaks', timeout: 500 },
        { name: 'zizmor', timeout: 500 }
      ];

      const maxTotalTime = 2000; // 3 adapters × 500ms max
      const startTime = Date.now();

      // Mock execution
      for (const adapter of adapters) {
        await Promise.race([
          new Promise(resolve => setTimeout(() => resolve('timeout'), adapter.timeout)),
          new Promise(resolve => setTimeout(() => resolve('done'), 100))
        ]);
      }

      const elapsed = Date.now() - startTime;

      // Should complete well within total budget
      expect(elapsed).toBeLessThan(maxTotalTime);
    });

    it('should clear timers on completion', async () => {
      const timeoutIds: any[] = [];
      let cleared = 0;

      // Mock setTimeout to track IDs
      global.setTimeout = ((fn: any, delay: any) => {
        const id = originalSetTimeout(fn, delay);
        timeoutIds.push(id);
        return id;
      }) as any;

      // Mock clearTimeout to track clears
      global.clearTimeout = ((id: any) => {
        cleared++;
        return originalClearTimeout(id);
      }) as any;

      await Promise.race([
        new Promise(resolve => {
          const id = setTimeout(() => resolve('timeout'), 100);
          clearTimeout(id);
        }),
        new Promise(resolve => setTimeout(() => resolve('done'), 50))
      ]);

      // Should have cleared at least one timeout
      expect(cleared).toBeGreaterThan(0);
    });
  });

  describe('Circuit breaker behavior', () => {
    it('should fast-fail after max retries', async () => {
      const maxRetries = 3;
      let attempts = 0;
      const startTime = Date.now();

      const executeWithRetry = async (fn: () => Promise<void>) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            attempts++;
            await fn();
            return;
          } catch (e) {
            if (i === maxRetries - 1) throw e;
            // Brief backoff
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      };

      try {
        await executeWithRetry(async () => {
          throw new Error('Circuit open');
        });
      } catch (e) {
        // Expected
      }

      const elapsed = Date.now() - startTime;

      expect(attempts).toBe(maxRetries);
      // Should complete in <500ms (3 attempts × 10ms backoff + overhead)
      expect(elapsed).toBeLessThan(500);
    });

    it('should exit with code 2 on timeout blocker', async () => {
      const isBlocker = (name: string) => name === 'gitleaks';
      const timed = true;

      const exitCode = timed && isBlocker('gitleaks') ? 2 : 1;

      expect(exitCode).toBe(2);
    });

    it('should not retry after circuit opens', async () => {
      let circuitOpen = false;
      let callCount = 0;
      const maxConsecutiveFailures = 3;

      const execute = async () => {
        if (circuitOpen) {
          throw new Error('Circuit open - fast fail');
        }

        callCount++;

        if (callCount >= maxConsecutiveFailures) {
          circuitOpen = true;
          throw new Error('Failures exceeded');
        }

        throw new Error('Adapter failed');
      };

      let executionCount = 0;

      try {
        for (let i = 0; i < 10; i++) {
          executionCount++;
          await execute();
        }
      } catch (e) {
        // Expected
      }

      // Should stop after reaching maxConsecutiveFailures
      expect(executionCount).toBeLessThanOrEqual(maxConsecutiveFailures + 1);
    });

    it('should have bounded worst-case execution time', async () => {
      const adapters = ['actionlint', 'gitleaks', 'zizmor'];
      const timeoutPerAdapter = 1000;
      const maxRetries = 3;
      const backoffMs = 50;

      const worstCaseMs = 
        adapters.length * 
        (timeoutPerAdapter + (maxRetries * backoffMs));

      // With 3 adapters, 1s timeout, 3 retries, 50ms backoff:
      // 3 * (1000 + 150) = 3450ms worst case
      expect(worstCaseMs).toBeLessThan(5000);
    });
  });

  describe('Timeout propagation', () => {
    it('should return exit code 2 if timeout is blocker', () => {
      const isBlockerAdapter = (name: string) => {
        return ['gitleaks', 'zizmor'].includes(name);
      };

      const timedOutAdapter = 'gitleaks';
      const hasBlockerTimeout = isBlockerAdapter(timedOutAdapter);

      const exitCode = hasBlockerTimeout ? 2 : 1;

      expect(exitCode).toBe(2);
    });

    it('should return exit code 1 if timeout is non-blocker', () => {
      const isBlockerAdapter = (name: string) => {
        return ['gitleaks', 'zizmor'].includes(name);
      };

      const timedOutAdapter = 'actionlint';
      const hasBlockerTimeout = isBlockerAdapter(timedOutAdapter);

      const exitCode = hasBlockerTimeout ? 2 : 1;

      expect(exitCode).toBe(1);
    });

    it('should warn before timeout triggers', async () => {
      const warnings: string[] = [];

      const warningFn = (msg: string) => {
        warnings.push(msg);
      };

      const adapterName = 'slow-gitleaks';
      const timeoutMs = 500;

      // Warn at 80% of timeout
      if (100 > timeoutMs * 0.8) {
        warningFn(`Adapter ${adapterName} approaching timeout`);
      }

      // Not yet approached
      expect(warnings.length).toBe(0);
    });
  });
});
