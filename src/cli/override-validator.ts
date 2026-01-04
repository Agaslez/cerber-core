/**
 * Override validator for Cerber emergency bypass
 * 
 * Override is a SAFETY FUSE, not a power switch.
 * It NEVER disables cerber-integrity or entire CI.
 * 
 * @author Stefan Pitek
 * @license MIT
 */

import { OverrideConfig } from './types.js';

export interface OverrideValidation {
  state: 'DISABLED' | 'ACTIVE' | 'EXPIRED' | 'INVALID';
  active: boolean;
  message: string;
  errors?: string[];
}

/**
 * Validate override configuration
 * Returns current state and whether override should be applied
 */
export function validateOverride(override?: OverrideConfig): OverrideValidation {
  // No override section or explicitly disabled
  if (!override || !override.enabled) {
    return {
      state: 'DISABLED',
      active: false,
      message: 'Override not enabled'
    };
  }
  
  // Enabled - validate required fields
  const errors: string[] = [];
  
  if (!override.reason || override.reason.trim() === '') {
    errors.push('reason is required when override enabled');
  }
  
  if (!override.expires || override.expires.trim() === '') {
    errors.push('expires is required when override enabled');
  }
  
  if (!override.approvedBy || override.approvedBy.trim() === '') {
    errors.push('approvedBy is required when override enabled');
  }
  
  // If missing required fields -> INVALID
  if (errors.length > 0) {
    return {
      state: 'INVALID',
      active: false,
      message: 'Override configuration invalid',
      errors
    };
  }
  
  // Check expiry
  try {
    const expiryDate = new Date(override.expires!);
    const now = new Date();
    
    if (isNaN(expiryDate.getTime())) {
      return {
        state: 'INVALID',
        active: false,
        message: 'Invalid expires date format (use ISO 8601)',
        errors: ['expires must be valid ISO 8601 date']
      };
    }
    
    if (expiryDate <= now) {
      return {
        state: 'EXPIRED',
        active: false,
        message: `Override expired at ${override.expires}`
      };
    }
    
    // All good - override is ACTIVE
    return {
      state: 'ACTIVE',
      active: true,
      message: `Override active until ${override.expires}`
    };
    
  } catch (err) {
    return {
      state: 'INVALID',
      active: false,
      message: 'Failed to parse expires date',
      errors: [(err as Error).message]
    };
  }
}

/**
 * Print override warning to console (for pre-commit)
 * Shows full metadata for audit trail
 */
export function printOverrideWarning(override: OverrideConfig, validation: OverrideValidation): void {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚠️  CERBER EMERGENCY OVERRIDE ACTIVE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Status:      ${validation.state}`);
  console.log(`Reason:      ${override.reason}`);
  console.log(`Expires:     ${override.expires}`);
  console.log(`Approved By: ${override.approvedBy}`);
  console.log('');
  console.log('Guardian checks: BYPASSED WITH WARNING');
  console.log('Self-protection: STILL ACTIVE (cerber-integrity runs)');
  console.log('');
  console.log('⚠️  Create follow-up PR to fix properly + disable override');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}
