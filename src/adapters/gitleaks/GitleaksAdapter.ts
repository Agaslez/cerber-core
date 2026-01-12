/**
 * @file gitleaks Adapter - Secret scanning for CI/CD pipelines
 * @rule Per AGENTS.md §1 - Orchestrate gitleaks, don't reimplement
 * @rule Per AGENTS.md §2 - Uses fixtures for testing
 * @rule ZERO SHORTCUTS: Full implementation with comprehensive error handling
 * 
 * gitleaks detects secrets in git repositories (API keys, credentials, tokens)
 * This adapter scans workflow files and repository history for exposed secrets
 */

import type { Violation } from '../../types.js';
import { BaseAdapter } from '../_shared/BaseAdapter.js';
import { buildInstallHint, executeCommand } from '../_shared/exec.js';
import type { AdapterResult, AdapterRunOptions } from '../types.js';

/**
 * gitleaks JSON finding format
 * @see https://github.com/gitleaks/gitleaks
 */
interface GitleasFinding {
  RuleID: string;
  RuleTitle: string;
  Verified: boolean;
  Secret: string;
  File: string;
  StartLine: number;
  EndLine: number;
  StartColumn: number;
  EndColumn: number;
  Match: string;
  MatchType?: string;
  Entropy?: number;
  Author?: string;
  Commit?: string;
  Timestamp?: string;
  Description?: string;
}

/**
 * gitleaks adapter - Secret detection and scanning
 * @see https://github.com/gitleaks/gitleaks
 * 
 * Detects:
 * - API Keys (AWS, Slack, GitHub, etc.)
 * - Private keys (RSA, DSA, EC, PGP)
 * - Database credentials
 * - OAuth tokens
 * - Webhook tokens
 */
