/**
 * @file Circuit State - State machine types
 * @rule Per REFACTOR-5 - Single Responsibility Principle
 * @description Circuit breaker state definitions
 */

export enum CircuitState {
  CLOSED = 'CLOSED',         // Normal operation
  OPEN = 'OPEN',             // Circuit is open, failing fast
  HALF_OPEN = 'HALF_OPEN'    // Testing recovery
}
