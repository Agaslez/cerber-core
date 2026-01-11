/**
 * @file Adapter types - SOLID Single Responsibility
 * @rule ONE interface per concept (AGENTS.md §1)
 */

import type { Violation } from '../types.js';

/**
 * Adapter execution options
 */
export interface AdapterRunOptions {
  /** Files to check (relative paths from repo root) */
  files: string[];
  
  /** Working directory (repo root) */
  cwd: string;
  
  /** Additional tool-specific args */
  args?: string[];
  
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Adapter execution result
 */
export interface AdapterResult {
  /** Tool name */
  tool: string;
  
  /** Tool version */
  version: string;
  
  /** Exit code (0 = success, 1 = violations, >1 = error) */
  exitCode: number;
  
  /** Parsed violations (normalized) */
  violations: Violation[];
  
  /** Raw stdout (for debugging) */
  rawStdout?: string;
  
  /** Raw stderr (for debugging) */
  rawStderr?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Skipped flag (tool not installed) */
  skipped?: boolean;
  
  /** Skip reason */
  skipReason?: string;
}

/**
 * Tool detection result
 */
export interface ToolDetection {
  /** Is tool installed? */
  installed: boolean;
  
  /** Tool version (if installed) */
  version: string | null;
  
  /** Installation path (if detected) */
  path?: string;
  
  /** Install hint (if not installed) */
  installHint: string;
}

/**
 * Adapter interface - MUST be implemented by all adapters
 * @rule Per AGENTS.md §1 - Required Interface
 */
export interface Adapter {
  /** Unique adapter name (lowercase, e.g., "actionlint") */
  readonly name: string;
  
  /** Tool display name (e.g., "actionlint") */
  readonly displayName: string;
  
  /** Tool description */
  readonly description: string;
  
  /**
   * Check if tool is installed
   * @rule MUST NOT throw - return detection result
   */
  detect(): Promise<ToolDetection>;
  
  /**
   * Get tool version
   * @rule MUST return null if tool not installed (graceful)
   */
  getVersion(): Promise<string | null>;
  
  /**
   * Check if tool is installed (convenience wrapper)
   */
  isInstalled(): Promise<boolean>;
  
  /**
   * Get installation instructions
   * @returns Human-readable hint (curl command, brew, apt, etc.)
   */
  getInstallHint(): string;
  
  /**
   * Run tool and parse output
   * @rule Per AGENTS.md §1 - MUST handle missing tool gracefully
   * @rule Per AGENTS.md §3 - MUST return deterministic violations (sorted)
   */
  run(options: AdapterRunOptions): Promise<AdapterResult>;
  
  /**
   * Parse tool output into violations
   * @rule Per AGENTS.md §1 - Feed with fixtures for testing
   * @rule Per AGENTS.md §3 - MUST return sorted violations
   */
  parseOutput(rawOutput: string, options?: { cwd?: string }): Violation[];
}

/**
 * Base adapter configuration
 */
export interface AdapterConfig {
  /** Adapter name */
  name: string;
  
  /** Tool binary name (for PATH lookup) */
  binaryName: string;
  
  /** Version command args (e.g., ["--version"]) */
  versionArgs: string[];
  
  /** Version regex pattern (to extract version from output) */
  versionPattern: RegExp;
  
  /** Installation hint template */
  installHint: string;
  
  /** Supported platforms (default: all) */
  platforms?: ('win32' | 'darwin' | 'linux')[];
}
