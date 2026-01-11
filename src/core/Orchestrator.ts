/**
 * @file Orchestrator - SOLID Single Responsibility
 * @rule Per AGENTS.md §0 - ONE TRUTH: Orchestrator coordinates, doesn't implement
 * @rule Per AGENTS.md §3 - Deterministic output (sorted, stable)
 * @rule Per AGENTS.md §6 - Graceful degradation
 * @rule Per PRODUCTION HARDENING - P0: Full observability
 * @rule Per REFACTOR-3 - DIP: Orchestrator → AdapterExecutionStrategy abstraction
 */

import crypto from 'crypto';
import { ActionlintAdapter } from '../adapters/actionlint/ActionlintAdapter.js';
import type { Adapter, AdapterResult } from '../adapters/types.js';
import { ZizmorAdapter } from '../adapters/zizmor/ZizmorAdapter.js';
import type { Violation } from '../types.js';
import { createChildLogger, generateRequestId } from './logger.js';
import { metrics } from './metrics.js';
import { sanitizePathArray, validateAdapterName, validateProfileName } from './security.js';
import type { AdapterExecutionStrategy } from './strategies/adapter-execution-strategy.js';
import { LegacyExecutionStrategy } from './strategies/legacy-execution-strategy.js';
import { ResilientExecutionStrategy } from './strategies/resilient-execution-strategy.js';
import type {
    AdapterRegistryEntry,
    OrchestratorResult,
    OrchestratorRunOptions,
} from './types.js';
import { validateOrchestratorOptions } from './validation.js';

/**
 * Orchestrator - coordinates multiple adapters
 * @rule Per AGENTS.md §0 - Dyrygent, nie orkiestra
 * @rule Per REFACTOR-3 - Uses Strategy Pattern for DIP compliance
 */
export class Orchestrator {
  private adapters: Map<string, AdapterRegistryEntry>;
  private adapterCache: Map<string, Adapter>;
  private strategy: AdapterExecutionStrategy;

