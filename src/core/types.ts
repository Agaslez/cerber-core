/**
 * @file Orchestrator types - SOLID Single Responsibility
 * @rule Per AGENTS.md §0 - ONE TRUTH: Orchestrator coordinates adapters
 */

import type { Adapter } from '../adapters/types.js';
import type { Violation } from '../types.js';

/**
 * Orchestrator run options
 */
export interface OrchestratorRunOptions {
  /** Files to check (relative paths from repo root) */
  files: string[];
  
  /** Working directory (repo root) */
  cwd: string;
  
  /** Tools to run (e.g., ['actionlint', 'zizmor']) */
  tools?: string[];
  
  /** Profile name (for metadata) */
  profile?: string;
  
  /** Run adapters in parallel (default: true) */
  parallel?: boolean;
  
  /** Timeout per adapter in milliseconds (default: 30000) */
  timeout?: number;
  
  /**
   * Enable resilience features (P2: Resilience)
   * - Circuit breaker: Fail fast for known-failing adapters
   * - Retry: Automatic retry on transient failures
   * - Timeout: Per-adapter timeout enforcement
   * - Partial success: Adapter A fails → B+C continue
   * 
   * @default false (for backward compatibility)
   */
  resilience?: {
    /** Enable circuit breaker (default: true) */
    circuitBreaker?: boolean;
    
    /** Enable retry logic (default: true) */
    retry?: boolean;
    
    /** Enable timeout enforcement (default: true) */
    timeout?: boolean;
    
    /** Circuit breaker failure threshold (default: 5) */
    failureThreshold?: number;
    
    /** Max retry attempts (default: 3) */
    maxRetries?: number;
    
    /** Per-adapter timeout in ms (default: 60000 = 1 min) */
    adapterTimeout?: number;
  };
}

/**
 * Orchestrator run result
 * @rule Per AGENTS.md §3 - Deterministic output
 * @schema .cerber/output.schema.json v1
 */
export interface OrchestratorResult {
  /** Output schema version (current: 1) */
  schemaVersion: 1;
  
  /** Is output deterministic? (always true) */
  deterministic: true;
  
  /** Summary statistics */
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  
  /** All violations from all adapters (deterministically sorted) */
  violations: Violation[];
  
  /** Metadata about tool execution */
  metadata: {
    /** Tools executed (object with tool names as keys) */
    tools: {
      [toolName: string]: {
        enabled: boolean;
        version?: string;
        exitCode?: number;
        skipped?: boolean;
        reason?: string;
      };
    };
  };
  
  /** Optional runtime metadata (NOT part of deterministic core) */
  runMetadata?: {
    generatedAt?: string;  // ISO 8601
    executionTime?: number;  // milliseconds
    profile?: string;  // 'solo' | 'dev' | 'team'
  };
}

/**
 * Adapter registry entry
 */
export interface AdapterRegistryEntry {
  name: string;
  displayName: string;
  enabled: boolean;
  factory: () => Adapter; // Type-safe factory (Adapter imported at top)
}
