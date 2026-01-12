/**
 * @file Text Formatter - Human-readable output
 * @rule Per ROADMAP COMMIT-8 - Pretty-printed violations with context
 */

import type { CerberOutput } from '../types.js';

/**
 * Format violations as human-readable text
 * @rule Per ROADMAP - Icon indicators, context, hints
 */
export function formatText(output: CerberOutput | any): string {
  let result = '';

  // Header
  result += '\n🛡️  CERBER VALIDATION REPORT\n';
  result += '═══════════════════════════════════════\n\n';

  // Metadata
  if (output.metadata) {
    result += `Profile:        ${output.metadata.profile || 'unknown'}\n`;
    result += `Target:         ${output.metadata.target || 'generic'}\n`;

    const toolNames = output.metadata.tools
      ? Array.isArray(output.metadata.tools)
        ? output.metadata.tools
            .map((t: any) => {
              const name = typeof t === 'string' ? t : t.name || '';
              const version =
                typeof t === 'string' ? '' : t.version ? ` (${t.version})` : '';
              return `${name}${version}`;
            })
            .filter((t: string) => t.length > 0)
            .join(', ')
        : Object.entries(output.metadata.tools || {})
            .map(([name, info]: [string, any]) => {
              const enabled = typeof info === 'boolean' ? info : info?.enabled ?? true;
              if (!enabled) return '';
              const version = info && typeof info === 'object' && info.version ? ` (${info.version})` : '';
              return `${name}${version}`;
            })
            .filter((t: string) => t.length > 0)
            .join(', ')
      : 'none';

    result += `Tools:          ${toolNames}\n`;
  }

  // Summary
  result += '\n📊 Summary:\n';
  result += `   Total:       ${output.summary?.total || 0}\n`;
  result += `   Errors:      ${output.summary?.errors || 0}\n`;
  result += `   Warnings:    ${output.summary?.warnings || 0}\n`;
  result += `   Info:        ${output.summary?.info || 0}\n`;

  // Violations
  if (output.violations && output.violations.length > 0) {
    result += `\n❌ Violations (${output.violations.length}):\n`;
    result += '───────────────────────────────────────\n\n';

    for (const v of output.violations) {
      const icon =
        v.severity === 'error' ? '❌' : v.severity === 'warning' ? '⚠️ ' : 'ℹ️ ';
      const location = v.path ? `${v.path}` : 'unknown';
      const lineCol = v.line
        ? `:${v.line}${v.column ? `:${v.column}` : ''}`
        : '';

      result += `${icon} [${v.source || 'unknown'}] ${v.id || 'unknown'}\n`;
      result += `   📍 ${location}${lineCol}\n`;
      result += `   📝 ${v.message || 'No message'}\n`;

      if (v.hint) {
        result += `   💡 Hint: ${v.hint}\n`;
      }

      result += '\n';
    }
  } else {
    result += '\n✅ No violations found!\n';
  }

  // Footer
  result += '═══════════════════════════════════════\n';

  if (output.runMetadata) {
    result += `Generated: ${output.runMetadata.generatedAt || new Date().toISOString()}\n`;
    result += `Duration:  ${output.runMetadata.executionTime || 0}ms\n`;
  }

  result += '\n';

  return result;
}

/**
 * Format violations as compact text (single line per violation)
 * Useful for CI logs
 */
export function formatCompact(output: CerberOutput | any): string {
  let result = '';

  if (!output.violations || output.violations.length === 0) {
    return '✅ No violations found\n';
  }

  for (const v of output.violations) {
    const icon =
      v.severity === 'error' ? '❌' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
    const location = v.path ? `${v.path}` : 'unknown';
    const lineCol = v.line ? `:${v.line}` : '';

    result += `${icon} ${v.id} @ ${location}${lineCol} - ${v.message}\n`;
  }

  return result;
}

/**
 * Format as table (markdown)
 */
export function formatTable(output: CerberOutput | any): string {
  if (!output.violations || output.violations.length === 0) {
    return '✅ No violations found\n';
  }

  let result = '\n| Severity | Tool | Rule | File | Line | Message |\n';
  result += '|----------|------|------|------|------|----------|\n';

  for (const v of output.violations) {
    const severity = v.severity || 'info';
    const tool = v.source || 'unknown';
    const id = v.id || 'unknown';
    const file = v.path || 'unknown';
    const line = v.line || '-';
    const message = (v.message || '').replace(/\|/g, '\\|').substring(0, 50);

    result += `| ${severity} | ${tool} | ${id} | ${file} | ${line} | ${message} |\n`;
  }

  result += '\n';

  return result;
}
