/**
 * GitSCM - Git operations for file discovery
 * Supports: staged files, changed files (vs base branch), all tracked files
 */

import execa from 'execa';

export class GitSCM {
  constructor(private cwd: string) {}

  /**
   * Get staged files (for pre-commit hooks)
   * Equivalent to: git diff --name-only --cached
   *
   * @returns Array of staged file paths (relative to repo root)
   */
  async getStagedFiles(): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['diff', '--name-only', '--cached'], {
        cwd: this.cwd,
      });
      return stdout
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);
    } catch {
      // Not a git repo or git not available
      return [];
    }
  }

  /**
   * Get changed files vs base branch (for PR validation)
   * Equivalent to: git diff --name-only origin/<baseBranch>...HEAD
   *
   * Fallback strategy:
   * 1. Try git diff against origin/<baseBranch>
   * 2. If that fails, fallback to all tracked files
   *
   * This handles CI environments where origin/main might not exist locally
   * (shallow clones, detached heads, etc.)
   *
   * @param baseBranch - Base branch to compare against (default: 'main')
   * @returns Array of changed file paths
   */
  async getChangedFiles(baseBranch: string = 'main'): Promise<string[]> {
    try {
      // Try: git diff origin/<baseBranch>...HEAD
      const refSpec = `origin/${baseBranch}...HEAD`;
      const { stdout } = await execa('git', ['diff', '--name-only', refSpec], {
        cwd: this.cwd,
      });

      const files = stdout
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);

      // If we got files, return them
      if (files.length > 0) {
        return files;
      }

      // Empty diff - try merge-base as fallback
      try {
        const { stdout: mergeBase } = await execa(
          'git',
          ['merge-base', 'HEAD', `origin/${baseBranch}`],
          {
            cwd: this.cwd,
          }
        );

        const { stdout: diffOut } = await execa(
          'git',
          ['diff', '--name-only', mergeBase.trim()],
          {
            cwd: this.cwd,
          }
        );

        return diffOut
          .split('\n')
          .map((line: string) => line.trim())
          .filter(Boolean);
      } catch {
        // merge-base also failed, return all files
        return this.getTrackedFiles();
      }
    } catch {
      // git diff failed (origin/<baseBranch> doesn't exist)
      // Fallback: return all tracked files
      return this.getTrackedFiles();
    }
  }

  /**
   * Get all tracked files in the repository
   * Equivalent to: git ls-files
   *
   * This is the ultimate fallback when changed files cannot be determined
   * (e.g., shallow clones, CI environments without remote)
   *
   * @returns Array of all tracked file paths
   */
  async getTrackedFiles(): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['ls-files'], {
        cwd: this.cwd,
      });

      return stdout
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);
    } catch {
      // Not a git repo
      return [];
    }
  }

  /**
   * Check if we're inside a git repository
   * Equivalent to: git rev-parse --git-dir
   *
   * @returns true if in git repo, false otherwise
   */
  async isGitRepo(): Promise<boolean> {
    try {
      await execa('git', ['rev-parse', '--git-dir'], { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get repository root directory
   * Equivalent to: git rev-parse --show-toplevel
   *
   * @returns Absolute path to repo root
   */
  async getRepoRoot(): Promise<string> {
    try {
      const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'], {
        cwd: this.cwd,
      });
      return stdout.trim();
    } catch {
      // Fallback to cwd if not in a repo
      return this.cwd;
    }
  }

  /**
   * Get current branch name
   * Equivalent to: git rev-parse --abbrev-ref HEAD
   *
   * @returns Current branch name
   */
  async getCurrentBranch(): Promise<string> {
    try {
      const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: this.cwd,
      });
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get list of remote branches
   * Equivalent to: git branch -r
   *
   * @returns Array of remote branch names
   */
  async getRemoteBranches(): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['branch', '-r'], {
        cwd: this.cwd,
      });

      return stdout
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((line: string) => line.replace(/^\*?\s+/, '')); // Remove * prefix and whitespace
    } catch {
      return [];
    }
  }
}
