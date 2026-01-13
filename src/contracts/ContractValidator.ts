/**
 * Contract Validator for Cerber Core v2.0
 * Validates contracts against JSON schema using Ajv
 * 
 * @package cerber-core
 * @version 2.0.0
 */

import type { ValidateFunction } from 'ajv';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { Contract, ContractValidationResult } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const contractSchema = require('./contract.schema.json');

export class ContractValidator {
  private ajv: InstanceType<typeof Ajv>;
  private validateFn: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true
    });
    
    this.validateFn = this.ajv.compile(contractSchema);
  }

  /**
   * Validate contract against schema
   */
  validate(contract: unknown): ContractValidationResult {
    const valid = this.validateFn(contract);
    
    if (valid) {
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    }

    const errors = this.validateFn.errors?.map((err: any) => {
      const path = err.instancePath || '/';
      const message = err.message || 'Unknown error';
      return `${path}: ${message}`;
    }) || [];

    return {
      valid: false,
      errors,
      warnings: []
    };
  }

  /**
   * Load and validate contract from file
   * @throws Error if file cannot be loaded or validation fails
   */
  async loadContract(filePath: string): Promise<Contract> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    
    let parsed: unknown;
    
    if (ext === '.json') {
      parsed = JSON.parse(content);
    } else if (ext === '.yml' || ext === '.yaml') {
      parsed = yaml.parse(content);
    } else {
      throw new Error(`Unsupported file format: ${ext}. Use .json, .yml, or .yaml`);
    }

    const result = this.validate(parsed);
    
    if (!result.valid) {
      throw new Error(`Contract validation failed:\n${result.errors.join('\n')}`);
    }
    
    return parsed as Contract;
  }

  /**
   * Resolve contract inheritance (extends)
   */
  async resolveContract(contract: Contract, basePath?: string): Promise<Contract> {
    if (!contract.extends) {
      return contract;
    }

    // Detect circular inheritance
    const seen = new Set<string>();
    return this._resolveContractRecursive(contract, basePath, seen);
  }

  private async _resolveContractRecursive(contract: Contract, basePath: string | undefined, seen: Set<string>): Promise<Contract> {
    if (!contract.extends) {
      return contract;
    }

    // Check for circular inheritance
    if (seen.has(contract.extends)) {
      throw new Error(`Circular inheritance detected: ${Array.from(seen).join(' -> ')} -> ${contract.extends}`);
    }
    seen.add(contract.extends);

    // Resolve base contract path
    let baseContractPath: string;
    
    if (contract.extends.startsWith('@cerber-core/')) {
      // Built-in contract
      const contractName = contract.extends.replace('@cerber-core/contracts/', '');
      baseContractPath = path.join(__dirname, 'templates', `${contractName}.yml`);
    } else if (basePath) {
      // Relative path
      baseContractPath = path.resolve(basePath, contract.extends);
    } else {
      throw new Error(`Cannot resolve contract: ${contract.extends} (no base path provided)`);
    }

    // Load base contract
    const baseContract = await this.loadContract(baseContractPath);

    // Recursively resolve base contract's extends
    const resolvedBase = await this._resolveContractRecursive(baseContract, path.dirname(baseContractPath), seen);

    // Merge contracts (child overrides parent)
    return this.mergeContracts(resolvedBase, contract);
  }

  /**
   * Merge two contracts (child overrides parent)
   */
  private mergeContracts(parent: Contract, child: Contract): Contract {
    return {
      ...parent,
      ...child,
      defaults: {
        ...parent.defaults,
        ...child.defaults,
        permissionsPolicy: {
          ...parent.defaults?.permissionsPolicy,
          ...child.defaults?.permissionsPolicy
        },
        nodeVersion: {
          ...parent.defaults?.nodeVersion,
          ...child.defaults?.nodeVersion
        }
      },
      rules: {
        ...parent.rules,
        ...child.rules
      },
      requiredActions: [
        ...(parent.requiredActions || []),
        ...(child.requiredActions || [])
      ],
      requiredSteps: [
        ...(parent.requiredSteps || []),
        ...(child.requiredSteps || [])
      ],
      allowedTriggers: child.allowedTriggers || parent.allowedTriggers,
      metadata: {
        ...parent.metadata,
        ...child.metadata
      }
    };
  }

  /**
   * Validate contract version (for migrations)
   */
  validateVersion(contract: Contract): { supported: boolean; message?: string } {
    if (contract.contractVersion !== 1) {
      return {
        supported: false,
        message: `Unsupported contract version: ${contract.contractVersion}. Current version: 1`
      };
    }

    return { supported: true };
  }
}
