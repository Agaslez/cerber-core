/**
 * Cerber SOLO - Feature Flags System
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

export type FeatureFlag = string;

export interface FlagConfig {
  enabled: boolean;
  description: string;
  owner: string;
  expiresAt?: string;
  environments?: ("development" | "staging" | "production")[];
}

export interface FeatureFlagsConfig {
  [key: string]: FlagConfig;
}

/**
 * Default feature flags configuration
 */
const defaultFlags: FeatureFlagsConfig = {
  "example-feature": {
    enabled: false,
    description: "Example feature flag",
    owner: "team",
    environments: ["development"]
  }
};

/**
 * Load feature flags from environment or use defaults
 */
let featureFlags: FeatureFlagsConfig = defaultFlags;

/**
 * Initialize feature flags with custom configuration
 * @param config - Custom feature flags configuration
 */
export function initializeFeatureFlags(config: FeatureFlagsConfig): void {
  featureFlags = { ...defaultFlags, ...config };
}

/**
 * Check if a feature flag is enabled
 * @param flag - Feature flag name
 * @returns true if the flag is enabled, false otherwise
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const config = featureFlags[flag];
  
  if (!config) {
    console.warn(`Feature flag "${flag}" not found, defaulting to false`);
    return false;
  }
  
  // Check if flag is enabled
  if (!config.enabled) {
    return false;
  }
  
  // Check environment restrictions
  if (config.environments && config.environments.length > 0) {
    const currentEnv = process.env.NODE_ENV || "development";
    if (!config.environments.includes(currentEnv as any)) {
      return false;
    }
  }
  
  // Check expiry date
  if (config.expiresAt) {
    const expiryDate = new Date(config.expiresAt);
    const now = new Date();
    
    if (now > expiryDate) {
      console.warn(`Feature flag "${flag}" has expired on ${config.expiresAt}`);
      return false;
    }
  }
  
  return true;
}

/**
 * React hook for feature flags
 * @param flag - Feature flag name
 * @returns true if the flag is enabled, false otherwise
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return isFeatureEnabled(flag);
}

/**
 * Higher-order component for conditional rendering based on feature flags
 * @param flag - Feature flag name
 * @param Component - Component to render if flag is enabled
 * @param Fallback - Optional fallback component if flag is disabled
 * @returns Component or Fallback based on flag status
 */
export function withFeatureFlag(
  flag: FeatureFlag,
  Component: any,
  Fallback?: any
): any {
  return function FeatureFlagWrapper(props: any) {
    const isEnabled = isFeatureEnabled(flag);
    
    if (isEnabled) {
      return Component(props);
    }
    
    if (Fallback) {
      return Fallback(props);
    }
    
    return null;
  };
}

/**
 * Get all feature flags
 * @returns All feature flags configuration
 */
export function getAllFlags(): FeatureFlagsConfig {
  return { ...featureFlags };
}

/**
 * Get enabled feature flags
 * @returns List of enabled feature flag names
 */
export function getEnabledFlags(): string[] {
  return Object.keys(featureFlags).filter(flag => isFeatureEnabled(flag));
}

/**
 * Get feature flag configuration
 * @param flag - Feature flag name
 * @returns Feature flag configuration or undefined
 */
export function getFlagConfig(flag: FeatureFlag): FlagConfig | undefined {
  return featureFlags[flag];
}

/**
 * Check if a feature flag exists
 * @param flag - Feature flag name
 * @returns true if the flag exists, false otherwise
 */
export function flagExists(flag: FeatureFlag): boolean {
  return flag in featureFlags;
}

/**
 * Get expired feature flags
 * @returns List of expired feature flag names
 */
export function getExpiredFlags(): string[] {
  const now = new Date();
  
  return Object.keys(featureFlags).filter(flag => {
    const config = featureFlags[flag];
    if (!config.expiresAt) return false;
    
    const expiryDate = new Date(config.expiresAt);
    return now > expiryDate;
  });
}

// Export types
export type { FeatureFlag, FlagConfig, FeatureFlagsConfig };
