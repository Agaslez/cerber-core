/**
 * @file Actionlint Adapter - COMMIT 4
 * @description Parses actionlint output in multiple formats
 */

import type { Violation } from '../types.js';

export interface ActionlintIssue {
  message: string;
  filepath: string;
  line: number;
  column: number;
  kind: string;
  snippet?: string;
  end_column?: number;
}

/**
 * Actionlint Adapter
 * 
 * Supports 3 output formats:
 * 1. NDJSON (default) - one JSON per line
 * 2. JSON array - array of issues
 * 3. Text fallback - human-readable format
 * 
 * @rule Per ROADMAP COMMIT 4 - Multiple format support
 */
export class ActionlintAdapter {
  /**
   * Parse actionlint output to violations
   * 
   * Auto-detects format:
   * - Starts with '{' → NDJSON
   * - Starts with '[' → JSON array
   * - Otherwise → Text fallback
   * 
   * @param output Actionlint stdout
   * @param options Parse options (cwd for path normalization)
   * @returns Array of violations
   */
  parse(output: string, options?: { cwd?: string }): Violation[] {
    if (!output || output.trim().length === 0) {
      return [];
    }

    const trimmed = output.trim();

    // Format 1: NDJSON (one JSON object per line)
    if (trimmed.startsWith('{')) {
      return this.parseNDJSON(trimmed, options);
    }

    // Format 2: JSON array
    if (trimmed.startsWith('[')) {
      return this.parseJSONArray(trimmed, options);
    }

    // Format 3: Text fallback
    return this.parseText(trimmed, options);
  }

  /**
   * Parse NDJSON format (default actionlint output)
   * 
   * Example:
   * {"message":"...","filepath":".github/workflows/ci.yml","line":10,"column":5,"kind":"expression"}
   * {"message":"...","filepath":".github/workflows/ci.yml","line":15,"column":3,"kind":"syntax-check"}
   * 
   * @param output NDJSON string
   * @param options Parse options
   * @returns Array of violations
   */
  private parseNDJSON(output: string, options?: { cwd?: string }): Violation[] {
    const violations: Violation[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith('{')) {
        continue;
      }

      try {
        const issue = JSON.parse(trimmedLine) as ActionlintIssue;
        violations.push(this.issueToViolation(issue, options?.cwd));
      } catch {
        // Skip invalid JSON lines
        continue;
      }
    }

    return violations;
  }

  /**
   * Parse JSON array format
   * 
   * Example:
   * [
   *   {"message":"...","filepath":"...","line":10,"column":5,"kind":"expression"},
   *   {"message":"...","filepath":"...","line":15,"column":3,"kind":"syntax-check"}
   * ]
   * 
   * @param output JSON array string
   * @param options Parse options
   * @returns Array of violations
   */
  private parseJSONArray(output: string, options?: { cwd?: string }): Violation[] {
    try {
      const issues = JSON.parse(output) as ActionlintIssue[];
      
      if (!Array.isArray(issues)) {
        return [];
      }

      return issues.map(issue => this.issueToViolation(issue, options?.cwd));
    } catch {
      // Invalid JSON
      return [];
    }
  }

  /**
   * Parse text format (human-readable fallback)
   * 
   * Example:
   * .github/workflows/ci.yml:10:5: error message here [expression]
   * .github/workflows/ci.yml:15:3: another error [syntax-check]
   * 
   * @param output Text string
   * @param options Parse options
   * @returns Array of violations
   */
  private parseText(output: string, options?: { cwd?: string }): Violation[] {
    const violations: Violation[] = [];
    const lines = output.split('\n');

    // Pattern: filepath:line:column: message [kind]
    const pattern = /^(.+?):(\d+):(\d+):\s*(.+?)(?:\s*\[([^\]]+)\])?$/;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      const match = trimmedLine.match(pattern);
      if (match) {
        const [, filepath, lineNum, colNum, message, kind] = match;
        
        violations.push({
          id: kind ? `actionlint/${kind}` : 'actionlint/unknown',
          severity: 'error', // actionlint reports all as errors
          message: message.trim(),
          source: 'actionlint',
          path: this.normalizePath(filepath, options?.cwd),
          line: parseInt(lineNum, 10),
          column: parseInt(colNum, 10),
        });
      }
    }

    return violations;
  }

  /**
   * Convert ActionlintIssue to Violation
   * 
   * @param issue Actionlint issue
   * @param cwd Current working directory
   * @returns Violation
   */
  private issueToViolation(issue: ActionlintIssue, cwd?: string): Violation {
    return {
      id: `actionlint/${issue.kind || 'unknown'}`,
      severity: 'error', // actionlint reports all as errors
      message: issue.message,
      source: 'actionlint',
      path: this.normalizePath(issue.filepath, cwd),
      line: issue.line,
      column: issue.column,
      hint: issue.snippet,
    };
  }

  /**
   * Normalize file path (forward slashes + relative to cwd)
   * 
   * @param filePath File path
   * @param cwd Current working directory
   * @returns Normalized relative path
   */
  private normalizePath(filePath: string, cwd?: string): string {
    // Convert backslashes to forward slashes
    let normalized = filePath.replace(/\\/g, '/');
    
    // If we have cwd, make path relative to it
    if (cwd) {
      const cwdNormalized = cwd.replace(/\\/g, '/');
      
      // Remove drive letter if present (e.g., "D:/project/file.yml" → "/project/file.yml")
      normalized = normalized.replace(/^[A-Za-z]:/, '');
      const cwdWithoutDrive = cwdNormalized.replace(/^[A-Za-z]:/, '');
      
      // If path starts with cwd, make it relative
      if (normalized.startsWith(cwdWithoutDrive)) {
        normalized = normalized.slice(cwdWithoutDrive.length);
        // Remove leading slash
        normalized = normalized.replace(/^\//, '');
      }
      // If path starts with ../ it's already relative
      else if (normalized.startsWith('../')) {
        // Extract just the filename part after ../
        const parts = normalized.split('../');
        normalized = parts[parts.length - 1];
      }
    }
    
    return normalized;
  }

  /**
   * Get severity from actionlint kind
   * 
   * Most actionlint issues are errors, but some could be warnings
   * 
   * @param _kind Issue kind
   * @returns Severity
   */
  private getSeverity(_kind: string): 'error' | 'warning' | 'info' {
    // Future: map certain kinds to warnings
    // For now, all are errors
    return 'error';
  }
}
