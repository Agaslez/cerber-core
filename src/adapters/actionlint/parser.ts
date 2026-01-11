/**
 * Actionlint Adapter
 * Parses GitHub Actions workflow validation results
 * Supports: NDJSON (JSON lines) + text format outputs
 */

import { Violation } from '../../reporting/violation';

/**
 * Actionlint output formats
 */
export type ActionlintFormat = 'ndjson' | 'text' | 'json' | 'auto';

/**
 * Actionlint error in structured format
 */
export interface ActionlintError {
  line: number;
  column: number;
  message: string;
  kind?: string;
}

/**
 * Actionlint raw JSON object (single error)
 */
export interface ActionlintRawError {
  line?: number;
  column?: number;
  message?: string;
  kind?: string;
}

/**
 * Parse actionlint error code to rule ID
 * Examples: "deprecated-commands", "insecure-runner", "missing-step-id"
 */
export function extractRuleId(message: string): string {
  // Match common rule patterns
  const patterns = [
    /deprecated command: `(.+?)`/i,           // deprecated-commands
    /insecure runner .+? (.+?)\.?$/i,         // insecure-runner
    /missing step id/i,                       // missing-step-id
    /invalid property `.+?`/i,                // invalid-property
    /ambiguous environment variable/i,        // ambiguous-env-var
    /workflow has .+ errors?/i,               // general-error
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1]?.toLowerCase().replace(/\s+/g, '-') || 'unknown-error';
    }
  }

  // Fallback: extract first word, lowercase, replace spaces
  const word = message.split(/[\s:,]/)[0];
  return word?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'unknown-error';
}

/**
 * Parse NDJSON format (line-delimited JSON)
 * Each line is a JSON object
 * Example:
 * {"line":1,"column":5,"message":"deprecated command: 'run'"}
 * {"line":2,"column":10,"message":"invalid property 'test'"}
 */
export function parseNdjson(output: string): ActionlintError[] {
  const lines = output
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const errors: ActionlintError[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as ActionlintRawError;

      if (parsed.line === undefined || parsed.message === undefined) {
        continue; // Skip incomplete entries
      }

      errors.push({
        line: parsed.line,
        column: parsed.column || 1,
        message: parsed.message,
        kind: parsed.kind
      });
    } catch {
      // Skip malformed JSON lines
      continue;
    }
  }

  return errors;
}

/**
 * Parse text format (human-readable)
 * Example:
 * .github/workflows/test.yml:5:10: deprecated command: 'run'
 * .github/workflows/test.yml:12:1: invalid property 'if'
 */
export function parseText(output: string): ActionlintError[] {
  const errors: ActionlintError[] = [];
  const lineRegex = /^\s*(?:\.\/)?(?:[^:]+):(\d+):(\d+):\s*(.+?)$/gm;

  let match;
  while ((match = lineRegex.exec(output)) !== null) {
    const [, lineStr, colStr, message] = match;

    errors.push({
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
      message: message.trim(),
      kind: undefined
    });
  }

  return errors;
}

/**
 * Parse JSON array format
 * [{"line":1,"column":5,"message":"..."}]
 */
export function parseJsonArray(output: string): ActionlintError[] {
  try {
    const parsed = JSON.parse(output) as ActionlintRawError[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        item =>
          item.line !== undefined &&
          item.message !== undefined
      )
      .map(item => ({
        line: item.line!,
        column: item.column || 1,
        message: item.message!,
        kind: item.kind
      }));
  } catch {
    return [];
  }
}

/**
 * Auto-detect format and parse
 * Priority: JSON array > NDJSON > Text
 */
export function parseAuto(output: string): ActionlintError[] {
  const trimmed = output.trim();

  // Try JSON array first
  if (trimmed.startsWith('[')) {
    const result = parseJsonArray(trimmed);
    if (result.length > 0) {
      return result;
    }
  }

  // Try NDJSON (each line is JSON)
  const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
  if (lines.every(line => {
    try {
      JSON.parse(line);
      return true;
    } catch {
      return false;
    }
  })) {
    const result = parseNdjson(trimmed);
    if (result.length > 0) {
      return result;
    }
  }

  // Fall back to text format
  return parseText(trimmed);
}

/**
 * Convert actionlint error to unified Violation format
 */
export function errorToViolation(
  error: ActionlintError,
  filePath: string
): Violation {
  const ruleId = extractRuleId(error.message);

  return {
    id: `actionlint/${ruleId}`,
    severity: 'error',
    message: error.message,
    source: 'actionlint',
    path: filePath,
    line: error.line,
    column: error.column,
    hint: undefined,
    toolOutput: {
      raw: error.message,
      kind: error.kind
    }
  };
}

/**
 * Main parser function
 * Converts actionlint output to Violations
 */
export function parseActionlintOutput(
  output: string,
  filePath: string,
  format: ActionlintFormat = 'auto'
): Violation[] {
  let errors: ActionlintError[];

  switch (format) {
    case 'ndjson':
      errors = parseNdjson(output);
      break;
    case 'text':
      errors = parseText(output);
      break;
    case 'json':
      errors = parseJsonArray(output);
      break;
    case 'auto':
    default:
      errors = parseAuto(output);
  }

  return errors.map(error => errorToViolation(error, filePath));
}

export default {
  parseActionlintOutput,
  parseNdjson,
  parseText,
  parseJsonArray,
  parseAuto,
  extractRuleId,
  errorToViolation
};
