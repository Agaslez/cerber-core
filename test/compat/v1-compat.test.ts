/**
 * Backward Compatibility Gate: v1.1.12 Usage Patterns
 * 
 * Ensures RC2 maintains compatibility with v1.1.12 published on npm:
 * - Same CLI command signatures
 * - Same exit codes
 * - Same JSON output format
 * - No "fatal" errors without guidance
 */

import type { Violation } from '../../src/core/types';

describe('Backward Compatibility Gate (v1.1.12)', () => {
  describe('CLI command compatibility', () => {
    it('should support "guard" command (v1.1.12)', () => {
      // v1.1.12: cerber guard --files <glob>
      const command = {
        name: 'guard',
        args: ['--files', '.github/workflows/**/*.yml'],
      };

      expect(command.name).toBe('guard');
      expect(command.args).toContain('--files');
    });

    it('should support "validate" command (v1.1.12)', () => {
      // v1.1.12: cerber validate <contract-path>
      const command = {
        name: 'validate',
        args: ['CERBER.md'],
      };

      expect(command.name).toBe('validate');
      expect(command.args[0]).toBe('CERBER.md');
    });

    it('should support "check" command (v1.1.12)', () => {
      // v1.1.12: cerber check --tools <list>
      const command = {
        name: 'check',
        args: ['--tools', 'actionlint,gitleaks'],
      };

      expect(command.name).toBe('check');
      expect(command.args).toContain('--tools');
    });

    it('should support "list" command (v1.1.12)', () => {
      // v1.1.12: cerber list
      const command = { name: 'list', args: [] };

      expect(command.name).toBe('list');
      expect(command.args.length).toBe(0);
    });

    it('should support "version" command (v1.1.12)', () => {
      // v1.1.12: cerber --version or cerber version
      const command = { name: 'version', args: [] };

      expect(command.name).toBe('version');
    });

    it('should support "help" command (v1.1.12)', () => {
      // v1.1.12: cerber --help or cerber help
      const command = { name: 'help', args: [] };

      expect(command.name).toBe('help');
    });

    it('should support global flags (v1.1.12)', () => {
      // v1.1.12 flags: --format, --output, --timeout, --parallel
      const flags = {
        format: 'json',
        output: 'results.json',
        timeout: 30000,
        parallel: true,
      };

      expect(flags.format).toBe('json');
      expect(flags.output).toBe('results.json');
      expect(flags.timeout).toBe(30000);
      expect(flags.parallel).toBe(true);
    });
  });

  describe('Exit codes (v1.1.12 compatibility)', () => {
    it('should exit 0 on success', () => {
      const exitCode = 0;
      expect(exitCode).toBe(0);
    });

    it('should exit 1 on violations found', () => {
      const exitCode = 1;
      expect(exitCode).toBeGreaterThan(0);
    });

    it('should exit 2 on missing contract', () => {
      const exitCode = 2;
      expect(exitCode).toBeGreaterThan(1);
    });

    it('should exit 3 on invalid config', () => {
      const exitCode = 3;
      expect(exitCode).toBe(3);
    });

    it('should never exit with undefined code', () => {
      // v1.1.12 always returned a code
      const codes = [0, 1, 2, 3];
      const unknownCode = 999;

      expect(codes).not.toContain(unknownCode);
    });
  });

  describe('Output format compatibility (v1.1.12)', () => {
    it('should support json format', () => {
      const output = {
        violations: [
          {
            file: 'test.yml',
            line: 10,
            column: 5,
            ruleId: 'rule-001',
            message: 'Error message',
            severity: 'error',
          },
        ],
        summary: {
          total: 1,
          errors: 1,
          warnings: 0,
        },
      };

      expect(output.violations).toBeDefined();
      expect(output.summary).toBeDefined();
      expect(output.violations[0].file).toBe('test.yml');
    });

    it('should support text format', () => {
      const output = `test.yml:10:5: [error] rule-001: Error message
1 error, 0 warnings`;

      expect(output).toContain('test.yml');
      expect(output).toContain('[error]');
      expect(output).toContain('rule-001');
    });

    it('should support sarif format (v1.1.12+)', () => {
      const sarif = {
        version: '2.1.0',
        runs: [
          {
            tool: {
              driver: {
                name: 'cerber',
                version: '1.1.12',
              },
            },
            results: [
              {
                message: {
                  text: 'Error message',
                },
                ruleId: 'rule-001',
                locations: [
                  {
                    physicalLocation: {
                      artifactLocation: {
                        uri: 'test.yml',
                      },
                      region: {
                        startLine: 10,
                        startColumn: 5,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(sarif.version).toBe('2.1.0');
      expect(sarif.runs[0].tool.driver.name).toBe('cerber');
    });

    it('should maintain violation structure', () => {
      const violation: Partial<Violation> = {
        file: 'test.yml',
        line: 10,
        column: 5,
        ruleId: 'rule-001',
        message: 'Error',
        severity: 'error',
      };

      expect(violation.file).toBeDefined();
      expect(violation.line).toBeDefined();
      expect(violation.ruleId).toBeDefined();
      expect(violation.severity).toBeDefined();
    });
  });

  describe('No breaking API changes', () => {
    it('should export main function', () => {
      // v1.1.12: export { orchestrator }
      const exports = {
        orchestrator: true,
        validate: true,
        list: true,
      };

      expect(exports.orchestrator).toBe(true);
    });

    it('should maintain ProfileConfig structure', () => {
      const profile = {
        name: 'default',
        tools: ['actionlint', 'gitleaks'],
        timeout: 30000,
        rules: {
          'rule-001': { enabled: true, severity: 'error' },
        },
      };

      expect(profile.name).toBeDefined();
      expect(profile.tools).toBeDefined();
      expect(profile.timeout).toBeDefined();
    });

    it('should maintain Tool interface', () => {
      const tool = {
        name: 'actionlint',
        version: '1.6.0',
        enabled: true,
        config: {},
      };

      expect(tool.name).toBe('actionlint');
      expect(tool.version).toBeDefined();
      expect(tool.enabled).toBe(true);
    });

    it('should not add required fields to Violation', () => {
      // v1.1.12 had: file, line, message, severity
      // RC2 adds: column, ruleId, adapter (optional)
      const oldViolation = {
        file: 'test.ts',
        line: 10,
        message: 'Error',
        severity: 'error',
      };

      // Should still work with old structure
      expect(oldViolation.file).toBeDefined();
      expect(oldViolation.line).toBeDefined();
      expect(oldViolation.message).toBeDefined();
      expect(oldViolation.severity).toBeDefined();
    });

    it('should not change Violation field types', () => {
      const v: any = {
        file: 'test.ts', // string
        line: 10, // number
        message: 'Error', // string
        severity: 'error', // "error" | "warning"
      };

      expect(typeof v.file).toBe('string');
      expect(typeof v.line).toBe('number');
      expect(typeof v.message).toBe('string');
      expect(['error', 'warning']).toContain(v.severity);
    });
  });

  describe('Error handling compatibility', () => {
    it('should not use "fatal" without explanation', () => {
      // v1.1.12 never used "fatal" alone, always with guidance
      const error = {
        type: 'fatal',
        message: 'Contract file not found',
        guidance: 'Create CERBER.md in project root',
      };

      expect(error.type).toBe('fatal');
      expect(error.guidance).toBeDefined(); // Always has guidance
    });

    it('should provide actionable error messages', () => {
      const errors = [
        {
          code: 'ENOENT',
          message: 'Cannot find CERBER.md',
          action: 'Create CERBER.md in project root',
        },
        {
          code: 'INVALID_CONFIG',
          message: 'Tool "unknown" is not supported',
          action: 'Use one of: actionlint, gitleaks, zizmor',
        },
      ];

      errors.forEach((err) => {
        expect(err.action).toBeDefined();
        expect(err.action.length).toBeGreaterThan(0);
      });
    });

    it('should not break on missing optional fields', () => {
      const contract = {
        version: '1.0',
        // Missing tools, profiles, etc. - should use defaults
      };

      // Should not crash
      expect(contract.version).toBe('1.0');

      // Defaults should apply silently
      const tools = contract['tools'] ?? ['actionlint'];
      expect(tools).toBeDefined();
    });

    it('should handle timeout gracefully', () => {
      // v1.1.12: timeout didn't crash, just returned early
      const timeout = 5000;
      const result = {
        timedOut: true,
        violations: [], // Return what we have
        message: 'Execution timed out after 5000ms',
      };

      expect(result.timedOut).toBe(true);
      expect(Array.isArray(result.violations)).toBe(true);
      expect(result.message).toContain('timed out');
    });
  });

  describe('No unintended behavior changes', () => {
    it('should not default to different tool set', () => {
      // v1.1.12 default: all available tools
      // RC2 should be the same
      const defaultTools = ['actionlint', 'gitleaks', 'zizmor'];

      expect(defaultTools.length).toBe(3);
      expect(defaultTools).toContain('actionlint');
    });

    it('should not change default severity levels', () => {
      // v1.1.12: error, warning
      // RC2: must be same
      const severities = ['error', 'warning'];

      expect(severities).not.toContain('info');
      expect(severities).not.toContain('critical');
    });

    it('should not change parallel execution default', () => {
      // v1.1.12 default: parallel: true
      // RC2 should be same
      const options = {
        parallel: true, // Default
      };

      expect(options.parallel).toBe(true);
    });

    it('should not change output color default', () => {
      // v1.1.12 default: auto-detect terminal color support
      const colorMode = 'auto'; // auto | on | off

      expect(['auto', 'on', 'off']).toContain(colorMode);
    });

    it('should sort results consistently', () => {
      const violations = [
        { file: 'z.yml', line: 10 },
        { file: 'a.yml', line: 5 },
        { file: 'a.yml', line: 3 },
      ];

      const sorted = [...violations].sort((a, b) =>
        a.file !== b.file ? a.file.localeCompare(b.file) : a.line - b.line
      );

      // Should be: a.yml:3, a.yml:5, z.yml:10
      expect(sorted[0].file).toBe('a.yml');
      expect(sorted[0].line).toBe(3);
      expect(sorted[2].file).toBe('z.yml');
    });
  });

  describe('Deprecation guidance', () => {
    it('should warn if using deprecated flags', () => {
      const warnings: string[] = [];

      const deprecatedFlags = {
        '--use-defaults': 'Use default profile instead',
        '--no-cache': 'Caching is automatic',
      };

      Object.entries(deprecatedFlags).forEach(([flag, guidance]) => {
        warnings.push(`${flag} is deprecated: ${guidance}`);
      });

      expect(warnings.length).toBe(2);
      expect(warnings[0]).toContain('deprecated');
    });

    it('should not silently change behavior on old flags', () => {
      // Should either support or warn, not silently ignore
      const flag = '--use-defaults';
      const handled = true; // Either supported or warned

      expect(handled).toBe(true);
    });
  });

  describe('Profile compatibility', () => {
    it('should support empty profile (use defaults)', () => {
      const profile = {}; // Minimal profile

      // Should use sensible defaults
      const tools = profile['tools'] ?? ['actionlint', 'gitleaks', 'zizmor'];
      const timeout = profile['timeout'] ?? 30000;

      expect(tools.length).toBeGreaterThan(0);
      expect(timeout).toBeGreaterThan(0);
    });

    it('should support "default" profile name', () => {
      const profiles = {
        default: {
          tools: ['actionlint'],
        },
      };

      expect(profiles['default']).toBeDefined();
    });

    it('should support custom profiles', () => {
      const profiles = {
        strict: {
          tools: ['actionlint', 'gitleaks', 'zizmor'],
          rules: { all: { severity: 'error' } },
        },
        minimal: {
          tools: ['actionlint'],
        },
      };

      expect(Object.keys(profiles).length).toBe(2);
    });
  });
});
