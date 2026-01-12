import { Contract, Profile } from '../contract/types';

/**
 * Profile Resolution Logic
 * 
 * Resolves active profile from contract based on:
 * 1. Environment variable override (CERBER_PROFILE)
 * 2. CLI argument override (--profile)
 * 3. Default hierarchy: team > dev > solo
 */

export interface ResolverOptions {
  contract: Contract;
  environmentProfile?: string;
  cliProfile?: string;
  target?: string;
}

export interface ResolvedProfile {
  profile: Profile;
  name: 'solo' | 'dev' | 'team';
  source: 'environment' | 'cli' | 'default';
  tools: string[];
  failOn: string[];
  timeout?: number;
  continueOnError?: boolean;
  requireDeterministicOutput?: boolean;
}

export interface ProfileHierarchy {
  available: string[];
  selected: string;
  hierarchy: string[];
}

export class ProfileResolver {
  private contract: Contract;
  private environmentProfile?: string;
  private cliProfile?: string;
  private target?: string;

  constructor(options: ResolverOptions) {
    this.contract = options.contract;
    this.environmentProfile = options.environmentProfile;
    this.cliProfile = options.cliProfile;
    this.target = options.target;
  }

  /**
   * Resolve active profile with priority:
   * 1. CLI argument (--profile)
   * 2. Environment variable (CERBER_PROFILE)
   * 3. Default hierarchy
   */
  resolve(): ResolvedProfile {
    const profileName = this.determineProfile();
    const profile = this.getProfile(profileName);

    if (!profile) {
      throw new Error(
        `Profile '${profileName}' not found in contract. Available: ${Object.keys(
          this.contract.profiles
        ).join(', ')}`
      );
    }

    return {
      profile,
      name: profileName as 'solo' | 'dev' | 'team',
      source: this.determineSource(),
      tools: profile.tools || [],
      failOn: profile.failOn || [],
      timeout: profile.timeout,
      continueOnError: profile.continueOnError,
      requireDeterministicOutput: profile.requireDeterministicOutput,
    };
  }

  /**
   * Get available profiles in contract
   */
  getAvailableProfiles(): string[] {
    return Object.keys(this.contract.profiles);
  }

  /**
   * Get profile hierarchy for diagnostic purposes
   */
  getHierarchy(): ProfileHierarchy {
    const available = this.getAvailableProfiles();
    const selected = this.determineProfile();

    return {
      available,
      selected,
      hierarchy: this.getProfileHierarchyOrder(),
    };
  }

  /**
   * Validate profile names in contract
   */
  validateProfiles(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const profileNames = this.getAvailableProfiles();

    // Check for required 'solo' profile
    if (!profileNames.includes('solo')) {
      errors.push("Contract must include 'solo' profile");
    }

    // Check for invalid profile names
    const validNames = ['solo', 'dev', 'team'];
    for (const name of profileNames) {
      if (!validNames.includes(name)) {
        errors.push(`Invalid profile name '${name}'. Must be: solo, dev, or team`);
      }
    }

    // Check profile structure
    for (const name of profileNames) {
      const profile = this.getProfile(name);
      if (!profile) continue;
      if (!Array.isArray(profile.tools)) {
        errors.push(`Profile '${name}' must have 'tools' array`);
      }
      if (!Array.isArray(profile.failOn)) {
        errors.push(`Profile '${name}' must have 'failOn' array`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merge profile with base (for extension/inheritance)
   * Useful for team > dev > solo inheritance
   */
  mergeWithBase(profileName: string, baseProfileName: string): Profile {
    const profile = this.getProfile(profileName);
    const baseProfile = this.getProfile(baseProfileName);

    if (!profile || !baseProfile) {
      throw new Error('Profile or base profile not found');
    }

    return {
      tools: Array.from(new Set([...(baseProfile.tools || []), ...(profile.tools || [])])),
      failOn: Array.from(new Set([...(baseProfile.failOn || []), ...(profile.failOn || [])])),
      timeout: profile.timeout ?? baseProfile.timeout,
      continueOnError: profile.continueOnError ?? baseProfile.continueOnError,
      requireDeterministicOutput:
        profile.requireDeterministicOutput ?? baseProfile.requireDeterministicOutput,
    };
  }

  /**
   * Get profile compatibility report
   */
  getCompatibilityReport(
    installedTools: string[]
  ): {
    profile: string;
    requiredTools: string[];
    installedTools: string[];
    missing: string[];
    coverage: number;
  } {
    const resolved = this.resolve();
    const missing = resolved.tools.filter((tool) => !installedTools.includes(tool));
    const coverage =
      resolved.tools.length > 0
        ? ((resolved.tools.length - missing.length) / resolved.tools.length) * 100
        : 100;

    return {
      profile: resolved.name,
      requiredTools: resolved.tools,
      installedTools: installedTools.filter((tool) => resolved.tools.includes(tool)),
      missing,
      coverage: Math.round(coverage),
    };
  }

  /**
   * Dry-run: show what would be resolved without actually resolving
   */
  dryRun(): {
    selectedProfile: string;
    source: string;
    tools: string[];
    failOn: string[];
  } {
    const profileName = this.determineProfile();
    const profile = this.getProfile(profileName);

    return {
      selectedProfile: profileName,
      source: this.determineSource(),
      tools: profile?.tools || [],
      failOn: profile?.failOn || [],
    };
  }

  // ==================== Private Methods ====================

  private getProfile(name: string): Profile | undefined {
    if (name === 'solo') return this.contract.profiles.solo;
    if (name === 'dev') return this.contract.profiles.dev;
    if (name === 'team') return this.contract.profiles.team;
    return undefined;
  }

  private determineProfile(): string {
    // Priority 1: CLI argument
    if (this.cliProfile && this.isValidProfileName(this.cliProfile)) {
      return this.cliProfile;
    }

    // Priority 2: Environment variable
    if (this.environmentProfile && this.isValidProfileName(this.environmentProfile)) {
      return this.environmentProfile;
    }

    // Priority 3: Default hierarchy (team > dev > solo)
    const available = this.getAvailableProfiles();
    if (available.includes('team')) return 'team';
    if (available.includes('dev')) return 'dev';
    return 'solo'; // solo is required to always exist
  }

  private determineSource(): 'environment' | 'cli' | 'default' {
    if (this.cliProfile && this.isValidProfileName(this.cliProfile)) return 'cli';
    if (this.environmentProfile && this.isValidProfileName(this.environmentProfile)) {
      return 'environment';
    }
    return 'default';
  }

  private getProfileHierarchyOrder(): string[] {
    const available = this.getAvailableProfiles();
    const order = [];

    if (available.includes('team')) order.push('team');
    if (available.includes('dev')) order.push('dev');
    if (available.includes('solo')) order.push('solo');

    return order;
  }

  private isValidProfileName(name: string): boolean {
    return this.getAvailableProfiles().includes(name);
  }
}

/**
 * Helper: Create default ProfileResolver from contract
 */
export function createProfileResolver(
  contract: Contract,
  options: Partial<ResolverOptions> = {}
): ProfileResolver {
  return new ProfileResolver({
    contract,
    environmentProfile: options.environmentProfile || process.env.CERBER_PROFILE,
    cliProfile: options.cliProfile,
    target: options.target,
  });
}
