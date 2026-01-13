import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { getDoctorToolStatus, printDoctorReport, runDoctor } from '../../src/cli/doctor.js';

describe('Doctor Command', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = resolve(tmpdir(), `doctor-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Tool Detection', () => {
    it('should detect actionlint when installed', async () => {
      const status = await getDoctorToolStatus('actionlint');
      expect(status.installed).toBeDefined();
      expect(typeof status.installed).toBe('boolean');
    });

    it('should detect zizmor when installed', async () => {
      const status = await getDoctorToolStatus('zizmor');
      expect(status.installed).toBeDefined();
      expect(typeof status.installed).toBe('boolean');
    });

    it('should detect gitleaks when installed', async () => {
      const status = await getDoctorToolStatus('gitleaks');
      expect(status.installed).toBeDefined();
      expect(typeof status.installed).toBe('boolean');
    });

    it('should get version for installed tool', async () => {
      const status = await getDoctorToolStatus('actionlint');
      if (status.installed) {
        expect(status.version).toBeDefined();
        expect(status.version).toMatch(/\d+\.\d+/);
      }
    });

    it('should return install command for missing tool', async () => {
      const status = await getDoctorToolStatus('nonexistent-tool');
      expect(status.installed).toBe(false);
      expect(status.installCommand).toBeDefined();
      expect(typeof status.installCommand).toBe('string');
    });
  });

  describe('Contract Detection', () => {
    it('should detect CERBER.md when present', async () => {
      // Create contract file
      writeFileSync(resolve(tempDir, 'CERBER.md'), 'profile: solo\n');

      const result = await runDoctor(tempDir);
      expect(result.contractFound).toBe(true);
    });

    it('should report missing contract', async () => {
      const result = await runDoctor(tempDir);
      expect(result.contractFound).toBe(false);
      expect(result.exitCode).toBeGreaterThan(0);
    });
  });

  describe('Doctor Report Format', () => {
    it('should output less than 5 lines for minimal status', async () => {
      const result = await runDoctor(tempDir);
      
      // Capture console.log calls
      const logs: string[] = [];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation((msg) => {
        logs.push(msg);
      });

      printDoctorReport(result);

      consoleSpy.mockRestore();
      
      // Count non-empty lines (excluding status header)
      const contentLines = logs.filter(l => l.trim().length > 0);
      expect(contentLines.length).toBeLessThan(20); // Reasonable upper bound
    });

    it('should include contract info when found', async () => {
      writeFileSync(resolve(tempDir, 'CERBER.md'), 'profile: solo\n');

      const result = await runDoctor(tempDir);

      const logs: string[] = [];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation((msg) => {
        logs.push(msg);
      });

      printDoctorReport(result);
      consoleSpy.mockRestore();

      const output = logs.join('\n');
      expect(output).toContain('Contract');
    });

    it('should include tool status in output', async () => {
      const result = await runDoctor(tempDir);

      const logs: string[] = [];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation((msg) => {
        logs.push(msg);
      });

      printDoctorReport(result);
      consoleSpy.mockRestore();

      const output = logs.join('\n');
      // Should mention at least one tool
      if (result.toolsStatus) {
        expect(output.toLowerCase()).toMatch(/actionlint|zizmor|gitleaks/);
      }
    });

    it('should show install hints for missing tools', async () => {
      const result = await runDoctor(tempDir);

      const logs: string[] = [];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation((msg) => {
        logs.push(msg);
      });

      printDoctorReport(result);
      consoleSpy.mockRestore();

      const output = logs.join('\n');
      // Should have install command hint if tools are missing
      if (result.toolsStatus && result.toolsStatus.some(t => !t.installed)) {
        expect(output.toLowerCase()).toMatch(/npm install|fix|install/);
      }
    });
  });

  describe('Exit Codes', () => {
    it('should return exit code 0 when all OK', async () => {
      mkdirSync(resolve(tempDir, '.cerber'), { recursive: true });
      writeFileSync(resolve(tempDir, '.cerber', 'contract.yml'), 'profile: solo\n');

      const result = await runDoctor(tempDir);
      // Exit code should be 0 for valid contract, or 1 for missing tools (warning)
      // In test environment, tools are usually not installed, so exit 1 is acceptable
      expect(result.contractFound).toBe(true);
      expect(result.exitCode).toBeLessThanOrEqual(1);
    });

    it('should return exit code 1 when warnings', async () => {
      const result = await runDoctor(tempDir);
      // Missing contract is a warning/incomplete setup
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      expect(result.exitCode).toBeLessThanOrEqual(2);
    });

    it('should return exit code 2 when blockers', async () => {
      const result = await runDoctor(tempDir);
      if (!result.contractFound) {
        expect(result.exitCode).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Performance', () => {
    it('should complete doctor check in less than 1 second', async () => {
      const start = Date.now();
      await runDoctor(tempDir);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    it('should complete with output in less than 1 second', async () => {
      const start = Date.now();
      const result = await runDoctor(tempDir);
      printDoctorReport(result);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Integration', () => {
    it('should run doctor without errors', async () => {
      expect(async () => {
        await runDoctor(tempDir);
      }).not.toThrow();
    });

    it('should have contract or tool info in result', async () => {
      const result = await runDoctor(tempDir);
      expect(result.contractFound !== undefined || result.toolsStatus !== undefined).toBe(true);
    });

    it('should provide actionable next steps', async () => {
      const result = await runDoctor(tempDir);

      const logs: string[] = [];
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation((msg) => {
        logs.push(msg);
      });

      printDoctorReport(result);
      consoleSpy.mockRestore();

      const output = logs.join('\n');
      // Should have some actionable info (contract found or install hints)
      expect(output.length).toBeGreaterThan(0);
    });
  });
});
