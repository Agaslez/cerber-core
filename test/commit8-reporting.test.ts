/**
 * @file COMMIT 8: Reporting Tests - Text + GitHub Formatters
 * @rule Test behavior, not implementation (snapshot tests for determinism)
 */

import {
    formatGitHub,
    formatGitHubCompact,
    formatGitHubGroup,
    formatGitHubSummary,
} from '../src/reporting/format-github.js';
import {
    formatCompact,
    formatTable,
    formatText,
} from '../src/reporting/format-text.js';
import { ReportFormatter } from '../src/reporting/ReportFormatter.js';

describe('COMMIT 8: Reporting - Text + GitHub Formatters', () => {
  const mockOutput = {
    schemaVersion: 1,
    contractVersion: 1,
    deterministic: true,
    summary: {
      total: 3,
      errors: 2,
      warnings: 1,
      info: 0,
    },
    violations: [
      {
        id: 'security/no-secrets',
        severity: 'error' as const,
        message: 'Hardcoded secret detected',
        source: 'gitleaks',
        path: '.github/workflows/ci.yml',
        line: 10,
        column: 5,
        hint: 'Use environment variables or secrets',
      },
      {
        id: 'workflow/invalid-syntax',
        severity: 'error' as const,
        message: 'Invalid YAML syntax',
        source: 'actionlint',
        path: '.github/workflows/test.yml',
        line: 20,
        column: 1,
      },
      {
        id: 'security/outdated-action',
        severity: 'warning' as const,
        message: 'Action uses outdated version',
        source: 'zizmor',
        path: '.github/workflows/deploy.yml',
        line: 15,
        column: 3,
      },
    ],
    metadata: {
      profile: 'dev',
      target: 'github-actions',
      tools: {
        actionlint: { enabled: true, version: '1.6.27' },
        gitleaks: { enabled: true, version: '8.18.0' },
        zizmor: { enabled: true, version: '0.5.0' },
      },
    },
    runMetadata: {
      profile: 'dev',
      executionTime: 1234,
      cwd: '/project',
      generatedAt: '2026-01-12T10:00:00Z',
    },
  };

  const emptyOutput = {
    schemaVersion: 1,
    contractVersion: 1,
    deterministic: true,
    summary: {
      total: 0,
      errors: 0,
      warnings: 0,
      info: 0,
    },
    violations: [],
    metadata: {
      profile: 'solo',
      tools: {},
    },
  };

  describe('formatText - Human-readable output', () => {
    it('should format with violations', () => {
      const result = formatText(mockOutput);

      expect(result).toContain('🛡️  CERBER VALIDATION REPORT');
      expect(result).toContain('Profile:        dev');
      expect(result).toContain('Target:         github-actions');
      expect(result).toContain('Tools:');
      expect(result).toContain('Summary');
      expect(result).toContain('Total:       3');
      expect(result).toContain('Errors:      2');
      expect(result).toContain('Warnings:    1');
    });

    it('should show all violations with details', () => {
      const result = formatText(mockOutput);

      expect(result).toContain('security/no-secrets');
      expect(result).toContain('Hardcoded secret detected');
      expect(result).toContain('.github/workflows/ci.yml:10');
      expect(result).toContain('Use environment variables or secrets');

      expect(result).toContain('workflow/invalid-syntax');
      expect(result).toContain('.github/workflows/test.yml:20');

      expect(result).toContain('security/outdated-action');
      expect(result).toContain('.github/workflows/deploy.yml:15');
    });

    it('should format with no violations', () => {
      const result = formatText(emptyOutput);

      expect(result).toContain('✅ No violations found!');
      expect(result).toContain('🛡️  CERBER VALIDATION REPORT');
    });

    it('should include metadata', () => {
      const result = formatText(mockOutput);

      expect(result).toContain('Generated:');
      expect(result).toContain('Duration:');
    });
  });

  describe('formatCompact - Single-line output', () => {
    it('should format violations compactly', () => {
      const result = formatCompact(mockOutput);

      expect(result).toContain('❌ security/no-secrets');
      expect(result).toContain('.github/workflows/ci.yml');
      expect(result).toContain('Hardcoded secret detected');
    });

    it('should have one line per violation', () => {
      const result = formatCompact(mockOutput);
      const lines = result.split('\n').filter(l => l.trim().length > 0);

      expect(lines.length).toBe(mockOutput.violations.length);
    });

    it('should show no violations message for empty output', () => {
      const result = formatCompact(emptyOutput);

      expect(result).toContain('✅ No violations found');
    });
  });

  describe('formatTable - Markdown table output', () => {
    it('should format as markdown table', () => {
      const result = formatTable(mockOutput);

      expect(result).toContain('| Severity | Tool | Rule | File | Line | Message |');
      expect(result).toContain('|----------|------|------|------|------|----------|');
    });

    it('should include all violation data', () => {
      const result = formatTable(mockOutput);

      expect(result).toContain('| error | gitleaks');
      expect(result).toContain('| security/no-secrets');
      expect(result).toContain('| .github/workflows/ci.yml');
    });

    it('should escape pipe characters in messages', () => {
      const outputWithPipe = {
        ...mockOutput,
        violations: [
          {
            ...mockOutput.violations[0],
            message: 'Error | with | pipes',
          },
        ],
      };

      const result = formatTable(outputWithPipe);

      expect(result).toContain('Error \\| with \\| pipes');
    });
  });

  describe('formatGitHub - GitHub Actions annotations', () => {
    it('should format as GitHub annotations', () => {
      const result = formatGitHub(mockOutput);

      expect(result).toContain('::error file=.github/workflows/ci.yml');
      expect(result).toContain('::error file=.github/workflows/test.yml');
      expect(result).toContain('::warning file=.github/workflows/deploy.yml');
    });

    it('should include line and column numbers', () => {
      const result = formatGitHub(mockOutput);

      expect(result).toContain('line=10,col=5');
      expect(result).toContain('line=20,col=1');
      expect(result).toContain('line=15,col=3');
    });

    it('should include rule ID and message', () => {
      const result = formatGitHub(mockOutput);

      expect(result).toContain('[security/no-secrets]');
      expect(result).toContain('Hardcoded secret detected');
    });

    it('should include hints in message', () => {
      const result = formatGitHub(mockOutput);

      expect(result).toContain('Use environment variables or secrets');
    });

    it('should return empty string for no violations', () => {
      const result = formatGitHub(emptyOutput);

      expect(result).toBe('');
    });
  });

  describe('formatGitHubCompact - Compact GitHub format', () => {
    it('should format compactly for GitHub', () => {
      const result = formatGitHubCompact(mockOutput);

      expect(result).toContain('::error::');
      expect(result).toContain('::warning::');
    });

    it('should include file and line', () => {
      const result = formatGitHubCompact(mockOutput);

      expect(result).toContain('.github/workflows/ci.yml:10');
      expect(result).toContain('.github/workflows/test.yml:20');
    });

    it('should include message', () => {
      const result = formatGitHubCompact(mockOutput);

      expect(result).toContain('Hardcoded secret detected');
    });
  });

  describe('formatGitHubGroup - GitHub workflow group', () => {
    it('should wrap in workflow group', () => {
      const result = formatGitHubGroup(mockOutput);

      expect(result).toContain('::group::');
      expect(result).toContain('::endgroup::');
      expect(result).toContain('🛡️ Cerber Validation Results');
    });

    it('should include violation count', () => {
      const result = formatGitHubGroup(mockOutput);

      expect(result).toContain('Found 3 violation(s)');
    });

    it('should include annotations inside group', () => {
      const result = formatGitHubGroup(mockOutput);

      expect(result).toContain('::error file=');
      expect(result).toContain('::warning file=');
    });
  });

  describe('formatGitHubSummary - GitHub summary', () => {
    it('should format as markdown summary', () => {
      const result = formatGitHubSummary(mockOutput);

      expect(result).toContain('## 🛡️ Cerber Validation Summary');
      expect(result).toContain('- **Total:** 3');
      expect(result).toContain('- **Errors:** 2');
      expect(result).toContain('- **Warnings:** 1');
      expect(result).toContain('- **Info:** 0');
    });

    it('should show success for no violations', () => {
      const result = formatGitHubSummary(emptyOutput);

      expect(result).toContain('✅ All checks passed!');
    });

    it('should show error status', () => {
      const result = formatGitHubSummary(mockOutput);

      expect(result).toContain('❌ 2 error(s) found');
    });
  });

  describe('ReportFormatter dispatcher', () => {
    it('should support all formats', () => {
      const formats = ReportFormatter.getSupportedFormats();

      expect(formats).toContain('text');
      expect(formats).toContain('compact');
      expect(formats).toContain('table');
      expect(formats).toContain('github');
      expect(formats).toContain('github-compact');
      expect(formats).toContain('github-group');
      expect(formats).toContain('github-summary');
      expect(formats).toContain('json');
    });

    it('should check if format is supported', () => {
      expect(ReportFormatter.isSupported('text')).toBe(true);
      expect(ReportFormatter.isSupported('github')).toBe(true);
      expect(ReportFormatter.isSupported('invalid')).toBe(false);
    });

    it('should dispatch to correct formatter', () => {
      const textResult = ReportFormatter.format(mockOutput, 'text');
      const githubResult = ReportFormatter.format(mockOutput, 'github');
      const jsonResult = ReportFormatter.format(mockOutput, 'json');

      expect(textResult).toContain('🛡️  CERBER VALIDATION REPORT');
      expect(githubResult).toContain('::error file=');
      expect(jsonResult).toContain('"violations"');
    });

    it('should default to text format', () => {
      const result = ReportFormatter.format(mockOutput);

      expect(result).toContain('🛡️  CERBER VALIDATION REPORT');
    });

    it('should format multiple at once', () => {
      const results = ReportFormatter.formatMultiple(mockOutput, [
        'text',
        'github',
        'json',
      ]);

      expect(results.text).toContain('🛡️');
      expect(results.github).toContain('::error');
      expect(results.json).toContain('"violations"');
    });

    it('should get format descriptions', () => {
      const desc = ReportFormatter.getDescription('text');

      expect(desc).toContain('Human-readable');
    });

    it('should detect format from environment', () => {
      // Default - should detect GitHub Actions if on GitHub Actions
      const defaultFormat = ReportFormatter.detectFormat({});
      const expectedDefault = process.env.GITHUB_ACTIONS ? 'github' : 'text';
      expect(defaultFormat).toBe(expectedDefault);

      // Explicit format
      const explicitFormat = ReportFormatter.detectFormat({ format: 'github' });
      expect(explicitFormat).toBe('github');

      // GitHub Actions detected
      const ghFormat = ReportFormatter.detectFormat({ github: true });
      expect(ghFormat).toBe('github');

      // CI detected (clear GitHub Actions env to test generic CI)
      const savedGhActions = process.env.GITHUB_ACTIONS;
      delete process.env.GITHUB_ACTIONS;
      const ciFormat = ReportFormatter.detectFormat({ ci: true });
      expect(ciFormat).toBe('compact');
      process.env.GITHUB_ACTIONS = savedGhActions;
    });
  });

  describe('Snapshot tests - Deterministic output', () => {
    it('should produce consistent text output', () => {
      const result1 = formatText(mockOutput);
      const result2 = formatText(mockOutput);

      expect(result1).toBe(result2);
    });

    it('should produce consistent GitHub output', () => {
      const result1 = formatGitHub(mockOutput);
      const result2 = formatGitHub(mockOutput);

      expect(result1).toBe(result2);
    });

    it('should produce consistent JSON output', () => {
      const result1 = ReportFormatter.format(mockOutput, 'json');
      const result2 = ReportFormatter.format(mockOutput, 'json');

      expect(result1).toBe(result2);
    });

    it('text format snapshot', () => {
      const result = formatText(mockOutput);

      expect(result).toMatchSnapshot();
    });

    it('github format snapshot', () => {
      const result = formatGitHub(mockOutput);

      expect(result).toMatchSnapshot();
    });

    it('compact format snapshot', () => {
      const result = formatCompact(mockOutput);

      expect(result).toMatchSnapshot();
    });

    it('table format snapshot', () => {
      const result = formatTable(mockOutput);

      expect(result).toMatchSnapshot();
    });

    it('github-group format snapshot', () => {
      const result = formatGitHubGroup(mockOutput);

      expect(result).toMatchSnapshot();
    });

    it('github-summary format snapshot', () => {
      const result = formatGitHubSummary(mockOutput);

      expect(result).toMatchSnapshot();
    });
  });

  describe('Edge cases', () => {
    it('should handle violation without line number', () => {
      const output = {
        ...mockOutput,
        violations: [
          {
            ...mockOutput.violations[0],
            line: undefined,
          },
        ],
      };

      const result = formatGitHub(output);

      expect(result).toContain('line=1');
    });

    it('should handle violation without column number', () => {
      const output = {
        ...mockOutput,
        violations: [
          {
            ...mockOutput.violations[0],
            column: undefined,
          },
        ],
      };

      const result = formatGitHub(output);

      expect(result).toContain('col=1');
    });

    it('should handle violation without path', () => {
      const output = {
        ...mockOutput,
        violations: [
          {
            ...mockOutput.violations[0],
            path: undefined,
          },
        ],
      };

      const result = formatGitHub(output);

      expect(result).toContain('file=unknown');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000);
      const output = {
        ...mockOutput,
        violations: [
          {
            ...mockOutput.violations[0],
            message: longMessage,
          },
        ],
      };

      const result = formatText(output);

      expect(result).toContain(longMessage);
    });

    it('should handle special characters in messages', () => {
      const output = {
        ...mockOutput,
        violations: [
          {
            ...mockOutput.violations[0],
            message: 'Error with "quotes" and \'apostrophes\' and `backticks`',
          },
        ],
      };

      const result = formatGitHub(output);

      expect(result).toContain('Error with');
    });
  });
});
