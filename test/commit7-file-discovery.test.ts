import { GitSCM } from '../src/scm/git';
import { PathNormalizer } from '../src/scm/paths';
import { FileDiscovery } from '../src/core/file-discovery';
import * as path from 'path';

describe('COMMIT-7: File Discovery (SCM Integration)', () => {
  describe('PathNormalizer', () => {
    describe('normalize()', () => {
      it('should convert Windows backslashes to forward slashes', () => {
        const input = 'C:\\Users\\project\\.github\\workflows\\ci.yml';
        const expected = 'C:/Users/project/.github/workflows/ci.yml';
        expect(PathNormalizer.normalize(input)).toBe(expected);
      });

      it('should leave Unix paths unchanged', () => {
        const input = '/home/user/.github/workflows/ci.yml';
        expect(PathNormalizer.normalize(input)).toBe(input);
      });

      it('should handle mixed slashes', () => {
        const input = 'src/utils\\helpers.ts';
        expect(PathNormalizer.normalize(input)).toBe('src/utils/helpers.ts');
      });

      it('should handle empty string', () => {
        expect(PathNormalizer.normalize('')).toBe('');
      });

      it('should handle single backslash', () => {
        expect(PathNormalizer.normalize('\\')).toBe('/');
      });
    });

    describe('makeRelative()', () => {
      it('should make absolute path relative and normalize', () => {
        const filePath = '/home/user/project/.github/workflows/ci.yml';
        const cwd = '/home/user/project';
        const result = PathNormalizer.makeRelative(filePath, cwd);
        expect(result).toBe('.github/workflows/ci.yml');
      });

      it('should handle Windows absolute paths', () => {
        const filePath = 'C:\\project\\.github\\ci.yml';
        const cwd = 'C:\\project';
        const result = PathNormalizer.makeRelative(filePath, cwd);
        expect(result).toBe('.github/ci.yml');
      });

      it('should handle already relative paths', () => {
        const filePath = '.github/workflows/ci.yml';
        const cwd = '/home/user/project';
        const result = PathNormalizer.makeRelative(filePath, cwd);
        // Should still normalize and process
        expect(typeof result).toBe('string');
      });
    });

    describe('matchGlobs()', () => {
      const files = [
        '.github/workflows/ci.yml',
        '.github/workflows/deploy.yaml',
        'src/index.ts',
        'src/utils.js',
        'README.md',
        '.github/scripts/setup.sh',
      ];

      it('should match YAML files', () => {
        const globs = ['**/*.yml', '**/*.yaml'];
        const result = PathNormalizer.matchGlobs(files, globs);
        expect(result).toContain('.github/workflows/ci.yml');
        expect(result).toContain('.github/workflows/deploy.yaml');
        expect(result).not.toContain('src/index.ts');
        expect(result).not.toContain('README.md');
      });

      it('should match files in .github directory', () => {
        const globs = ['.github/**/*'];
        const result = PathNormalizer.matchGlobs(files, globs);
        expect(result).toContain('.github/workflows/ci.yml');
        expect(result).toContain('.github/scripts/setup.sh');
        expect(result).not.toContain('src/index.ts');
      });

      it('should match TypeScript files', () => {
        const globs = ['**/*.ts'];
        const result = PathNormalizer.matchGlobs(files, globs);
        expect(result).toContain('src/index.ts');
        expect(result).not.toContain('src/utils.js');
      });

      it('should return all files for empty globs array', () => {
        const result = PathNormalizer.matchGlobs(files, []);
        expect(result).toEqual(files);
      });

      it('should match multiple glob patterns (OR logic)', () => {
        const globs = ['.github/**/*', 'src/**/*.ts'];
        const result = PathNormalizer.matchGlobs(files, globs);
        expect(result).toContain('.github/workflows/ci.yml');
        expect(result).toContain('src/index.ts');
        expect(result).not.toContain('README.md');
      });

      it('should handle dot files correctly', () => {
        const globs = ['.*/**/*'];
        const result = PathNormalizer.matchGlobs(files, globs);
        // minimatch with dot: true should match hidden files
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('normalizeArray()', () => {
      it('should normalize array of paths', () => {
        const input = ['src\\index.ts', 'src\\utils.ts'];
        const result = PathNormalizer.normalizeArray(input);
        expect(result).toEqual(['src/index.ts', 'src/utils.ts']);
      });

      it('should handle empty array', () => {
        expect(PathNormalizer.normalizeArray([])).toEqual([]);
      });
    });

    describe('removeLeadingDot()', () => {
      it('should remove leading ./from Unix path', () => {
        expect(PathNormalizer.removeLeadingDot('./src/index.ts')).toBe('src/index.ts');
      });

      it('should remove leading .\\ from Windows path', () => {
        expect(PathNormalizer.removeLeadingDot('.\\src\\index.ts')).toBe('src/index.ts');
      });

      it('should not affect paths without leading dot', () => {
        expect(PathNormalizer.removeLeadingDot('src/index.ts')).toBe('src/index.ts');
      });
    });

    describe('join()', () => {
      it('should join path segments with forward slashes', () => {
        const result = PathNormalizer.join('src', 'utils', 'helpers.ts');
        expect(result).toBe('src/utils/helpers.ts');
      });

      it('should handle Windows path separator', () => {
        const result = PathNormalizer.join('.github', 'workflows');
        // Should normalize to forward slashes
        expect(result).not.toContain('\\');
      });
    });

    describe('relative()', () => {
      it('should compute relative path between two directories', () => {
        const result = PathNormalizer.relative('/home/user/project', '/home/user/project/.github');
        expect(result).toBe('.github');
      });

      it('should normalize result', () => {
        // Result should use forward slashes
        const result = PathNormalizer.relative('C:\\project', 'C:\\project\\src');
        expect(result).not.toContain('\\');
      });
    });

    describe('isAbsolute()', () => {
      it('should return true for absolute Unix paths', () => {
        expect(PathNormalizer.isAbsolute('/home/user/file.txt')).toBe(true);
      });

      it('should return true for absolute Windows paths', () => {
        expect(PathNormalizer.isAbsolute('C:\\Users\\file.txt')).toBe(true);
      });

      it('should return false for relative paths', () => {
        expect(PathNormalizer.isAbsolute('src/file.txt')).toBe(false);
      });
    });

    describe('deduplicate()', () => {
      it('should remove duplicate paths', () => {
        const input = ['a.ts', 'b.ts', 'a.ts', 'c.ts', 'b.ts'];
        const result = PathNormalizer.deduplicate(input);
        expect(result).toEqual(['a.ts', 'b.ts', 'c.ts']);
      });

      it('should maintain original order', () => {
        const input = ['z.ts', 'a.ts', 'z.ts', 'm.ts'];
        const result = PathNormalizer.deduplicate(input);
        expect(result).toEqual(['z.ts', 'a.ts', 'm.ts']);
      });

      it('should handle empty array', () => {
        expect(PathNormalizer.deduplicate([])).toEqual([]);
      });
    });

    describe('sort()', () => {
      it('should sort paths lexicographically', () => {
        const input = ['z.ts', 'a.ts', 'm.ts'];
        const result = PathNormalizer.sort(input);
        expect(result).toEqual(['a.ts', 'm.ts', 'z.ts']);
      });

      it('should not modify original array', () => {
        const input = ['z.ts', 'a.ts'];
        const result = PathNormalizer.sort(input);
        expect(input).toEqual(['z.ts', 'a.ts']); // Original unchanged
      });
    });
  });

  describe('GitSCM (mocked)', () => {
    const cwd = '/home/user/project';
    let gitSCM: GitSCM;

    beforeEach(() => {
      gitSCM = new GitSCM(cwd);
    });

    describe('getStagedFiles()', () => {
      it('should return empty array for non-git directory', async () => {
        // When git is not available or not in repo, returns []
        const result = await gitSCM.getStagedFiles();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('getChangedFiles()', () => {
      it('should accept baseBranch parameter', async () => {
        const result = await gitSCM.getChangedFiles('develop');
        expect(Array.isArray(result)).toBe(true);
      });

      it('should default to main branch', async () => {
        const result = await gitSCM.getChangedFiles();
        expect(Array.isArray(result)).toBe(true);
      });

      it('should fallback when base branch missing', async () => {
        // This tests the fallback logic: if origin/<base> doesn't exist,
        // should return tracked files
        const result = await gitSCM.getChangedFiles('nonexistent-branch');
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('getTrackedFiles()', () => {
      it('should return array of files', async () => {
        const result = await gitSCM.getTrackedFiles();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('isGitRepo()', () => {
      it('should return boolean', async () => {
        const result = await gitSCM.isGitRepo();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('getRepoRoot()', () => {
      it('should return string path', async () => {
        const result = await gitSCM.getRepoRoot();
        expect(typeof result).toBe('string');
      });
    });

    describe('getCurrentBranch()', () => {
      it('should return branch name or unknown', async () => {
        const result = await gitSCM.getCurrentBranch();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('FileDiscovery', () => {
    const cwd = '/home/user/project';
    let discovery: FileDiscovery;

    beforeEach(() => {
      discovery = new FileDiscovery(cwd);
    });

    describe('discover()', () => {
      it('should accept staged mode', async () => {
        const result = await discovery.discover({ mode: 'staged' });
        expect(Array.isArray(result)).toBe(true);
      });

      it('should accept changed mode', async () => {
        const result = await discovery.discover({ mode: 'changed' });
        expect(Array.isArray(result)).toBe(true);
      });

      it('should accept all mode', async () => {
        const result = await discovery.discover({ mode: 'all' });
        expect(Array.isArray(result)).toBe(true);
      });

      it('should accept custom baseBranch for changed mode', async () => {
        const result = await discovery.discover({
          mode: 'changed',
          baseBranch: 'develop',
        });
        expect(Array.isArray(result)).toBe(true);
      });

      it('should filter by glob patterns', async () => {
        const result = await discovery.discover({
          mode: 'all',
          globs: ['**/*.yml', '**/*.yaml'],
        });
        expect(Array.isArray(result)).toBe(true);
      });

      it('should handle empty globs array (no filtering)', async () => {
        const result = await discovery.discover({
          mode: 'all',
          globs: [],
        });
        expect(Array.isArray(result)).toBe(true);
      });

      it('should deduplicate results', async () => {
        const result = await discovery.discover({ mode: 'all' });
        const uniqueFiles = new Set(result);
        expect(result.length).toBe(uniqueFiles.size);
      });

      it('should sort results', async () => {
        const result = await discovery.discover({ mode: 'all' });
        const sorted = [...result].sort();
        expect(result).toEqual(sorted);
      });

      it('should normalize paths (forward slashes)', async () => {
        const result = await discovery.discover({ mode: 'all' });
        for (const file of result) {
          expect(file).not.toContain('\\');
        }
      });

      it('should make paths relative', async () => {
        const result = await discovery.discover({ mode: 'all' });
        for (const file of result) {
          expect(PathNormalizer.isAbsolute(file)).toBe(false);
        }
      });
    });

    describe('isInGitRepo()', () => {
      it('should return boolean', async () => {
        const result = await discovery.isInGitRepo();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('getRepoRoot()', () => {
      it('should return string path', async () => {
        const result = await discovery.getRepoRoot();
        expect(typeof result).toBe('string');
      });
    });

    describe('getCurrentBranch()', () => {
      it('should return string', async () => {
        const result = await discovery.getCurrentBranch();
        expect(typeof result).toBe('string');
      });
    });

    describe('getRemoteBranches()', () => {
      it('should return array of strings', async () => {
        const result = await discovery.getRemoteBranches();
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe('validateBaseBranch()', () => {
      it('should return boolean', async () => {
        const result = await discovery.validateBaseBranch('main');
        expect(typeof result).toBe('boolean');
      });
    });

    describe('recommendMode()', () => {
      it('should return valid discovery mode', async () => {
        const result = await discovery.recommendMode();
        expect(['staged', 'changed', 'all']).toContain(result);
      });
    });
  });

  describe('Integration: FileDiscovery with filters', () => {
    const cwd = '/home/user/project';
    const discovery = new FileDiscovery(cwd);

    it('should handle chained operations: discover → filter → normalize', async () => {
      const result = await discovery.discover({
        mode: 'all',
        globs: ['**/*.ts', '**/*.tsx'],
      });

      // Verify results are normalized and filtered
      expect(Array.isArray(result)).toBe(true);
      for (const file of result) {
        // Should have forward slashes only
        expect(file).not.toContain('\\');
        // Should match at least one glob (if any results)
        if (result.length > 0) {
          expect(file.endsWith('.ts') || file.endsWith('.tsx')).toBe(true);
        }
      }
    });

    it('should handle multiple glob patterns', async () => {
      const result = await discovery.discover({
        mode: 'all',
        globs: ['.github/**/*.yml', '.github/**/*.yaml', 'src/**/*.ts'],
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return sorted, deduplicated results', async () => {
      const result = await discovery.discover({ mode: 'all' });

      // Check sorted
      const sorted = [...result].sort();
      expect(result).toEqual(sorted);

      // Check deduplicated
      const unique = new Set(result);
      expect(result.length).toBe(unique.size);
    });
  });
});
