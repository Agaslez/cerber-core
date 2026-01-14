/**
 * @file Contract Profile Tests - COMMIT 2
 * @description Validates contract profile structure and behavior
 */

import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import { join } from 'path';
import type { Contract, Profile } from '../src/contracts/types.js';

describe('@fast COMMIT 2: Contract Profiles', () => {
  let contract: Contract;

  beforeAll(() => {
    const contractPath = join(process.cwd(), '.cerber', 'contract.yml');
    const yaml = readFileSync(contractPath, 'utf-8');
    contract = load(yaml) as Contract;
  });

  describe('Profile Structure', () => {
    it('should have profiles defined', () => {
      expect(contract.profiles).toBeDefined();
      expect(typeof contract.profiles).toBe('object');
    });

    it('should have dev-fast profile', () => {
      expect(contract.profiles?.['dev-fast']).toBeDefined();
      const profile = contract.profiles!['dev-fast'];
      
      expect(profile.tools).toEqual(['actionlint']);
      expect(profile.failOn).toEqual(['error']);
      expect(profile.description).toBe('Fast pre-commit check (<2s)');
    });

    it('should have dev profile', () => {
      expect(contract.profiles?.['dev']).toBeDefined();
      const profile = contract.profiles!['dev'];
      
      expect(profile.tools).toEqual(['actionlint', 'zizmor']);
      expect(profile.failOn).toEqual(['error', 'warning']);
      expect(profile.description).toBe('Full development check');
    });

    it('should have team profile', () => {
      expect(contract.profiles?.['team']).toBeDefined();
      const profile = contract.profiles!['team'];
      
      expect(profile.tools).toEqual(['actionlint', 'zizmor', 'gitleaks']);
      expect(profile.failOn).toEqual(['error', 'warning']);
      expect(profile.description).toBe('Team CI with secrets scanning');
    });
  });

  describe('Profile Tools', () => {
    it('should use tools array (NOT enable object)', () => {
      const profile = contract.profiles!['dev'];
      
      expect(Array.isArray(profile.tools)).toBe(true);
      expect(profile.tools.length).toBeGreaterThan(0);
      
      // Ensure no 'enable' field exists
      expect((profile as any).enable).toBeUndefined();
    });

    it('should have failOn array with valid severities', () => {
      const profile = contract.profiles!['dev'];
      
      expect(Array.isArray(profile.failOn)).toBe(true);
      profile.failOn.forEach(severity => {
        expect(['error', 'warning', 'info']).toContain(severity);
      });
    });

    it('dev-fast should only run actionlint', () => {
      const profile = contract.profiles!['dev-fast'];
      
      expect(profile.tools).toHaveLength(1);
      expect(profile.tools[0]).toBe('actionlint');
    });

    it('team should run all security tools', () => {
      const profile = contract.profiles!['team'];
      
      expect(profile.tools).toContain('actionlint');
      expect(profile.tools).toContain('zizmor');
      expect(profile.tools).toContain('gitleaks');
    });
  });

  describe('Profile FailOn Behavior', () => {
    it('dev-fast should only fail on errors', () => {
      const profile = contract.profiles!['dev-fast'];
      
      expect(profile.failOn).toEqual(['error']);
      expect(profile.failOn).not.toContain('warning');
      expect(profile.failOn).not.toContain('info');
    });

    it('dev should fail on errors and warnings', () => {
      const profile = contract.profiles!['dev'];
      
      expect(profile.failOn).toContain('error');
      expect(profile.failOn).toContain('warning');
      expect(profile.failOn).not.toContain('info');
    });

    it('team should fail on errors and warnings', () => {
      const profile = contract.profiles!['team'];
      
      expect(profile.failOn).toContain('error');
      expect(profile.failOn).toContain('warning');
      expect(profile.failOn).not.toContain('info');
    });
  });

  describe('Rule Configuration', () => {
    it('should use object format (NOT string enum)', () => {
      expect(contract.rules).toBeDefined();
      
      const securityRule = contract.rules!['security/no-hardcoded-secrets'];
      expect(typeof securityRule).toBe('object');
      expect(securityRule).toHaveProperty('severity');
    });

    it('should support per-rule gate override', () => {
      const securityRule = contract.rules!['security/no-hardcoded-secrets'];
      
      expect(securityRule.severity).toBe('error');
      expect(securityRule.gate).toBe(true); // Always block
    });

    it('should allow gate=false for non-critical rules', () => {
      const limitPerms = contract.rules!['security/limit-permissions'];
      
      expect(limitPerms.severity).toBe('error');
      expect(limitPerms.gate).toBe(false); // Warn but don't block
    });

    it('should handle rules without gate override', () => {
      const cacheRule = contract.rules!['best-practices/cache-dependencies'];
      
      expect(cacheRule.severity).toBe('warning');
      expect(cacheRule.gate).toBeUndefined(); // Falls back to profile.failOn
    });
  });

  describe('Profile Selection Logic', () => {
    it('should get profile by name', () => {
      const getProfile = (name: string): Profile | undefined => {
        return contract.profiles?.[name];
      };

      expect(getProfile('dev-fast')).toBeDefined();
      expect(getProfile('dev')).toBeDefined();
      expect(getProfile('team')).toBeDefined();
      expect(getProfile('nonexistent')).toBeUndefined();
    });

    it('should determine if violation should fail based on profile', () => {
      const shouldFail = (
        profile: Profile,
        severity: 'error' | 'warning' | 'info'
      ): boolean => {
        return profile.failOn.includes(severity);
      };

      const devFast = contract.profiles!['dev-fast'];
      expect(shouldFail(devFast, 'error')).toBe(true);
      expect(shouldFail(devFast, 'warning')).toBe(false);
      expect(shouldFail(devFast, 'info')).toBe(false);

      const dev = contract.profiles!['dev'];
      expect(shouldFail(dev, 'error')).toBe(true);
      expect(shouldFail(dev, 'warning')).toBe(true);
      expect(shouldFail(dev, 'info')).toBe(false);
    });

    it('should determine if rule should gate based on override', () => {
      const shouldGate = (
        ruleId: string,
        violationSeverity: 'error' | 'warning' | 'info',
        profile: Profile
      ): boolean => {
        const rule = contract.rules?.[ruleId];
        
        // Per-rule override takes precedence
        if (rule && typeof rule === 'object' && rule.gate !== undefined) {
          return rule.gate;
        }
        
        // Fallback to profile.failOn
        return profile.failOn.includes(violationSeverity);
      };

      const dev = contract.profiles!['dev'];

      // Rule with gate=true always blocks
      expect(shouldGate('security/no-hardcoded-secrets', 'error', dev)).toBe(true);
      
      // Rule with gate=false never blocks (even if error)
      expect(shouldGate('security/limit-permissions', 'error', dev)).toBe(false);
      
      // Rule without gate falls back to profile.failOn
      expect(shouldGate('best-practices/cache-dependencies', 'warning', dev)).toBe(true);
      expect(shouldGate('performance/use-composite-actions', 'info', dev)).toBe(false);
    });
  });

  describe('Backwards Compatibility', () => {
    it('should NOT have old enable field', () => {
      Object.values(contract.profiles || {}).forEach(profile => {
        expect((profile as any).enable).toBeUndefined();
      });
    });

    it('should have contractVersion 1', () => {
      expect(contract.contractVersion).toBe(1);
    });

    it('should be valid YAML structure', () => {
      expect(contract.name).toBe('nodejs-ci-contract');
      expect(contract.version).toBe('1.0.0');
    });
  });

  describe('Profile Snapshot', () => {
    it('should produce consistent profile structure', () => {
      const profiles = contract.profiles;
      
      expect(profiles).toMatchSnapshot();
    });
  });
});
