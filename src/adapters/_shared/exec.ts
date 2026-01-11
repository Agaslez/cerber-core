/**
 * @file Shared execution utilities - SOLID Single Responsibility
 * @rule Per AGENTS.md §2 - Tool installation detection
 * @rule Cross-platform (Windows is first-class citizen)
 */

import type { ExecaError, Options as ExecaOptions } from 'execa';
import execa from 'execa';
import { platform } from 'node:os';
import which from 'which';

/**
 * Command execution options
 */
export interface ExecOptions {
  /** Working directory */
  cwd?: string;
  
  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Environment variables */
  env?: Record<string, string>;
  
  /** Reject on non-zero exit code (default: false) */
  reject?: boolean;
  
  /** Input to stdin */
  input?: string;
}

/**
 * Command execution result
 */
export interface ExecResult {
  /** Exit code */
  exitCode: number;
  
  /** stdout content */
  stdout: string;
  
  /** stderr content */
  stderr: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Command that was executed */
  command: string;
  
  /** Whether command failed */
  failed: boolean;
  
  /** Error (if failed and not rejected) */
  error?: Error;
}

/**
 * Execute command with timeout and cross-platform support
 * @rule Per AGENTS.md §8 - Windows is first-class citizen
 * @rule Graceful failure - returns ExecResult even on error
 */
export async function executeCommand(
  command: string,
  args: string[],
  options: ExecOptions = {}
): Promise<ExecResult> {
  const startTime = Date.now();
  const execaOptions: ExecaOptions = {
    cwd: options.cwd || process.cwd(),
    timeout: options.timeout || 30000,
    env: { ...process.env, ...options.env },
    reject: options.reject ?? false,
    input: options.input,
    // Cross-platform shell handling
    shell: platform() === 'win32' ? 'cmd.exe' : '/bin/sh',
    windowsHide: true,
  };

  try {
    const result = await execa(command, args, execaOptions);
    const executionTime = Date.now() - startTime;

    return {
      exitCode: result.exitCode || 0,
      stdout: String(result.stdout || ''),
      stderr: String(result.stderr || ''),
      executionTime,
      command: `${command} ${args.join(' ')}`,
      failed: (result.exitCode || 0) !== 0,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const execaError = error as ExecaError;

    return {
      exitCode: execaError.exitCode ?? 1,
      stdout: String(execaError.stdout ?? ''),
      stderr: String(execaError.stderr ?? ''),
      executionTime,
      command: `${command} ${args.join(' ')}`,
      failed: true,
      error: execaError,
    };
  }
}

/**
 * Find command in PATH (cross-platform)
 * @rule Per AGENTS.md §2 - Tool detection
 * @returns Absolute path to command or null if not found
 */
export async function findCommand(command: string): Promise<string | null> {
  try {
    // which() throws if not found
    const path = await which(command, { nothrow: true });
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Check if command exists in PATH
 */
export async function commandExists(command: string): Promise<boolean> {
  const path = await findCommand(command);
  return path !== null;
}

/**
 * Extract version from tool output using regex
 * @rule Common pattern for version detection
 * @example
 * extractVersion("actionlint 1.6.26", /(\d+\.\d+\.\d+)/) // "1.6.26"
 */
export function extractVersion(output: string, pattern: RegExp): string | null {
  const match = output.match(pattern);
  return match ? match[1] : null;
}

/**
 * Parse exit code to standard Cerber exit codes
 * @rule Per AGENTS.md §8 - Exit codes: 0 (success) / 1 (violations) / 2 (config error) / 3 (tool error)
 */
export function normalizeExitCode(toolExitCode: number, toolName: string): number {
  // 0 = success (no violations)
  if (toolExitCode === 0) return 0;
  
  // 1 = violations found (standard across most linters)
  if (toolExitCode === 1) return 1;
  
  // 2 = config error (some tools use this)
  if (toolExitCode === 2) return 2;
  
  // >2 = tool error (3 in Cerber convention)
  return 3;
}

/**
 * Build installation hint for common package managers
 * @rule Per AGENTS.md §2 - Installation hints
 */
export function buildInstallHint(
  toolName: string,
  options: {
    brew?: string;
    apt?: string;
    github?: string;
    binary?: string;
  }
): string {
  const hints: string[] = [];
  
  if (options.brew) {
    hints.push(`brew install ${options.brew}`);
  }
  
  if (options.apt) {
    hints.push(`apt-get install ${options.apt}`);
  }
  
  if (options.github) {
    hints.push(`Download from: ${options.github}`);
  }
  
  if (options.binary) {
    hints.push(`curl -L ${options.binary} | tar xz`);
  }
  
  return hints.join(' OR ');
}
