/**
 * Type Definitions for Guardian + Cerber
 */

// ============================================
// GUARDIAN TYPES
// ============================================

export interface GuardianSchema {
  requiredFiles?: string[];
  forbiddenPatterns?: ForbiddenPattern[];
  requiredImports?: Record<string, string[]>;
  packageJsonRules?: PackageJsonRules;
}

export interface ForbiddenPattern {
  pattern: RegExp;
  name: string;
  exceptions?: string[];
  severity?: 'error' | 'warning';
}

export interface PackageJsonRules {
  requiredScripts?: string[];
  requiredDevDependencies?: string[];
  requiredDependencies?: string[];
}

export interface ArchitectApproval {
  file?: string;
  line?: number;
  reason: string;
  date: string;
  architect: string;
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  approvals: ArchitectApproval[];
}

// ============================================
// CERBER TYPES
// ============================================

export interface CerberCheckContext {
  rootDir: string;
  [key: string]: any;
}

export type CerberCheck = (ctx: CerberCheckContext) => Promise<CerberIssue[]>;

export interface CerberIssue {
  code: string;
  component?: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  message: string;
  rootCause?: string;
  fix?: string;
  durationMs?: number;
  details?: Record<string, any>;
}

export interface CerberResult {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  app: {
    version: string;
    env: string;
    uptime: number;
    nodeVersion: string;
  };
  components: Array<{
    id: string;
    name: string;
    severity: string;
    message: string;
    details?: Record<string, any>;
    fix?: string;
  }>;
  summary: {
    totalChecks: number;
    failedChecks: number;
    criticalIssues: number;
    errorIssues: number;
    warningIssues: number;
  };
  durationMs: number;
}

// Legacy compatibility
export type CerberIssueInstance = CerberIssue;

// ============================================
// V2.0 TYPES - Orchestrator & Adapters
// ============================================

/**
 * Violation - unified format from all tools
 * @rule Per AGENTS.md §3 - Deterministic output (sorted)
 */
export interface Violation {
  /** Stable rule ID (e.g., "security/no-hardcoded-secrets") */
  id: string;
  
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
  
  /** Human-readable message */
  message: string;
  
  /** Tool that generated violation (e.g., "actionlint", "zizmor") */
  source: string;
  
  /** File path (relative to repo root) */
  path?: string;
  
  /** Line number (1-indexed) */
  line?: number;
  
  /** Column number (1-indexed) */
  column?: number;
  
  /** Fix suggestion */
  hint?: string;
  
  /** Original tool output (for debugging) */
  toolOutput?: unknown;
}

/**
 * CerberOutput - Deterministic, schema-driven output
 * @rule Per AGENTS.md §1 - ONE TRUTH: output schema defines all possible output structures
 * @rule Per AGENTS.md §3 - Deterministic: same input → byte-identical output
 * @rule Per AGENTS.md §4 - Tests FIRST: all behavior must be tested
 * 
 * KEY PROPERTIES:
 * - schemaVersion: increment on breaking changes (NOT contractVersion - ONE TRUTH)
 * - deterministic: always true (for snapshot testing)
 * - summary: aggregate violation counts
 * - violations: sorted by (path, line, column, id)
 * - metadata.tools: sorted by tool name
 * - runMetadata: NOT part of determinism (timestamp, executionTime, etc.)
 */
export interface CerberOutput {
  /** Output schema version (increment on breaking changes) */
  schemaVersion: number;
  
  /** True if output is deterministic (same input → identical JSON) */
  deterministic: true;
  
  /** Violation summary */
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  
  /** Violations sorted deterministically */
  violations: Violation[];
  
  /** Tool execution metadata */
  metadata: {
    profile?: 'solo' | 'dev' | 'team' | 'custom';
    target?: string;
    tools: Record<string, {
      enabled: boolean;
      version?: string;
      exitCode?: number;
      skipped?: boolean;
      reason?: string;
    }>;
  };
  
  /** Optional runtime metadata (NOT part of determinism) */
  runMetadata?: {
    profile?: string;
    executionTime?: number;
    cwd?: string;
    generatedAt?: string; // ISO 8601 - EXCLUDED from determinism checks
  };
}
