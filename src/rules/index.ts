/**
 * Rule Engine for Cerber Core v2.0
 * Manages and executes validation rules
 * 
 * @package cerber-core
 * @version 2.0.0
 */

import type { Violation, WorkflowAST } from '../semantic/SemanticComparator';

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'best-practices' | 'performance';
  severity: 'critical' | 'error' | 'warning' | 'info';
  enabled: boolean;
  check: (workflow: WorkflowAST) => Promise<Violation[]>;
}

export interface RuleConfig {
  [ruleId: string]: 'error' | 'warning' | 'info' | 'off';
}

export class RuleManager {
  private rules: Map<string, Rule> = new Map();

  constructor() {
    this.loadBuiltInRules();
  }

  private loadBuiltInRules(): void {
    // Security Rules
    this.registerRule(createNoHardcodedSecretsRule());
    this.registerRule(createRequireActionPinningRule());
    this.registerRule(createLimitPermissionsRule());
    this.registerRule(createNoWildcardTriggersRule());
    this.registerRule(createCheckoutPersistCredsRule());

    // Best Practices Rules
    this.registerRule(createCacheDependenciesRule());
    this.registerRule(createSetupNodeVersionRule());
    this.registerRule(createParallelizeMatrixRule());

    // Performance Rules
    this.registerRule(createAvoidUnnecessaryCheckoutRule());
    this.registerRule(createUseCompositeActionsRule());
  }

  registerRule(rule: Rule): void {
    this.rules.set(rule.id, rule);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) rule.enabled = true;
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) rule.enabled = false;
  }

  async runRules(workflow: WorkflowAST, config?: RuleConfig): Promise<Violation[]> {
    const violations: Violation[] = [];

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      const ruleViolations = await rule.check(workflow);
      violations.push(...ruleViolations);
    }

    return violations;
  }

  async runRule(ruleId: string, workflow: WorkflowAST): Promise<Violation[]> {
    const rule = this.rules.get(ruleId);
    if (!rule) return [];

    return await rule.check(workflow);
  }

  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }
}

// ===== SECURITY RULES =====

function createNoHardcodedSecretsRule(): Rule {
  return {
    id: 'security/no-hardcoded-secrets',
    name: 'No Hardcoded Secrets',
    description: 'Detects hardcoded secrets (API keys, tokens, passwords)',
    category: 'security',
    severity: 'critical',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];
      const secretPatterns = [
        { pattern: /sk_(live|test|fake)_[a-zA-Z0-9]{20,}/g, name: 'Stripe API key' },
        { pattern: /ghp_[a-zA-Z0-9]{36,}/g, name: 'GitHub personal token' },
        { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS access key' },
        { pattern: /pk_(live|test)_[a-zA-Z0-9]{20,}/g, name: 'Stripe publishable key' }
      ];

      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (!job.steps) continue;

          job.steps.forEach((step, stepIndex) => {
            if (step.env) {
              for (const [envKey, envValue] of Object.entries(step.env)) {
                if (typeof envValue !== 'string') continue;
                if (envValue.includes('${{')) continue; // Skip GitHub expressions

                for (const { pattern, name } of secretPatterns) {
                  if (pattern.test(envValue)) {
                    violations.push({
                      level: 'semantic',
                      severity: 'critical',
                      message: `Hardcoded secret detected: ${name} in env.${envKey}`,
                      location: `jobs.${jobName}.steps[${stepIndex}].env.${envKey}`,
                      suggestion: `Replace with: \${{ secrets.${envKey} }}`,
                      fix: {
                        type: 'replace',
                        location: `jobs.${jobName}.steps[${stepIndex}].env.${envKey}`,
                        before: envValue,
                        after: `\${{ secrets.${envKey} }}`,
                        confidence: 95
                      }
                    });
                  }
                }
              }
            }
          });
        }
      }

      return violations;
    }
  };
}

