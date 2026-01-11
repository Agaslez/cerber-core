/**
 * @file Circuit Breaker Stats - Statistics tracking
 * @rule Per REFACTOR-5 - Single Responsibility Principle
 * @description Pure statistics computation and storage
 */

import type { CircuitState } from './circuit-state.js';

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  consecutiveSuccesses: number;
  lastFailureTime: number | null;
  lastStateChange: number;
  totalCalls: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class StatsTracker {
  private totalCalls: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private consecutiveSuccesses: number = 0;
  private lastFailureTime: number | null = null;

  recordCall(): void {
    this.totalCalls++;
  }

  recordSuccess(): void {
    this.totalSuccesses++;
    this.consecutiveSuccesses++;
  }

  recordFailure(): void {
    this.totalFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();
  }

  resetConsecutive(): void {
    this.consecutiveSuccesses = 0;
  }

  getConsecutiveSuccesses(): number {
    return this.consecutiveSuccesses;
  }

  getLastFailureTime(): number | null {
    return this.lastFailureTime;
  }

  getTotalCalls(): number {
    return this.totalCalls;
  }

  getTotalSuccesses(): number {
    return this.totalSuccesses;
  }

  getTotalFailures(): number {
    return this.totalFailures;
  }
}
