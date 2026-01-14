import { describe, expect, it } from '@jest/globals';
import {
    ExponentialBackoffStrategy,
    FibonacciBackoffStrategy,
    FixedDelayStrategy,
    LinearBackoffStrategy,
} from '../../src/core/retry-strategy.js';

describe('@fast RetryStrategy', () => {
  describe('ExponentialBackoffStrategy', () => {
    it('should calculate exponential delays', () => {
      const strategy = new ExponentialBackoffStrategy(100, 10000, 2, 0);

      expect(strategy.calculateDelay(0)).toBe(100);
      expect(strategy.calculateDelay(1)).toBe(200);
      expect(strategy.calculateDelay(2)).toBe(400);
      expect(strategy.calculateDelay(3)).toBe(800);
    });

    it('should respect max delay', () => {
      const strategy = new ExponentialBackoffStrategy(100, 500, 2, 0);

      expect(strategy.calculateDelay(5)).toBe(500);
      expect(strategy.calculateDelay(10)).toBe(500);
    });

    it('should apply jitter', () => {
      const strategy = new ExponentialBackoffStrategy(100, 10000, 2, 0.5);

      const delay1 = strategy.calculateDelay(0);
      const delay2 = strategy.calculateDelay(0);

      expect(delay1).toBeGreaterThanOrEqual(100);
      expect(delay1).toBeLessThanOrEqual(150);
      expect(delay1).not.toBe(delay2);
    });

    it('should return strategy name', () => {
      const strategy = new ExponentialBackoffStrategy();
      expect(strategy.getName()).toBe('exponential');
    });
  });

  describe('LinearBackoffStrategy', () => {
    it('should calculate linear delays', () => {
      const strategy = new LinearBackoffStrategy(100, 50, 10000, 0);

      expect(strategy.calculateDelay(0)).toBe(100);
      expect(strategy.calculateDelay(1)).toBe(150);
      expect(strategy.calculateDelay(2)).toBe(200);
      expect(strategy.calculateDelay(3)).toBe(250);
    });

    it('should respect max delay', () => {
      const strategy = new LinearBackoffStrategy(100, 100, 500, 0);

      expect(strategy.calculateDelay(10)).toBe(500);
    });

    it('should apply jitter', () => {
      const strategy = new LinearBackoffStrategy(100, 50, 10000, 0.3);

      const delay = strategy.calculateDelay(0);
      expect(delay).toBeGreaterThanOrEqual(100);
      expect(delay).toBeLessThanOrEqual(130);
    });

    it('should return strategy name', () => {
      const strategy = new LinearBackoffStrategy();
      expect(strategy.getName()).toBe('linear');
    });
  });

  describe('FibonacciBackoffStrategy', () => {
    it('should calculate fibonacci delays', () => {
      const strategy = new FibonacciBackoffStrategy(100, 100000, 0);

      expect(strategy.calculateDelay(0)).toBe(100);
      expect(strategy.calculateDelay(1)).toBe(100);
      expect(strategy.calculateDelay(2)).toBe(200);
      expect(strategy.calculateDelay(3)).toBe(300);
      expect(strategy.calculateDelay(4)).toBe(500);
      expect(strategy.calculateDelay(5)).toBe(800);
    });

    it('should respect max delay', () => {
      const strategy = new FibonacciBackoffStrategy(100, 1000, 0);

      expect(strategy.calculateDelay(8)).toBe(1000);
    });

    it('should apply jitter', () => {
      const strategy = new FibonacciBackoffStrategy(100, 10000, 0.2);

      const delay = strategy.calculateDelay(2);
      expect(delay).toBeGreaterThanOrEqual(200);
      expect(delay).toBeLessThanOrEqual(240);
    });

    it('should return strategy name', () => {
      const strategy = new FibonacciBackoffStrategy();
      expect(strategy.getName()).toBe('fibonacci');
    });
  });

  describe('FixedDelayStrategy', () => {
    it('should return fixed delay', () => {
      const strategy = new FixedDelayStrategy(500, 0);

      expect(strategy.calculateDelay(0)).toBe(500);
      expect(strategy.calculateDelay(1)).toBe(500);
      expect(strategy.calculateDelay(5)).toBe(500);
      expect(strategy.calculateDelay(100)).toBe(500);
    });

    it('should apply jitter', () => {
      const strategy = new FixedDelayStrategy(1000, 0.1);

      const delay = strategy.calculateDelay(0);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(1100);
    });

    it('should return strategy name', () => {
      const strategy = new FixedDelayStrategy();
      expect(strategy.getName()).toBe('fixed');
    });
  });

  describe('Strategy comparison', () => {
    it('should show different backoff patterns', () => {
      const exponential = new ExponentialBackoffStrategy(100, 10000, 2, 0);
      const linear = new LinearBackoffStrategy(100, 100, 10000, 0);
      const fibonacci = new FibonacciBackoffStrategy(100, 10000, 0);
      const fixed = new FixedDelayStrategy(200, 0);

      const attempts = [0, 1, 2, 3, 4];

      const exponentialDelays = attempts.map((a) => exponential.calculateDelay(a));
      const linearDelays = attempts.map((a) => linear.calculateDelay(a));
      const fibonacciDelays = attempts.map((a) => fibonacci.calculateDelay(a));
      const fixedDelays = attempts.map((a) => fixed.calculateDelay(a));

      expect(exponentialDelays).toEqual([100, 200, 400, 800, 1600]);
      expect(linearDelays).toEqual([100, 200, 300, 400, 500]);
      expect(fibonacciDelays).toEqual([100, 100, 200, 300, 500]);
      expect(fixedDelays).toEqual([200, 200, 200, 200, 200]);
    });
  });
});
