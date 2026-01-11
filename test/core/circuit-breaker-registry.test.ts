/**
 * CircuitBreakerRegistry Cleanup Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 * @rule REFACTOR-9: Fix memory leak in long-running processes
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CircuitBreakerRegistry } from '../../src/core/circuit-breaker-registry.js';
import { CircuitState } from '../../src/core/circuit-breaker.js';

describe('CircuitBreakerRegistry Cleanup', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    registry = new CircuitBreakerRegistry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe('TTL-based Cleanup', () => {
    it('should cleanup unused breakers after TTL', () => {
      // Create breaker and access it
      const breaker1 = registry.getOrCreate('service-1');
      expect(registry.getSize()).toBe(1);

      // Move time forward (simulate passing TTL)
      const ttl = 100; // 100ms for testing
      jest.useFakeTimers();
      jest.advanceTimersByTime(ttl + 1);

      // Cleanup should remove it
      const removed = registry.cleanup(ttl);
      expect(removed).toBe(1);
      expect(registry.getSize()).toBe(0);

      jest.useRealTimers();
    });

    it('should NOT cleanup recently accessed breakers', () => {
      const breaker1 = registry.getOrCreate('service-1');
      const breaker2 = registry.getOrCreate('service-2');

      jest.useFakeTimers();
      jest.advanceTimersByTime(50); // Half of TTL

      // Access one breaker to update its timestamp
      registry.getOrCreate('service-1');

      jest.advanceTimersByTime(60); // Now 110ms total, first breaker at 60ms

      // Cleanup with TTL of 100ms
      const removed = registry.cleanup(100);

      // Only service-2 should be removed (idle > 100ms)
      // service-1 was accessed at 50ms, so idle = 110-50 = 60ms < 100ms
      expect(removed).toBe(1);
      expect(registry.getSize()).toBe(1);

      jest.useRealTimers();
    });

    it('should keep OPEN breakers even if unused', async () => {
      const breaker = registry.getOrCreate('service-1', { failureThreshold: 1 });

      // Open the circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Fail');
        });
      } catch {
        // Expected
      }

      expect(breaker.getStats().state).toBe(CircuitState.OPEN);

      // Move time forward past TTL
      jest.useFakeTimers();
      jest.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

      // OPEN breaker should NOT be cleaned up
      const removed = registry.cleanup();
      expect(removed).toBe(0);
      expect(registry.getSize()).toBe(1);

      jest.useRealTimers();
    });

    it('should remove CLOSED breakers after TTL', async () => {
      const breaker = registry.getOrCreate('service-1');

      // Ensure it's CLOSED
      await breaker.execute(async () => 'ok');
      expect(breaker.getStats().state).toBe(CircuitState.CLOSED);

      // Move time forward past TTL
      jest.useFakeTimers();
      jest.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

      // CLOSED breaker SHOULD be cleaned up
      const removed = registry.cleanup();
      expect(removed).toBe(1);
      expect(registry.getSize()).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('Registry Tracking', () => {
    it('should track breaker metadata', () => {
      registry.getOrCreate('service-1');
      registry.getOrCreate('service-2');

      const tracked = registry.getTrackedBreakers();

      expect(tracked).toHaveLength(2);
      expect(tracked[0].name).toBe('service-1');
      expect(tracked[1].name).toBe('service-2');
      expect(tracked[0].state).toBe(CircuitState.CLOSED);
      expect(tracked[0].ageMs).toBeGreaterThanOrEqual(0);
      expect(tracked[0].idleMs).toBeGreaterThanOrEqual(0);
    });

    it('should update lastAccessTime on getAllStats', () => {
      registry.getOrCreate('service-1');

      jest.useFakeTimers();
      jest.advanceTimersByTime(100);

      const tracked1 = registry.getTrackedBreakers();
      const idle1 = tracked1[0].idleMs;

      jest.advanceTimersByTime(50);

      // Calling getAllStats should update access time
      registry.getAllStats();

      const tracked2 = registry.getTrackedBreakers();
      const idle2 = tracked2[0].idleMs;

      // Idle time should be much less now
      expect(idle2).toBeLessThan(idle1);

      jest.useRealTimers();
    });

    it('should return correct size', () => {
      expect(registry.getSize()).toBe(0);

      registry.getOrCreate('service-1');
      expect(registry.getSize()).toBe(1);

      registry.getOrCreate('service-2');
      expect(registry.getSize()).toBe(2);

      registry.cleanup(0); // Remove all
      expect(registry.getSize()).toBe(0);
    });
  });

  describe('Manual Cleanup Control', () => {
    it('should allow manual cleanup with custom TTL', () => {
      registry.getOrCreate('short-ttl-service');
      registry.getOrCreate('long-ttl-service');

      jest.useFakeTimers();
      jest.advanceTimersByTime(500);

      // Only short-ttl service should be removed
      const removed = registry.cleanup(300); // 300ms TTL
      expect(removed).toBe(2); // Both are idle > 300ms

      jest.useRealTimers();
    });

    it('should allow clearing all breakers', () => {
      registry.getOrCreate('service-1');
      registry.getOrCreate('service-2');
      registry.getOrCreate('service-3');

      expect(registry.getSize()).toBe(3);

      registry.clear();

      expect(registry.getSize()).toBe(0);
    });

    it('should update access time on getOrCreate', () => {
      registry.getOrCreate('service-1');

      jest.useFakeTimers();
      jest.advanceTimersByTime(100);

      const tracked1 = registry.getTrackedBreakers();
      expect(tracked1[0].idleMs).toBeGreaterThanOrEqual(100);

      // Access the breaker again
      registry.getOrCreate('service-1');

      const tracked2 = registry.getTrackedBreakers();
      expect(tracked2[0].idleMs).toBeLessThan(5); // Should be very recent

      jest.useRealTimers();
    });
  });

  describe('Periodic Cleanup', () => {
    it('should start and stop periodic cleanup', () => {
      const registryWithCleanup = new CircuitBreakerRegistry(true);

      registryWithCleanup.getOrCreate('service-1');
      expect(registryWithCleanup.getSize()).toBe(1);

      // Manually stop cleanup (normally would run every 10 minutes)
      registryWithCleanup.stopPeriodicCleanup();

      registryWithCleanup.clear();
    });
  });

  describe('Integration with CircuitBreaker', () => {
    it('should track breaker state changes', async () => {
      const breaker = registry.getOrCreate('test-service', { failureThreshold: 2 });

      // Cause failures to open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }

      const tracked = registry.getTrackedBreakers();
      expect(tracked[0].state).toBe(CircuitState.OPEN);
    });

    it('should preserve breaker references after cleanup', async () => {
      const breaker1 = registry.getOrCreate('service-1');
      await breaker1.execute(async () => 'ok');
      expect(breaker1.getStats().state).toBe(CircuitState.CLOSED);

      // The breaker reference should remain valid even after cleanup
      // This test ensures we're not breaking object references
      jest.useFakeTimers();
      jest.advanceTimersByTime(61 * 60 * 1000); // 61 minutes

      // breaker1 is CLOSED, so it would be cleaned up
      registry.cleanup();

      // But the breaker1 variable still holds a valid reference
      // It should still work
      const result = await breaker1.execute(async () => 'still-works');
      expect(result).toBe('still-works');

      jest.useRealTimers();
    });
  });
});
