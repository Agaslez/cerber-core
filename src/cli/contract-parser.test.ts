/**
 * Contract Parser Tests
 * 
 * @author Stefan Pitek
 * @license MIT
 */

import { describe, expect, it } from '@jest/globals';
import { extractContract, getDefaultContract } from '../src/cli/contract-parser';

describe('Contract Parser', () => {
  describe('extractContract', () => {
    it('should parse valid CERBER_CONTRACT', () => {
      const markdown = `# CERBER.md

## CERBER_CONTRACT
\`\`\`yaml
version: 1
mode: dev

guardian:
  enabled: true
  schemaFile: BACKEND_SCHEMA.ts
  hook: husky
  approvalsTag: ARCHITECT_APPROVED

health:
  enabled: true
  endpoint: /api/health
  failOn:
    critical: true
    error: true
    warning: false

ci:
  provider: github
  branches: [main]
  requiredOnPR: true
  postDeploy:
    enabled: true
    waitSeconds: 90
    healthUrlVar: CERBER_HEALTH_URL
\`\`\`

Rest of the document...
`;

      const result = extractContract(markdown);
      
      expect(result).toBeTruthy();
      expect(result?.version).toBe(1);
      expect(result?.mode).toBe('dev');
      expect(result?.guardian.enabled).toBe(true);
      expect(result?.guardian.schemaFile).toBe('BACKEND_SCHEMA.ts');
      expect(result?.health.enabled).toBe(true);
      expect(result?.health.endpoint).toBe('/api/health');
      expect(result?.ci.provider).toBe('github');
      expect(result?.ci.branches).toEqual(['main']);
    });

    it('should return null when CERBER_CONTRACT section is missing', () => {
      const markdown = `# CERBER.md

Some content without contract
`;

      const result = extractContract(markdown);
      expect(result).toBeNull();
    });

    it('should return null when yaml block is missing', () => {
      const markdown = `# CERBER.md

## CERBER_CONTRACT

No yaml block here
`;

      const result = extractContract(markdown);
      expect(result).toBeNull();
    });

    it('should handle solo mode contract', () => {
      const markdown = `## CERBER_CONTRACT
\`\`\`yaml
version: 1
mode: solo

guardian:
  enabled: true
  schemaFile: SCHEMA.ts
  hook: manual
  approvalsTag: APPROVED

health:
  enabled: false
  endpoint: /health
  failOn:
    critical: true
    error: false
    warning: false

ci:
  provider: github
  branches: [main]
  requiredOnPR: false
  postDeploy:
    enabled: false
    waitSeconds: 60
    healthUrlVar: HEALTH_URL
\`\`\`
`;

      const result = extractContract(markdown);
      
      expect(result?.mode).toBe('solo');
      expect(result?.guardian.hook).toBe('manual');
      expect(result?.health.enabled).toBe(false);
      expect(result?.ci.postDeploy.enabled).toBe(false);
    });

    it('should handle team mode contract', () => {
      const markdown = `## CERBER_CONTRACT
\`\`\`yaml
version: 1
mode: team

guardian:
  enabled: true
  schemaFile: SCHEMA.ts
  hook: husky
  approvalsTag: APPROVED

health:
  enabled: true
  endpoint: /api/health
  failOn:
    critical: true
    error: true
    warning: true

ci:
  provider: github
  branches: [main, develop]
  requiredOnPR: true
  postDeploy:
    enabled: true
    waitSeconds: 120
    healthUrlVar: HEALTH_URL
    authHeaderSecret: AUTH_SECRET
\`\`\`
`;

      const result = extractContract(markdown);
      
      expect(result?.mode).toBe('team');
      expect(result?.ci.branches).toEqual(['main', 'develop']);
      expect(result?.health.failOn.warning).toBe(true);
      expect(result?.ci.postDeploy.enabled).toBe(true);
    });
  });

  describe('getDefaultContract', () => {
    it('should return default dev contract', () => {
      const contract = getDefaultContract('dev');
      
      expect(contract.version).toBe(1);
      expect(contract.mode).toBe('dev');
      expect(contract.guardian.enabled).toBe(true);
      expect(contract.health.enabled).toBe(true);
      expect(contract.ci.postDeploy.enabled).toBe(false);
    });

    it('should return default solo contract', () => {
      const contract = getDefaultContract('solo');
      
      expect(contract.mode).toBe('solo');
      expect(contract.health.enabled).toBe(false);
      expect(contract.ci.postDeploy.enabled).toBe(false);
    });

    it('should return default team contract', () => {
      const contract = getDefaultContract('team');
      
      expect(contract.mode).toBe('team');
      expect(contract.health.enabled).toBe(true);
      expect(contract.ci.postDeploy.enabled).toBe(true);
    });
  });
});
