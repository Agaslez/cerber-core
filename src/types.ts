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
