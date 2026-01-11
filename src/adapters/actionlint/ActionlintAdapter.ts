/**
 * @file actionlint Adapter - SOLID Single Responsibility
 * @rule Per AGENTS.md §1 - Orchestrate actionlint, don't reimplement
 * @rule Per AGENTS.md §2 - Uses fixtures for testing
 */

import type { Violation } from '../../types.js';
import { BaseAdapter } from '../_shared/BaseAdapter.js';
import { buildInstallHint, executeCommand } from '../_shared/exec.js';
import type { AdapterResult, AdapterRunOptions } from '../types.js';

/**
 * actionlint adapter - GitHub Actions workflow linter
 * @see https://github.com/rhysd/actionlint
 */
export class ActionlintAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'actionlint',
      displayName: 'actionlint',
      description: 'GitHub Actions workflow linter',
      binaryName: 'actionlint',
      versionArgs: ['-version'],
      versionPattern: /(\d+\.\d+\.\d+)/,
      installHint: buildInstallHint('actionlint', {
        brew: 'actionlint',
        github: 'https://github.com/rhysd/actionlint/releases',
        binary: 'https://github.com/rhysd/actionlint/releases/latest/download/actionlint_linux_amd64.tar.gz',
      }),
    });
  }

  /**
   * Run actionlint on files
   * @rule Per AGENTS.md §6 - Graceful: tool missing → skip with warning
   */
  async run(options: AdapterRunOptions): Promise<AdapterResult> {
    const startTime = Date.now();

    // Check if tool is installed
    const detection = await this.detect();
    if (!detection.installed) {
      return this.createSkippedResult(
        `actionlint not installed. ${detection.installHint}`
      );
    }

    // Filter for workflow files only
    const workflowFiles = options.files.filter(
      (file) =>
        file.includes('.github/workflows/') && 
        (file.endsWith('.yml') || file.endsWith('.yaml'))
    );

    if (workflowFiles.length === 0) {
      return this.createResult(
        detection.version || 'unknown',
        0,
        [],
        Date.now() - startTime
      );
    }

    // Run actionlint
    // Note: actionlint accepts file paths or runs on .github/workflows/* if no args
    const args = workflowFiles.length > 0 ? workflowFiles : [];
    
    const result = await executeCommand('actionlint', args, {
      cwd: options.cwd,
      timeout: options.timeout || 30000,
      reject: false,
    });

    // Parse output
    const violations = this.parseOutput(result.stdout + result.stderr, {
      cwd: options.cwd,
    });

    return this.createResult(
      detection.version || 'unknown',
      result.exitCode,
      violations,
      Date.now() - startTime,
      result.stdout,
      result.stderr
    );
  }

  /**
   * Parse actionlint output into violations
   * @rule Per AGENTS.md §1 - Parse with well-tested regex + fixtures
   * @rule Per AGENTS.md §3 - Return sorted violations
   * 
   * Format: <file>:<line>:<col>: <message> [<rule>]
   * Example: .github/workflows/ci.yml:5:1: unexpected key "jobs" [syntax-check]
   */
  parseOutput(rawOutput: string, options?: { cwd?: string }): Violation[] {
    if (!rawOutput || rawOutput.trim() === '') {
      return [];
    }

    const violations: Violation[] = [];
    const lines = rawOutput.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and separator lines (|, ^~~)
      if (!line || line.startsWith('|') || line.match(/^\^[~^]+$/)) {
        continue;
      }

      // Match: <file>:<line>:<col>: <message> [<rule>]
      const match = line.match(/^(.+?):(\d+):(\d+):\s+(.+?)\s+\[(.+?)\]$/);
      
      if (match) {
        const [, filePath, lineNum, colNum, message, ruleId] = match;
        
        // Normalize path (handle Windows absolute paths)
        const normalizedPath = this.normalizePath(filePath, options?.cwd);

        violations.push({
          id: `actionlint/${ruleId}`,
          severity: this.mapSeverity(ruleId),
          message: message.trim(),
          source: 'actionlint',
          path: normalizedPath,
          line: parseInt(lineNum, 10),
          column: parseInt(colNum, 10),
          toolOutput: { ruleId, rawLine: line },
        });
      }
    }

    return this.sortViolations(violations);
  }

  /**
   * Normalize file path - converts Windows backslashes and makes relative to cwd
   * @param filePath Path from actionlint output
   * @param cwd Current working directory
   * @returns Normalized path (forward slashes, relative to cwd)
   */
  private normalizePath(filePath: string, cwd?: string): string {
    // 1. Convert backslashes to forward slashes
    let normalized = filePath.replace(/\\/g, '/');
    
    if (cwd) {
      // 2. Remove drive letters (e.g., D:, C:)
      normalized = normalized.replace(/^[A-Za-z]:/, '');
      const cwdWithoutDrive = cwd.replace(/\\/g, '/').replace(/^[A-Za-z]:/, '');
      
      // 3. Make relative to cwd if path starts with cwd
      if (normalized.startsWith(cwdWithoutDrive)) {
        normalized = normalized.slice(cwdWithoutDrive.length).replace(/^\//, '');
      }
      // 4. Clean up ../ prefix if present
      else if (normalized.startsWith('../')) {
        // Remove leading ../ segments
        normalized = normalized.split('../').pop() || normalized;
      }
    }
    
    return normalized;
  }

  /**
   * Map actionlint rule to severity
   * @rule Per AGENTS.md - Consistent severity mapping
   */
  private mapSeverity(ruleId: string): 'error' | 'warning' | 'info' {
    // Critical rules (syntax errors, security issues)
    if (
      ruleId === 'syntax-check' ||
      ruleId === 'expression' ||
      ruleId === 'credentials'
    ) {
      return 'error';
    }

    // Deprecations and version issues
    if (
      ruleId === 'deprecated-commands' ||
      ruleId === 'action-version'
    ) {
      return 'warning';
    }

    // Everything else is warning (actionlint is strict)
    return 'warning';
  }
}
