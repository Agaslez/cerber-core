/**
 * Cerber - Runtime Health Monitoring
 * Validates system health and blocks deployments on critical issues
 */

import type { CerberCheck, CerberCheckContext, CerberIssue, CerberResult } from './types';

export class Cerber {
  private checks: CerberCheck[];
  private context: CerberCheckContext;

  constructor(checks: CerberCheck[], context?: Partial<CerberCheckContext>) {
    this.checks = checks;
    this.context = {
      rootDir: context?.rootDir || process.cwd(),
      ...context,
    };
  }

  /**
   * Run all health checks
   */
  async runChecks(options?: { parallel?: boolean }): Promise<CerberResult> {
    const startTime = Date.now();
    
    console.log('🐕 Running Cerber health checks...\n');

    let allIssues: CerberIssue[] = [];

    if (options?.parallel) {
      // Parallel execution
      const results = await Promise.allSettled(
        this.checks.map(check => check(this.context))
      );
      
      allIssues = results
        .filter((r): r is PromiseFulfilledResult<CerberIssue[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);
    } else {
      // Sequential execution
      for (const check of this.checks) {
        try {
          const issues = await check(this.context);
          allIssues.push(...issues);
        } catch (err) {
          console.error(`Check failed: ${err.message}`);
        }
      }
    }

    // Calculate summary
    const summary = this.calculateSummary(allIssues);
    const duration = Date.now() - startTime;

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (summary.criticalIssues > 0 || summary.errorIssues > 0) {
      status = 'unhealthy';
    } else if (summary.warningIssues > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const result: CerberResult = {
      timestamp: new Date().toISOString(),
      status,
      app: {
        version: process.env.APP_VERSION || '1.0.0',
        env: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
      components: allIssues.map(issue => ({
        id: issue.code,
        name: issue.component || 'unknown',
        severity: issue.severity,
        message: issue.message,
        details: issue.details,
        fix: issue.fix,
      })),
      summary,
      durationMs: duration,
    };

    this.printResult(result);

    return result;
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(issues: CerberIssue[]) {
    return {
      totalChecks: this.checks.length,
      failedChecks: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      errorIssues: issues.filter(i => i.severity === 'error').length,
      warningIssues: issues.filter(i => i.severity === 'warning').length,
    };
  }

  /**
   * Print result to console
   */
  private printResult(result: CerberResult): void {
    console.log('═══════════════════════════════════════════════════');
    console.log('🐕 CERBER HEALTH CHECK RESULTS');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.durationMs}ms`);
    console.log(`\nSummary:`);
    console.log(`  Total Checks: ${result.summary.totalChecks}`);
    console.log(`  Failed: ${result.summary.failedChecks}`);
    console.log(`  Critical: ${result.summary.criticalIssues}`);
    console.log(`  Errors: ${result.summary.errorIssues}`);
    console.log(`  Warnings: ${result.summary.warningIssues}`);

    if (result.components.length > 0) {
      console.log('\n🔍 Issues Found:');
      result.components.forEach(c => {
        const icon = c.severity === 'critical' ? '🔴' 
                   : c.severity === 'error' ? '❌' 
                   : '⚠️';
        console.log(`\n${icon} [${c.severity.toUpperCase()}] ${c.name}`);
        console.log(`   ${c.message}`);
        if (c.fix) {
          console.log(`   💡 Fix: ${c.fix}`);
        }
      });
    }

    console.log('\n═══════════════════════════════════════════════════\n');
  }
}

/**
 * Helper to create issue object
 */
export function makeIssue(params: {
  code: string;
  component?: string;
  severity: 'critical' | 'error' | 'warning';
  message: string;
  rootCause?: string;
  fix?: string;
  durationMs?: number;
  details?: Record<string, any>;
}): CerberIssue {
  return {
    code: params.code,
    component: params.component,
    severity: params.severity,
    message: params.message,
    rootCause: params.rootCause,
    fix: params.fix,
    durationMs: params.durationMs,
    details: params.details,
  };
}

/**
 * Main function for CLI
 */
export async function runHealthChecks(options: {
  checks: string;
  parallel?: boolean;
  url?: string;
}): Promise<CerberResult> {
  if (options.url) {
    // Fetch from URL
    const response = await fetch(options.url);
    return response.json();
  }

  // Load checks from file
  const checksPath = path.resolve(process.cwd(), options.checks);
  const checksModule = await import(checksPath);
  const checks = Object.values(checksModule).filter(
    (v): v is CerberCheck => typeof v === 'function'
  );

  const cerber = new Cerber(checks);
  return cerber.runChecks({ parallel: options.parallel });
}

export { CerberCheck, CerberCheckContext, CerberIssue, CerberResult };

    import * as path from 'path';

