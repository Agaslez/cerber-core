/**
 * CERBER_CONTRACT parser
 * 
 * Extracts and validates YAML contract from CERBER.md
 * 
 * @author Stefan Pitek
 * @license MIT
 */

import fs from 'fs/promises';
import path from 'path';
import { CerberContract, ContractParseResult } from './types.js';

const YAML_START_MARKER = '## CERBER_CONTRACT';
const YAML_CODE_BLOCK_START = '```yaml';
const YAML_CODE_BLOCK_END = '```';

export async function parseCerberContract(projectRoot: string): Promise<ContractParseResult> {
  const cerberPath = path.join(projectRoot, 'CERBER.md');
  
  try {
    const content = await fs.readFile(cerberPath, 'utf-8');
    return extractContract(content);
  } catch (err) {
    // CERBER.md doesn't exist
    return { success: false, error: { message: 'CERBER.md not found' } };
  }
}

export function extractContract(content: string): ContractParseResult {
  const lines = content.split('\n');
  
  // Find CERBER_CONTRACT section
  const contractStartIndex = lines.findIndex(line => line.trim() === YAML_START_MARKER);
  if (contractStartIndex === -1) {
    return {
      success: false,
      error: {
        message: `Missing "${YAML_START_MARKER}" section header`,
        context: 'Expected format:\n\n## CERBER_CONTRACT\n\`\`\`yaml\n...\n\`\`\`'
      }
    };
  }
  
  // Find yaml code block
  let yamlStartIndex = -1;
  let yamlEndIndex = -1;
  
  for (let i = contractStartIndex; i < lines.length; i++) {
    if (lines[i].trim().startsWith(YAML_CODE_BLOCK_START)) {
      yamlStartIndex = i + 1;
    } else if (yamlStartIndex !== -1 && lines[i].trim() === YAML_CODE_BLOCK_END) {
      yamlEndIndex = i;
      break;
    }
  }
  
  if (yamlStartIndex === -1) {
    return {
      success: false,
      error: {
        message: 'Missing YAML code block after CERBER_CONTRACT header',
        line: contractStartIndex + 1,
        context: `Expected \`\`\`yaml after line ${contractStartIndex + 1}`
      }
    };
  }
  
  if (yamlEndIndex === -1) {
    return {
      success: false,
      error: {
        message: 'Unclosed YAML code block',
        line: yamlStartIndex,
        context: 'Missing closing \`\`\` for YAML block'
      }
    };
  }
  
  const yamlContent = lines.slice(yamlStartIndex, yamlEndIndex).join('\n');
  
  // Simple YAML parser (for our specific structure)
  try {
    const contract = parseSimpleYaml(yamlContent);
    
    // Validate required fields
    const validation = validateContract(contract);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          message: 'Invalid contract structure',
          context: validation.errors.join('\n')
        }
      };
    }
    
    return { success: true, contract };
  } catch (err: any) {
    return {
      success: false,
      error: {
        message: 'Failed to parse YAML contract',
        context: err.message || 'Invalid YAML structure'
      }
    };
  }
}

function parseSimpleYaml(yamlContent: string): CerberContract {
  const lines = yamlContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  
  const contract: any = {
    version: 1,
    mode: 'dev',
    guardian: {},
    health: {},
    ci: {},
    team: {}
  };
  
  let currentSection: string | null = null;
  let currentSubsection: string | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;
    
    if (indent === 0 && trimmed.endsWith(':')) {
      // Top-level key
      const key = trimmed.slice(0, -1);
      currentSection = key;
      currentSubsection = null;
    } else if (indent === 2 && trimmed.endsWith(':')) {
      // Second-level key
      const key = trimmed.slice(0, -1);
      currentSubsection = key;
      if (currentSection && !contract[currentSection][key]) {
        contract[currentSection][key] = {};
      }
    } else if (trimmed.includes(':')) {
      // Key-value pair
      const [key, ...valueParts] = trimmed.split(':');
      let value: any = valueParts.join(':').trim();
      
      // Strip inline comments (# after value)
      const commentIndex = value.indexOf('#');
      if (commentIndex !== -1) {
        value = value.substring(0, commentIndex).trim();
      }
      
      // Parse value type
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value))) value = Number(value);
      else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((v: string) => {
          const trimmed = v.trim();
          // Strip quotes from array values
          if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
              (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
            return trimmed.slice(1, -1);
          }
          return trimmed;
        });
      }
      
      if (currentSubsection && currentSection) {
        contract[currentSection][currentSubsection][key.trim()] = value;
      } else if (currentSection) {
        contract[currentSection][key.trim()] = value;
      } else {
        contract[key.trim()] = value;
      }
    }
  }
  
  return contract as CerberContract;
}

function validateContract(contract: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check guardian section
  if (!contract.guardian) {
    errors.push('Missing "guardian" section');
  } else {
    if (typeof contract.guardian.enabled !== 'boolean') {
      errors.push('guardian.enabled must be true or false');
    }
    if (contract.guardian.enabled && !contract.guardian.schemaFile) {
      errors.push('guardian.schemaFile is required when guardian is enabled');
    }
  }
  
  // Check health section
  if (!contract.health) {
    errors.push('Missing "health" section');
  } else {
    if (typeof contract.health.enabled !== 'boolean') {
      errors.push('health.enabled must be true or false');
    }
    if (contract.health.enabled && !contract.health.endpoint) {
      errors.push('health.endpoint is required when health is enabled');
    }
  }
  
  // Check ci section
  if (!contract.ci) {
    errors.push('Missing "ci" section');
  } else {
    if (!contract.ci.provider) {
      errors.push('ci.provider is required (e.g., "github")');
    }
    if (!contract.ci.postDeploy) {
      contract.ci.postDeploy = { enabled: false };
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function getDefaultContract(mode: 'solo' | 'dev' | 'team' = 'dev'): CerberContract {
  return {
    version: 1,
    mode,
    guardian: {
      enabled: true,
      schemaFile: 'BACKEND_SCHEMA.ts',
      hook: 'husky',
      approvalsTag: 'ARCHITECT_APPROVED'
    },
    health: {
      enabled: mode !== 'solo',
      endpoint: '/api/health',
      failOn: {
        critical: true,
        error: true,
        warning: false
      }
    },
    ci: {
      provider: 'github',
      branches: ['main'],
      requiredOnPR: true,
      postDeploy: {
        enabled: mode === 'team',
        waitSeconds: 90,
        healthUrlVar: 'CERBER_HEALTH_URL',
        authHeaderSecret: 'CERBER_HEALTH_AUTH_HEADER'
      }
    }
  };
}
