/**
 * FileDiscovery - Unified file discovery system
 * Discovers files for validation based on mode: staged, changed, or all
 * Supports filtering by glob patterns
 */

import { GitSCM } from '../scm/git';
import { PathNormalizer } from '../scm/paths';

export type DiscoveryMode = 'staged' | 'changed' | 'all';

export interface DiscoveryOptions {
  /**
   * Discovery mode
   * - 'staged': git diff --cached (files staged for commit)
   * - 'changed': git diff vs base branch (for PR validation)
   * - 'all': git ls-files (all tracked files)
   */
  mode: DiscoveryMode;

  /**
   * Base branch for 'changed' mode
   * Default: 'main'
   */
  baseBranch?: string;

  /**
   * Glob patterns to filter files
   * Example: ["**\/*.yml", "**\/*.yaml"]
   * If not provided, all discovered files are returned
   */
  globs?: string[];

  /**
   * Include hidden files (.github, etc.)
   * Default: true
   */
  includeHidden?: boolean;
}

export class FileDiscovery {
  private git: GitSCM;

  constructor(private cwd: string) {
    this.git = new GitSCM(cwd);
  }

  /**
   * Discover files based on mode and filters
   *
   * @param options - Discovery options
   * @returns Array of discovered file paths (normalized)
   *
   * @example
   * // Get staged files
   * const files = await discovery.discover({ mode: 'staged' });
   *
   * // Get changed files vs main branch, filtered to YAML
   * const files = await discovery.discover({
   *   mode: 'changed',
   *   baseBranch: 'main',
   *   globs: ['**\/*.yml', '**\/*.yaml']
   * });
   */
  async discover(options: DiscoveryOptions): Promise<string[]> {
    // 1. Get files by mode
    let files: string[];

    switch (options.mode) {
      case 'staged':
        files = await this.git.getStagedFiles();
        break;

      case 'changed':
        files = await this.git.getChangedFiles(options.baseBranch || 'main');
        break;

      case 'all':
        files = await this.git.getTrackedFiles();
        break;

      default:
        const exhaustive: never = options.mode;
        throw new Error(`Unknown discovery mode: ${exhaustive}`);
    }

    // 2. Filter by glob patterns if provided
    if (options.globs && options.globs.length > 0) {
      files = PathNormalizer.matchGlobs(files, options.globs);
    }

    // 3. Normalize paths (Windows → forward slashes)
    files = PathNormalizer.normalizeArray(files);

    // 4. Make paths relative to cwd
    files = files.map((f) => PathNormalizer.makeRelative(f, this.cwd));

    // 5. Deduplicate and sort
    files = PathNormalizer.deduplicate(files);
    files = PathNormalizer.sort(files);

    return files;
  }

  /**
   * Check if we're in a git repository
   *
   * @returns true if in git repo
   */
  async isInGitRepo(): Promise<boolean> {
    return this.git.isGitRepo();
  }

  /**
   * Get repository root directory
   *
   * @returns Absolute path to repo root
   */
  async getRepoRoot(): Promise<string> {
    return this.git.getRepoRoot();
  }

  /**
   * Get current branch name
   *
   * @returns Current branch name
   */
  async getCurrentBranch(): Promise<string> {
    return this.git.getCurrentBranch();
  }

  /**
   * Get available remote branches
   * Useful for validating base branch exists
   *
   * @returns Array of remote branch names
   */
  async getRemoteBranches(): Promise<string[]> {
    return this.git.getRemoteBranches();
  }

  /**
   * Validate that base branch exists in remote
   *
   * @param baseBranch - Branch name to validate
   * @returns true if branch exists in origin
   */
  async validateBaseBranch(baseBranch: string): Promise<boolean> {
    const branches = await this.getRemoteBranches();
    return branches.some(
      (b) => b === `origin/${baseBranch}` || b.endsWith(`/${baseBranch}`)
    );
  }

  /**
   * Quick check: what mode would we use for given scenario?
   * Useful for user-facing messages
   *
   * @returns The recommended discovery mode for current environment
   */
  async recommendMode(): Promise<DiscoveryMode> {
    const isGit = await this.isInGitRepo();
    if (!isGit) {
      return 'all'; // Not in git, can't use staged/changed
    }

    const branch = await this.getCurrentBranch();
    const isDetached = branch === 'HEAD';

    if (isDetached) {
      return 'all'; // Detached HEAD, can't determine changed files
    }

    // Default: try changed, fallback to all
    return 'changed';
  }
}
