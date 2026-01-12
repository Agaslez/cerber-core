/**
 * @file ReportFormatter - Unified report formatting dispatcher
 * @rule Per ROADMAP COMMIT-8 - Single interface for all formats
 * @rule Per AGENTS.md §1 - Strategy Pattern for format selection
 */

import type { CerberOutput } from '../types.js';
import {
    formatGitHub,
    formatGitHubCompact,
    formatGitHubGroup,
    formatGitHubSummary,
} from './format-github.js';
import {
    formatCompact,
    formatTable,
    formatText,
} from './format-text.js';

/**
 * Supported output formats
 */
export type OutputFormat =
  | 'text'       // Human-readable with colors/icons
  | 'compact'    // Single line per violation
  | 'table'      // Markdown table
  | 'github'     // GitHub annotations (::error file=...)
  | 'github-compact'  // Compact GitHub format
  | 'github-group'    // GitHub workflow group
  | 'github-summary'  // GitHub workflow summary
  | 'json';      // Raw JSON

/**
 * Report Formatter dispatcher
 * @rule Per AGENTS.md §1 - Strategy pattern: select formatter based on format type
 */
export class ReportFormatter {
  /**
   * Format violations according to specified format
   * @param output Orchestration output with violations
   * @param format Target output format
   * @returns Formatted string
   */
  static format(output: CerberOutput | any, format: OutputFormat = 'text'): string {
    switch (format) {
      case 'text':
        return formatText(output);

      case 'compact':
        return formatCompact(output);

      case 'table':
        return formatTable(output);

      case 'github':
        return formatGitHub(output);

      case 'github-compact':
        return formatGitHubCompact(output);

      case 'github-group':
        return formatGitHubGroup(output);

      case 'github-summary':
        return formatGitHubSummary(output);

      case 'json':
        return JSON.stringify(output, null, 2);

      default:
        return formatText(output);
    }
  }

  /**
   * Get all supported formats
   */
  static getSupportedFormats(): OutputFormat[] {
    return [
      'text',
      'compact',
      'table',
      'github',
      'github-compact',
      'github-group',
      'github-summary',
      'json',
    ];
  }

  /**
   * Check if format is supported
   */
  static isSupported(format: string): boolean {
    return this.getSupportedFormats().includes(format as OutputFormat);
  }

  /**
   * Get format description
   */
  static getDescription(format: OutputFormat): string {
    const descriptions: Record<OutputFormat, string> = {
      text: 'Human-readable format with colors and icons',
      compact: 'Single line per violation (CI logs)',
      table: 'Markdown table format',
      github: 'GitHub Actions annotations (file,line,col)',
      'github-compact': 'Compact GitHub annotation format',
      'github-group': 'GitHub workflow group with annotations',
      'github-summary': 'GitHub workflow summary markdown',
      json: 'Raw JSON format',
    };

    return descriptions[format] || 'Unknown format';
  }

  /**
   * Format multiple times for different outputs
   * Useful for CI that needs both GitHub annotations and logs
   */
  static formatMultiple(
    output: CerberOutput | any,
    formats: OutputFormat[]
  ): Record<OutputFormat, string> {
    const results: Record<OutputFormat, string> = {} as Record<OutputFormat, string>;

    for (const format of formats) {
      results[format] = this.format(output, format);
    }

    return results;
  }

  /**
   * Determine format from environment or CLI options
   * Useful in CLI to auto-detect format
   */
  static detectFormat(options?: {
    format?: string;
    ci?: boolean;
    github?: boolean;
  }): OutputFormat {
    // Explicit format provided
    if (options?.format && this.isSupported(options.format)) {
      return options.format as OutputFormat;
    }

    // GitHub Actions detected
    if (options?.github || process.env.GITHUB_ACTIONS === 'true') {
      return 'github';
    }

    // Generic CI detected
    if (options?.ci || process.env.CI === 'true') {
      return 'compact';
    }

    // Default to human-readable
    return 'text';
  }
}

/**
 * Convenience functions for common use cases
 */

/**
 * Format for console output (text with optional colors)
 */
export function formatForConsole(
  output: CerberOutput,
  options?: { color?: boolean }
): string {
  return ReportFormatter.format(output, 'text');
  // Note: Color support would be added here with chalk or similar
}

/**
 * Format for GitHub Actions workflow
 */
export function formatForGitHub(output: CerberOutput): string {
  return ReportFormatter.format(output, 'github');
}

/**
 * Format for logging
 */
export function formatForLog(output: CerberOutput): string {
  return ReportFormatter.format(output, 'compact');
}

/**
 * Format for CI/CD pipeline logs
 */
export function formatForCI(output: CerberOutput): string {
  const format = ReportFormatter.detectFormat({ ci: true });
  return ReportFormatter.format(output, format);
}
