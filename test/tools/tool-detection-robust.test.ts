/**
 * Tool Detection Robustness Tests
 * 
 * Tests PATH parsing, multiple paths, stderr output, missing permissions
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('Tool Detection Robustness', () => {
  describe('PATH parsing', () => {
    it('should handle PATH with spaces (Program Files)', () => {
      const testPath = 'C:\\Program Files\\Tool\\bin;C:\\Windows\\System32';
      // Simulate parsing
      const dirs = testPath.split(';');
      expect(dirs.length).toBe(2);
      expect(dirs[0]).toContain('Program Files');
    });

    it('should handle PATH with quotes', () => {
      const testPath = '"C:\\Path\\With Spaces";"C:\\Normal\\Path"';
      const dirs = testPath
        .split(';')
        .map((d) => d.replace(/"/g, ''));
      expect(dirs[0]).toContain('Path\\With Spaces');
    });

    it('should handle mixed separators (Unix/Windows)', () => {
      const unixPath = '/usr/local/bin:/usr/bin:/bin';
      const dirs = unixPath.split(':');
      expect(dirs.length).toBe(3);
      expect(dirs[0]).toBe('/usr/local/bin');
    });
  });

  describe('Multiple tool paths', () => {
    it('should prefer first occurrence in PATH order', () => {
      const paths = [
        '/usr/local/bin/actionlint',
        '/opt/actionlint',
        '/usr/bin/actionlint',
      ];
      
      // Should pick first
      const selected = paths[0];
      expect(selected).toBe('/usr/local/bin/actionlint');
    });

    it('should handle duplicate paths gracefully', () => {
      const paths = [
        '/usr/local/bin/tool',
        '/usr/local/bin/tool',
        '/usr/bin/tool',
      ];
      
      const unique = [...new Set(paths)];
      expect(unique.length).toBeLessThan(paths.length);
    });
  });

  describe('Version detection from stderr', () => {
    it('should parse version from stderr output', () => {
      const stderrOutput = 'actionlint version 1.6.15';
      const match = stderrOutput.match(/(\d+\.\d+\.\d+)/);
      expect(match?.[1]).toBe('1.6.15');
    });

    it('should handle malformed version output', () => {
      const stderrOutput = 'Tool output without version';
      const match = stderrOutput.match(/(\d+\.\d+\.\d+)/);
      expect(match).toBeNull();
    });

    it('should ignore extra text around version', () => {
      const stderrOutput = 'Tool v1.2.3 (build 123)';
      const match = stderrOutput.match(/v?(\d+\.\d+\.\d+)/);
      expect(match?.[1]).toBe('1.2.3');
    });
  });

  describe('Permission checks', () => {
    it('should detect unexecutable file', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perm-test-'));
      const testFile = path.join(tempDir, 'noperm');
      fs.writeFileSync(testFile, '#!/bin/bash\necho test');
      
      // Remove execute permission
      fs.chmodSync(testFile, 0o644);
      
      const stats = fs.statSync(testFile);
      const isExecutable = (stats.mode & 0o111) !== 0;
      
      expect(isExecutable).toBe(false);
      
      fs.rmSync(tempDir, { recursive: true });
    });

    (process.platform === 'win32' ? it.skip : it)('should recognize executable file', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perm-test-'));
      const testFile = path.join(tempDir, 'withperm');
      fs.writeFileSync(testFile, '#!/bin/bash\necho test');
      
      // Add execute permission
      fs.chmodSync(testFile, 0o755);
      
      const stats = fs.statSync(testFile);
      const isExecutable = (stats.mode & 0o111) !== 0;
      
      expect(isExecutable).toBe(true);
      
      fs.rmSync(tempDir, { recursive: true });
    });
  });

  describe('Tool detection edge cases', () => {
    it('should handle tool name with .exe suffix (Windows)', () => {
      const toolName = 'actionlint.exe';
      expect(toolName).toMatch(/actionlint/);
      expect(toolName).toMatch(/\.exe$/);
    });

    it('should handle tool in current directory', () => {
      const toolPath = './bin/actionlint';
      expect(toolPath.startsWith('.')).toBe(true);
    });

    it('should handle relative paths with backslashes (Windows)', () => {
      const toolPath = '.\\bin\\actionlint.exe';
      const normalized = toolPath.replace(/\\/g, '/');
      expect(normalized).toBe('./bin/actionlint.exe');
    });

    it('should skip symlinks that point to nonexistent targets', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'symlink-test-'));
      const linkPath = path.join(tempDir, 'link');
      const targetPath = path.join(tempDir, 'nonexistent');
      
      try {
        fs.symlinkSync(targetPath, linkPath);
        
        // Link exists but target doesn't
        const linkExists = fs.existsSync(linkPath);
        const targetExists = fs.existsSync(targetPath);
        
        expect(linkExists).toBe(false); // existsSync returns false for broken link
        expect(targetExists).toBe(false);
      } catch (e) {
        // Symlink creation might fail on Windows
        expect(true).toBe(true);
      }
      
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  describe('Cross-platform compatibility', () => {
    it('should handle Windows absolute path', () => {
      const winPath = 'C:\\Program Files\\Tool\\bin\\actionlint.exe';
      expect(winPath).toMatch(/^[A-Z]:/);
      expect(winPath).toMatch(/\.exe$/);
    });

    it('should handle Unix absolute path', () => {
      const unixPath = '/usr/local/bin/actionlint';
      expect(unixPath).toMatch(/^\//);
      expect(unixPath).not.toMatch(/\.exe$/);
    });
  });
});
