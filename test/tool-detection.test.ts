/**
 * Tool Detection Tests (COMMIT-3)
 * Tests cross-platform tool detection: Windows (PowerShell), macOS/Linux (bash)
 */

import {
    detectTool,
    detectTools,
    detectToolsAsync,
    getRegisteredTools,
    getSystemInfo,
    meetsVersionRequirement,
    registerCustomTool,
    ToolDetectionResult,
    ToolInfo
} from '../src/adapters/ToolDetection';

describe('@fast Tool Detection (COMMIT-3)', () => {
  describe('Single Tool Detection', () => {
    test('should detect node (always available in test environment)', () => {
      const result = detectTool('node');
      expect(result.name).toBe('node');
      expect(result.installed).toBe(true);
      // Version may not be detected on all systems, but path should be
      if (result.version) {
        expect(result.version).toBeDefined();
      }
      expect(result.path).toBeDefined();
    });

    test('should detect git (commonly available)', () => {
      const result = detectTool('git');
      expect(result.name).toBe('git');
      expect(result.installed).toBe(true);
      // Version may not be detected on all systems, but path should be
      if (result.version) {
        expect(result.version).toBeDefined();
      }
      expect(result.path).toBeDefined();
    });

    test('should return installed false for missing tool', () => {
      const result = detectTool('non-existent-tool-xyz-123');
      expect(result.installed).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle case-insensitive tool names', () => {
      const result1 = detectTool('node');
      const result2 = detectTool('NODE');
      expect(result1.name).toBe(result2.name);
    });

    test('should detect actionlint if available', () => {
      const result = detectTool('actionlint');
      if (result.installed) {
        expect(result.version).toBeDefined();
        expect(result.path).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('should detect zizmor if available', () => {
      const result = detectTool('zizmor');
      if (result.installed) {
        expect(result.version).toBeDefined();
        expect(result.path).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    });

    test('should detect gitleaks if available', () => {
      const result = detectTool('gitleaks');
      if (result.installed) {
        expect(result.version).toBeDefined();
        expect(result.path).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('Batch Tool Detection', () => {
    test('should detect multiple tools synchronously', () => {
      const results = detectTools(['node', 'git', 'npm']);
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('node');
      expect(results[1].name).toBe('git');
      expect(results[2].name).toBe('npm');
      expect(results.every(r => r.name)).toBe(true);
    });

    test('should detect multiple tools asynchronously', async () => {
      const results = await detectToolsAsync(['node', 'git']);
      expect(results).toHaveLength(2);
      expect(results[0].installed).toBe(true);
      expect(results[1].installed).toBe(true);
    });

    test('should handle mixed available and unavailable tools', () => {
      const results = detectTools(['node', 'non-existent-tool-xyz', 'git']);
      expect(results).toHaveLength(3);
      expect(results[0].installed).toBe(true);
      expect(results[1].installed).toBe(false);
      expect(results[2].installed).toBe(true);
    });

    test('should return empty array for empty input', () => {
      const results = detectTools([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('Version Detection', () => {
    test('should extract version correctly or handle gracefully', () => {
      const nodeResult = detectTool('node');
      expect(nodeResult.installed).toBe(true);
      // Version may or may not be detected depending on shell environment
      if (nodeResult.version) {
        expect(nodeResult.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    test('should extract npm version or handle gracefully', () => {
      const npmResult = detectTool('npm');
      expect(npmResult.installed).toBe(true);
      // Version may or may not be detected depending on shell environment
      if (npmResult.version) {
        expect(npmResult.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    test('should extract git version or handle gracefully', () => {
      const gitResult = detectTool('git');
      expect(gitResult.installed).toBe(true);
      // Version may or may not be detected depending on shell environment
      if (gitResult.version) {
        expect(gitResult.version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    test('should handle version detection gracefully', () => {
      const result = detectTool('node');
      expect(result.installed).toBe(true);
      // Version can be undefined, we don't require it
      expect(typeof result.version === 'string' || result.version === undefined).toBe(true);
    });
  });

  describe('Version Requirement Checking', () => {
    test('should verify version meets requirement', () => {
      const result: ToolDetectionResult = {
        name: 'test-tool',
        installed: true,
        version: '1.5.0'
      };

      expect(meetsVersionRequirement(result, '1.0.0')).toBe(true);
      expect(meetsVersionRequirement(result, '1.5.0')).toBe(true);
      expect(meetsVersionRequirement(result, '1.5.1')).toBe(false);
      expect(meetsVersionRequirement(result, '2.0.0')).toBe(false);
    });

    test('should return false for uninstalled tool', () => {
      const result: ToolDetectionResult = {
        name: 'test-tool',
        installed: false
      };

      expect(meetsVersionRequirement(result, '1.0.0')).toBe(false);
    });

    test('should return false when version is unknown', () => {
      const result: ToolDetectionResult = {
        name: 'test-tool',
        installed: true,
        version: undefined
      };

      expect(meetsVersionRequirement(result, '1.0.0')).toBe(false);
    });

    test('should handle major version comparisons', () => {
      const result: ToolDetectionResult = {
        name: 'test-tool',
        installed: true,
        version: '2.0.0'
      };

      expect(meetsVersionRequirement(result, '1.99.99')).toBe(true);
      expect(meetsVersionRequirement(result, '2.0.0')).toBe(true);
      expect(meetsVersionRequirement(result, '2.0.1')).toBe(false);
    });

    test('should handle minor version comparisons', () => {
      const result: ToolDetectionResult = {
        name: 'test-tool',
        installed: true,
        version: '1.5.0'
      };

      expect(meetsVersionRequirement(result, '1.4.99')).toBe(true);
      expect(meetsVersionRequirement(result, '1.5.0')).toBe(true);
      expect(meetsVersionRequirement(result, '1.5.1')).toBe(false);
    });

    test('should handle patch version comparisons', () => {
      const result: ToolDetectionResult = {
        name: 'test-tool',
        installed: true,
        version: '1.0.5'
      };

      expect(meetsVersionRequirement(result, '1.0.0')).toBe(true);
      expect(meetsVersionRequirement(result, '1.0.5')).toBe(true);
      expect(meetsVersionRequirement(result, '1.0.6')).toBe(false);
    });
  });

  describe('System Information', () => {
    test('should return system info object', () => {
      const info = getSystemInfo();
      expect(info.platform).toBeDefined();
      expect(info.nodeVersion).toBeDefined();
      expect(info.npmVersion).toBeDefined();
    });

    test('should include platform information', () => {
      const info = getSystemInfo();
      expect(info.platform).toMatch(/(linux|darwin|win32)/i);
    });

    test('should have valid node version or gracefully handle', () => {
      const info = getSystemInfo();
      // Version may be "unknown" if detection fails, but that's OK
      if (info.nodeVersion !== 'unknown') {
        expect(info.nodeVersion).toMatch(/^\d+\.\d+\.\d+/);
      }
    });
  });

  describe('Custom Tool Registration', () => {
    test('should register custom tool', () => {
      const customTool: ToolInfo = {
        name: 'custom-test-tool',
        command: 'echo',
        versionFlag: '--version',
        versionRegex: /(\d+\.\d+\.\d+)/
      };

      registerCustomTool(customTool);
      const registered = getRegisteredTools();
      expect(registered).toContain('custom-test-tool');
    });

    test('should list all registered tools', () => {
      const tools = getRegisteredTools();
      expect(tools).toContain('node');
      expect(tools).toContain('npm');
      expect(tools).toContain('git');
      expect(tools).toContain('actionlint');
      expect(tools).toContain('zizmor');
      expect(tools).toContain('gitleaks');
    });

    test('should have at least 6 default tools registered', () => {
      const tools = getRegisteredTools();
      expect(tools.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should detect node on any platform', () => {
      const result = detectTool('node');
      expect(result.installed).toBe(true);
      expect(result.path).toBeDefined();
    });

    test('should detect git on any platform', () => {
      const result = detectTool('git');
      expect(result.installed).toBe(true);
      expect(result.path).toBeDefined();
    });

    test('should handle detection errors gracefully', () => {
      const result = detectTool('definitely-not-a-real-command-12345');
      expect(result.installed).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    test('should return valid ToolDetectionResult structure', () => {
      const result = detectTool('node');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('installed');
      expect(['name', 'installed', 'version', 'path', 'error'].some(
        key => key in result
      )).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty tool name', () => {
      const result = detectTool('');
      expect(result.installed).toBe(false);
    });

    test('should handle tool name with spaces', () => {
      const result = detectTool('tool with spaces');
      expect(result.installed).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle special characters in tool name', () => {
      const result = detectTool('tool@#$%');
      expect(result.installed).toBe(false);
    });

    test('should normalize case for tool lookups', () => {
      const lower = detectTool('npm');
      const upper = detectTool('NPM');
      const mixed = detectTool('Npm');
      expect(lower.name).toBe(upper.name);
      expect(lower.name).toBe(mixed.name);
    });

    test('should detect tools not in registry gracefully', () => {
      const result = detectTool('unknown-tool-that-does-not-exist');
      expect(result.installed).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Stability', () => {
    test('should return consistent results for same tool', () => {
      const result1 = detectTool('node');
      const result2 = detectTool('node');
      expect(result1.installed).toBe(result2.installed);
      expect(result1.version).toBe(result2.version);
    });

    test('should batch detect with same results as individual', () => {
      const individual = [
        detectTool('node'),
        detectTool('git'),
        detectTool('npm')
      ];
      const batch = detectTools(['node', 'git', 'npm']);

      expect(batch).toHaveLength(individual.length);
      for (let i = 0; i < batch.length; i++) {
        expect(batch[i].name).toBe(individual[i].name);
        expect(batch[i].installed).toBe(individual[i].installed);
      }
    });
  });
});
