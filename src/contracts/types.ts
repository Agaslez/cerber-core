/**
 * Contract Types for Cerber Core v2.0
 * 
 * @package cerber-core
 * @version 2.0.0
 */

export interface Contract {
  contractVersion: 1;
  name: string;
  version: string;
  extends?: string;
  defaults?: ContractDefaults;
  rules?: RuleConfig;
  requiredActions?: RequiredAction[];
  requiredSteps?: RequiredStep[];
  allowedTriggers?: string[];
  metadata?: ContractMetadata;
}

export interface ContractDefaults {
  permissionsPolicy?: {
    maxLevel?: 'read' | 'write' | 'none';
    allowedScopes?: string[];
  };
  actionPinning?: 'required' | 'recommended' | 'optional';
  secretsPolicy?: 'no-hardcoded' | 'allowed-with-approval';
  nodeVersion?: {
    required?: boolean;
    minVersion?: string;
  };
}

export interface RuleConfig {
  [ruleId: string]: 'error' | 'warning' | 'info' | 'off';
}

export interface RequiredAction {
  action: string;
  minVersion?: string;
  allowedVersions?: string[];
}

export interface RequiredStep {
  name: string;
  command?: string;
}

export interface ContractMetadata {
  description?: string;
  author?: string;
  repository?: string;
  tags?: string[];
}

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
