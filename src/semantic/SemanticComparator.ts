/**
 * Semantic Comparator - Advanced Workflow Comparison
 * Replaces simple string diff with 3-level semantic analysis
 * 
 * @package cerber-core
 * @version 2.0.0
 */

export interface WorkflowAST {
  name?: string;
  on?: Record<string, unknown>;
  jobs?: Record<string, Job>;
  permissions?: Permissions;
  env?: Record<string, string>;
}

export interface Job {
  name?: string;
  'runs-on'?: string | string[];
  steps?: Step[];
  needs?: string | string[];
  if?: string;
  strategy?: Strategy;
  permissions?: Permissions;
  env?: Record<string, string>;
}

export interface Step {
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
  if?: string;
  id?: string;
}

export interface Strategy {
  matrix?: Record<string, unknown>;
  'fail-fast'?: boolean;
  'max-parallel'?: number;
}

export interface Permissions {
  [key: string]: 'read' | 'write' | 'none';
}

export interface ContractAST {
  name?: string;
  version?: string;
  description?: string;
  rules?: Record<string, 'error' | 'warning' | 'info' | 'off'>;
  requiredActions?: string[];
  forbiddenActions?: string[];
  requiredSteps?: string[];
  permissionsPolicy?: PermissionsPolicy;
  triggerPolicy?: TriggerPolicy;
}

export interface PermissionsPolicy {
  maxLevel?: 'read' | 'write' | 'none';
  allowedScopes?: string[];
  forbiddenScopes?: string[];
}

export interface TriggerPolicy {
  allowedEvents?: string[];
  forbiddenEvents?: string[];
  requireProtectedBranches?: boolean;
}

export type ViolationSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface Violation {
  level: 'structure' | 'semantic' | 'rule';
  severity: ViolationSeverity;
  message: string;
  location?: string;
  suggestion?: string;
  fix?: Fix;
}

export interface Fix {
  type: 'replace' | 'add' | 'remove' | 'reorder';
  location: string;
  before?: string;
  after?: string;
  patch?: string; // The actual fix content
  description?: string; // Human-readable description
  confidence: number; // 0-100
}

