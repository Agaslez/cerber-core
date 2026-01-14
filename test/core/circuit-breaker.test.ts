/**
 * @file Circuit Breaker Tests
 * @rule Comprehensive test coverage for P2.1: Circuit Breaker
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
    CircuitBreaker,
    CircuitBreakerOpenError,
    CircuitBreakerRegistry,
    circuitBreakers,
    CircuitState
} from '../../src/core/circuit-breaker.js';

describe('@fast CircuitBreaker', () => {
  describe('State Transitions', () => {
    it('starts in CLOSED state', () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      const stats = breaker.getStats();
      
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
    
    it('transitions to OPEN after failure threshold exceeded', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 3,
        failureWindow: 60000
      });
      
      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Simulated failure');
          });
        } catch {
          // Expected
        }
      }
      
      const stats = breaker.getStats();
      expect(stats.state).toBe(CircuitState.OPEN);
      expect(stats.failures).toBe(3);
    });
    
    it('transitions to HALF_OPEN after reset timeout', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        resetTimeout: 100 // 100ms
      });
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }
      
      expect(breaker.getStats().state).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Next call should transition to HALF_OPEN
      try {
        await breaker.execute(async () => {
          throw new Error('Still failing');
        });
      } catch {
        // Expected
      }
      
      expect(breaker.getStats().state).toBe(CircuitState.OPEN); // Back to OPEN because call failed
    });
    
    it('transitions to CLOSED after successful recovery in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        resetTimeout: 100,
        successThreshold: 2
      });
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }
      
      expect(breaker.getStats().state).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Succeed twice in HALF_OPEN state
      await breaker.execute(async () => 'success-1');
      await breaker.execute(async () => 'success-2');
      
      const stats = breaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.consecutiveSuccesses).toBe(0); // Reset after closing
    });
  });
  
  describe('Fail Fast Behavior', () => {
    it('throws CircuitBreakerOpenError when circuit is OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2
      });
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }
      
      // Next call should fail fast
      await expect(
        breaker.execute(async () => 'should not execute')
      ).rejects.toThrow(CircuitBreakerOpenError);
    });
    
    it('does not execute function when circuit is OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2
      });
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }
      
      const fn = jest.fn(async () => 'should not execute');
      
      try {
        await breaker.execute(fn);
      } catch {
        // Expected
      }
      
      expect(fn).not.toHaveBeenCalled();
    });
  });
  
  describe('Failure Window', () => {
    it('only counts failures within the time window', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 3,
        failureWindow: 100 // 100ms window
      });
      
      // Fail once
      try {
        await breaker.execute(async () => {
          throw new Error('Fail 1');
        });
      } catch {
        // Expected
      }
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Fail twice more (only these should count)
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error(`Fail ${i + 2}`);
          });
        } catch {
          // Expected
        }
      }
      
      // Circuit should still be CLOSED (only 2 failures in window)
      expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
    });
  });
  
  describe('Success Threshold', () => {
    it('requires multiple successes to close from HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        resetTimeout: 100,
        successThreshold: 3
      });
      
      // Open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }
      
      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // One success - should stay HALF_OPEN
      await breaker.execute(async () => 'success-1');
      expect(breaker.getStats().state).toBe(CircuitState.HALF_OPEN);
      
      // Two successes - should stay HALF_OPEN
      await breaker.execute(async () => 'success-2');
      expect(breaker.getStats().state).toBe(CircuitState.HALF_OPEN);
      
      // Three successes - should close
      await breaker.execute(async () => 'success-3');
      expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
    });
    
    it('resets consecutive successes on failure in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2,
        resetTimeout: 100,
        successThreshold: 2
      });
      
      // Open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }
      
      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // One success
      await breaker.execute(async () => 'success-1');
      expect(breaker.getStats().consecutiveSuccesses).toBe(1);
      
      // Fail - should reset consecutive successes
      try {
        await breaker.execute(async () => {
          throw new Error('Fail again');
        });
      } catch {
        // Expected
      }
      
      expect(breaker.getStats().consecutiveSuccesses).toBe(0);
    });
  });
  
  describe('Statistics', () => {
    it('tracks total calls, failures, and successes', async () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      
      // 3 successes
      await breaker.execute(async () => 'ok-1');
      await breaker.execute(async () => 'ok-2');
      await breaker.execute(async () => 'ok-3');
      
      // 2 failures
      try {
        await breaker.execute(async () => {
          throw new Error('Fail-1');
        });
      } catch {
        // Expected
      }
      
      try {
        await breaker.execute(async () => {
          throw new Error('Fail-2');
        });
      } catch {
        // Expected
      }
      
      const stats = breaker.getStats();
      expect(stats.totalCalls).toBe(5);
      expect(stats.totalSuccesses).toBe(3);
      expect(stats.totalFailures).toBe(2);
    });
    
    it('tracks last failure time', async () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      
      const beforeFailure = Date.now();
      
      try {
        await breaker.execute(async () => {
          throw new Error('Fail');
        });
      } catch {
        // Expected
      }
      
      const afterFailure = Date.now();
      const stats = breaker.getStats();
      
      expect(stats.lastFailureTime).toBeGreaterThanOrEqual(beforeFailure);
      expect(stats.lastFailureTime).toBeLessThanOrEqual(afterFailure);
    });
  });
  
  describe('Force Open/Close', () => {
    it('forceOpen() opens circuit immediately', () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      
      expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
      
      breaker.forceOpen();
      
      expect(breaker.getStats().state).toBe(CircuitState.OPEN);
    });
    
    it('forceClose() closes circuit and resets stats', async () => {
      const breaker = new CircuitBreaker({
        name: 'test',
        failureThreshold: 2
      });
      
      // Open circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Fail');
          });
        } catch {
          // Expected
        }
      }
      
      expect(breaker.getStats().state).toBe(CircuitState.OPEN);
      expect(breaker.getStats().failures).toBe(2);
      
      breaker.forceClose();
      
      const stats = breaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.failures).toBe(0);
      expect(stats.consecutiveSuccesses).toBe(0);
    });
  });
  
  describe('Error Handling', () => {
    it('propagates original error when circuit is CLOSED', async () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      
      const originalError = new Error('Original error');
      
      await expect(
        breaker.execute(async () => {
          throw originalError;
        })
      ).rejects.toThrow('Original error');
    });
    
    it('throws CircuitBreakerOpenError when circuit is OPEN', async () => {
      const breaker = new CircuitBreaker({
        name: 'test-service',
        failureThreshold: 1
      });
      
      // Open circuit
      try {
        await breaker.execute(async () => {
          throw new Error('Fail');
        });
      } catch {
        // Expected
      }
      
      // Should throw CircuitBreakerOpenError
      await expect(
        breaker.execute(async () => 'ignored')
      ).rejects.toThrow(CircuitBreakerOpenError);
      
      await expect(
        breaker.execute(async () => 'ignored')
      ).rejects.toThrow(/Circuit breaker OPEN for test-service/);
    });
  });
  
  describe('Return Values', () => {
    it('returns function result when successful', async () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      
      const result = await breaker.execute(async () => 'success result');
      
      expect(result).toBe('success result');
    });
    
    it('returns complex objects', async () => {
      const breaker = new CircuitBreaker({ name: 'test' });
      
      const complexResult = { data: [1, 2, 3], meta: { total: 3 } };
      const result = await breaker.execute(async () => complexResult);
      
      expect(result).toEqual(complexResult);
    });
  });
});

describe('CircuitBreakerRegistry', () => {
  let registry: CircuitBreakerRegistry;
  
  beforeEach(() => {
    registry = new CircuitBreakerRegistry();
  });
  
  it('creates new circuit breakers on demand', () => {
    const breaker1 = registry.getOrCreate('service-1');
    const breaker2 = registry.getOrCreate('service-2');
    
    expect(breaker1).toBeDefined();
    expect(breaker2).toBeDefined();
    expect(breaker1).not.toBe(breaker2);
  });
  
  it('returns existing breaker for same name', () => {
    const breaker1 = registry.getOrCreate('service-1');
    const breaker2 = registry.getOrCreate('service-1');
    
    expect(breaker1).toBe(breaker2);
  });
  
  it('applies custom options when creating breaker', () => {
    const breaker = registry.getOrCreate('service-1', {
      failureThreshold: 10
    });
    
    // Verify by failing 5 times (should not open with threshold=10)
    for (let i = 0; i < 5; i++) {
      breaker.execute(async () => {
        throw new Error('Fail');
      }).catch(() => {});
    }
    
    // Give time for async execution
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(breaker.getStats().state).toBe(CircuitState.CLOSED);
        resolve();
      }, 50);
    });
  });
  
  it('getAllStats returns stats for all breakers', async () => {
    const breaker1 = registry.getOrCreate('service-1');
    const breaker2 = registry.getOrCreate('service-2');
    
    await breaker1.execute(async () => 'ok');
    await breaker2.execute(async () => 'ok');
    
    const allStats = registry.getAllStats();
    
    expect(allStats).toHaveProperty('service-1');
    expect(allStats).toHaveProperty('service-2');
    expect(allStats['service-1'].totalSuccesses).toBe(1);
    expect(allStats['service-2'].totalSuccesses).toBe(1);
  });
  
  it('resetAll closes and resets all breakers', async () => {
    const breaker1 = registry.getOrCreate('service-1', { failureThreshold: 1 });
    const breaker2 = registry.getOrCreate('service-2', { failureThreshold: 1 });
    
    // Open both circuits
    try {
      await breaker1.execute(async () => {
        throw new Error('Fail');
      });
    } catch {
      // Expected
    }
    
    try {
      await breaker2.execute(async () => {
        throw new Error('Fail');
      });
    } catch {
      // Expected
    }
    
    expect(breaker1.getStats().state).toBe(CircuitState.OPEN);
    expect(breaker2.getStats().state).toBe(CircuitState.OPEN);
    
    registry.resetAll();
    
    expect(breaker1.getStats().state).toBe(CircuitState.CLOSED);
    expect(breaker2.getStats().state).toBe(CircuitState.CLOSED);
  });
});

describe('Global Registry', () => {
  it('circuitBreakers is a global singleton', () => {
    const breaker1 = circuitBreakers.getOrCreate('global-service');
    const breaker2 = circuitBreakers.getOrCreate('global-service');
    
    expect(breaker1).toBe(breaker2);
  });
});
