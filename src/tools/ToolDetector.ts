/**
 * @file Tool Detection - COMMIT 3
 * @description Cross-platform tool detection without which/where
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface ToolInfo {
  name: string;
  version: string;
  available: boolean;
  error?: string;
}

/**
 * Tool Detector - cross-platform detection without which/where
 * 
 * Strategy:
 * 1. Try to run tool with --version flag
 * 2. Parse version from stdout/stderr
 * 3. Return { name, version, available }
 * 
 * @rule Per ROADMAP COMMIT 3 - NO which/where dependency
 */
export class ToolDetector {
  /**
   * Detect if tool is available and get its version
   * 
   * @param toolName Tool name (e.g., 'actionlint', 'zizmor', 'gitleaks')
   * @returns Tool information
   */
  async detect(toolName: string): Promise<ToolInfo> {
    try {
      // Try --version first (most common)
      const result = await this.tryVersion(toolName, ['--version']);
      
      if (result.available) {
        return result;
      }
      
      // Try -v as fallback
      return await this.tryVersion(toolName, ['-v']);
    } catch (error) {
      return {
        name: toolName,
        version: 'unknown',
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Try to run tool with version flag
   * 
   * @param toolName Tool name
   * @param args Arguments (e.g., ['--version'])
   * @returns Tool information
   */
  private async tryVersion(toolName: string, args: string[]): Promise<ToolInfo> {
    try {
      // Cross-platform: just try to execute the tool
      // If it's in PATH, it will work on all platforms
      const { stdout, stderr } = await execFileAsync(toolName, args, {
        timeout: 5000, // 5s timeout
        windowsHide: true, // Hide console window on Windows
      });
      
      // Parse version from output (stdout or stderr)
      const output = stdout || stderr;
      const version = this.parseVersion(output);
      
      return {
        name: toolName,
        version,
        available: true,
      };
    } catch (error) {
      // Tool not found or execution failed
      const isError = error instanceof Error;
      const code = isError ? (error as NodeJS.ErrnoException).code : undefined;
      const message = isError ? error.message : String(error);
      
      const isNotFound = code === 'ENOENT' || message.includes('ENOENT');
      
      return {
        name: toolName,
        version: 'unknown',
        available: false,
        error: isNotFound ? 'Tool not found in PATH' : message,
      };
    }
  }

  /**
   * Parse version from tool output
   * 
   * Supports multiple formats:
   * - "actionlint 1.6.27"
   * - "v1.6.27"
   * - "1.6.27"
   * - "zizmor version 0.1.0"
   * - "gitleaks version v8.18.0"
   * 
   * @param output Tool output
   * @returns Parsed version or 'unknown'
   */
  parseVersion(output: string): string {
    if (!output) {
      return 'unknown';
    }

    // Remove ANSI color codes
    // eslint-disable-next-line no-control-regex
    const clean = output.replace(/\x1b\[[0-9;]*m/g, '');

    // Try different version patterns
    const patterns = [
      // "actionlint 1.6.27" or "actionlint v1.6.27"
      /(?:actionlint|zizmor|gitleaks)\s+v?(\d+\.\d+\.\d+)/i,
      
      // "version 1.6.27" or "version: 1.6.27"
      /version[:\s]+v?(\d+\.\d+\.\d+)/i,
      
      // "v1.6.27" or "1.6.27" (standalone)
      /\bv?(\d+\.\d+\.\d+)\b/,
      
      // "1.6" (two-part version)
      /\bv?(\d+\.\d+)\b/,
    ];

    for (const pattern of patterns) {
      const match = clean.match(pattern);
      if (match) {
        return match[1]; // Return captured version
      }
    }

    return 'unknown';
  }

  /**
   * Detect multiple tools in parallel
   * 
   * @param toolNames Array of tool names
   * @returns Array of tool information
   */
  async detectAll(toolNames: string[]): Promise<ToolInfo[]> {
    const promises = toolNames.map(name => this.detect(name));
    return Promise.all(promises);
  }

  /**
   * Get available tools only
   * 
   * @param toolNames Array of tool names
   * @returns Array of available tool information
   */
  async getAvailable(toolNames: string[]): Promise<ToolInfo[]> {
    const all = await this.detectAll(toolNames);
    return all.filter(tool => tool.available);
  }

  /**
   * Get missing tools
   * 
   * @param toolNames Array of tool names
   * @returns Array of missing tool names
   */
  async getMissing(toolNames: string[]): Promise<string[]> {
    const all = await this.detectAll(toolNames);
    return all.filter(tool => !tool.available).map(tool => tool.name);
  }
}