export interface ComparisonResult {
  valid: boolean;
  violations: Violation[];
  structureViolations: Violation[];
  semanticViolations: Violation[];
  ruleViolations: Violation[];
  summary: {
    critical: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * SemanticComparator - 3-level workflow validation
 * 
 * Level 1: Structure validation (required keys, valid YAML)
 * Level 2: Semantic validation (action versions, permissions)
 * Level 3: Custom rules validation (user-defined contract)
 */
export class SemanticComparator {
  constructor(private contract?: ContractAST) {}

  /**
   * Main comparison method
   */
  async compare(workflow: WorkflowAST): Promise<ComparisonResult> {
    const structureViolations = this.validateStructure(workflow);
    const semanticViolations = this.validateSemantics(workflow);
    const ruleViolations = this.contract ? this.validateRules(workflow, this.contract) : [];

    const allViolations = [
      ...structureViolations,
      ...semanticViolations,
      ...ruleViolations
    ];

    const summary = this.calculateSummary(allViolations);

    return {
      valid: summary.critical === 0 && summary.errors === 0,
      violations: allViolations,
      structureViolations,
      semanticViolations,
      ruleViolations,
      summary
    };
  }

  /**
   * Level 1: Structure Validation
   * Validates required keys, proper nesting, valid YAML structure
   */
  private validateStructure(workflow: WorkflowAST): Violation[] {
    const violations: Violation[] = [];

    // Check required top-level keys
    if (!workflow.on) {
      violations.push({
        level: 'structure',
        severity: 'error',
        message: 'Missing required key: "on" (workflow triggers)',
        location: 'root',
        suggestion: 'Add "on:" field with trigger events (e.g., on: [push, pull_request])'
      });
    }

    if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
      violations.push({
        level: 'structure',
        severity: 'error',
        message: 'Missing required key: "jobs" or jobs is empty',
        location: 'root',
        suggestion: 'Add at least one job definition'
      });
    }

    // Validate jobs structure
    if (workflow.jobs) {
      for (const [jobId, job] of Object.entries(workflow.jobs)) {
        if (!job['runs-on']) {
          violations.push({
            level: 'structure',
            severity: 'error',
            message: `Job "${jobId}" missing required key: "runs-on"`,
            location: `jobs.${jobId}`,
            suggestion: 'Add "runs-on: ubuntu-latest" or appropriate runner'
          });
        }

        if (!job.steps || job.steps.length === 0) {
          violations.push({
            level: 'structure',
            severity: 'warning',
            message: `Job "${jobId}" has no steps defined`,
            location: `jobs.${jobId}`,
            suggestion: 'Add at least one step'
          });
        }

        // Validate steps
        if (job.steps) {
          job.steps.forEach((step, index) => {
            if (!step.uses && !step.run) {
              violations.push({
                level: 'structure',
                severity: 'error',
                message: `Step ${index + 1} in job "${jobId}" must have either "uses" or "run"`,
                location: `jobs.${jobId}.steps[${index}]`,
                suggestion: 'Add "uses: actions/checkout@v4" or "run: echo hello"'
              });
            }
          });
        }
      }
    }

    return violations;
  }

  /**
   * Level 2: Semantic Validation
   * Validates action versions, permissions scope, trigger logic
   */
  private validateSemantics(workflow: WorkflowAST): Violation[] {
    const violations: Violation[] = [];

    // Check permissions
    if (workflow.permissions) {
      const unsafePermissions = this.checkPermissions(workflow.permissions, 'workflow');
      violations.push(...unsafePermissions);
    }

    // Check jobs
    if (workflow.jobs) {
      for (const [jobId, job] of Object.entries(workflow.jobs)) {
        
        // Check job permissions
        if (job.permissions) {
          const unsafePermissions = this.checkPermissions(job.permissions, `jobs.${jobId}`);
          violations.push(...unsafePermissions);
        }

        // Check actions in steps
        if (job.steps) {
          job.steps.forEach((step, index) => {
            if (step.uses) {
              const actionViolations = this.validateAction(step.uses, `jobs.${jobId}.steps[${index}]`);
              violations.push(...actionViolations);
            }

            // Check for secrets in env
            if (step.env) {
              const secretViolations = this.checkForHardcodedSecrets(step.env, `jobs.${jobId}.steps[${index}].env`);
              violations.push(...secretViolations);
            }
          });
        }
      }
    }

    // Check triggers
    if (workflow.on) {
      const triggerViolations = this.validateTriggers(workflow.on);
      violations.push(...triggerViolations);
    }

    return violations;
  }

  /**
   * Level 3: Custom Rules Validation
   * Validates against user-defined contract rules
   */
  private validateRules(workflow: WorkflowAST, contract: ContractAST): Violation[] {
    const violations: Violation[] = [];

    // Check required actions
    if (contract.requiredActions) {
      const usedActions = this.extractUsedActions(workflow);
      for (const requiredAction of contract.requiredActions) {
        if (!usedActions.some(used => used.startsWith(requiredAction))) {
          violations.push({
            level: 'rule',
            severity: 'error',
            message: `Required action missing: ${requiredAction}`,
            location: 'workflow',
            suggestion: `Add a step using: ${requiredAction}`
          });
        }
      }
    }

    // Check forbidden actions
    if (contract.forbiddenActions) {
      const usedActions = this.extractUsedActions(workflow);
      for (const forbiddenAction of contract.forbiddenActions) {
        const foundViolations = usedActions.filter(used => used.startsWith(forbiddenAction));
        if (foundViolations.length > 0) {
          violations.push({
            level: 'rule',
            severity: 'error',
            message: `Forbidden action used: ${forbiddenAction}`,
            location: 'workflow',
            suggestion: `Remove or replace this action`
          });
        }
      }
    }

    // Check permissions policy
    if (contract.permissionsPolicy && workflow.permissions) {
      const policyViolations = this.validatePermissionsPolicy(
        workflow.permissions,
        contract.permissionsPolicy
      );
      violations.push(...policyViolations);
    }

    return violations;
  }

  /**
   * Helper: Check permissions for overly broad access
   */
  private checkPermissions(permissions: Permissions, location: string): Violation[] {
    const violations: Violation[] = [];

    for (const [scope, level] of Object.entries(permissions)) {
      if (level === 'write' && scope === 'all') {
        violations.push({
          level: 'semantic',
          severity: 'critical',
          message: `Overly broad permissions: write-all at ${location}`,
          location,
          suggestion: 'Restrict to specific scopes (e.g., contents: write, pull-requests: read)',
          fix: {
            type: 'replace',
            location,
            before: 'write-all',
            after: 'contents: write\n  pull-requests: read',
            confidence: 80
          }
        });
      }
    }

    return violations;
  }

  /**
   * Helper: Validate action format and version
   */
  private validateAction(action: string, location: string): Violation[] {
    const violations: Violation[] = [];

    // Check if action has version pinning
    const hasVersion = action.includes('@');
    
    if (!hasVersion) {
      // No version at all
      violations.push({
        level: 'semantic',
        severity: 'error',
        message: `Action "${action}" is not pinned to any version`,
        location,
        suggestion: 'Pin to version (e.g., actions/checkout@v4)',
        fix: {
          type: 'replace',
          location,
          before: action,
          after: `${action}@v4`,
          confidence: 60
        }
      });
    } else {
      // Has version - check if it's full version or just major
      const [actionPath, version] = action.split('@');
      if (version.startsWith('v') && !version.includes('.')) {
        // Only major version like @v4
        violations.push({
          level: 'semantic',
          severity: 'warning',
          message: `Action "${action}" pinned to major version only`,
          location,
          suggestion: 'Pin to full version (e.g., @v4.1.0)',
          fix: {
            type: 'replace',
            location,
            before: action,
            after: `${actionPath}@v4.1.0`,
            confidence: 60
          }
        });
      }
    }

    return violations;
  }

  /**
   * Helper: Check for hardcoded secrets
   */
  private checkForHardcodedSecrets(env: Record<string, string>, location: string): Violation[] {
    const violations: Violation[] = [];
    const secretPatterns = [
      /^(sk|pk)_(test|live|fake)_[a-zA-Z0-9]{20,}/,  // Stripe keys (including test/fake)
      /^ghp_[a-zA-Z0-9]{36,}/,                        // GitHub tokens
      /^AKIA[0-9A-Z]{16}/,                       // AWS access keys
    ];

    for (const [key, value] of Object.entries(env)) {
      for (const pattern of secretPatterns) {
        if (pattern.test(value)) {
          violations.push({
            level: 'semantic',
            severity: 'critical',
            message: `Hardcoded secret detected in ${key}`,
            location,
            suggestion: `Replace with: \${{ secrets.${key} }}`,
            fix: {
              type: 'replace',
              location: `${location}.${key}`,
              before: value,
              after: `\${{ secrets.${key} }}`,
              confidence: 95
            }
          });
        }
      }
    }

    return violations;
  }

  /**
   * Helper: Validate workflow triggers
   */
  private validateTriggers(triggers: Record<string, unknown>): Violation[] {
    const violations: Violation[] = [];

    // Warn about wildcard triggers
    if (triggers['*'] || (Array.isArray(triggers) && triggers.includes('*'))) {
      violations.push({
        level: 'semantic',
        severity: 'warning',
        message: 'Wildcard trigger detected - this may cause excessive workflow runs',
        location: 'on',
        suggestion: 'Specify explicit events (e.g., [push, pull_request])'
      });
    }

    return violations;
  }

  /**
   * Helper: Extract all used actions from workflow
   */
  private extractUsedActions(workflow: WorkflowAST): string[] {
    const actions: string[] = [];

    if (workflow.jobs) {
      for (const job of Object.values(workflow.jobs)) {
        if (job.steps) {
          for (const step of job.steps) {
            if (step.uses) {
              actions.push(step.uses);
            }
          }
        }
      }
    }

    return actions;
  }

  /**
   * Helper: Validate permissions against policy
   */
  private validatePermissionsPolicy(
    permissions: Permissions,
    policy: PermissionsPolicy
  ): Violation[] {
    const violations: Violation[] = [];

    for (const [scope, level] of Object.entries(permissions)) {
      // Check max level
      if (policy.maxLevel && this.comparePermissionLevel(level, policy.maxLevel) > 0) {
        violations.push({
          level: 'rule',
          severity: 'error',
          message: `Permission "${scope}: ${level}" exceeds policy max level "${policy.maxLevel}"`,
          location: 'permissions',
          suggestion: `Change to "${scope}: ${policy.maxLevel}"`
        });
      }

      // Check forbidden scopes
      if (policy.forbiddenScopes?.includes(scope)) {
        violations.push({
          level: 'rule',
          severity: 'error',
          message: `Forbidden permission scope: ${scope}`,
          location: 'permissions',
          suggestion: 'Remove this permission'
        });
      }
    }

    return violations;
  }

  /**
   * Helper: Compare permission levels
   */
  private comparePermissionLevel(a: string, b: string): number {
    const levels = { 'none': 0, 'read': 1, 'write': 2 };
    return (levels[a as keyof typeof levels] || 0) - (levels[b as keyof typeof levels] || 0);
  }

  /**
   * Helper: Calculate summary statistics
   */
  private calculateSummary(violations: Violation[]) {
    return {
      critical: violations.filter(v => v.severity === 'critical').length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length,
    };
  }
}
