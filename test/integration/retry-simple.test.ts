import { describe, expect, it } from '@jest/globals';
import { CircuitBreaker } from '../../src/core/circuit-breaker.js';
import { retry } from '../../src/core/retry.js';

describe('@integration Integration: Retry Mechanism', () => {
  it('should retry operation multiple times', async () => {
    let attempts = 0;

    const flaky = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Not yet');
      }
      return 'success';
    };

    const result = await retry(flaky, {
      maxAttempts: 5,
      initialDelay: 10,
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should fail after max attempts', async () => {
    let attempts = 0;

    const alwaysFails = async () => {
      attempts++;
      throw new Error('Always fails');
    };

    await expect(
      retry(alwaysFails, {
        maxAttempts: 3,
        initialDelay: 10,
      })
    ).rejects.toThrow('Always fails');

    expect(attempts).toBe(3);
  });

  it('should work with circuit breaker', async () => {
    const breaker = new CircuitBreaker({
      name: 'retry-test',
      failureThreshold: 2,
      resetTimeout: 1000,
    });

    let callCount = 0;

    const operation = async () => {
      callCount++;
      throw new Error('Fail');
    };

    await expect(
      breaker.execute(() => retry(operation, { maxAttempts: 2, initialDelay: 10 }))
    ).rejects.toThrow();

    expect(callCount).toBe(2);

    await expect(
      breaker.execute(() => retry(operation, { maxAttempts: 2, initialDelay: 10 }))
    ).rejects.toThrow();

    expect(breaker.getStats().state).toBe('OPEN');
  });
});
