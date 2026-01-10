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
   * @returns Array of violations
   */
  parse(output: string): Violation[] {
    if (!output || output.trim().length === 0) {
      return [];
    }

    const trimmed = output.trim();

    // Format 1: NDJSON (one JSON object per line)
    if (trimmed.startsWith('{')) {
      return this.parseNDJSON(trimmed);
    }

    // Format 2: JSON array
    if (trimmed.startsWith('[')) {
      return this.parseJSONArray(trimmed);
    }

    // Format 3: Text fallback
    return this.parseText(trimmed);
  }

  /**
   * Parse NDJSON format (default actionlint output)
   * 
   * Example:
   * {"message":"...","filepath":".github/workflows/ci.yml","line":10,"column":5,"kind":"expression"}
   * {"message":"...","filepath":".github/workflows/ci.yml","line":15,"column":3,"kind":"syntax-check"}
   * 
   * @param output NDJSON string
   * @returns Array of violations
   */
  private parseNDJSON(output: string): Violation[] {
    const violations: Violation[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith('{')) {
        continue;
      }

      try {
        const issue = JSON.parse(trimmedLine) as ActionlintIssue;
        violations.push(this.issueToViolation(issue));
      } catch (error) {
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
   * @returns Array of violations
   */
  private parseJSONArray(output: string): Violation[] {
    try {
      const issues = JSON.parse(output) as ActionlintIssue[];
      
      if (!Array.isArray(issues)) {
        return [];
      }

      return issues.map(issue => this.issueToViolation(issue));
    } catch (error) {
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
   * @returns Array of violations
   */
  private parseText(output: string): Violation[] {
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
          path: this.normalizePath(filepath),
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
   * @returns Violation
   */
  private issueToViolation(issue: ActionlintIssue): Violation {
    return {
      id: `actionlint/${issue.kind || 'unknown'}`,
      severity: 'error', // actionlint reports all as errors
      message: issue.message,
      source: 'actionlint',
      path: this.normalizePath(issue.filepath),
      line: issue.line,
      column: issue.column,
      hint: issue.snippet,
    };
  }

  /**
   * Normalize file path (forward slashes)
   * 
   * @param path File path
   * @returns Normalized path
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
  }

  /**
   * Get severity from actionlint kind
   * 
   * Most actionlint issues are errors, but some could be warnings
   * 
   * @param kind Issue kind
   * @returns Severity
   */
  private getSeverity(kind: string): 'error' | 'warning' | 'info' {
    // Future: map certain kinds to warnings
    // For now, all are errors
    return 'error';
  }
}
