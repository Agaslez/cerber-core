/**
 * @file Security Tests
 * @rule Per PRODUCTION HARDENING - P1: Input Validation & Security
 */

import { describe, expect, it } from '@jest/globals';
import path from 'node:path';
import {
    escapeShellArg,
    globalRateLimiter,
    isSafeString,
    sanitizeCommandArg,
    sanitizePath,
    sanitizePathArray,
    validateAdapterName,
    validateCommandArgs,
    validatePathSafety,
    validateProfileName
} from '../../../src/core/security.js';

describe('Security', () => {
  describe('sanitizePath', () => {
    it('should accept and normalize valid paths', () => {
      const result = sanitizePath('test.yml');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toContain('test.yml');
    });

    it('should reject paths with null bytes', () => {
      expect(() => sanitizePath('file\0.txt')).toThrow('null byte');
    });

    it('should reject paths with directory traversal', () => {
      expect(() => sanitizePath('../etc/passwd')).toThrow('dangerous pattern');
    });

    it('should reject paths with shell expansion', () => {
      expect(() => sanitizePath('~/.bashrc')).toThrow('dangerous pattern');
      expect(() => sanitizePath('${HOME}/file')).toThrow('dangerous pattern');
      expect(() => sanitizePath('`whoami`')).toThrow('dangerous pattern');
    });

    it('should reject paths with command injection attempts', () => {
      expect(() => sanitizePath('file.txt;rm -rf /')).toThrow('dangerous pattern');
      expect(() => sanitizePath('file.txt&&cat /etc/passwd')).toThrow('dangerous pattern');
      expect(() => sanitizePath('file.txt|ls')).toThrow('dangerous pattern');
    });

    it('should reject paths with redirection', () => {
      expect(() => sanitizePath('file.txt>output')).toThrow('dangerous pattern');
      expect(() => sanitizePath('file.txt<input')).toThrow('dangerous pattern');
    });

    it('should prevent directory escape when baseDir is provided', () => {
      const baseDir = '/safe/directory';
      expect(() => sanitizePath('../../../etc/passwd', baseDir)).toThrow('dangerous pattern');
    });

    it('should allow paths within baseDir', () => {
      const baseDir = process.cwd();
      const result = sanitizePath('test/file.yml', baseDir);
      expect(result.startsWith(baseDir)).toBe(true);
    });
  });

  describe('validatePathSafety', () => {
    it('should accept valid paths', () => {
      expect(validatePathSafety('valid/path.yml')).toBe(true);
      expect(validatePathSafety('test.txt')).toBe(true);
    });

    it('should reject paths that are too long', () => {
      const longPath = 'a'.repeat(5000);
      expect(() => validatePathSafety(longPath)).toThrow('too long');
    });

    it('should reject paths with null bytes', () => {
      expect(() => validatePathSafety('file\0.txt')).toThrow('null byte');
    });

    it('should reject dangerous patterns', () => {
      expect(() => validatePathSafety('../etc/passwd')).toThrow('dangerous pattern');
      expect(() => validatePathSafety('file;ls')).toThrow('dangerous pattern');
    });
  });

  describe('sanitizeCommandArg', () => {
    it('should accept valid command arguments', () => {
      expect(sanitizeCommandArg('--flag')).toBe('--flag');
      expect(sanitizeCommandArg('value')).toBe('value');
      expect(sanitizeCommandArg('path/to/file')).toBe('path/to/file');
    });

    it('should reject arguments with null bytes', () => {
      expect(() => sanitizeCommandArg('arg\0')).toThrow('null byte');
    });

    it('should reject arguments with command injection', () => {
      expect(() => sanitizeCommandArg('arg;ls')).toThrow('shell injection');
      expect(() => sanitizeCommandArg('arg&&cat')).toThrow('shell injection');
      expect(() => sanitizeCommandArg('arg||rm')).toThrow('shell injection');
      expect(() => sanitizeCommandArg('arg|pipe')).toThrow('shell injection');
    });

    it('should reject arguments with command substitution', () => {
      expect(() => sanitizeCommandArg('`whoami`')).toThrow('shell injection');
      expect(() => sanitizeCommandArg('$(cat /etc/passwd)')).toThrow('shell injection');
    });

    it('should reject arguments with redirection', () => {
      expect(() => sanitizeCommandArg('arg>file')).toThrow('shell injection');
      expect(() => sanitizeCommandArg('arg<file')).toThrow('shell injection');
    });

    it('should reject arguments with newlines', () => {
      expect(() => sanitizeCommandArg('arg\nls')).toThrow('shell injection');
      expect(() => sanitizeCommandArg('arg\rcat')).toThrow('shell injection');
    });
  });

  describe('validateCommandArgs', () => {
    it('should accept array of valid arguments', () => {
      const args = ['--flag', 'value', 'path/to/file'];
      expect(validateCommandArgs(args)).toBe(true);
    });

    it('should reject if any argument is invalid', () => {
      const args = ['--flag', 'value;ls', 'file'];
      expect(() => validateCommandArgs(args)).toThrow('shell injection');
    });
  });

  describe('escapeShellArg', () => {
    it('should wrap argument in single quotes', () => {
      expect(escapeShellArg('simple')).toBe("'simple'");
      expect(escapeShellArg('path/to/file')).toBe("'path/to/file'");
    });

    it('should escape embedded single quotes', () => {
      expect(escapeShellArg("it's")).toBe("'it'\\''s'");
      expect(escapeShellArg("can't")).toBe("'can'\\''t'");
    });

    it('should handle multiple single quotes', () => {
      expect(escapeShellArg("it's can't")).toBe("'it'\\''s can'\\''t'");
    });

    it('should make dangerous strings safe', () => {
      const dangerous = '; rm -rf /';
      const escaped = escapeShellArg(dangerous);
      expect(escaped).toBe("'; rm -rf /'");
      // Verify it's wrapped in quotes (shell won't execute)
      expect(escaped.startsWith("'")).toBe(true);
      expect(escaped.endsWith("'")).toBe(true);
    });
  });

  describe('validateAdapterName', () => {
    it('should accept valid adapter names', () => {
      expect(validateAdapterName('actionlint')).toBe(true);
      expect(validateAdapterName('zizmor')).toBe(true);
      expect(validateAdapterName('custom-tool')).toBe(true);
      expect(validateAdapterName('tool_v2')).toBe(true);
    });

    it('should reject adapter names with special characters', () => {
      expect(() => validateAdapterName('tool;ls')).toThrow('Invalid adapter name');
      expect(() => validateAdapterName('tool$var')).toThrow('Invalid adapter name');
      expect(() => validateAdapterName('tool space')).toThrow('Invalid adapter name');
      expect(() => validateAdapterName('../tool')).toThrow('Invalid adapter name');
    });

    it('should reject adapter names that are too long', () => {
      const longName = 'a'.repeat(100);
      expect(() => validateAdapterName(longName)).toThrow('too long');
    });
  });

  describe('validateProfileName', () => {
    it('should accept valid profile names', () => {
      expect(validateProfileName('dev')).toBe(true);
      expect(validateProfileName('team-mode')).toBe(true);
      expect(validateProfileName('prod_env')).toBe(true);
    });

    it('should reject profile names with command injection', () => {
      expect(() => validateProfileName('dev;rm -rf /')).toThrow();
      expect(() => validateProfileName('$(cat /etc/passwd)')).toThrow();
    });
  });

  describe('sanitizePathArray', () => {
    it('should sanitize array of paths', () => {
      const paths = ['test1.yml', 'test2.yml'];
      const result = sanitizePathArray(paths);
      
      expect(result).toHaveLength(2);
      expect(path.isAbsolute(result[0])).toBe(true);
      expect(path.isAbsolute(result[1])).toBe(true);
    });

    it('should throw if any path is invalid', () => {
      const paths = ['valid.yml', '../etc/passwd'];
      expect(() => sanitizePathArray(paths)).toThrow('dangerous pattern');
    });

    it('should handle empty array', () => {
      const result = sanitizePathArray([]);
      expect(result).toEqual([]);
    });
  });

  describe('isSafeString', () => {
    it('should return true for safe strings', () => {
      expect(isSafeString('hello')).toBe(true);
      expect(isSafeString('hello-world')).toBe(true);
      expect(isSafeString('test123')).toBe(true);
      expect(isSafeString('path/to/file')).toBe(true);
    });

    it('should return false for strings with null bytes', () => {
      expect(isSafeString('hello\0world')).toBe(false);
    });

    it('should return false for strings with dangerous patterns', () => {
      expect(isSafeString('../etc/passwd')).toBe(false);
      expect(isSafeString('${var}')).toBe(false);
      expect(isSafeString('`command`')).toBe(false);
      expect(isSafeString('test;ls')).toBe(false);
      expect(isSafeString('test&&cat')).toBe(false);
      expect(isSafeString('test||rm')).toBe(false);
      expect(isSafeString('test>file')).toBe(false);
      expect(isSafeString('test<file')).toBe(false);
    });
  });

  describe('globalRateLimiter', () => {
    beforeEach(() => {
      globalRateLimiter.clear();
    });

    it('should allow requests within limit', () => {
      expect(globalRateLimiter.isAllowed('test-key')).toBe(true);
      expect(globalRateLimiter.isAllowed('test-key')).toBe(true);
      expect(globalRateLimiter.isAllowed('test-key')).toBe(true);
    });

    it('should reject requests after limit', () => {
      const key = 'test-key';
      
      // Make 60 requests (the limit)
      for (let i = 0; i < 60; i++) {
        expect(globalRateLimiter.isAllowed(key)).toBe(true);
      }
      
      // 61st request should be rejected
      expect(globalRateLimiter.isAllowed(key)).toBe(false);
    });

    it('should track different keys separately', () => {
      expect(globalRateLimiter.isAllowed('key1')).toBe(true);
      expect(globalRateLimiter.isAllowed('key2')).toBe(true);
      expect(globalRateLimiter.isAllowed('key1')).toBe(true);
      expect(globalRateLimiter.isAllowed('key2')).toBe(true);
      
      // Both keys should still be allowed (separate counters)
      expect(globalRateLimiter.isAllowed('key1')).toBe(true);
      expect(globalRateLimiter.isAllowed('key2')).toBe(true);
    });

    it('should reset limits for specific key', () => {
      const key = 'test-key';
      
      // Make some requests
      globalRateLimiter.isAllowed(key);
      globalRateLimiter.isAllowed(key);
      
      // Reset
      globalRateLimiter.reset(key);
      
      // Should start counting from zero again
      expect(globalRateLimiter.isAllowed(key)).toBe(true);
    });

    it('should clear all limits', () => {
      globalRateLimiter.isAllowed('key1');
      globalRateLimiter.isAllowed('key2');
      
      globalRateLimiter.clear();
      
      expect(globalRateLimiter.isAllowed('key1')).toBe(true);
      expect(globalRateLimiter.isAllowed('key2')).toBe(true);
    });
  });
});