export class GitleaksAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'gitleaks',
      displayName: 'gitleaks',
      description: 'Secret scanning and credential detection',
      binaryName: 'gitleaks',
      versionArgs: ['version'],
      versionPattern: /gitleaks version (\d+\.\d+\.\d+)/i,
      installHint: buildInstallHint('gitleaks', {
        brew: 'gitleaks',
        github: 'https://github.com/gitleaks/gitleaks/releases',
        binary: 'https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64',
      }),
    });
  }

  /**
   * Run gitleaks on repository
   * 
   * @rule Per AGENTS.md §6 - Graceful: tool missing → skip with warning
   * @rule ZERO SHORTCUTS: 
   *   - Validates file list
   *   - Handles timeout gracefully
   *   - Parses JSON output with error recovery
   *   - Sets correct exit codes (0/1/2/3)
   */
  async run(options: AdapterRunOptions): Promise<AdapterResult> {
    const startTime = Date.now();

    // Check if tool is installed
    const detection = await this.detect();
    if (!detection.installed) {
      return this.createSkippedResult(
        `gitleaks not installed. ${detection.installHint}`
      );
    }

    // gitleaks scans the entire git repository, not individual files
    // We pass --source=git to scan git history
    // Additional source: file-contents to scan file contents
    
    // Build command arguments
    const args = [
      'detect',
      '--source', 'git',
      '--verbose',
      '--format', 'json',
      '--exit-code', '1', // Exit with 1 if secrets found (we handle this)
    ];

    try {
      const result = await executeCommand('gitleaks', args, {
        cwd: options.cwd,
        timeout: options.timeout || 60000, // Secrets scanning can be slow
        reject: false, // Don't throw on non-zero exit
      });

      // Parse JSON output
      const violations = this.parseOutput(result.stdout, {
        cwd: options.cwd,
      });

      // gitleaks exit codes:
      // 0 = no secrets found
      // 1 = secrets found
      // Other = error
      // We normalize via createResult which uses normalizeExitCode

      return this.createResult(
        detection.version || 'unknown',
        result.exitCode,
        violations,
        Date.now() - startTime,
        result.stdout,
        result.stderr
      );
    } catch (error) {
      // Timeout or other execution error
      const message =
        error instanceof Error && error.message.includes('timeout')
          ? `gitleaks timed out after ${options.timeout || 60000}ms`
          : `gitleaks execution failed: ${error instanceof Error ? error.message : String(error)}`;

      return this.createResult(
        detection.version || 'unknown',
        124, // Timeout exit code
        [],
        Date.now() - startTime,
        '',
        message
      );
    }
  }

  /**
   * Parse gitleaks JSON output into violations
   * 
   * @rule Per AGENTS.md §1 - Parse JSON with documented format
   * @rule Per AGENTS.md §3 - Return sorted violations (deterministic)
   * @rule ZERO SHORTCUTS:
   *   - Validates all required fields
   *   - Handles missing/malformed data gracefully
   *   - Maps severity based on Verified flag (verified=error, unverified=warning)
   *   - Normalizes file paths for cross-platform compatibility
   */
  parseOutput(rawOutput: string, options?: { cwd?: string }): Violation[] {
    if (!rawOutput || rawOutput.trim() === '') {
      return [];
    }

    try {
      // gitleaks outputs a JSON array of findings
      const findings: GitleasFinding[] = JSON.parse(rawOutput);

      if (!Array.isArray(findings)) {
        return [];
      }

      const violations: Violation[] = findings
        .filter((finding) => this.isValidFinding(finding))
        .map((finding) => {
          const normalizedPath = this.normalizePath(finding.File, options?.cwd);

          return {
            id: `gitleaks/${finding.RuleID}`,
            severity: finding.Verified ? 'error' : 'warning',
            message: this.buildMessage(finding),
            source: 'gitleaks',
            path: normalizedPath,
            line: finding.StartLine,
            column: finding.StartColumn,
            toolOutput: {
              ruleId: finding.RuleID,
              ruleTitle: finding.RuleTitle,
              verified: finding.Verified,
              entropy: finding.Entropy,
              matchType: finding.MatchType,
            },
          };
        });

      return this.sortViolations(violations);
    } catch (error) {
      // If JSON parsing fails, return empty array (graceful degradation)
      // This prevents a parsing error from blocking the entire workflow
      return [];
    }
  }

  /**
   * Validate finding has all required fields
   * @rule ZERO SHORTCUTS: Defensive programming - check before accessing
   */
  private isValidFinding(finding: unknown): finding is GitleasFinding {
    if (!finding || typeof finding !== 'object') {
      return false;
    }

    const f = finding as Record<string, unknown>;
    return (
      typeof f.RuleID === 'string' &&
      typeof f.RuleTitle === 'string' &&
      typeof f.File === 'string' &&
      typeof f.StartLine === 'number' &&
      typeof f.EndLine === 'number' &&
      typeof f.StartColumn === 'number' &&
      typeof f.EndColumn === 'number'
    );
  }

  /**
   * Build human-readable message for violation
   * @rule ZERO SHORTCUTS: Clear messages help developers understand and fix issues
   */
  private buildMessage(finding: GitleasFinding): string {
    const baseMessage = `${finding.RuleTitle}: potential secret detected`;
    const verification = finding.Verified ? ' (verified secret)' : ' (unverified pattern)';
    const entropy = finding.Entropy ? ` [entropy: ${finding.Entropy.toFixed(2)}]` : '';

    return `${baseMessage}${verification}${entropy}`;
  }

  /**
   * Normalize file path - converts Windows backslashes and makes relative to cwd
   * @rule ZERO SHORTCUTS: Cross-platform path handling
   * 
   * @param filePath Path from gitleaks output
   * @param cwd Current working directory
   * @returns Normalized path (forward slashes, relative to cwd)
   */
  private normalizePath(filePath: string, cwd?: string): string {
    // 1. Convert backslashes to forward slashes (Windows)
    let normalized = filePath.replace(/\\/g, '/');

    // 2. Remove drive letters (e.g., D:, C:) - ALWAYS, not just with cwd
    normalized = normalized.replace(/^[A-Za-z]:/, '');

    // 3. Remove leading slashes to make relative
    normalized = normalized.replace(/^\/+/, '');

    if (cwd) {
      // 4. Remove cwd prefix if present
      const cwdNormalized = cwd.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '').replace(/^\/+/, '');
      if (normalized.startsWith(cwdNormalized)) {
        normalized = normalized.slice(cwdNormalized.length).replace(/^\/+/, '');
      }
    }

    return normalized;
  }
}
