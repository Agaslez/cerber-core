/**
 * @file Base Adapter - SOLID Single Responsibility
 * @rule Per AGENTS.md §1 - Common adapter logic
 * @rule DRY principle - shared detection/version logic
 */

import type { Violation } from '../../types.js';
import type {
    Adapter,
    AdapterConfig,
    AdapterResult,
    AdapterRunOptions,
    ToolDetection,
} from '../types.js';
import {
    executeCommand,
    extractVersion,
    findCommand,
    normalizeExitCode,
} from './exec.js';

/**
 * Abstract base adapter - implements common detection logic
 * @rule Per AGENTS.md §1 - SOLID principle: Extract common behavior
 * @rule Per AGENTS.md §6 - Graceful degradation (tool missing)
 */
export abstract class BaseAdapter implements Adapter {
  public readonly name: string;
  public readonly displayName: string;
  public readonly description: string;
  
  protected readonly config: AdapterConfig;

  constructor(config: AdapterConfig & { displayName: string; description: string }) {
    this.name = config.name;
    this.displayName = config.displayName;
    this.description = config.description;
    this.config = config;
  }

  /**
   * Detect tool installation
   * @rule Per AGENTS.md §2 - MUST NOT throw
   */
  async detect(): Promise<ToolDetection> {
    // Check platform support
    if (this.config.platforms && !this.config.platforms.includes(process.platform as any)) {
      return {
        installed: false,
        version: null,
        installHint: `${this.displayName} is not supported on ${process.platform}`,
      };
    }

    // Find in PATH
    const path = await findCommand(this.config.binaryName);
    if (!path) {
      return {
        installed: false,
        version: null,
        installHint: this.getInstallHint(),
      };
    }

    // Get version
    const version = await this.getVersion();

    return {
      installed: true,
      version,
      path,
      installHint: version ? '' : this.getInstallHint(),
    };
  }

  /**
   * Get tool version
   * @rule Per AGENTS.md §2 - MUST return null if not installed (graceful)
   */
  async getVersion(): Promise<string | null> {
    try {
      const result = await executeCommand(
        this.config.binaryName,
        this.config.versionArgs,
        { timeout: 5000 }
      );

      if (result.failed) {
        return null;
      }

      // Try to extract version from stdout or stderr
      const output = result.stdout || result.stderr;
      return extractVersion(output, this.config.versionPattern);
    } catch {
      return null;
    }
  }

  /**
   * Check if tool is installed
   */
  async isInstalled(): Promise<boolean> {
    const detection = await this.detect();
    return detection.installed;
  }

  /**
   * Get installation hint
   */
  getInstallHint(): string {
    return this.config.installHint;
  }

  /**
   * Run tool - must be implemented by subclass
   * @rule Per AGENTS.md §1 - Each adapter implements its own logic
   */
  abstract run(options: AdapterRunOptions): Promise<AdapterResult>;

  /**
   * Parse output - must be implemented by subclass
   * @rule Per AGENTS.md §1 - Each adapter has its own parser
   * @rule Per AGENTS.md §3 - MUST return sorted violations
   */
  abstract parseOutput(rawOutput: string, options?: { cwd?: string }): Violation[];

  /**
   * Sort violations deterministically
   * @rule Per AGENTS.md §3 - Determinism: sorted by path, line, column, id, source
   */
  protected sortViolations(violations: Violation[]): Violation[] {
    return [...violations].sort((a, b) => {
      // Sort by path
      if (a.path && b.path && a.path !== b.path) {
        return a.path.localeCompare(b.path);
      }
      
      // Sort by line
      if (a.line !== undefined && b.line !== undefined && a.line !== b.line) {
        return a.line - b.line;
      }
      
      // Sort by column
      if (a.column !== undefined && b.column !== undefined && a.column !== b.column) {
        return a.column - b.column;
      }
      
      // Sort by id
      if (a.id !== b.id) {
        return a.id.localeCompare(b.id);
      }
      
      // Sort by source
      if (a.source !== b.source) {
        return a.source.localeCompare(b.source);
      }
      
      return 0;
    });
  }

  /**
   * Create skipped result (tool not installed)
   * @rule Per AGENTS.md §6 - Graceful degradation
   */
  protected createSkippedResult(reason: string): AdapterResult {
    return {
      tool: this.name,
      version: 'n/a',
      exitCode: 0,
      violations: [],
      executionTime: 0,
      skipped: true,
      skipReason: reason,
    };
  }

  /**
   * Create result from execution
   * @rule Per AGENTS.md §8 - Exit codes: 0/1/2/3
   */
  protected createResult(
    version: string,
    exitCode: number,
    violations: Violation[],
    executionTime: number,
    rawStdout?: string,
    rawStderr?: string
  ): AdapterResult {
    return {
      tool: this.name,
      version,
      exitCode: normalizeExitCode(exitCode, this.name),
      violations: this.sortViolations(violations),
      rawStdout,
      rawStderr,
      executionTime,
    };
  }
}
