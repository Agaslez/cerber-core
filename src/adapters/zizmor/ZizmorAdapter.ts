/**
 * @file zizmor Adapter - SOLID Single Responsibility
 * @rule Per AGENTS.md §1 - Orchestrate zizmor, don't reimplement
 * @rule Per AGENTS.md §2 - Uses fixtures for testing
 */

import type { Violation } from '../../types.js';
import { BaseAdapter } from '../_shared/BaseAdapter.js';
import { buildInstallHint, executeCommand } from '../_shared/exec.js';
import type { AdapterResult, AdapterRunOptions } from '../types.js';

/**
 * zizmor finding (JSON output)
 */
interface ZizmorFinding {
  workflowPath: string;
  job: string;
  step: number;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  line?: number;
  column?: number;
}

/**
 * zizmor adapter - GitHub Actions security scanner
 * @see https://github.com/woodruffw/zizmor
 */
export class ZizmorAdapter extends BaseAdapter {
  constructor() {
    super({
      name: 'zizmor',
      displayName: 'zizmor',
      description: 'GitHub Actions security scanner',
      binaryName: 'zizmor',
      versionArgs: ['--version'],
      versionPattern: /zizmor (\d+\.\d+\.\d+)/,
      installHint: buildInstallHint('zizmor', {
        github: 'https://github.com/woodruffw/zizmor/releases',
        binary: 'https://github.com/woodruffw/zizmor/releases/latest/download/zizmor-x86_64-unknown-linux-musl',
      }),
    });
  }

  /**
   * Run zizmor on files
   * @rule Per AGENTS.md §6 - Graceful: tool missing → skip with warning
   */
  async run(options: AdapterRunOptions): Promise<AdapterResult> {
    const startTime = Date.now();

    // Check if tool is installed
    const detection = await this.detect();
    if (!detection.installed) {
      return this.createSkippedResult(
        `zizmor not installed. ${detection.installHint}`
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

    // Run zizmor with JSON output
    // zizmor accepts directory or specific workflow files
    const args = ['--format', 'json', ...workflowFiles];

    const result = await executeCommand('zizmor', args, {
      cwd: options.cwd,
      timeout: options.timeout || 30000,
      reject: false,
    });

    // Parse JSON output
    const violations = this.parseOutput(result.stdout, {
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
   * Parse zizmor JSON output into violations
   * @rule Per AGENTS.md §1 - Parse JSON (documented format)
   * @rule Per AGENTS.md §3 - Return sorted violations
   */
  parseOutput(rawOutput: string, options?: { cwd?: string }): Violation[] {
    if (!rawOutput || rawOutput.trim() === '') {
      return [];
    }

    try {
      const findings: ZizmorFinding[] = JSON.parse(rawOutput);
      
      if (!Array.isArray(findings)) {
        return [];
      }

      const violations: Violation[] = findings.map((finding) => {
        // Normalize path (handle Windows absolute paths)
        const normalizedPath = this.normalizePath(finding.workflowPath, options?.cwd);

        return {
          id: `zizmor/${finding.rule}`,
          severity: this.mapSeverity(finding.severity),
          message: finding.message,
          source: 'zizmor',
          path: normalizedPath,
          line: finding.line,
          column: finding.column,
          toolOutput: {
            job: finding.job,
            step: finding.step,
            originalSeverity: finding.severity,
          },
        };
      });

      return this.sortViolations(violations);
    } catch (error) {
      // If JSON parsing fails, return empty (graceful degradation)
      return [];
    }
  }

  /**
   * Normalize file path - converts Windows backslashes and makes relative to cwd
   * @param filePath Path from zizmor output
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
   * Map zizmor severity to Cerber severity
   * @rule Per AGENTS.md - Consistent severity mapping
   */
  private mapSeverity(
    zizmorSeverity: 'critical' | 'high' | 'medium' | 'low'
  ): 'error' | 'warning' | 'info' {
    switch (zizmorSeverity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'warning';
    }
  }
}