function createRequireActionPinningRule(): Rule {
  return {
    id: 'security/require-action-pinning',
    name: 'Require Action Pinning',
    description: 'Ensures actions are pinned to specific versions or commit SHA',
    category: 'security',
    severity: 'error',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (!job.steps) continue;

          job.steps.forEach((step, stepIndex) => {
            if (!step.uses) return;

            const action = step.uses;
            
            // Check if action has version
            if (!action.includes('@')) {
              violations.push({
                level: 'semantic',
                severity: 'error',
                message: `Action "${action}" not pinned to version`,
                location: `jobs.${jobName}.steps[${stepIndex}].uses`,
                suggestion: `Pin to version: ${action}@v4.1.0 or commit SHA`,
                fix: {
                  type: 'replace',
                  location: `jobs.${jobName}.steps[${stepIndex}].uses`,
                  before: action,
                  after: `${action}@v4.1.0`,
                  confidence: 70
                }
              });
            }
            // Check if only major version
            else if (/@v\d+$/.test(action)) {
              violations.push({
                level: 'semantic',
                severity: 'warning',
                message: `Action "${action}" pinned to major version only`,
                location: `jobs.${jobName}.steps[${stepIndex}].uses`,
                suggestion: `Pin to full version: ${action}.1.0 or commit SHA`
              });
            }
          });
        }
      }

      return violations;
    }
  };
}

function createLimitPermissionsRule(): Rule {
  return {
    id: 'security/limit-permissions',
    name: 'Limit Permissions',
    description: 'Enforces principle of least privilege for workflow permissions',
    category: 'security',
    severity: 'error',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.permissions) {
        for (const [scope, level] of Object.entries(workflow.permissions)) {
          if (level === 'write') {
            violations.push({
              level: 'semantic',
              severity: 'warning',
              message: `Overly broad permissions: ${scope}: write`,
              location: `permissions.${scope}`,
              suggestion: `Consider using: ${scope}: read`,
              fix: {
                type: 'replace',
                location: `permissions.${scope}`,
                before: 'write',
                after: 'read',
                confidence: 80
              }
            });
          }
        }
      }

      return violations;
    }
  };
}

function createNoWildcardTriggersRule(): Rule {
  return {
    id: 'security/no-wildcard-triggers',
    name: 'No Wildcard Triggers',
    description: 'Prevents workflows from running on all events using wildcards',
    category: 'security',
    severity: 'warning',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.on) {
        const checkWildcard = (obj: any, path: string) => {
          if (Array.isArray(obj) && obj.includes('*')) {
            violations.push({
              level: 'semantic',
              severity: 'warning',
              message: `Wildcard trigger detected in ${path}`,
              location: path,
              suggestion: `Specify explicit branches/tags instead of wildcards`
            });
          } else if (typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
              checkWildcard(value, `${path}.${key}`);
            }
          }
        };

        checkWildcard(workflow.on, 'on');
      }

      return violations;
    }
  };
}

function createCheckoutPersistCredsRule(): Rule {
  return {
    id: 'security/checkout-without-persist-credentials',
    name: 'Checkout Without Persist Credentials',
    description: 'Ensures checkout action does not persist credentials',
    category: 'security',
    severity: 'warning',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (!job.steps) continue;

          job.steps.forEach((step, stepIndex) => {
            if (step.uses?.includes('actions/checkout')) {
              const persistCreds = step.with?.['persist-credentials'];
              if (persistCreds !== false) {
                violations.push({
                  level: 'rule',
                  severity: 'warning',
                  message: `Checkout step should set persist-credentials: false`,
                  location: `jobs.${jobName}.steps[${stepIndex}]`,
                  suggestion: `Add: with: { persist-credentials: false }`,
                  fix: {
                    type: 'add',
                    location: `jobs.${jobName}.steps[${stepIndex}].with`,
                    after: '{ persist-credentials: false }',
                    confidence: 85
                  }
                });
              }
            }
          });
        }
      }

      return violations;
    }
  };
}

// ===== BEST PRACTICES RULES =====

function createCacheDependenciesRule(): Rule {
  return {
    id: 'best-practices/cache-dependencies',
    name: 'Cache Dependencies',
    description: 'Suggests caching dependencies for faster builds',
    category: 'best-practices',
    severity: 'warning',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (!job.steps) continue;

          const hasSetupNode = job.steps.some(s => s.uses?.includes('actions/setup-node'));
          const hasCache = job.steps.some(s => 
            s.uses?.includes('actions/cache')
          ) || job.steps.some(s => s.with?.['cache']);

          if (hasSetupNode && !hasCache) {
            violations.push({
              level: 'rule',
              severity: 'warning',
              message: `Job "${jobName}" uses setup-node but has no caching`,
              location: `jobs.${jobName}`,
              suggestion: `Add actions/cache@v4 or use cache: 'npm' in setup-node`
            });
          }
        }
      }

      return violations;
    }
  };
}

