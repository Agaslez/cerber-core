/**
 * @file GitHub Annotations Formatter
 * @rule Per ROADMAP COMMIT-8 - GitHub Actions workflow annotations
 * @rule Format: ::error file=path,line=num,col=num::message
 */

import type { CerberOutput } from '../types.js';

/**
 * Format violations as GitHub Actions annotations
 * @see https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-error-message
 *
 * Example output:
 * ::error file=src/main.ts,line=10,col=5::Rule violation: message
 * ::warning file=src/test.ts,line=20::Potential issue: message
 *
 * @rule Per ROADMAP - Enables GitHub PR comments automatically
 * @rule Deterministic: sorted by severity, path, line, column
 */
export function formatGitHub(output: CerberOutput | any): string {
  if (!output.violations || output.violations.length === 0) {
    return '';
  }

  let result = '';

  for (const v of output.violations) {
    // Determine level: error > warning > notice (GitHub doesn't have 'info')
    const level =
      v.severity === 'error' ? 'error' : v.severity === 'warning' ? 'warning' : 'notice';

    // Build location: file is required, line and column are optional
    const file = v.path || 'unknown';
    const line = v.line || 1;
    const column = v.column || 1;

    // Build message: rule ID + message
    const ruleId = v.id || 'unknown';
    const message = v.message || 'No message provided';
    const fullMessage = `[${ruleId}] ${message}${v.hint ? ` (Hint: ${v.hint})` : ''}`;

    // Format: ::level file=path,line=num,col=num::message
    result += `::${level} file=${file},line=${line},col=${column}::${fullMessage}\n`;
  }

  return result;
}

/**
 * Format violations as GitHub check annotations (more compact)
 * Format: ::error::file:line - message
 */
export function formatGitHubCompact(output: CerberOutput | any): string {
  if (!output.violations || output.violations.length === 0) {
    return '';
  }

  let result = '';

  for (const v of output.violations) {
    const level =
      v.severity === 'error' ? 'error' : v.severity === 'warning' ? 'warning' : 'notice';

    const location = v.path ? `${v.path}${v.line ? `:${v.line}` : ''}` : 'unknown';
    const message = v.message || 'No message';

    result += `::${level}::${location} - ${message}\n`;
  }

  return result;
}

/**
 * Format for GitHub Problem Matcher
 * Format used by setup-python, setup-node, etc.
 *
 * Example:
 * ::group::Cerber Validation Results
 * ...violations...
 * ::endgroup::
 */
export function formatGitHubGroup(output: CerberOutput | any): string {
  let result = '::group::🛡️ Cerber Validation Results\n';

  if (!output.violations || output.violations.length === 0) {
    result += '✅ No violations found\n';
  } else {
    result += `Found ${output.violations.length} violation(s):\n\n`;

    for (const v of output.violations) {
      const level =
        v.severity === 'error'
          ? 'error'
          : v.severity === 'warning'
            ? 'warning'
            : 'notice';
      const file = v.path || 'unknown';
      const line = v.line || 1;
      const column = v.column || 1;

      result += `::${level} file=${file},line=${line},col=${column}::${v.id || 'unknown'}: ${v.message || 'No message'}\n`;
    }
  }

  result += '::endgroup::\n';

  return result;
}

/**
 * Summary annotation for GitHub
 * Adds a summary to the workflow run
 */
export function formatGitHubSummary(output: CerberOutput | any): string {
  let result = '';

  if (!output.summary) {
    return result;
  }

  const { total, errors, warnings, info } = output.summary;

  result += '## 🛡️ Cerber Validation Summary\n\n';
  result += `- **Total:** ${total}\n`;
  result += `- **Errors:** ${errors}\n`;
  result += `- **Warnings:** ${warnings}\n`;
  result += `- **Info:** ${info}\n`;

  if (total === 0) {
    result += '\n✅ All checks passed!\n';
  } else if (errors === 0) {
    result += `\n⚠️ ${warnings} warning(s) found\n`;
  } else {
    result += `\n❌ ${errors} error(s) found\n`;
  }

  return result;
}
