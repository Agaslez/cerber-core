/**
 * @file Security Utilities
 * @rule Per PRODUCTION HARDENING - P1: Input Validation & Security
 * @description Path sanitization and command injection prevention
 */

import path from 'node:path';
import { createLogger } from './logger.js';

const log = createLogger({ name: 'security' });

/**
 * Dangerous path patterns that indicate potential security issues
 * NOTE: Colon (:) is allowed for Windows drive letters (C:\)
 */
const DANGEROUS_PATTERNS = [
  /\.\./,           // Directory traversal
  /\0/,             // Null byte injection
  /[<>"|?*]/,       // Invalid filename chars (REMOVED : for Windows drives)
  /^[~]/,           // Shell expansion
  /\$\{/,           // Variable expansion
  /`/,              // Command substitution
  /;/,              // Command chaining
  /&&/,             // Command chaining
  /\|\|/,           // Command chaining
  />/,              // Output redirection
  /</,              // Input redirection
  /\|/              // Pipe
];

/**
 * Dangerous command patterns for shell injection
 */
const SHELL_INJECTION_PATTERNS = [
  /;/,              // Command separator
  /&&/,             // AND operator
  /\|\|/,           // OR operator
  /\|/,             // Pipe
  /`/,              // Backtick command substitution
  /\$\(/,           // $() command substitution
  />/,              // Output redirection
  /</,              // Input redirection
  /\n/,             // Newline (command separator)
  /\r/              // Carriage return
];

/**
 * Sanitize file path to prevent directory traversal and injection attacks
 * 
 * @param filePath - User-provided file path
 * @param baseDir - Base directory to resolve relative paths (default: cwd)
 * @returns Sanitized absolute path
 * @throws {Error} If path is dangerous or invalid
 */
export function sanitizePath(filePath: string, baseDir?: string): string {
  // Check for null bytes
  if (filePath.includes('\0')) {
    log.error({ filePath }, 'Path contains null byte');
    throw new Error('Invalid path: contains null byte');
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(filePath)) {
      log.error({ filePath, pattern: pattern.source }, 'Path contains dangerous pattern');
      throw new Error(`Invalid path: contains dangerous pattern (${pattern.source})`);
    }
  }

  // Normalize and resolve to absolute path
  const base = baseDir || process.cwd();
  const resolved = path.resolve(base, filePath);
  const normalized = path.normalize(resolved);

  // Verify the path doesn't escape the base directory (if baseDir was provided)
  if (baseDir) {
    const normalizedBase = path.normalize(path.resolve(baseDir));
    if (!normalized.startsWith(normalizedBase)) {
      log.error({ 
        filePath, 
        baseDir, 
        resolved: normalized,
        normalizedBase 
      }, 'Path escapes base directory');
      throw new Error('Invalid path: attempts to escape base directory');
    }
  }

  return normalized;
}

/**
 * Validate that a path is safe for file operations
 * 
 * @param filePath - Path to validate
 * @returns true if path is safe
 * @throws {Error} If path is dangerous
 */
export function validatePathSafety(filePath: string): boolean {
  // Check length
  if (filePath.length > 4096) {
    throw new Error('Path too long (max 4096 characters)');
  }

  // Check for null bytes
  if (filePath.includes('\0')) {
    throw new Error('Path contains null byte');
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(filePath)) {
      throw new Error(`Path contains dangerous pattern: ${pattern.source}`);
    }
  }

  return true;
}

/**
 * Sanitize command argument to prevent shell injection
 * 
 * @param arg - Command argument to sanitize
 * @returns Sanitized argument
 * @throws {Error} If argument contains shell injection patterns
 */
export function sanitizeCommandArg(arg: string): string {
  // Check for null bytes
  if (arg.includes('\0')) {
    log.error({ arg }, 'Command arg contains null byte');
    throw new Error('Invalid argument: contains null byte');
  }

  // Check for shell injection patterns
  for (const pattern of SHELL_INJECTION_PATTERNS) {
    if (pattern.test(arg)) {
      log.error({ arg, pattern: pattern.source }, 'Command arg contains injection pattern');
      throw new Error(`Invalid argument: contains shell injection pattern (${pattern.source})`);
    }
  }

  return arg;
}

/**
 * Validate command arguments array for safety
 * 
 * @param args - Array of command arguments
 * @returns true if all arguments are safe
 * @throws {Error} If any argument is dangerous
 */
export function validateCommandArgs(args: string[]): boolean {
  for (const arg of args) {
    sanitizeCommandArg(arg);
  }
  return true;
}

/**
 * Escape shell argument for safe command execution
 * Uses single quotes and escapes embedded single quotes
 * 
 * @param arg - Argument to escape
 * @returns Shell-escaped argument
 */
export function escapeShellArg(arg: string): string {
  // Replace single quotes with '\'' (end quote, literal single quote, start quote)
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Validate adapter name for safety
 * Only allows alphanumeric, hyphens, and underscores
 * 
 * @param name - Adapter name to validate
 * @returns true if name is safe
 * @throws {Error} If name is invalid
 */
export function validateAdapterName(name: string): boolean {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error('Invalid adapter name: must be alphanumeric (with hyphens/underscores)');
  }
  
  if (name.length > 64) {
    throw new Error('Adapter name too long (max 64 characters)');
  }

  return true;
}

/**
 * Validate profile name for safety
 * Same rules as adapter name
 * 
 * @param name - Profile name to validate
 * @returns true if name is safe
 * @throws {Error} If name is invalid
 */
export function validateProfileName(name: string): boolean {
  return validateAdapterName(name); // Same rules
}

/**
 * Safe file path array validation
 * Validates and sanitizes an array of file paths
 * 
 * @param paths - Array of file paths
 * @param baseDir - Optional base directory
 * @returns Array of sanitized paths
 * @throws {Error} If any path is invalid
 */
export function sanitizePathArray(paths: string[], baseDir?: string): string[] {
  return paths.map(p => sanitizePath(p, baseDir));
}

/**
 * Check if a string contains any dangerous characters
 * 
 * @param input - String to check
 * @returns true if string is safe, false otherwise
 */
export function isSafeString(input: string): boolean {
  try {
    // Check for null bytes
    if (input.includes('\0')) {
      return false;
    }

    // Check basic dangerous patterns
    const basicDangerousPatterns = [
      /\.\./,     // Directory traversal
      /\$\{/,     // Variable expansion
      /`/,        // Command substitution
      /;/,        // Command separator
      /&&/,       // AND operator
      /\|\|/,     // OR operator
      />/,        // Redirection
      /</         // Redirection
    ];

    for (const pattern of basicDangerousPatterns) {
      if (pattern.test(input)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or similar distributed solution
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed
   * 
   * @param key - Identifier (e.g., IP address, user ID)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      log.warn({ key, requests: validTimestamps.length }, 'Rate limit exceeded');
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.requests.clear();
  }
}

/**
 * Global rate limiter instance (60 req/min per key)
 */
export const globalRateLimiter = new RateLimiter(60000, 60);
