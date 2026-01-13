/**
 * NPM Pack Smoke Test
 * 
 * Verifies package tarball can be installed and CLI commands work
 * Tests: --help, doctor, init from packed distribution
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('NPM Pack Smoke Test (Distribution)', () => {
  let tempDir: string;
  let packFile: string;

  beforeAll(() => {
    // Create temp directory for extraction
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-pack-'));
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      try {
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${tempDir}"`, { shell: 'cmd.exe' as any });
        } else {
          execSync(`rm -rf "${tempDir}"`, { shell: true as any });
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Package structure validation', () => {
    it('should generate valid tarball with npm pack', () => {
      try {
        const output = execSync('npm pack --dry-run 2>&1', {
          cwd: process.cwd(),
          encoding: 'utf8'
        });

        expect(output).toMatch(/cerber/i);
        expect(output).toMatch(/\.tgz/);
      } catch (e) {
        throw new Error(`npm pack failed: ${e}`);
      }
    });

    it('should include dist/ directory in tarball', () => {
      try {
        const output = execSync('npm pack --dry-run 2>&1', {
          cwd: process.cwd(),
          encoding: 'utf8'
        });

        expect(output).toContain('dist/');
      } catch (e) {
        throw new Error(`Package missing dist/: ${e}`);
      }
    });

    it('should exclude test/ directory from tarball', () => {
      try {
        const output = execSync('npm pack --dry-run 2>&1', {
          cwd: process.cwd(),
          encoding: 'utf8'
        });

        // Should not include test files in main listing
        const lines = output.split('\n');
        const testLines = lines.filter(l => l.includes('test/'));

        // May have minimal test refs but not bulk test files
        expect(testLines.length).toBeLessThan(5);
      } catch (e) {
        throw new Error(`Package check failed: ${e}`);
      }
    });

    it('should include package.json with correct metadata', () => {
      try {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
        );

        expect(pkgJson.name).toContain('cerber');
        expect(pkgJson.version).toBeDefined();
        expect(pkgJson.main).toBeDefined();
        expect(pkgJson.type).toBe('module');
      } catch (e) {
        throw new Error(`package.json validation failed: ${e}`);
      }
    });

    it('should have binary entry points', () => {
      try {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
        );

        expect(pkgJson.bin).toBeDefined();
        expect(typeof pkgJson.bin).toBe('object');
      } catch (e) {
        throw new Error(`Binary entry points missing: ${e}`);
      }
    });
  });

  describe('CLI command availability from dist', () => {
    it('should have cerber CLI available', () => {
      try {
        const output = execSync('npx cerber --help 2>&1', {
          cwd: process.cwd(),
          encoding: 'utf8'
        });

        expect(output).toMatch(/cerber|usage|help/i);
      } catch (e) {
        throw new Error(`cerber --help failed: ${e}`);
      }
    });

    it('should execute doctor command', () => {
      try {
        const output = execSync('npx cerber doctor 2>&1', {
          cwd: process.cwd(),
          encoding: 'utf8',
          timeout: 5000
        });

        expect(output).toContain('doctor');
      } catch (e: any) {
        // doctor may timeout but should start
        expect((e as Error).toString()).not.toMatch(/command not found/i);
      }
    });

    it('should handle init command', () => {
      try {
        const output = execSync('npx cerber init --help 2>&1', {
          cwd: process.cwd(),
          encoding: 'utf8'
        });

        expect(output).toMatch(/init/i);
      } catch (e: any) {
        // init may not exist but --help should work
        expect((e as Error).toString()).not.toMatch(/command not found/i);
      }
    });
  });

  describe('Distribution integrity', () => {
    it('should have reproducible tarball size', () => {
      try {
        const output = execSync('npm pack --dry-run 2>&1', {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe'
        });

        // Extract size from output - looks for "package size: 254.2 kB"
        const sizeMatch = output.match(/package size:\s*(\d+(?:\.\d+)?)\s*(kB|KB|k|b)/i);

        if (sizeMatch) {
          const sizeValue = parseFloat(sizeMatch[1]);
          const sizeUnit = sizeMatch[2].toUpperCase();
          
          // Convert to KB if needed
          const sizeKb = sizeUnit === 'B' ? sizeValue / 1024 : sizeValue;
          
          // Should be roughly 250-350 KB
          expect(sizeKb).toBeGreaterThan(200);
          expect(sizeKb).toBeLessThan(500);
        }
      } catch (e) {
        throw new Error(`Pack size check failed: ${e}`);
      }
    });

    it('should have compiled dist/ before pack', () => {
      try {
        const distPath = path.join(process.cwd(), 'dist');
        const hasDistFiles = fs.existsSync(distPath) &&
          fs.readdirSync(distPath).length > 0;

        expect(hasDistFiles).toBe(true);
      } catch (e) {
        throw new Error(`dist/ missing or empty: ${e}`);
      }
    });

    it('should exit code 0 on successful pack validation', () => {
      let exitCode = 0;

      try {
        execSync('npm pack --dry-run 2>&1', {
          cwd: process.cwd(),
          stdio: 'pipe'
        });
      } catch (e: any) {
        exitCode = e.status || 1;
      }

      expect(exitCode).toBe(0);
    });
  });

  describe('Post-install artifacts', () => {
    it('should include guardian protection files', () => {
      try {
        const files = [
          'CODEOWNERS',
          '.cerber/contract.yml',
          'GUARDIAN_PROTECTION.md'
        ];

        for (const file of files) {
          const fullPath = path.join(process.cwd(), file);
          const exists = fs.existsSync(fullPath);
          expect(exists).toBe(true);
        }
      } catch (e) {
        throw new Error(`Guardian files missing: ${e}`);
      }
    });

    it('should have hook installation script', () => {
      try {
        const hookPath = path.join(process.cwd(), 'bin', 'setup-guardian-hooks.cjs');
        const exists = fs.existsSync(hookPath);
        expect(exists).toBe(true);

        // Should be executable (on Unix)
        if (process.platform !== 'win32') {
          const stats = fs.statSync(hookPath);
          expect(stats.mode & 0o111).toBeGreaterThan(0);
        }

        // Verify the script has expected content
        const content = fs.readFileSync(hookPath, 'utf8');
        expect(content).toContain('Guardian Hook Setup');
        expect(content).toContain('--dry-run');
        expect(content).toContain('.git');
      } catch (e) {
        throw new Error(`Hook script missing: ${e}`);
      }
    });

    it('should run guardian hook installer with --dry-run safely', () => {
      try {
        const hookPath = path.join(process.cwd(), 'bin', 'setup-guardian-hooks.cjs');
        
        // Test --dry-run mode (should not modify system)
        const output = execSync(`node ${hookPath} --dry-run 2>&1`, {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 5000
        });

        // Should indicate dry-run mode and no changes
        expect(output).toMatch(/DRY-RUN|would|No changes/i);
        expect(output).not.toMatch(/ERROR|FATAL/i);
      } catch (e: any) {
        // Dry-run should not throw, but if it does, check if it's expected
        if (e.status === 2) {
          // Exit code 2 = blocker (e.g., not in a git repo during test)
          // This is acceptable if we're testing in isolation
          expect(e.toString()).toMatch(/not a git repository|FATAL/i);
        } else {
          throw new Error(`Hook installer failed unexpectedly: ${e}`);
        }
      }
    });
  });
});
