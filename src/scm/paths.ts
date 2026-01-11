/**
 * PathNormalizer - Cross-platform path utilities
 * Ensures consistent path handling across Windows/macOS/Linux
 */

import { minimatch } from 'minimatch';
import * as path from 'path';

export class PathNormalizer {
  /**
   * Normalize path for cross-platform consistency
   * Converts Windows backslashes to forward slashes
   *
   * Examples:
   *   "C:\\Users\\project\\.github\\workflows\\ci.yml" → "C:/Users/project/.github/workflows/ci.yml"
   *   "/home/user/.github/workflows/ci.yml" → "/home/user/.github/workflows/ci.yml" (unchanged)
   *
   * @param filePath - File path to normalize
   * @returns Normalized path with forward slashes
   */
  static normalize(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Make absolute path relative to cwd and normalize it
   *
   * Examples:
   *   makeRelative("C:\\project\\.github\\ci.yml", "C:\\project")
   *   → ".github/ci.yml"
   *
   * @param filePath - Absolute or relative file path
   * @param cwd - Current working directory (base path)
   * @returns Normalized relative path
   */
  static makeRelative(filePath: string, cwd: string): string {
    const relative = path.relative(cwd, filePath);
    return this.normalize(relative);
  }

  /**
   * Filter files by glob patterns using minimatch
   *
   * Examples:
   *   matchGlobs(
   *     [".github/workflows/ci.yml", "src/index.ts", "README.md"],
   *     [".github/**\/*.yml", "src/**\/*.ts"]
   *   )
   *   → [".github/workflows/ci.yml", "src/index.ts"]
   *
   * @param files - Array of file paths
   * @param globs - Array of glob patterns to match
   * @returns Filtered array of files matching at least one glob
   */
  static matchGlobs(files: string[], globs: string[]): string[] {
    if (globs.length === 0) {
      return files;
    }

    return files.filter((file) => {
      return globs.some((glob) => minimatch(file, glob, { dot: true }));
    });
  }

  /**
   * Normalize array of paths
   *
   * @param filePaths - Array of file paths
   * @returns Array of normalized paths
   */
  static normalizeArray(filePaths: string[]): string[] {
    return filePaths.map((fp) => this.normalize(fp));
  }

  /**
   * Remove leading ./ or .\\ from paths
   *
   * Examples:
   *   removeLeadingDot("./src/index.ts") → "src/index.ts"
   *   removeLead ingDot(".\\\\src\\\\index.ts") → "src/index.ts"
   *
   * @param filePath - File path
   * @returns Path without leading ./
   */
  static removeLeadingDot(filePath: string): string {
    const normalized = this.normalize(filePath);
    return normalized.replace(/^\.\//, '');
  }

  /**
   * Join paths with forward slashes
   *
   * Examples:
   *   join("src", "utils", "helpers.ts") → "src/utils/helpers.ts"
   *   join(".", ".github", "workflows") → ".github/workflows"
   *
   * @param paths - Path segments
   * @returns Joined normalized path
   */
  static join(...paths: string[]): string {
    return this.normalize(path.join(...paths));
  }

  /**
   * Get relative path from one location to another
   *
   * @param from - Starting path
   * @param to - Target path
   * @returns Normalized relative path
   */
  static relative(from: string, to: string): string {
    return this.normalize(path.relative(from, to));
  }

  /**
   * Check if path is absolute
   *
   * @param filePath - File path
   * @returns true if path is absolute
   */
  static isAbsolute(filePath: string): boolean {
    return path.isAbsolute(filePath);
  }

  /**
   * Get directory name from path
   *
   * @param filePath - File path
   * @returns Directory name
   */
  static dirname(filePath: string): string {
    return this.normalize(path.dirname(filePath));
  }

  /**
   * Get file name from path
   *
   * @param filePath - File path
   * @returns File name
   */
  static basename(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * Get file extension
   *
   * @param filePath - File path
   * @returns File extension (including dot)
   */
  static extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Deduplicate paths, maintaining order
   *
   * @param filePaths - Array of file paths (may contain duplicates)
   * @returns Array of unique paths in original order
   */
  static deduplicate(filePaths: string[]): string[] {
    const seen = new Set<string>();
    return filePaths.filter((fp) => {
      if (seen.has(fp)) {
        return false;
      }
      seen.add(fp);
      return true;
    });
  }

  /**
   * Sort paths lexicographically
   *
   * @param filePaths - Array of file paths
   * @returns Sorted array
   */
  static sort(filePaths: string[]): string[] {
    return [...filePaths].sort();
  }
}