  /**
   * Constructor with Dependency Injection
   * @param strategy - Execution strategy (default: LegacyExecutionStrategy for backward compatibility)
   * @rule Per REFACTOR-3 - DIP: Inject strategy to eliminate tight coupling
   */
  constructor(strategy?: AdapterExecutionStrategy) {
    this.adapters = new Map();
    this.adapterCache = new Map();
    // Default: LegacyExecutionStrategy (backward compatible)
    this.strategy = strategy ?? new LegacyExecutionStrategy();
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
   * Get registered adapter (cached)
   * @rule Cache instances to prevent re-creation overhead
   */
  getAdapter(name: string): Adapter | null {
    const entry = this.adapters.get(name);
    if (!entry || !entry.enabled) {
      return null;
    }

    // Return cached instance if available
    if (this.adapterCache.has(name)) {
      metrics.cacheHits.inc({ adapter: name });
      return this.adapterCache.get(name)!;
    }

    // Create and cache new instance
    metrics.cacheMisses.inc({ adapter: name });
    const adapter = entry.factory();
    this.adapterCache.set(name, adapter);
    metrics.cacheSize.set(this.adapterCache.size);
    return adapter;
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
   * @rule Per PRODUCTION HARDENING - P0: Full observability
   */
  async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
    const runId = generateRequestId();
    const log = createChildLogger({ 
      operation: 'orchestrator.run', 
      runId,
      profile: options.profile 
    });
    
    // PRODUCTION HARDENING - P1: Input validation
    try {
      validateOrchestratorOptions(options);
      
      // Sanitize file paths
      options.files = sanitizePathArray(options.files);
      
      // Validate profile name if provided
      if (options.profile) {
        validateProfileName(options.profile);
      }
      
      // Validate adapter names if provided
      if (options.tools) {
        for (const tool of options.tools) {
          validateAdapterName(tool);
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error({ error: errorMsg }, 'Input validation failed');
      metrics.orchestratorRuns.inc({ 
        profile: options.profile || 'default',
        status: 'error'
      });
      throw new Error(`Input validation failed: ${errorMsg}`);
    }
    
    const startTime = Date.now();
    const timer = metrics.orchestratorDuration.startTimer({ 
      profile: options.profile || 'default' 
    });

    // Determine which adapters to run (support both 'tools' and 'adapters')
    const adapterNames =
      options.tools && options.tools.length > 0
        ? options.tools
        : this.listAdapters();
    
    log.info({
      tools: adapterNames,
      filesCount: options.files.length,
      parallel: options.parallel ?? true,
      timeout: options.timeout
    }, 'Starting orchestration');

    // Get adapter instances
    const adapters = adapterNames
      .map((name) => ({ name, adapter: this.getAdapter(name) }))
      .filter((entry) => entry.adapter !== null) as Array<{
      name: string;
      adapter: Adapter;
    }>;

    if (adapters.length === 0) {
      return this.createEmptyResult(startTime, options.profile);
    }

    // Run adapters (parallel or sequential)
    const results = options.parallel ?? true
      ? await this.runParallel(adapters, options)
      : await this.runSequential(adapters, options);

    // Merge results
    const result = this.mergeResults(results, adapters.map((a) => a.name), startTime, options.profile);
    
    // Log completion & record metrics
    const duration = Date.now() - startTime;
    timer();
    
    metrics.orchestratorRuns.inc({ 
      profile: options.profile || 'default', 
      status: 'success' 
    });
    
    metrics.filesProcessed.inc(
      { profile: options.profile || 'default' },
      options.files.length
    );
    
    log.info({
      violations: result.violations.length,
      errors: result.summary.errors,
      warnings: result.summary.warnings,
      duration,
      toolsRun: adapters.length
    }, 'Orchestration complete');
    
    return result;
  }

  /**
   * Run adapters in parallel
   * @rule Per AGENTS.md §6 - Graceful: one adapter fails → others continue
   * @rule Per PRODUCTION HARDENING - P2: Resilience delegated to strategy
   * @rule Per REFACTOR-3 - DIP: Delegate to AdapterExecutionStrategy
   */
  private async runParallel(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    // Check if resilience is enabled → use ResilientExecutionStrategy
    if (options.resilience) {
      const resilientStrategy = new ResilientExecutionStrategy();
      return resilientStrategy.executeParallel(adapters, options);
    }
    
    // Delegate to injected strategy
    return this.strategy.executeParallel(adapters, options);
  }

  /**
   * Run adapters sequentially
   * @rule Per PRODUCTION HARDENING - P2: Sequential execution via strategy
   * @rule Per REFACTOR-3 - DIP: Delegate to AdapterExecutionStrategy
   */
  private async runSequential(
    adapters: Array<{ name: string; adapter: Adapter }>,
    options: OrchestratorRunOptions
  ): Promise<AdapterResult[]> {
    // Check if resilience is enabled → use ResilientExecutionStrategy
    if (options.resilience) {
      const resilientStrategy = new ResilientExecutionStrategy();
      return resilientStrategy.executeSequential(adapters, options);
    }
    
    // Delegate to injected strategy
    return this.strategy.executeSequential(adapters, options);
  }

  /**
   * Merge adapter results into unified output
   * @rule Per AGENTS.md §3 - Deterministic: sorted violations, stable metadata
   */
  private mergeResults(
    results: AdapterResult[],
    adapterNames: string[],
    startTime: number,
    profile?: string
  ): OrchestratorResult {
    // Collect all violations
    const allViolations: Violation[] = [];
    for (const result of results) {
      allViolations.push(...result.violations);
    }

    // Deduplicate violations
    const uniqueViolations = this.deduplicate(allViolations);

    // Sort violations deterministically
    const sortedViolations = this.sortViolations(uniqueViolations);

    // Build metadata (array format per new schema)
    const tools = results.map(result => ({
      name: result.tool,
      version: result.version,
      exitCode: result.exitCode,
      skipped: result.skipped,
      reason: result.skipReason,
    }));

    // Calculate summary
    const summary = this.calculateSummary(sortedViolations);

    return {
      schemaVersion: 1,
      contractVersion: 1,
      deterministic: true,
      summary,
      violations: sortedViolations,
      metadata: { tools },
      runMetadata: {
        generatedAt: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        profile,
      },
    };
  }

  /**
   * Deduplicate violations
   * @rule Deduplication key: source|id|path|line|column|hash(message)
   * @rule Safety: limit Set size to prevent OOM (max 50k violations)
   */
  private deduplicate(violations: Violation[]): Violation[] {
    const MAX_DEDUP_SIZE = 50000; // ~3MB for Set
    const seen = new Set<string>();
    const unique: Violation[] = [];
    const totalViolations = violations.length;

    for (const violation of violations) {
      const key = this.getDedupeKey(violation);
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(violation);

        // Safety: if we hit limit, stop deduplication and log warning
        if (seen.size >= MAX_DEDUP_SIZE) {
          const log = createChildLogger({ operation: 'orchestrator.deduplicate' });
          log.warn(`Deduplication limit reached (${MAX_DEDUP_SIZE}). Some duplicates may remain.`);
          break;
        }
      }
    }
    
    // Record deduplication efficiency
    if (totalViolations > 0) {
      const dedupedCount = totalViolations - unique.length;
      const dedupRate = (dedupedCount / totalViolations) * 100;
      metrics.deduplicationRate.observe(dedupRate);
    }

    return unique;
  }

  /**
   * Get deduplication key for violation
   * @rule 32-char hash reduces collision probability to negligible levels
   */
  private getDedupeKey(violation: Violation): string {
    try {
      const messageHash = crypto
        .createHash('sha256')
        .update(violation.message)
        .digest('hex')
        .substring(0, 32); // 32 chars = 2^128 space

      return [
        violation.source,
        violation.id,
        violation.path || '',
        violation.line || 0,
        violation.column || 0,
        messageHash,
      ].join('|');
    } catch (error) {
      // Fallback: if hashing fails, use full message (rare edge case)
      return [
        violation.source,
        violation.id,
        violation.path || '',
        violation.line || 0,
        violation.column || 0,
        violation.message.substring(0, 32),
      ].join('|');
    }
  }

  /**
   * Sort violations deterministically
   * @rule Per AGENTS.md §3 - severity → path → line → column → id → source
   */
  private sortViolations(violations: Violation[]): Violation[] {
    const severityOrder = { error: 0, warning: 1, info: 2 };

    return [...violations].sort((a, b) => {
      // Sort by severity first
      if (a.severity !== b.severity) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }

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
  private createEmptyResult(startTime: number, profile?: string): OrchestratorResult {
    return {
      schemaVersion: 1,
      contractVersion: 1,
      deterministic: true,
      summary: { total: 0, errors: 0, warnings: 0, info: 0 },
      violations: [],
      metadata: { tools: [] },
      runMetadata: {
        generatedAt: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        profile,
      },
    };
  }
}
