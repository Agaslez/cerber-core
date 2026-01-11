import { beforeEach, describe, expect, it } from '@jest/globals';
import { StatsTracker } from '../../../src/core/circuit-breaker/stats-tracker.js';

describe('StatsTracker', () => {
  let stats: StatsTracker;

  beforeEach(() => {
    stats = new StatsTracker();
  });

  it('should track calls', () => {
    expect(stats.getTotalCalls()).toBe(0);

    stats.recordCall();
    expect(stats.getTotalCalls()).toBe(1);

    stats.recordCall();
    stats.recordCall();
    expect(stats.getTotalCalls()).toBe(3);
  });

  it('should track successes and consecutive successes', () => {
    stats.recordSuccess();
    expect(stats.getTotalSuccesses()).toBe(1);
    expect(stats.getConsecutiveSuccesses()).toBe(1);

    stats.recordSuccess();
    expect(stats.getTotalSuccesses()).toBe(2);
    expect(stats.getConsecutiveSuccesses()).toBe(2);

    stats.recordSuccess();
    expect(stats.getTotalSuccesses()).toBe(3);
    expect(stats.getConsecutiveSuccesses()).toBe(3);
  });

  it('should reset consecutive successes on failure', () => {
    stats.recordSuccess();
    stats.recordSuccess();
    expect(stats.getConsecutiveSuccesses()).toBe(2);

    stats.recordFailure();
    expect(stats.getConsecutiveSuccesses()).toBe(0);
    expect(stats.getTotalSuccesses()).toBe(2);
  });

  it('should track failures and last failure time', () => {
    expect(stats.getLastFailureTime()).toBeNull();

    stats.recordFailure();
    expect(stats.getTotalFailures()).toBe(1);
    expect(stats.getLastFailureTime()).not.toBeNull();

    const firstFailureTime = stats.getLastFailureTime();

    stats.recordFailure();
    expect(stats.getTotalFailures()).toBe(2);
    expect(stats.getLastFailureTime()).toBeGreaterThanOrEqual(firstFailureTime!);
  });

  it('should track successes after failures', () => {
    stats.recordFailure();
    stats.recordFailure();
    expect(stats.getTotalFailures()).toBe(2);
    expect(stats.getConsecutiveSuccesses()).toBe(0);

    stats.recordSuccess();
    expect(stats.getTotalSuccesses()).toBe(1);
    expect(stats.getConsecutiveSuccesses()).toBe(1);
  });

  it('should reset consecutive successes explicitly', () => {
    stats.recordSuccess();
    stats.recordSuccess();
    expect(stats.getConsecutiveSuccesses()).toBe(2);

    stats.resetConsecutive();
    expect(stats.getConsecutiveSuccesses()).toBe(0);
    expect(stats.getTotalSuccesses()).toBe(2);
  });
});
