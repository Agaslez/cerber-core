/**
 * Tool Detection Adapter
 * Cross-platform detection of CLI tools (actionlint, zizmor, gitleaks, etc.)
 * Supports: Windows (PowerShell, cmd), macOS (bash), Linux (bash)
 */

import { execSync } from 'child_process';
import { platform } from 'os';

export interface ToolDetectionResult {
  name: string;
  installed: boolean;
  version?: string;
  path?: string;
  error?: string;
}

export interface ToolInfo {
  name: string;
  command: string;
  versionFlag: string;
  versionRegex: RegExp;
  minVersion?: string;
}

/**
 * Tool metadata for detection
 */
const TOOL_REGISTRY: Record<string, ToolInfo> = {
  actionlint: {
    name: 'actionlint',
    command: 'actionlint',
    versionFlag: '-version',
    versionRegex: /version\s+(\d+\.\d+\.\d+)/i
  },
  zizmor: {
    name: 'zizmor',
    command: 'zizmor',
    versionFlag: '--version',
    versionRegex: /(\d+\.\d+\.\d+)/
  },
  gitleaks: {
    name: 'gitleaks',
    command: 'gitleaks',
    versionFlag: 'version',
    versionRegex: /gitleaks\s+version\s+v(\d+\.\d+\.\d+)/i
  },
  node: {
    name: 'node',
    command: 'node',
    versionFlag: '--version',
    versionRegex: /v(\d+\.\d+\.\d+)/
  },
  npm: {
    name: 'npm',
    command: 'npm',
    versionFlag: '--version',
    versionRegex: /(\d+\.\d+\.\d+)/
  },
  git: {
    name: 'git',
    command: 'git',
    versionFlag: '--version',
    versionRegex: /git\s+version\s+(\d+\.\d+\.\d+)/i
  }
};

/**
 * Detect if running on Windows
 */
function isWindows(): boolean {
  return platform() === 'win32';
}

/**
 * Get command prefix based on platform
 */
function getCommandPrefix(): string {
  return isWindows() ? '' : '';
}

/**
 * Execute command and capture output
 * Handles platform-specific execution (PowerShell vs bash)
 */
function executeCommand(command: string, args: string[] = []): string {
  let fullCommand: string;

    if (isWindows()) {
      // Windows: use cmd with quoted command
      fullCommand = `cmd /c "${command}" ${args.join(' ')}`;
    } else {
      // Unix: use shell directly
      fullCommand = `${command} ${args.join(' ')}`;
    }

    const output = execSync(fullCommand, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'] as any,
      shell: '/bin/sh',
      timeout: 5000
    }).trim();

    return output;
}

/**
 * Find command in PATH
 * Cross-platform: Windows (cmd /c where), Unix (which)
 */
function findInPath(command: string): string | null {
  try {
    const findCmd = isWindows() ? `where ${command}` : `which ${command}`;
    const shell = isWindows() ? 'cmd' : '/bin/sh';
    const result = execSync(findCmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell,
      timeout: 5000
    })
      .trim()
      .split('\n')[0];
    return result || null;
  } catch {
    return null;
  }
}

/**
 * Extract version from output using regex
 */
function extractVersion(output: string, regex: RegExp): string | undefined {
  const match = output.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Detect single tool
 */
export function detectTool(toolName: string): ToolDetectionResult {
  const toolInfo = TOOL_REGISTRY[toolName.toLowerCase()];

  if (!toolInfo) {
    return {
      name: toolName,
      installed: false,
      error: `Tool "${toolName}" not in registry`
    };
  }

  try {
    // Check if command exists in PATH
    const toolPath = findInPath(toolInfo.command);

    if (!toolPath) {
      return {
        name: toolInfo.name,
        installed: false,
        error: `Command "${toolInfo.command}" not found in PATH`
      };
    }

    // Try to get version
    let version: string | undefined;
    try {
      const versionOutput = executeCommand(toolInfo.command, [toolInfo.versionFlag]);
      version = extractVersion(versionOutput, toolInfo.versionRegex);
    } catch (versionError) {
      // Version detection failed, but tool is installed
      version = undefined;
    }

    return {
      name: toolInfo.name,
      installed: true,
      version,
      path: toolPath
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      name: toolInfo.name,
      installed: false,
      error: errorMsg
    };
  }
}

/**
 * Detect multiple tools in parallel
 */
export async function detectToolsAsync(
  toolNames: string[]
): Promise<ToolDetectionResult[]> {
  return Promise.all(toolNames.map(name => Promise.resolve(detectTool(name))));
}

/**
 * Detect multiple tools synchronously
 */
export function detectTools(toolNames: string[]): ToolDetectionResult[] {
  return toolNames.map(name => detectTool(name));
}

/**
 * Verify tool meets minimum version requirement
 */
export function meetsVersionRequirement(
  detected: ToolDetectionResult,
  minVersion: string
): boolean {
  if (!detected.installed || !detected.version) {
    return false;
  }

  return compareVersions(detected.version, minVersion) >= 0;
}

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Get system information for diagnostics
 */
export function getSystemInfo(): {
  platform: string;
  nodeVersion: string;
  npmVersion: string;
} {
  const nodeDetection = detectTool('node');
  const npmDetection = detectTool('npm');

  return {
    platform: `${platform()} (${isWindows() ? 'PowerShell' : 'Bash'})`,
    nodeVersion: nodeDetection.version || 'unknown',
    npmVersion: npmDetection.version || 'unknown'
  };
}

/**
 * Register custom tool for detection
 */
export function registerCustomTool(toolInfo: ToolInfo): void {
  TOOL_REGISTRY[toolInfo.name.toLowerCase()] = toolInfo;
}

/**
 * Get all registered tools
 */
export function getRegisteredTools(): string[] {
  return Object.keys(TOOL_REGISTRY);
}

export default {
  detectTool,
  detectTools,
  detectToolsAsync,
  meetsVersionRequirement,
  getSystemInfo,
  registerCustomTool,
  getRegisteredTools
};
