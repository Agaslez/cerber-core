import { describe, expect, it } from '@jest/globals';
import { CircuitBreaker } from '../../src/core/circuit-breaker.js';

describe('@integration Integration: Circuit Breaker', () => {
  it('should track successful operations', async () => {
    const breaker = new CircuitBreaker({
      name: 'success-test',
      failureThreshold: 3,
      resetTimeout: 1000,
    });

    const result = await breaker.execute(async () => {
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(breaker.getStats().successes).toBe(1);
    expect(breaker.getStats().state).toBe('CLOSED');
  });

  it('should open circuit after threshold', async () => {
    const breaker = new CircuitBreaker({
      name: 'threshold-test',
      failureThreshold: 3,
      resetTimeout: 1000,
    });

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Failure');
        });
      } catch {}
    }

    expect(breaker.getStats().state).toBe('OPEN');

    await expect(
      breaker.execute(async () => 'never-called')
    ).rejects.toThrow('Circuit breaker OPEN');
  });

  it('should handle parallel operations', async () => {
    const breaker = new CircuitBreaker({
      name: 'parallel-test',
      failureThreshold: 10,
      resetTimeout: 1000,
    });

    const operations = Array.from({ length: 5 }, (_, i) =>
      breaker.execute(async () => `result-${i}`)
    );

    const results = await Promise.all(operations);

    expect(results).toEqual(['result-0', 'result-1', 'result-2', 'result-3', 'result-4']);
    expect(breaker.getStats().successes).toBe(5);
  });

  it('should transition to HALF_OPEN after timeout', async () => {
    const breaker = new CircuitBreaker({
      name: 'half-open-test',
      failureThreshold: 2,
      resetTimeout: 100,
    });

    for (let i = 0; i < 2; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error('Failure');
        });
      } catch {}
    }

    expect(breaker.getStats().state).toBe('OPEN');

    await new Promise((resolve) => setTimeout(resolve, 150));

    const result = await breaker.execute(async () => 'recovered');

    expect(result).toBe('recovered');
  });
});