function createSetupNodeVersionRule(): Rule {
  return {
    id: 'best-practices/setup-node-with-version',
    name: 'Setup Node With Version',
    description: 'Requires explicit Node.js version in setup-node',
    category: 'best-practices',
    severity: 'error',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (!job.steps) continue;

          job.steps.forEach((step, stepIndex) => {
            if (step.uses?.includes('actions/setup-node')) {
              const hasVersion = step.with?.['node-version'] || step.with?.['node-version-file'];
              if (!hasVersion) {
                violations.push({
                  level: 'rule',
                  severity: 'error',
                  message: `setup-node missing explicit node-version`,
                  location: `jobs.${jobName}.steps[${stepIndex}]`,
                  suggestion: `Add: with: { node-version: '20' }`
                });
              }
            }
          });
        }
      }

      return violations;
    }
  };
}

function createParallelizeMatrixRule(): Rule {
  return {
    id: 'best-practices/parallelize-matrix-jobs',
    name: 'Parallelize Matrix Jobs',
    description: 'Suggests using matrix strategy for multiple similar jobs',
    category: 'best-practices',
    severity: 'info',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.jobs) {
        const jobNames = Object.keys(workflow.jobs);
        const similarJobs = jobNames.filter(name => 
          name.match(/-(18|20|22)$/) || name.match(/test-node-/)
        );

        if (similarJobs.length >= 3) {
          violations.push({
            level: 'rule',
            severity: 'info',
            message: `Consider using matrix strategy instead of ${similarJobs.length} separate jobs`,
            location: 'jobs',
            suggestion: `Use strategy: { matrix: { node-version: ['18', '20', '22'] } }`
          });
        }
      }

      return violations;
    }
  };
}

// ===== PERFORMANCE RULES =====

function createAvoidUnnecessaryCheckoutRule(): Rule {
  return {
    id: 'performance/avoid-unnecessary-checkout',
    name: 'Avoid Unnecessary Checkout',
    description: 'Detects multiple checkout steps in same job',
    category: 'performance',
    severity: 'info',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.jobs) {
        for (const [jobName, job] of Object.entries(workflow.jobs)) {
          if (!job.steps) continue;

          const checkoutSteps = job.steps.filter((s, idx) => {
            const isCheckout = s.uses?.includes('actions/checkout');
            const isDifferentRepo = s.with?.['repository'];
            return isCheckout && !isDifferentRepo;
          });

          if (checkoutSteps.length > 1) {
            violations.push({
              level: 'rule',
              severity: 'info',
              message: `Job "${jobName}" has multiple checkout steps`,
              location: `jobs.${jobName}`,
              suggestion: `Reuse single checkout for same repository`
            });
          }
        }
      }

      return violations;
    }
  };
}

function createUseCompositeActionsRule(): Rule {
  return {
    id: 'performance/use-composite-actions',
    name: 'Use Composite Actions',
    description: 'Suggests extracting repeated step patterns to composite actions',
    category: 'performance',
    severity: 'info',
    enabled: true,
    check: async (workflow: WorkflowAST): Promise<Violation[]> => {
      const violations: Violation[] = [];

      if (workflow.jobs) {
        const setupPatterns = new Map<string, number>();

        // Count repeated patterns
        for (const job of Object.values(workflow.jobs)) {
          if (!job.steps) continue;

          const firstSteps = job.steps.slice(0, 3).map(s => s.uses || s.run).join('|');
          setupPatterns.set(firstSteps, (setupPatterns.get(firstSteps) || 0) + 1);
        }

        for (const [, count] of setupPatterns) {
          if (count >= 3) {
            violations.push({
              level: 'rule',
              severity: 'info',
              message: `Repeated step pattern found in ${count} jobs`,
              location: 'jobs',
              suggestion: `Extract to composite action: .github/actions/setup-common`
            });
          }
        }
      }

      return violations;
    }
  };
}
