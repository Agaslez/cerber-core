/**
 * @file Orchestrator - SOLID Single Responsibility
 * @rule Per AGENTS.md §0 - ONE TRUTH: Orchestrator coordinates, doesn't implement
 * @rule Per AGENTS.md §3 - Deterministic output (sorted, stable)
 * @rule Per AGENTS.md §6 - Graceful degradation
 */

import { ActionlintAdapter } from '../adapters/actionlint/ActionlintAdapter.js';
import type { Adapter, AdapterResult } from '../adapters/types.js';
import { ZizmorAdapter } from '../adapters/zizmor/ZizmorAdapter.js';
import type { Violation } from '../types.js';
import type {
    AdapterRegistryEntry,
    OrchestratorResult,
    OrchestratorRunOptions,
} from './types.js';

/**
 * Orchestrator - coordinates multiple adapters
 * @rule Per AGENTS.md §0 - Dyrygent, nie orkiestra
 */
export class Orchestrator {
  private adapters: Map<string, AdapterRegistryEntry>;

  constructor() {
    this.adapters = new Map();
    this.registerDefaultAdapters();
  }

  /**
   * Register default adapters
   * @rule Easily extensible for new adapters
   */
  private registerDefaultAdapters(): void {
    this.register({
      name: 'actionlint',
      displayName: 'actionlint',
      enabled: true,
      factory: () => new ActionlintAdapter(),
    });

    this.register({
      name: 'zizmor',
      displayName: 'zizmor',
      enabled: true,
      factory: () => new ZizmorAdapter(),
    });
  }

  /**
   * Register an adapter
   */
  register(entry: AdapterRegistryEntry): void {
    this.adapters.set(entry.name, entry);
  }

  /**
   * Get registered adapter
   */
  getAdapter(name: string): Adapter | null {
    const entry = this.adapters.get(name);
    if (!entry || !entry.enabled) {
      return null;
    }
    return entry.factory();
  }

  /**
   * List registered adapters
   */
  listAdapters(): string[] {
    return Array.from(this.adapters.values())
      .filter((entry) => entry.enabled)
      .map((entry) => entry.name)
      .sort();
  }

  /**
   * Run adapters and merge results
   * @rule Per AGENTS.md §3 - Deterministic output
   * @rule Per AGENTS.md §6 - Graceful: adapter fails → continue with others
   */
  async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
    const startTime = Date.now();

    // Determine which adapters to run
    const adapterNames =
      options.adapters && options.adapters.length > 0
        ? options.adapters
        : this.listAdapters();

    // Get adapter instances
    const adapters = adapterNames
      .map((name) => ({ name, adapter: this.getAdapter(name) }))
      .filter((entry) => entry.adapter !== null) as Array<{
      name: string;
      adapter: Adapter;
    }>;

    if (adapters.length === 0) {
      return this.createEmptyResult(startTime);
    }

    // Run adapters (parallel or sequential)
    const results = options.parallel ?? true
      ? await this.runParallel(adapters, options)
      : await this.runSequential(adapters, options);

    // Merge results
    return this.mergeResults(results, adapters.map((a) => a.name), startTime);
  }

  /**
   * Run adapters in parallel
   * @rule Per AGENTS.md §6 - Graceful: one adapter fails → others continue
   */
  private async runParallel(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    const promises = adapters.map(async ({ adapter }) => {
      try {
        return await adapter.run({
          files: options.files,
          cwd: options.cwd,
          timeout: options.timeout,
        });
      } catch (error) {
        // Graceful: adapter crashes → create error result
        return {
          tool: adapter.name,
          version: 'unknown',
          exitCode: 3,
          violations: [],
          executionTime: 0,
          skipped: true,
          skipReason: `Adapter crashed: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Run adapters sequentially
   */
  private async runSequential(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    const results: AdapterResult[] = [];

    for (const { adapter } of adapters) {
      try {
        const result = await adapter.run({
          files: options.files,
          cwd: options.cwd,
          timeout: options.timeout,
        });
        results.push(result);
      } catch (error) {
        // Graceful: adapter crashes → create error result, continue
        results.push({
          tool: adapter.name,
          version: 'unknown',
          exitCode: 3,
          violations: [],
          executionTime: 0,
          skipped: true,
          skipReason: `Adapter crashed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }

    return results;
  }

  /**
   * Merge adapter results into unified output
   * @rule Per AGENTS.md §3 - Deterministic: sorted violations, stable metadata
   */
  private mergeResults(
    results: AdapterResult[],
    adapterNames: string[],
    startTime: number
  ): OrchestratorResult {
    // Collect all violations
    const allViolations: Violation[] = [];
    for (const result of results) {
      allViolations.push(...result.violations);
    }

    // Sort violations deterministically
    const sortedViolations = this.sortViolations(allViolations);

    // Build metadata (sorted by tool name for determinism)
    const metadata: OrchestratorResult['metadata'] = {
      tools: {},
    };

    for (const result of results) {
      metadata.tools[result.tool] = {
        version: result.version,
        exitCode: result.exitCode,
        skipped: result.skipped,
        reason: result.skipReason,
      };
    }

    // Sort metadata keys
    const sortedMetadata = Object.keys(metadata.tools)
      .sort()
      .reduce((acc, key) => {
        acc[key] = metadata.tools[key];
        return acc;
      }, {} as typeof metadata.tools);

    // Calculate summary
    const summary = this.calculateSummary(sortedViolations);

    return {
      contractVersion: 1,
      deterministic: true,
      summary,
      violations: sortedViolations,
      metadata: { tools: sortedMetadata },
      runMetadata: {
        executionTime: Date.now() - startTime,
        adaptersRun: adapterNames,
      },
    };
  }

  /**
   * Sort violations deterministically
   * @rule Per AGENTS.md §3 - path → line → column → id → source
   */
  private sortViolations(violations: Violation[]): Violation[] {
    return [...violations].sort((a, b) => {
      // Sort by path
      if (a.path && b.path && a.path !== b.path) {
        return a.path.localeCompare(b.path);
      }

      // Sort by line
      const aLine = a.line ?? Infinity;
      const bLine = b.line ?? Infinity;
      if (aLine !== bLine) {
        return aLine - bLine;
      }

      // Sort by column
      const aColumn = a.column ?? Infinity;
      const bColumn = b.column ?? Infinity;
      if (aColumn !== bColumn) {
        return aColumn - bColumn;
      }

      // Sort by id
      if (a.id !== b.id) {
        return a.id.localeCompare(b.id);
      }

      // Sort by source
      if (a.source !== b.source) {
        return a.source.localeCompare(b.source);
      }

      return 0;
    });
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(violations: Violation[]): OrchestratorResult['summary'] {
    const summary = {
      total: violations.length,
      errors: 0,
      warnings: 0,
      info: 0,
    };

    for (const violation of violations) {
      switch (violation.severity) {
        case 'error':
          summary.errors++;
          break;
        case 'warning':
          summary.warnings++;
          break;
        case 'info':
          summary.info++;
          break;
      }
    }

    return summary;
  }

  /**
   * Create empty result (no adapters to run)
   */
  private createEmptyResult(startTime: number): OrchestratorResult {
    return {
      contractVersion: 1,
      deterministic: true,
      summary: { total: 0, errors: 0, warnings: 0, info: 0 },
      violations: [],
      metadata: { tools: {} },
      runMetadata: {
        executionTime: Date.now() - startTime,
        adaptersRun: [],
      },
    };
  }
}
