/**
 * @file ResilienceFactory - Factory Pattern for Resilience Components
 * @rule Per REFACTOR-8: Consolidate resilience component creation
 * @description Centralized factory for creating CircuitBreaker, Retry, and timeout configurations
 * 
 * Benefits:
 * - Single source of truth for resilience configuration
 * - Validation of options before component creation
 * - Sensible defaults based on use case profiles
 * - Simplified API for consumers
 * 
 * Profiles:
 * - 'default': Balanced settings for general use
 * - 'aggressive': Fast recovery, low tolerance
 * - 'conservative': Slow recovery, high tolerance
 * - 'custom': User-provided settings
 */

import { CircuitBreaker, type CircuitBreakerOptions } from './circuit-breaker.js';
import {
    ExponentialBackoffStrategy,
    LinearBackoffStrategy
} from './retry-strategy.js';
import type { RetryOptions } from './retry.ts';

export type ResilienceProfile = 'default' | 'aggressive' | 'conservative' | 'custom';

export interface ResilienceConfig {
  /** CircuitBreaker configuration */
  circuitBreaker?: Partial<CircuitBreakerOptions>;
  
  /** Retry configuration */
  retry?: Partial<RetryOptions>;
  
  /** Operation timeout (ms) */
  timeout?: number;
  
  /** Profile preset */
  profile?: ResilienceProfile;
}

export interface ValidatedResilienceConfig {
  circuitBreaker: CircuitBreakerOptions;
  retry: RetryOptions;
  timeout: number;
}

/**
 * ResilienceFactory - Factory Pattern for creating resilience components
 * 
 * @example
 * ```typescript
 * const factory = new ResilienceFactory();
 * 
 * // Create with default profile
 * const breaker = factory.createCircuitBreaker({ name: 'api-service' });
 * 
 * // Create with aggressive profile
 * const config = factory.createConfig({
 *   profile: 'aggressive',
 *   circuitBreaker: { name: 'fast-api' }
 * });
 * ```
 */
export class ResilienceFactory {
  private readonly profileDefaults: Record<ResilienceProfile, ResilienceConfig> = {
    default: {
      circuitBreaker: {
        failureThreshold: 5,
        failureWindow: 60000,
        resetTimeout: 30000,
        successThreshold: 2
      },
      retry: {
        maxAttempts: 3,
        strategy: new ExponentialBackoffStrategy(100, 5000, 0.1)
      },
      timeout: 30000
    },
    aggressive: {
      circuitBreaker: {
        failureThreshold: 3,
        failureWindow: 30000,
        resetTimeout: 10000,
        successThreshold: 1
      },
      retry: {
        maxAttempts: 5,
        strategy: new ExponentialBackoffStrategy(50, 2000, 0.2)
      },
      timeout: 10000
    },
    conservative: {
      circuitBreaker: {
        failureThreshold: 10,
        failureWindow: 120000,
        resetTimeout: 60000,
        successThreshold: 2
      },
      retry: {
        maxAttempts: 3,
        strategy: new LinearBackoffStrategy(200, 10000, 0.05)
      },
      timeout: 60000
    },
    custom: {}
  };

  /**
   * Create validated resilience configuration
   */
  createConfig(config: ResilienceConfig): ValidatedResilienceConfig {
    const profile = config.profile || 'default';
    const baseConfig = this.profileDefaults[profile];

    // Merge configurations: profile defaults + user overrides
    const circuitBreakerConfig: CircuitBreakerOptions = {
      name: config.circuitBreaker?.name || 'unnamed',
      failureThreshold: config.circuitBreaker?.failureThreshold ?? baseConfig.circuitBreaker?.failureThreshold ?? 5,
      failureWindow: config.circuitBreaker?.failureWindow ?? baseConfig.circuitBreaker?.failureWindow ?? 60000,
      resetTimeout: config.circuitBreaker?.resetTimeout ?? baseConfig.circuitBreaker?.resetTimeout ?? 30000,
      successThreshold: config.circuitBreaker?.successThreshold ?? baseConfig.circuitBreaker?.successThreshold ?? 2
    };

    const retryConfig: RetryOptions = {
      maxAttempts: config.retry?.maxAttempts ?? baseConfig.retry?.maxAttempts ?? 3,
      strategy: config.retry?.strategy ?? baseConfig.retry?.strategy ?? new ExponentialBackoffStrategy(100, 5000, 0.1),
      isRetryable: config.retry?.isRetryable,
      name: config.retry?.name,
      onRetry: config.retry?.onRetry
    };

    const timeout = config.timeout ?? baseConfig.timeout ?? 30000;

    // Validate configuration
    this.validateConfig({ circuitBreaker: circuitBreakerConfig, retry: retryConfig, timeout });

    return { circuitBreaker: circuitBreakerConfig, retry: retryConfig, timeout };
  }

  /**
   * Create CircuitBreaker with validated configuration
   */
  createCircuitBreaker(config: ResilienceConfig): CircuitBreaker {
    const validated = this.createConfig(config);
    return new CircuitBreaker(validated.circuitBreaker);
  }

  /**
   * Create retry configuration with validated settings
   */
  createRetryConfig(config: ResilienceConfig): RetryOptions {
    const validated = this.createConfig(config);
    return validated.retry;
  }

  /**
   * Get timeout value with profile defaults
   */
  getTimeout(config: ResilienceConfig): number {
    const validated = this.createConfig(config);
    return validated.timeout;
  }

  /**
   * Validate configuration values
   */
  private validateConfig(config: ValidatedResilienceConfig): void {
    // Validate CircuitBreaker
    if (config.circuitBreaker.failureThreshold! <= 0) {
      throw new Error('CircuitBreaker failureThreshold must be > 0');
    }
    if (config.circuitBreaker.failureWindow! <= 0) {
      throw new Error('CircuitBreaker failureWindow must be > 0');
    }
    if (config.circuitBreaker.resetTimeout! < 0) {
      throw new Error('CircuitBreaker resetTimeout must be >= 0');
    }
    if (config.circuitBreaker.successThreshold! <= 0) {
      throw new Error('CircuitBreaker successThreshold must be > 0');
    }

    // Validate Retry
    if (config.retry.maxAttempts !== undefined && config.retry.maxAttempts < 0) {
      throw new Error('Retry maxAttempts must be >= 0');
    }

    // Validate Timeout
    if (config.timeout <= 0) {
      throw new Error('Timeout must be > 0');
    }

    // Logical validations
    if (config.circuitBreaker.successThreshold! > config.retry.maxAttempts!) {
      throw new Error('CircuitBreaker successThreshold cannot exceed Retry maxAttempts');
    }
  }

  /**
   * Get available profiles
   */
  getProfiles(): ResilienceProfile[] {
    return Object.keys(this.profileDefaults) as ResilienceProfile[];
  }

  /**
   * Get profile configuration details
   */
  getProfileConfig(profile: ResilienceProfile): ResilienceConfig {
    return { ...this.profileDefaults[profile] };
  }
}
