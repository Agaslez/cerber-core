import { execSync } from 'child_process';

export interface GuardianOptions {
  staged?: boolean;
  debug?: boolean;
  profile?: 'dev-fast' | 'normal';
}

export interface GuardianResult {
  exitCode: number;
  duration: number;
  toolsRan: string[];
  output?: string;
}

/**
 * Get list of staged files in git repo
 */
export async function getStagedFiles(cwd: string): Promise<string[]> {
  try {
    const output = execSync('git diff --cached --name-only', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return output
      .trim()
      .split('\n')
      .filter(line => line.length > 0);
  } catch {
    return [];
  }
}

/**
 * Filter files to relevant ones for CI checks
 * Relevant: .github/workflows/* and .cerber/*
 */
function filterRelevantFiles(files: string[]): string[] {
  return files.filter(file => 
    file.startsWith('.github/workflows/') || 
    file.startsWith('.cerber/')
  );
}

/**
 * Run guardian checks on staged files
 */
export async function runGuardian(
  cwd: string = process.cwd(),
  options: GuardianOptions = {}
): Promise<GuardianResult> {
  const startTime = Date.now();
  const toolsRan: string[] = [];
  let exitCode = 0;
  let output = '';

  // Get staged files if --staged flag
  let files: string[] = [];
  if (options.staged) {
    files = await getStagedFiles(cwd);
    
    // If no relevant files changed, exit immediately with success
    const relevantFiles = filterRelevantFiles(files);
    if (relevantFiles.length === 0) {
      const duration = Date.now() - startTime;
      if (options.debug) {
        output = `[Guardian] No relevant files changed. Exit in ${duration}ms`;
        console.log(output);
      }
      return {
        exitCode: 0,
        duration,
        toolsRan: [],
        output
      };
    }

    // Run checks on relevant files
    files = relevantFiles;
  }

  // Run actionlint on workflow files
  const workflowFiles = files.filter(f => f.startsWith('.github/workflows/'));
  if (workflowFiles.length > 0) {
    try {
      execSync(`actionlint ${workflowFiles.join(' ')}`, {
        cwd,
        stdio: 'pipe'
      });
      toolsRan.push('actionlint');
      if (options.debug) {
        console.log(`[Guardian] actionlint: OK`);
      }
    } catch (e: any) {
      // actionlint found issues
      toolsRan.push('actionlint');
      if (options.debug) {
        console.log(`[Guardian] actionlint: VIOLATIONS`);
      }
      exitCode = 1;
      output = e.toString();
    }
  }

  // In dev-fast mode, skip zizmor and gitleaks
  if (options.profile !== 'dev-fast') {
    // Could add zizmor/gitleaks checks here
    // For now, just actionlint for workflows
  }

  const duration = Date.now() - startTime;

  if (options.debug) {
    console.log(`[Guardian] Completed in ${duration}ms. Exit code: ${exitCode}`);
  }

  return {
    exitCode,
    duration,
    toolsRan,
    output: output || undefined
  };
}

/**
 * Print guardian output
 */
export function printGuardianReport(result: GuardianResult, options?: GuardianOptions): void {
  if (!options?.debug) {
    // Minimal output
    if (result.exitCode !== 0) {
      if (result.output) {
        console.log(result.output);
      }
    }
  } else {
    // Debug output with timing
    console.log(`[Guardian Report]`);
    console.log(`Exit Code: ${result.exitCode}`);
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Tools Ran: ${result.toolsRan.join(', ') || 'none'}`);
    if (result.output) {
      console.log(`Output: ${result.output}`);
    }
  }
}
