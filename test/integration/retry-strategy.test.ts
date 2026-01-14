import { describe, expect, it } from '@jest/globals';
import { FibonacciBackoffStrategy, LinearBackoffStrategy } from '../../src/core/retry-strategy.js';
import { retry } from '../../src/core/retry.js';

describe('@integration Integration: Retry with Custom Strategies', () => {
  it('should use linear backoff strategy', async () => {
    let attempts = 0;
    const delays: number[] = [];

    const strategy = new LinearBackoffStrategy(50, 50, 1000, 0);

    const operation = async () => {
      attempts++;
      if (attempts < 4) {
        throw new Error('Not yet');
      }
      return 'success';
    };

    const result = await retry(operation, {
      maxAttempts: 5,
      strategy,
      onRetry: (_attempt, delay) => delays.push(delay),
    });

    expect(result).toBe('success');
    expect(attempts).toBe(4);
    expect(delays.length).toBe(3);
    expect(delays[0]).toBe(50);
    expect(delays[1]).toBe(100);
    expect(delays[2]).toBe(150);
  });

  it('should use fibonacci backoff strategy', async () => {
    let attempts = 0;
    const delays: number[] = [];

    const strategy = new FibonacciBackoffStrategy(10, 1000, 0);

    const operation = async () => {
      attempts++;
      if (attempts < 5) {
        throw new Error('Not yet');
      }
      return 'done';
    };

    const result = await retry(operation, {
      maxAttempts: 6,
      strategy,
      onRetry: (_attempt, delay) => delays.push(delay),
    });

    expect(result).toBe('done');
    expect(attempts).toBe(5);
    expect(delays).toEqual([10, 10, 20, 30]);
  });

  it('should use default exponential strategy when none provided', async () => {
    let attempts = 0;

    const operation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Retry');
      }
      return 'ok';
    };

    const result = await retry(operation, {
      maxAttempts: 3,
      initialDelay: 10,
      jitter: 0,
    });

    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });
});
