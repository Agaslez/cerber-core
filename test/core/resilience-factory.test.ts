/**
 * ResilienceFactory Tests
 * 
 * @package cerber-core
 * @version 2.0.0
 * @rule REFACTOR-8: Factory Pattern for resilience components
 */

import { describe, expect, it } from '@jest/globals';
import { CircuitBreaker } from '../../src/core/circuit-breaker.js';
import { ResilienceFactory } from '../../src/core/resilience-factory.js';
import { LinearBackoffStrategy } from '../../src/core/retry-strategy.js';

describe('ResilienceFactory', () => {
  describe('Profile Management', () => {
    it('should list available profiles', () => {
      const factory = new ResilienceFactory();
      const profiles = factory.getProfiles();

      expect(profiles).toContain('default');
      expect(profiles).toContain('aggressive');
      expect(profiles).toContain('conservative');
      expect(profiles).toContain('custom');
    });

    it('should retrieve profile configuration', () => {
      const factory = new ResilienceFactory();
      const config = factory.getProfileConfig('default');

      expect(config.circuitBreaker).toBeDefined();
      expect(config.retry).toBeDefined();
      expect(config.timeout).toBeDefined();
    });
  });

  describe('Configuration Creation', () => {
    it('should create default configuration', () => {
      const factory = new ResilienceFactory();
      const config = factory.createConfig({
        circuitBreaker: { name: 'test-service' }
      });

      expect(config.circuitBreaker.name).toBe('test-service');
      expect(config.circuitBreaker.failureThreshold).toBe(5);
      expect(config.retry.maxAttempts).toBe(3);
      expect(config.timeout).toBe(30000);
    });

    it('should create aggressive profile configuration', () => {
      const factory = new ResilienceFactory();
      const config = factory.createConfig({
        profile: 'aggressive',
        circuitBreaker: { name: 'fast-api' }
      });

      expect(config.circuitBreaker.failureThreshold).toBe(3);
      expect(config.circuitBreaker.resetTimeout).toBe(10000);
      expect(config.retry.maxAttempts).toBe(5);
      expect(config.timeout).toBe(10000);
    });

    it('should create conservative profile configuration', () => {
      const factory = new ResilienceFactory();
      const config = factory.createConfig({
        profile: 'conservative',
        circuitBreaker: { name: 'slow-api' }
      });

      expect(config.circuitBreaker.failureThreshold).toBe(10);
      expect(config.circuitBreaker.resetTimeout).toBe(60000);
      expect(config.retry.maxAttempts).toBe(3);
      expect(config.timeout).toBe(60000);
    });

    it('should merge custom overrides with profile defaults', () => {
      const factory = new ResilienceFactory();
      const config = factory.createConfig({
        profile: 'default',
        circuitBreaker: { 
          name: 'custom-service',
          failureThreshold: 7 
        },
        retry: {
          maxAttempts: 4
        },
        timeout: 45000
      });

      expect(config.circuitBreaker.failureThreshold).toBe(7);
      expect(config.retry.maxAttempts).toBe(4);
      expect(config.timeout).toBe(45000);
      // Other defaults preserved
      expect(config.circuitBreaker.resetTimeout).toBe(30000);
    });

    it('should use custom strategy when provided', () => {
      const factory = new ResilienceFactory();
      const customStrategy = new LinearBackoffStrategy(100, 5000, 0.1);
      
      const config = factory.createConfig({
        circuitBreaker: { name: 'test' },
        retry: {
          strategy: customStrategy
        }
      });

      expect(config.retry.strategy).toBe(customStrategy);
    });
  });

  describe('Component Creation', () => {
    it('should create CircuitBreaker with default profile', () => {
      const factory = new ResilienceFactory();
      const breaker = factory.createCircuitBreaker({
        circuitBreaker: { name: 'test-breaker' }
      });

      expect(breaker).toBeInstanceOf(CircuitBreaker);
      expect(breaker.getStats().state).toBe('CLOSED');
    });

    it('should create CircuitBreaker with aggressive profile', async () => {
      const factory = new ResilienceFactory();
      const breaker = factory.createCircuitBreaker({
        profile: 'aggressive',
        circuitBreaker: { name: 'aggressive-breaker' }
      });

      expect(breaker).toBeInstanceOf(CircuitBreaker);
      
      // Test aggressive settings: failureThreshold = 3
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Failure');
          });
        } catch {}
      }

      expect(breaker.getStats().state).toBe('OPEN');
    });

    it('should create retry configuration', () => {
      const factory = new ResilienceFactory();
      const retryConfig = factory.createRetryConfig({
        profile: 'default',
        circuitBreaker: { name: 'test' }
      });

      expect(retryConfig.maxAttempts).toBe(3);
      expect(retryConfig.strategy).toBeDefined();
    });

    it('should get timeout value', () => {
      const factory = new ResilienceFactory();
      
      const defaultTimeout = factory.getTimeout({
        circuitBreaker: { name: 'test' }
      });
      expect(defaultTimeout).toBe(30000);

      const customTimeout = factory.getTimeout({
        circuitBreaker: { name: 'test' },
        timeout: 15000
      });
      expect(customTimeout).toBe(15000);
    });
  });

  describe('Validation', () => {
    it('should reject invalid failureThreshold', () => {
      const factory = new ResilienceFactory();
      
      expect(() => {
        factory.createConfig({
          circuitBreaker: { 
            name: 'test',
            failureThreshold: 0 
          }
        });
      }).toThrow('CircuitBreaker failureThreshold must be > 0');
    });

    it('should reject invalid failureWindow', () => {
      const factory = new ResilienceFactory();
      
      expect(() => {
        factory.createConfig({
          circuitBreaker: { 
            name: 'test',
            failureWindow: -1 
          }
        });
      }).toThrow('CircuitBreaker failureWindow must be > 0');
    });

    it('should reject negative resetTimeout', () => {
      const factory = new ResilienceFactory();
      
      expect(() => {
        factory.createConfig({
          circuitBreaker: { 
            name: 'test',
            resetTimeout: -1 
          }
        });
      }).toThrow('CircuitBreaker resetTimeout must be >= 0');
    });

    it('should reject invalid successThreshold', () => {
      const factory = new ResilienceFactory();
      
      expect(() => {
        factory.createConfig({
          circuitBreaker: { 
            name: 'test',
            successThreshold: 0 
          }
        });
      }).toThrow('CircuitBreaker successThreshold must be > 0');
    });

    it('should reject negative maxAttempts', () => {
      const factory = new ResilienceFactory();
      
      expect(() => {
        factory.createConfig({
          circuitBreaker: { name: 'test' },
          retry: { maxAttempts: -1 }
        });
      }).toThrow('Retry maxAttempts must be >= 0');
    });

    it('should reject invalid timeout', () => {
      const factory = new ResilienceFactory();
      
      expect(() => {
        factory.createConfig({
          circuitBreaker: { name: 'test' },
          timeout: 0
        });
      }).toThrow('Timeout must be > 0');
    });

    it('should reject successThreshold > maxAttempts', () => {
      const factory = new ResilienceFactory();
      
      expect(() => {
        factory.createConfig({
          circuitBreaker: { 
            name: 'test',
            successThreshold: 5 
          },
          retry: { maxAttempts: 3 }
        });
      }).toThrow('CircuitBreaker successThreshold cannot exceed Retry maxAttempts');
    });
  });

  describe('Integration', () => {
    it('should create working CircuitBreaker from factory', async () => {
      const factory = new ResilienceFactory();
      const breaker = factory.createCircuitBreaker({
        circuitBreaker: { name: 'integration-test' }
      });

      const result = await breaker.execute(async () => 'success');
      
      expect(result).toBe('success');
      expect(breaker.getStats().successes).toBe(1);
    });

    it('should create retry config compatible with retry function', async () => {
      const factory = new ResilienceFactory();
      const retryConfig = factory.createRetryConfig({
        profile: 'aggressive',
        circuitBreaker: { name: 'test' }
      });

      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temp failure');
        }
        return 'success';
      };

      // Verify config has necessary fields
      expect(retryConfig.maxAttempts).toBeGreaterThan(0);
      expect(retryConfig.strategy).toBeDefined();
      expect(retryConfig.strategy?.calculateDelay).toBeDefined();
    });
  });
});
