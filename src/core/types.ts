/**
 * @file Orchestrator types - SOLID Single Responsibility
 * @rule Per AGENTS.md §0 - ONE TRUTH: Orchestrator coordinates adapters
 */

import type { Violation } from '../types.js';

/**
 * Orchestrator run options
 */
export interface OrchestratorRunOptions {
  /** Files to check (relative paths from repo root) */
  files: string[];
  
  /** Working directory (repo root) */
  cwd: string;
  
  /** Adapters to run (e.g., ['actionlint', 'zizmor']) */
  adapters?: string[];
  
  /** Run adapters in parallel (default: true) */
  parallel?: boolean;
  
  /** Timeout per adapter in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Orchestrator run result
 * @rule Per AGENTS.md §3 - Deterministic output
 */
export interface OrchestratorResult {
  /** Contract version */
  contractVersion: number;
  
  /** Is output deterministic? */
  deterministic: boolean;
  
  /** Summary statistics */
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  
  /** All violations from all adapters (sorted) */
  violations: Violation[];
  
  /** Metadata about tool execution */
  metadata: {
    tools: {
      [toolName: string]: {
        version: string;
        exitCode: number;
        skipped?: boolean;
        reason?: string;
      };
    };
  };
  
  /** Optional runtime metadata (not part of deterministic core) */
  runMetadata?: {
    executionTime: number;
    adaptersRun: string[];
    generatedAt?: string;
  };
}

/**
 * Adapter registry entry
 */
export interface AdapterRegistryEntry {
  name: string;
  displayName: string;
  enabled: boolean;
  factory: () => any; // Returns Adapter instance
}
