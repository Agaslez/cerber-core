/**
 * Unified Violation Model
 * Represents a single code violation/finding from any tool
 * ONE TRUTH: This is the canonical format for all violations
 */

/**
 * Severity levels
 */
export type Severity = 'error' | 'warning' | 'info';

/**
 * Tool sources
 */
export type ToolSource = 'actionlint' | 'zizmor' | 'gitleaks' | 'cerber-semantic' | 'test';

/**
 * Tool-specific output metadata
 */
export interface ToolOutput {
  /** Raw output from tool */
  raw: string;
  /** Tool-specific kind/category */
  kind?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Unified Violation format
 * Common format for all tool findings
 */
export interface Violation {
  /** Unique rule identifier: <tool>/<rule-id> */
  id: string;

  /** Severity: error (fails CI), warning (gated), info (informational) */
  severity: Severity;

  /** Human-readable error message */
  message: string;

  /** Tool that generated this violation */
  source: ToolSource;

  /** File path (normalized to forward slashes) */
  path: string;

  /** 1-based line number */
  line: number;

  /** 1-based column number (if available) */
  column: number;

  /** Optional hint/suggestion for fix */
  hint?: string;

  /** Tool-specific output metadata */
  toolOutput?: ToolOutput;
}

/**
 * Violation comparison key for deduplication
 * Format: source|id|path|line|column|hash(message)
 */
export function getViolationKey(violation: Violation): string {
  const messageHash = Math.abs(
    violation.message.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
  ).toString(36);

  return `${violation.source}|${violation.id}|${violation.path}|${violation.line}|${violation.column}|${messageHash}`;
}

/**
 * Create a violation from components
 */
export function createViolation(
  id: string,
  message: string,
  path: string,
  line: number,
  column: number = 1,
  options?: {
    severity?: Severity;
    source?: ToolSource;
    hint?: string;
    toolOutput?: ToolOutput;
  }
): Violation {
  return {
    id,
    severity: options?.severity || 'error',
    message,
    source: options?.source || 'test',
    path,
    line,
    column,
    hint: options?.hint,
    toolOutput: options?.toolOutput
  };
}

export default {
  getViolationKey,
  createViolation
};
