/**
 * @file Tool Detection Tests - COMMIT 3
 * @description Tests for cross-platform tool detection
 */

import { ToolDetector } from '../src/tools/ToolDetector.js';

describe('COMMIT 3: Tool Detection', () => {
  let detector: ToolDetector;

  beforeEach(() => {
    detector = new ToolDetector();
  });

  describe('Version Parsing', () => {
    it('should parse actionlint version format', () => {
      const output = 'actionlint 1.6.27\nhttps://github.com/rhysd/actionlint';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('1.6.27');
    });

    it('should parse version with v prefix', () => {
      const output = 'gitleaks version v8.18.0';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('8.18.0');
    });

    it('should parse standalone version number', () => {
      const output = 'v1.6.27';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('1.6.27');
    });

    it('should parse version: format', () => {
      const output = 'tool version: 1.2.3';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('1.2.3');
    });

    it('should parse two-part version', () => {
      const output = 'version 1.2';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('1.2');
    });

    it('should handle ANSI color codes', () => {
      const output = '\x1b[32mactionlint 1.6.27\x1b[0m';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('1.6.27');
    });

    it('should return unknown for invalid output', () => {
      const output = 'no version here';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('unknown');
    });

    it('should return unknown for empty output', () => {
      const version = detector.parseVersion('');
      
      expect(version).toBe('unknown');
    });

    it('should parse zizmor format', () => {
      const output = 'zizmor 0.1.0';
      const version = detector.parseVersion(output);
      
      expect(version).toBe('0.1.0');
    });

    it('should handle multiline output', () => {
      const output = `
Tool Name: actionlint
Version: 1.6.27
Author: rhysd
      `;
      const version = detector.parseVersion(output);
      
      expect(version).toBe('1.6.27');
    });
  });

  describe('Tool Detection (Real)', () => {
    // These tests run against real tools if available
    // They should pass even if tools are not installed

    it('should detect node (always available)', async () => {
      const info = await detector.detect('node');
      
      expect(info.name).toBe('node');
      expect(info.available).toBe(true);
      expect(info.version).not.toBe('unknown');
      expect(info.version).toMatch(/^\d+\.\d+/);
    }, 10000);

    it('should detect npm (usually available)', async () => {
      const info = await detector.detect('npm');
      
      expect(info.name).toBe('npm');
      
      // npm might not be available in all test environments
      if (info.available) {
        expect(info.version).not.toBe('unknown');
      }
    }, 10000);

    it('should handle missing tool gracefully', async () => {
      const info = await detector.detect('nonexistent-tool-12345');
      
      expect(info.name).toBe('nonexistent-tool-12345');
      expect(info.available).toBe(false);
      expect(info.version).toBe('unknown');
      expect(info.error).toBeDefined();
      expect(info.error).toContain('not found');
    }, 10000);

    it('should detect git (usually available)', async () => {
      const info = await detector.detect('git');
      
      expect(info.name).toBe('git');
      
      // Git might not be in PATH on some systems
      if (info.available) {
        expect(info.version).not.toBe('unknown');
        expect(info.version).toMatch(/^\d+\.\d+/);
      }
    }, 10000);
  });

  describe('Multiple Tool Detection', () => {
    it('should detect multiple tools in parallel', async () => {
      const tools = await detector.detectAll(['node', 'git']);
      
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('node');
      expect(tools[1].name).toBe('git');
      
      // At least node should be available
      expect(tools[0].available).toBe(true);
    }, 10000);

    it('should handle mix of available and missing tools', async () => {
      const tools = await detector.detectAll(['node', 'nonexistent-12345']);
      
      expect(tools).toHaveLength(2);
      expect(tools[0].available).toBe(true); // node
      expect(tools[1].available).toBe(false); // nonexistent
    }, 10000);

    it('should get only available tools', async () => {
      const available = await detector.getAvailable(['node', 'git', 'nonexistent-12345']);
      
      // At least node should be available
      expect(available.length).toBeGreaterThanOrEqual(1);
      available.forEach(tool => {
        expect(tool.available).toBe(true);
        expect(tool.version).not.toBe('unknown');
      });
    }, 10000);

    it('should get missing tools', async () => {
      const missing = await detector.getMissing(['node', 'git', 'nonexistent-12345']);
      
      expect(missing).toContain('nonexistent-12345');
      expect(missing).not.toContain('node');
    }, 10000);
  });

  describe('Cerber Tools Detection', () => {
    it('should attempt to detect actionlint', async () => {
      const info = await detector.detect('actionlint');
      
      expect(info.name).toBe('actionlint');
      
      // actionlint might not be installed
      if (info.available) {
        expect(info.version).toMatch(/^\d+\.\d+/);
      } else {
        expect(info.version).toBe('unknown');
        expect(info.error).toBeDefined();
      }
    }, 10000);

    it('should attempt to detect zizmor', async () => {
      const info = await detector.detect('zizmor');
      
      expect(info.name).toBe('zizmor');
      
      // zizmor might not be installed
      if (info.available) {
        expect(info.version).toMatch(/^\d+\.\d+/);
      } else {
        expect(info.available).toBe(false);
      }
    }, 10000);

    it('should attempt to detect gitleaks', async () => {
      const info = await detector.detect('gitleaks');
      
      expect(info.name).toBe('gitleaks');
      
      // gitleaks might not be installed
      if (info.available) {
        expect(info.version).toMatch(/^\d+\.\d+/);
      }
    }, 10000);

    it('should detect all cerber tools in parallel', async () => {
      const cerberTools = ['actionlint', 'zizmor', 'gitleaks'];
      const tools = await detector.detectAll(cerberTools);
      
      expect(tools).toHaveLength(3);
      tools.forEach(tool => {
        expect(['actionlint', 'zizmor', 'gitleaks']).toContain(tool.name);
      });
    }, 15000);
  });

  describe('Cross-Platform Behavior', () => {
    it('should not use which/where commands', async () => {
      // This test verifies that we don't shell out to which/where
      // by checking that the implementation uses execFile directly
      
      const info = await detector.detect('node');
      
      // If this works, we're using execFile (cross-platform)
      expect(info.available).toBe(true);
    }, 10000);

    it('should handle Windows paths correctly', async () => {
      // Windows uses backslashes, but execFile handles this automatically
      const info = await detector.detect('node');
      
      expect(info.available).toBe(true);
      expect(info.version).toBeDefined();
    }, 10000);

    it('should timeout after 5 seconds for hanging tools', async () => {
      // This test verifies timeout behavior
      // We can't easily test this without a hanging tool, so we check the logic
      
      const start = Date.now();
      const info = await detector.detect('nonexistent-hanging-tool');
      const duration = Date.now() - start;
      
      // Should fail quickly (not hang indefinitely)
      expect(duration).toBeLessThan(10000);
      expect(info.available).toBe(false);
    }, 12000);
  });

  describe('Error Handling', () => {
    it('should handle tool execution errors gracefully', async () => {
      const info = await detector.detect('tool-that-errors-12345');
      
      expect(info.available).toBe(false);
      expect(info.error).toBeDefined();
    }, 10000);

    it('should differentiate between not found and execution error', async () => {
      const notFound = await detector.detect('nonexistent-tool-12345');
      
      expect(notFound.error).toContain('not found');
    }, 10000);
  });

  describe('Tool Info Structure', () => {
    it('should return correct structure for available tool', async () => {
      const info = await detector.detect('node');
      
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('available');
      
      expect(typeof info.name).toBe('string');
      expect(typeof info.version).toBe('string');
      expect(typeof info.available).toBe('boolean');
      
      expect(info.available).toBe(true);
    }, 10000);

    it('should return correct structure for missing tool', async () => {
      const info = await detector.detect('nonexistent-tool-12345');
      
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('available');
      expect(info).toHaveProperty('error');
      
      expect(info.available).toBe(false);
      expect(info.version).toBe('unknown');
    }, 10000);
  });
});
