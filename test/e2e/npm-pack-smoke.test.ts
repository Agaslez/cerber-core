/**
 * NPM Pack Smoke Test — TARBALL VALIDATION
 * 
 * Verifies:
 * 1. npm pack creates valid tarball with required files
 * 2. dist/, bin/ present and accessible
 * 3. test/* NOT packaged (not shipped to users)
 * 4. E2E: Install tarball in clean dir, npx cerber --help works
 * 
 * This is the TRUE test: client installs tarball, not repo
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('@e2e NPM Pack Smoke Test (Tarball Distribution)', () => {
  let packFile: string;
  let packDir: string;
  let installDir: string;

  beforeAll(() => {
    packDir = process.cwd();
    installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cerber-smoke-'));
  });

  afterAll(() => {
    // Cleanup temp dir
    if (fs.existsSync(installDir)) {
      try {
        if (process.platform === 'win32') {
          execSync(`rmdir /s /q "${installDir}"`, { stdio: 'pipe' });
        } else {
          execSync(`rm -rf "${installDir}"`, { stdio: 'pipe' });
        }
      } catch {
        // Ignore
      }
    }
  });

  describe('Tarball content validation', () => {
    it('should create tarball with npm pack', () => {
      try {
        const output = execSync('npm pack 2>&1', {
          cwd: packDir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Extract filename from output (e.g., "cerber-core-1.1.12.tgz")
        // npm pack outputs the filename as the last line
        const lines = output.trim().split('\n');
        const lastLine = lines[lines.length - 1].trim();
        
        packFile = lastLine;
        const fullPath = path.join(packDir, packFile);
        expect(fs.existsSync(fullPath)).toBe(true);
      } catch (e) {
        throw new Error(`npm pack failed: ${e}`);
      }
    });

    it('should include dist/index.js in tarball', () => {
      try {
        const listing = execSync(`tar -tzf "${packFile}"`, {
          cwd: packDir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe']
        });

        expect(listing).toContain('dist/index.js');
      } catch (e) {
        throw new Error(`Tarball missing dist/index.js: ${e}`);
      }
    });

    it('should include bin/cerber executable', () => {
      try {
        const listing = execSync(`tar -tzf "${packFile}"`, {
          cwd: packDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        expect(listing).toContain('bin/cerber');
      } catch (e) {
        throw new Error(`Tarball missing bin/cerber: ${e}`);
      }
    });

    it('should include setup-guardian-hooks.cjs in bin/', () => {
      try {
        const listing = execSync(`tar -tzf "${packFile}"`, {
          cwd: packDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        expect(listing).toContain('bin/setup-guardian-hooks.cjs');
      } catch (e) {
        throw new Error(`Tarball missing setup-guardian-hooks.cjs: ${e}`);
      }
    });

    it('should NOT include test/ files in tarball', () => {
      try {
        const listing = execSync(`tar -tzf "${packFile}"`, {
          cwd: packDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        const lines = listing.split('\n');
        const testFiles = lines.filter(l => 
          l.includes('/test/') && (l.match(/\.test\.(ts|js)/) || l.match(/\.spec\.(ts|js)/))
        );

        expect(testFiles).toEqual([]);
      } catch (e) {
        throw new Error(`Tarball validation failed: ${e}`);
      }
    });

    it('should NOT include node_modules in tarball', () => {
      try {
        const listing = execSync(`tar -tzf "${packFile}"`, {
          cwd: packDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        expect(listing).not.toContain('node_modules');
      } catch (e) {
        throw new Error(`Tarball contains node_modules: ${e}`);
      }
    });

    it('should have package.json with correct main/bin entries', () => {
      try {
        // Extract package.json from tarball
        const pkgJson = JSON.parse(
          execSync(`tar -xzOf "${packFile}" package/package.json`, {
            cwd: packDir,
            encoding: 'utf8',
            stdio: 'pipe'
          })
        );

        expect(pkgJson.name).toContain('cerber');
        expect(pkgJson.main).toBe('dist/index.js');
        expect(pkgJson.bin).toBeDefined();
        expect(pkgJson.bin.cerber).toBe('./bin/cerber');
      } catch (e) {
        throw new Error(`package.json validation failed: ${e}`);
      }
    });
  });;

  describe('E2E tarball installation', () => {
    it('should install tarball in clean directory', () => {
      try {
        // Create package.json in install dir
        execSync('npm init -y', {
          cwd: installDir,
          stdio: 'pipe'
        });

        // Install the tarball
        const tarballPath = path.join(packDir, packFile);
        execSync(`npm install --silent "${tarballPath}"`, {
          cwd: installDir,
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 120000
        });

        // Verify node_modules/cerber-core exists
        const pkgPath = path.join(installDir, 'node_modules', 'cerber-core');
        const exists = fs.existsSync(pkgPath);
        expect(exists).toBe(true);
      } catch (e: any) {
        throw new Error(`Tarball installation failed: ${e.message || e}`);
      }
    });

    it('npx cerber --help should work from installed tarball', () => {
      try {
        const output = execSync('npx --yes cerber --help', {
          cwd: installDir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 30000
        });

        expect(output).toMatch(/cerber|usage|help/i);
      } catch (e: any) {
        throw new Error(`npx cerber --help failed: ${e.message || e}`);
      }
    });

    it('should have dist files installed in node_modules', () => {
      try {
        const distPath = path.join(installDir, 'node_modules', 'cerber-core', 'dist');
        const distExists = fs.existsSync(distPath);
        expect(distExists).toBe(true);

        const distFiles = fs.readdirSync(distPath);
        expect(distFiles.length).toBeGreaterThan(0);
      } catch (e: any) {
        throw new Error(`dist/ not properly installed: ${e.message || e}`);
      }
    });

    it('should have bin scripts installed', () => {
      try {
        const binPath = path.join(installDir, 'node_modules', 'cerber-core', 'bin');
        const binExists = fs.existsSync(binPath);
        expect(binExists).toBe(true);

        const binFiles = fs.readdirSync(binPath);
        const hasCerber = binFiles.includes('cerber');
        const hasSetup = binFiles.some(f => f.includes('setup-guardian-hooks'));
        
        expect(hasCerber).toBe(true);
        expect(hasSetup).toBe(true);
      } catch (e: any) {
        throw new Error(`bin/ not properly installed: ${e.message || e}`);
      }
    });
  });

  describe('Tarball determinism (reproducibility)', () => {
    it('should produce same tarball content on rebuild', () => {
      try {
        // Get listing of current tarball
        const listing1 = execSync(`tar -tzf "${packFile}"`, {
          cwd: packDir,
          encoding: 'utf8',
          stdio: 'pipe'
        }).trim();

        // Rebuild and pack again
        execSync('npm run build', {
          cwd: packDir,
          stdio: 'pipe'
        });

        const output2 = execSync('npm pack 2>&1', {
          cwd: packDir,
          encoding: 'utf8',
          stdio: 'pipe'
        });

        const lines2 = output2.trim().split('\n');
        const packFile2 = lines2[lines2.length - 1].trim();

        const listing2 = execSync(`tar -tzf "${packFile2}"`, {
          cwd: packDir,
          encoding: 'utf8',
          stdio: 'pipe'
        }).trim();

        // Both should list same files
        expect(listing1).toEqual(listing2);

        // Cleanup second tarball
        try {
          fs.unlinkSync(path.join(packDir, packFile2));
        } catch {}
      } catch (e) {
        throw new Error(`Determinism check failed: ${e}`);
      }
    });
  });

  describe('Package.json files field alignment', () => {
    it('package.json files should include dist/ and bin/', () => {
      try {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(packDir, 'package.json'), 'utf8')
        );

        expect(pkgJson.files).toBeDefined();
        expect(Array.isArray(pkgJson.files)).toBe(true);
        expect(pkgJson.files).toContain('dist');
        expect(pkgJson.files).toContain('bin');
      } catch (e) {
        throw new Error(`package.json files field invalid: ${e}`);
      }
    });

    it('package.json files should NOT include test/', () => {
      try {
        const pkgJson = JSON.parse(
          fs.readFileSync(path.join(packDir, 'package.json'), 'utf8')
        );

        expect(pkgJson.files).toBeDefined();
        const hasTestEntry = pkgJson.files.some((f: string) => 
          f.includes('test') || f.includes('*.test') || f.includes('*.spec')
        );
        expect(hasTestEntry).toBe(false);
      } catch (e) {
        throw new Error(`package.json contains test files: ${e}`);
      }
    });
  });
});
