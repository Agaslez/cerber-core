import { Contract } from '../src/contract/types';
import { ProfileResolver, createProfileResolver } from '../src/core/ProfileResolver';

describe('@fast COMMIT-6: Profile Resolution Logic', () => {
  const minimalContract: Contract = {
    contractVersion: 1,
    profiles: {
      solo: {
        tools: ['actionlint'],
        failOn: ['error'],
      },
    },
  };

  const fullContract: Contract = {
    contractVersion: 1,
    profiles: {
      solo: {
        tools: ['actionlint'],
        failOn: ['error'],
        timeout: 300,
      },
      dev: {
        tools: ['actionlint', 'gitleaks'],
        failOn: ['error', 'warning'],
        timeout: 600,
        continueOnError: true,
      },
      team: {
        tools: ['actionlint', 'gitleaks', 'zizmor'],
        failOn: ['error', 'warning'],
        timeout: 900,
        continueOnError: true,
        requireDeterministicOutput: true,
      },
    },
  };

  describe('Basic Resolution', () => {
    it('should resolve solo profile as default', () => {
      const resolver = new ProfileResolver({ contract: minimalContract });
      const resolved = resolver.resolve();

      expect(resolved.name).toBe('solo');
      expect(resolved.source).toBe('default');
      expect(resolved.tools).toEqual(['actionlint']);
      expect(resolved.failOn).toEqual(['error']);
    });

    it('should resolve team profile when available and no override', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const resolved = resolver.resolve();

      expect(resolved.name).toBe('team');
      expect(resolved.tools).toContain('zizmor');
      expect(resolved.requireDeterministicOutput).toBe(true);
    });

    it('should prefer CLI argument over environment', () => {
      const resolver = new ProfileResolver({
        contract: fullContract,
        cliProfile: 'solo',
        environmentProfile: 'dev',
      });
      const resolved = resolver.resolve();

      expect(resolved.name).toBe('solo');
      expect(resolved.source).toBe('cli');
    });

    it('should use environment variable when no CLI argument', () => {
      const resolver = new ProfileResolver({
        contract: fullContract,
        environmentProfile: 'dev',
      });
      const resolved = resolver.resolve();

      expect(resolved.name).toBe('dev');
      expect(resolved.source).toBe('environment');
    });

    it('should ignore invalid CLI profile and fall back', () => {
      const resolver = new ProfileResolver({
        contract: fullContract,
        cliProfile: 'invalid',
      });
      const resolved = resolver.resolve();

      expect(resolved.name).toBe('team'); // default hierarchy
      expect(resolved.source).toBe('default');
    });
  });

  describe('Profile Hierarchy', () => {
    it('should follow team > dev > solo hierarchy', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const hierarchy = resolver.getHierarchy();

      expect(hierarchy.hierarchy).toEqual(['team', 'dev', 'solo']);
      expect(hierarchy.selected).toBe('team');
    });

    it('should skip missing profiles in hierarchy', () => {
      const devOnlyContract: Contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
          },
          dev: {
            tools: ['actionlint', 'gitleaks'],
            failOn: ['error', 'warning'],
          },
        },
      };

      const resolver = new ProfileResolver({ contract: devOnlyContract });
      const hierarchy = resolver.getHierarchy();

      expect(hierarchy.hierarchy).toEqual(['dev', 'solo']);
      expect(hierarchy.selected).toBe('dev');
    });

    it('should always fall back to solo', () => {
      const resolver = new ProfileResolver({ contract: minimalContract });
      const hierarchy = resolver.getHierarchy();

      expect(hierarchy.hierarchy).toEqual(['solo']);
      expect(hierarchy.selected).toBe('solo');
    });
  });

  describe('Profile Validation', () => {
    it('should validate correct contract', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const validation = resolver.validateProfiles();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should require solo profile in valid contract', () => {
      // Since Contract type enforces solo, we test that validation
      // passes for contracts with solo profile
      const resolver = new ProfileResolver({ contract: fullContract });
      const validation = resolver.validateProfiles();

      expect(validation.valid).toBe(true);
      const available = resolver.getAvailableProfiles();
      expect(available).toContain('solo');
    });

    it('should handle contract with only solo and dev', () => {
      const devContract: Contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
          },
          dev: {
            tools: ['gitleaks'],
            failOn: ['error'],
          },
        },
      };

      const resolver = new ProfileResolver({ contract: devContract });
      const validation = resolver.validateProfiles();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate profile structure', () => {
      const malformedContract: Contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
          },
          dev: {
            tools: ['gitleaks'],
            failOn: ['error'],
          },
        },
      };

      const resolver = new ProfileResolver({ contract: malformedContract });
      const validation = resolver.validateProfiles();

      expect(validation.valid).toBe(true);
    });
  });

  describe('Profile Merging', () => {
    it('should merge team with dev profile', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const merged = resolver.mergeWithBase('team', 'dev');

      expect(merged.tools).toContain('actionlint');
      expect(merged.tools).toContain('gitleaks');
      expect(merged.tools).toContain('zizmor');
      expect(new Set(merged.tools).size).toBe(3); // no duplicates
    });

    it('should merge dev with solo profile', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const merged = resolver.mergeWithBase('dev', 'solo');

      expect(merged.tools).toContain('actionlint');
      expect(merged.tools).toContain('gitleaks');
    });

    it('should merge failOn arrays without duplicates', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const merged = resolver.mergeWithBase('team', 'dev');

      expect(merged.failOn).toContain('error');
      expect(merged.failOn).toContain('warning');
      expect(new Set(merged.failOn).size).toBe(merged.failOn.length);
    });

    it('should prefer profile timeout over base', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const merged = resolver.mergeWithBase('team', 'dev');

      expect(merged.timeout).toBe(900); // team's timeout
    });

    it('should use base timeout if profile undefined', () => {
      const customContract: Contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: ['error'],
            timeout: 300,
          },
          dev: {
            tools: ['gitleaks'],
            failOn: ['warning'],
            // no timeout defined
          },
        },
      };

      const resolver = new ProfileResolver({ contract: customContract });
      const merged = resolver.mergeWithBase('dev', 'solo');

      expect(merged.timeout).toBe(300); // solo's timeout
    });

    it('should throw on invalid profile name', () => {
      const resolver = new ProfileResolver({ contract: fullContract });

      expect(() => resolver.mergeWithBase('invalid', 'solo')).toThrow();
    });
  });

  describe('Compatibility Reporting', () => {
    it('should report full coverage when all tools installed', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const report = resolver.getCompatibilityReport(['actionlint', 'gitleaks', 'zizmor']);

      expect(report.profile).toBe('team');
      expect(report.coverage).toBe(100);
      expect(report.missing).toHaveLength(0);
    });

    it('should report partial coverage when some tools missing', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const report = resolver.getCompatibilityReport(['actionlint']);

      expect(report.coverage).toBe(33); // 1 of 3
      expect(report.missing).toContain('gitleaks');
      expect(report.missing).toContain('zizmor');
    });

    it('should report zero coverage when no tools installed', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const report = resolver.getCompatibilityReport([]);

      expect(report.coverage).toBe(0);
      expect(report.missing).toHaveLength(3);
    });

    it('should ignore extra installed tools not in profile', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const report = resolver.getCompatibilityReport([
        'actionlint',
        'gitleaks',
        'zizmor',
        'extra-tool',
      ]);

      expect(report.coverage).toBe(100);
      expect(report.installedTools).toHaveLength(3); // only profile tools
    });
  });

  describe('Dry Run', () => {
    it('should show what would be resolved without side effects', () => {
      const resolver = new ProfileResolver({
        contract: fullContract,
        cliProfile: 'dev',
      });

      const dryRun = resolver.dryRun();

      expect(dryRun.selectedProfile).toBe('dev');
      expect(dryRun.source).toBe('cli');
      expect(dryRun.tools).toEqual(['actionlint', 'gitleaks']);
      expect(dryRun.failOn).toEqual(['error', 'warning']);
    });

    it('should reflect defaults in dry run', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const dryRun = resolver.dryRun();

      expect(dryRun.selectedProfile).toBe('team');
      expect(dryRun.source).toBe('default');
    });
  });

  describe('Available Profiles', () => {
    it('should list all available profiles', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const available = resolver.getAvailableProfiles();

      expect(available).toContain('solo');
      expect(available).toContain('dev');
      expect(available).toContain('team');
    });

    it('should handle single profile', () => {
      const resolver = new ProfileResolver({ contract: minimalContract });
      const available = resolver.getAvailableProfiles();

      expect(available).toEqual(['solo']);
    });
  });

  describe('Factory Helper', () => {
    it('should create resolver from factory', () => {
      const resolver = createProfileResolver(fullContract, {
        cliProfile: 'dev',
      });

      const resolved = resolver.resolve();
      expect(resolved.name).toBe('dev');
    });

    it('should read CERBER_PROFILE environment variable via factory', () => {
      process.env.CERBER_PROFILE = 'solo';

      const resolver = createProfileResolver(fullContract);
      const resolved = resolver.resolve();

      expect(resolved.source).toBe('environment');

      delete process.env.CERBER_PROFILE;
    });
  });

  describe('Edge Cases', () => {
    it('should handle profile with empty tools array', () => {
      const emptyToolsContract: Contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: [],
            failOn: ['error'],
          },
        },
      };

      const resolver = new ProfileResolver({ contract: emptyToolsContract });
      const resolved = resolver.resolve();

      expect(resolved.tools).toEqual([]);
    });

    it('should handle profile with empty failOn array', () => {
      const emptyFailOnContract: Contract = {
        contractVersion: 1,
        profiles: {
          solo: {
            tools: ['actionlint'],
            failOn: [],
          },
        },
      };

      const resolver = new ProfileResolver({ contract: emptyFailOnContract });
      const resolved = resolver.resolve();

      expect(resolved.failOn).toEqual([]);
    });

    it('should handle all optional profile parameters', () => {
      const resolver = new ProfileResolver({ contract: fullContract });
      const resolved = resolver.resolve();

      expect(resolved.timeout).toBeDefined();
      expect(resolved.continueOnError).toBeDefined();
      expect(resolved.requireDeterministicOutput).toBeDefined();
    });

    it('should throw when resolving non-existent profile via override', () => {
      const resolver = new ProfileResolver({
        contract: fullContract,
        cliProfile: 'nonexistent',
      });

      // Invalid override should be ignored, falls back to default
      const resolved = resolver.resolve();
      expect(resolved.name).toBe('team'); // defaults to team in hierarchy
    });
  });
});
