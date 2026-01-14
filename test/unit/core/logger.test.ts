/**
 * @file Logger Tests
 * @rule Per PRODUCTION HARDENING - P0: Observability
 */

import { describe, expect, it } from '@jest/globals';
import { createChildLogger, createLogger, generateRequestId, logError, startTimer } from '../../../src/core/logger.js';

describe('@fast Logger', () => {
  describe('createLogger', () => {
    it('should create logger with default config', () => {
      const logger = createLogger();
      expect(logger).toBeDefined();
      expect(logger.level).toBeDefined();
    });

    it('should create logger with custom level', () => {
      const logger = createLogger({ level: 'error' });
      expect(logger).toBeDefined();
      expect(logger.level).toBe('error');
    });

    it('should create logger with custom name', () => {
      const logger = createLogger({ name: 'test-logger' });
      expect(logger).toBeDefined();
    });
  });

  describe('createChildLogger', () => {
    it('should create child logger with context', () => {
      const child = createChildLogger({ operation: 'test', runId: '123' });
      expect(child).toBeDefined();
    });
  });

  describe('startTimer', () => {
    it('should measure duration', async () => {
      const timer = startTimer();
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = timer.end('Test operation');
      
      expect(duration).toBeGreaterThanOrEqual(8);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('logError', () => {
    it('should log Error instance with full context', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at line 123';
      
      expect(() => {
        logError('Operation failed', error, { extra: 'context' });
      }).not.toThrow();
    });

    it('should log string error', () => {
      expect(() => {
        logError('Operation failed', 'String error', { extra: 'context' });
      }).not.toThrow();
    });

    it('should log error with Node.js error codes', () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      error.syscall = 'open';
      
      expect(() => {
        logError('File operation failed', error);
      }).not.toThrow();
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate request ID in expected format', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });
});
