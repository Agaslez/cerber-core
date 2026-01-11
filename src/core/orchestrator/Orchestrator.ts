/**
 * Orchestrator
 * Minimal E2E orchestration: load contract → resolve profile → detect tools → execute → aggregate
 */

import * as fs from 'fs';
import * as YAML from 'js-yaml';
import * as path from 'path';
import { detectTools } from './adapters/ToolDetection';
import { Contract, Profile, isContract } from './contract/types';
import { CerberOutput, Violation } from './reporting/violation';

export interface OrchestratorOptions {
  contractPath?: string;
  profile?: 'solo' | 'dev' | 'team';
  workingDir?: string;
  timeout?: number;
  continueOnError?: boolean;
}

export interface OrchestratorResult {
  success: boolean;
  contract: Contract;
  profile: Profile;
  detectedTools: string[];
  violations: Violation[];
  output: CerberOutput;
  duration: number;
}

/**
 * Orchestrator - Minimal E2E implementation
 * Handles contract loading, profile resolution, tool detection, and basic execution flow
 */
export class Orchestrator {
  private contract: Contract | null = null;
  private cwd: string;
  private options: Required<OrchestratorOptions>;

  constructor(options: OrchestratorOptions = {}) {
    this.cwd = options.workingDir || process.cwd();
    this.options = {
      contractPath: options.contractPath || path.join(this.cwd, '.cerber', 'contract.yml'),
      profile: options.profile || 'solo',
      workingDir: this.cwd,
      timeout: options.timeout || 30000,
      continueOnError: options.continueOnError ?? false
    };
  }

  /**
   * Load contract from YAML file
   */
  loadContract(): Contract {
    if (this.contract) {
      return this.contract;
    }

    const contractPath = path.resolve(this.options.contractPath);

    if (!fs.existsSync(contractPath)) {
      throw new Error(
        `Contract not found: ${contractPath}. Create .cerber/contract.yml or specify contractPath.`
      );
    }

    try {
      const content = fs.readFileSync(contractPath, 'utf-8');
      const parsed = YAML.load(content);

      if (!isContract(parsed)) {
        throw new Error('Invalid contract format');
      }

      this.contract = parsed;
      return parsed;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load contract: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Resolve the active profile to use
   */
  resolveProfile(contract: Contract): Profile {
    const profileName = this.options.profile;
    const profile = contract.profiles[profileName];

    if (!profile) {
      throw new Error(
        `Profile "${profileName}" not found in contract. Available: ${Object.keys(contract.profiles).join(', ')}`
      );
    }

    return profile;
  }

  /**
   * Get tools enabled for the active profile
   */
  getEnabledTools(profile: Profile): string[] {
    return profile.tools || [];
  }

  /**
   * Detect which enabled tools are installed
   */
  async detectInstalledTools(toolNames: string[]): Promise<string[]> {
    const detections = await Promise.all(
      toolNames.map(name =>
        Promise.resolve({
          name,
          installed: this.isToolInstalled(name)
        })
      )
    );

    return detections.filter(d => d.installed).map(d => d.name);
  }

  /**
   * Check if a tool is installed (simplified - uses PATH detection)
   */
  private isToolInstalled(toolName: string): boolean {
    try {
      const results = detectTools([toolName]);
      return results[0]?.installed ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Execute orchestration: load contract → resolve profile → detect tools → prepare for execution
   * Returns orchestration context ready for tool execution
   */
  async orchestrate(): Promise<OrchestratorResult> {
    const startTime = Date.now();

    try {
      // Step 1: Load contract
      const contract = this.loadContract();

      // Step 2: Resolve active profile
      const profile = this.resolveProfile(contract);

      // Step 3: Get enabled tools
      const enabledTools = this.getEnabledTools(profile);

      // Step 4: Detect installed tools
      const detectedTools = await this.detectInstalledTools(enabledTools);

      // Step 5: Create output structure (empty violations for now - execution comes next)
      const output: CerberOutput = {
        schemaVersion: 1,
        deterministic: true,
        summary: {
          total: 0,
          errors: 0,
          warnings: 0,
          info: 0
        },
        violations: [],
        metadata: {
          profile: this.options.profile,
          target: contract.extends || 'generic',
          tools: this.buildToolsMetadata(contract, detectedTools)
        },
        runMetadata: {
          profile: this.options.profile,
          executionTime: 0,
          cwd: this.cwd,
          generatedAt: new Date().toISOString()
        }
      };

      const duration = Date.now() - startTime;

      return {
        success: true,
        contract,
        profile,
        detectedTools,
        violations: [],
        output,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof Error) {
        return {
          success: false,
          contract: {} as Contract,
          profile: {} as Profile,
          detectedTools: [],
          violations: [],
          output: {
            schemaVersion: 1,
            deterministic: true,
            summary: { total: 0, errors: 0, warnings: 0, info: 0 },
            violations: [],
            metadata: {
              tools: {}
            },
            runMetadata: {
              cwd: this.cwd,
              generatedAt: new Date().toISOString(),
              executionTime: duration
            }
          },
          duration
        };
      }

      throw error;
    }
  }

  /**
   * Build tools metadata for output
   */
  private buildToolsMetadata(
    contract: Contract,
    detectedTools: string[]
  ): Record<string, { enabled: boolean; version?: string; exitCode?: number }> {
    const metadata: Record<string, { enabled: boolean; version?: string }> = {};

    for (const toolName of Object.keys(contract.tools || {})) {
      metadata[toolName] = {
        enabled: detectedTools.includes(toolName),
        version: contract.tools?.[toolName]?.version
      };
    }

    return metadata;
  }

  /**
   * Validate that orchestration succeeded
   */
  static isValidResult(result: OrchestratorResult): boolean {
    return (
      result.success &&
      result.contract &&
      result.profile &&
      Array.isArray(result.detectedTools) &&
      result.output &&
      result.output.schemaVersion === 1
    );
  }

  /**
   * Get contract path
   */
  getContractPath(): string {
    return this.options.contractPath;
  }

  /**
   * Get working directory
   */
  getWorkingDir(): string {
    return this.cwd;
  }

  /**
   * Get configured profile name
   */
  getProfileName(): 'solo' | 'dev' | 'team' {
    return this.options.profile;
  }
}

export default Orchestrator;
