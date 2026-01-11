/**
 * Contract Types
 * Synchronized with `.cerber/contract.schema.json`
 * ONE TRUTH: contract.yml defines validation profiles and tool configuration
 */

/**
 * Tool Configuration
 * Per-tool settings: versioning, flags, behavior
 */
export interface ToolConfig {
  enabled?: boolean;
  version?: string;
  autoInstall?: boolean;
  args?: string[];
}

/**
 * Rule Configuration
 * Per-rule overrides: severity, gating behavior
 */
export interface RuleConfig {
  severity?: 'error' | 'warning' | 'info';
  gate?: boolean;
  source?: 'actionlint' | 'zizmor' | 'gitleaks' | 'ratchet' | 'cerber-semantic';
}

/**
 * Validation Profile
 * Defines which tools to enable and which severity levels cause failure
 */
export interface Profile {
  /**
   * Array of tool names to enable
   * Examples: ['actionlint'], ['actionlint', 'zizmor'], ['actionlint', 'zizmor', 'gitleaks']
   */
  tools: string[];

  /**
   * Severity levels that cause CI failure
   * 'error' - Always fails
   * 'warning' - Fails if in this array
   * 'info' - Fails if in this array
   * Example: ['error'] or ['error', 'warning']
   */
  failOn: ('error' | 'warning' | 'info')[];

  /**
   * Max execution time per tool (milliseconds)
   * Default: 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Continue validation if tool crashes
   * Default: false (fail fast on tool error)
   */
  continueOnError?: boolean;

  /**
   * Enforce deterministic output for team profiles
   * Default: false
   */
  requireDeterministicOutput?: boolean;
}

/**
 * Target Definition
 * What to scan: github-actions, gitlab-ci, docker, terraform, etc.
 */
export interface Target {
  id: 'github-actions' | 'gitlab-ci' | 'generic-yaml';
  globs?: string[];
}

/**
 * Cerber Contract
 * Root configuration for validation rules, profiles, and tool behavior
 * Loaded from `cerber.yml` or `.cerber/contract.yml`
 */
export interface Contract {
  /**
   * Contract format version (current: 1)
   * Increment on breaking changes
   */
  contractVersion: 1;

  /**
   * Project name (optional)
   * Used in reports and logs
   */
  name?: string;

  /**
   * Contract description (optional)
   * Used in reports
   */
  description?: string;

  /**
   * Base template to extend
   * Examples: 'nodejs-base', 'python-base', 'react-base'
   * Provides sensible defaults for language/framework ecosystem
   */
  extends?: string;

  /**
   * Default profile to use when --profile not specified
   * Falls back to 'solo' if not set
   */
  activeProfile?: 'solo' | 'dev' | 'team';

  /**
   * Target definitions (what to scan)
   * Default: ['github-actions'] if not specified
   * Can include multiple targets for CI/CD tools
   */
  targets?: Target[];

  /**
   * Tool configuration (per-tool settings)
   * Maps tool name to ToolConfig
   * Examples:
   * ```
   * tools:
   *   actionlint:
   *     enabled: true
   *     version: "1.6.27"
   *   zizmor:
   *     enabled: true
   *     args: [--fix]
   * ```
   */
  tools?: Record<string, ToolConfig>;

  /**
   * Rule configuration (per-rule overrides)
   * Maps rule ID to RuleConfig
   * Examples:
   * ```
   * rules:
   *   'actionlint/deprecated-commands':
   *     severity: warning
   *   'zizmor/insecure-runner':
   *     gate: false
   * ```
   */
  rules?: Record<string, RuleConfig>;

  /**
   * Validation Profiles
   * Define which tools run and which severity levels cause failure
   * At minimum, must include 'solo' profile
   * Profiles support business model: solo < dev < team in strictness
   */
  profiles: {
    /**
     * Solo Profile (default, minimal checks)
     * Single-developer project, catching obvious errors
     * Typically: actionlint only, failOn: [error]
     */
    solo: Profile;

    /**
     * Dev Profile (optional, medium checks)
     * Development team, more comprehensive scanning
     * Typically: actionlint + zizmor, failOn: [error, warning]
     */
    dev?: Profile;

    /**
     * Team Profile (optional, strictest checks)
     * Large team, strict enforcement with determinism
     * Typically: actionlint + zizmor + gitleaks, failOn: [error, warning]
     * Enforces: deterministic output, full snapshot comparison
     */
    team?: Profile;
  };
}

/**
 * Contract Resolution Result
 * After loading contract.yml and resolving extends/defaults
 */
export interface ResolvedContract extends Contract {
  profiles: {
    solo: Profile;
    dev: Profile;
    team: Profile;
  };
}

/**
 * Type guard: Check if object is a valid Contract
 */
export function isContract(obj: unknown): obj is Contract {
  if (typeof obj !== 'object' || obj === null) return false;
  const contract = obj as Record<string, unknown>;
  return (
    contract.contractVersion === 1 &&
    typeof contract.profiles === 'object' &&
    contract.profiles !== null &&
    'solo' in contract.profiles
  );
}

/**
 * Type guard: Check if profile name is valid
 */
export function isProfileName(value: unknown): value is 'solo' | 'dev' | 'team' {
  return value === 'solo' || value === 'dev' || value === 'team';
}

/**
 * Type guard: Check if severity is valid
 */
export function isSeverity(value: unknown): value is 'error' | 'warning' | 'info' {
  return value === 'error' || value === 'warning' || value === 'info';
}
