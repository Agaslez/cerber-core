import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { FailureWindow } from '../../../src/core/circuit-breaker/failure-window.js';

describe('FailureWindow', () => {
  let window: FailureWindow;

  beforeEach(() => {
    jest.useFakeTimers();
    window = new FailureWindow(1000); // 1 second window
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should track failures within window', () => {
    window.recordFailure();
    expect(window.getRecentCount()).toBe(1);

    window.recordFailure();
    expect(window.getRecentCount()).toBe(2);

    window.recordFailure();
    expect(window.getRecentCount()).toBe(3);
  });

  it('should remove old failures outside window', () => {
    window.recordFailure();
    window.recordFailure();
    expect(window.getRecentCount()).toBe(2);

    jest.advanceTimersByTime(1100);

    expect(window.getRecentCount()).toBe(0);
  });

  it('should keep recent failures and remove old ones', () => {
    window.recordFailure();
    jest.advanceTimersByTime(500);
    
    window.recordFailure();
    expect(window.getRecentCount()).toBe(2);

    jest.advanceTimersByTime(600);
    expect(window.getRecentCount()).toBe(1);

    jest.advanceTimersByTime(500);
    expect(window.getRecentCount()).toBe(0);
  });

  it('should reset all failures', () => {
    window.recordFailure();
    window.recordFailure();
    window.recordFailure();
    expect(window.getRecentCount()).toBe(3);

    window.reset();
    expect(window.getRecentCount()).toBe(0);
  });
});
