/**
 * CLI types for Cerber init command
 * 
 * @author Stefan Pitek
 * @license MIT
 */

export type CerberMode = 'solo' | 'dev' | 'team';

export interface CerberContract {
  version: number;
  mode: CerberMode;
  guardian: GuardianConfig;
  health: HealthConfig;
  ci: CIConfig;
  schema: SchemaConfig;
  team?: TeamConfig;
  override?: OverrideConfig;
}

export interface OverrideConfig {
  enabled: boolean;
  reason?: string;
  expires?: string;  // ISO 8601
  approvedBy?: string;
}

export interface GuardianConfig {
  enabled: boolean;
  schemaFile: string;
  hook: 'husky' | 'manual';
  approvalsTag: string;
}

export interface HealthConfig {
  enabled: boolean;
  endpoint: string;
  failOn: {
    critical: boolean;
    error: boolean;
    warning: boolean;
  };
}

export interface CIConfig {
  provider: 'github' | 'gitlab' | 'manual';
  branches: string[];
  requiredOnPR: boolean;
  postDeploy: {
    enabled: boolean;
    waitSeconds: number;
    healthUrlVar: string;
    authHeaderSecret?: string;
  };
}

export interface TeamConfig {
  schemaOwners?: string[];
  reviewRequired?: boolean;
}

export interface SchemaConfig {
  enabled: boolean;
  file: string;
  mode: 'strict' | 'template_only';
  owners?: string[];
  description?: string;
}

export interface ContractParseResult {
  success: boolean;
  contract?: CerberContract;
  error?: {
    message: string;
    line?: number;
    context?: string;
  };
}

export interface InitOptions {
  mode?: CerberMode;
  force?: boolean;
  dryRun?: boolean;
  printTemplate?: boolean;
  printSchemaTemplate?: boolean;
  noHusky?: boolean;
  noWorkflow?: boolean;
  noHealth?: boolean;
  writeContract?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  generated: boolean;
}
