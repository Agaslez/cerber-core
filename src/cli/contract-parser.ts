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
import { CerberContract } from './types.js';

const YAML_START_MARKER = '## CERBER_CONTRACT';
const YAML_CODE_BLOCK_START = '```yaml';
const YAML_CODE_BLOCK_END = '```';

export async function parseCerberContract(projectRoot: string): Promise<CerberContract | null> {
  const cerberPath = path.join(projectRoot, 'CERBER.md');
  
  try {
    const content = await fs.readFile(cerberPath, 'utf-8');
    return extractContract(content);
  } catch (err) {
    // CERBER.md doesn't exist
    return null;
  }
}

export function extractContract(content: string): CerberContract | null {
  const lines = content.split('\n');
  
  // Find CERBER_CONTRACT section
  const contractStartIndex = lines.findIndex(line => line.trim() === YAML_START_MARKER);
  if (contractStartIndex === -1) {
    return null;
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
  
  if (yamlStartIndex === -1 || yamlEndIndex === -1) {
    return null;
  }
  
  const yamlContent = lines.slice(yamlStartIndex, yamlEndIndex).join('\n');
  
  // Simple YAML parser (for our specific structure)
  return parseSimpleYaml(yamlContent);
}

function parseSimpleYaml(yamlContent: string): CerberContract {
  const lines = yamlContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  
  const contract: any = {
    version: 1,
    mode: 'dev',
    guardian: {},
    health: {},
    ci: {}
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
      
      // Parse value type
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value))) value = Number(value);
      else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((v: string) => v.trim());
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
