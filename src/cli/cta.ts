/**
 * CTA (Call-to-Action) module
 * Shows GitHub star + Discord invite after successful commands
 * 
 * Anti-spam: Shows max once per 24h using state file
 * Cross-platform: Works on Linux/Mac/Windows
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface CtaState {
  lastCtaShownAt?: number; // Unix timestamp
}

/**
 * Get platform-specific config directory
 */
export function getConfigDir(): string {
  const platform = process.platform;
  
  if (platform === 'win32') {
    // Windows: %APPDATA%/cerber
    const appData = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    return join(appData, 'cerber');
  } else {
    // Linux/Mac: ~/.config/cerber
    return join(homedir(), '.config', 'cerber');
  }
}

/**
 * Get state file path
 */
export function getStateFilePath(): string {
  return join(getConfigDir(), 'state.json');
}

/**
 * Read CTA state from disk (returns empty object if not exists/error)
 */
export function readCtaState(): CtaState {
  const statePath = getStateFilePath();
  
  try {
    if (!existsSync(statePath)) {
      return {};
    }
    
    const content = readFileSync(statePath, 'utf-8');
    return JSON.parse(content) as CtaState;
  } catch (error) {
    // If read/parse fails, return empty state (fail gracefully)
    return {};
  }
}

/**
 * Write CTA state to disk (fails gracefully)
 */
export function writeCtaState(state: CtaState): boolean {
  const statePath = getStateFilePath();
  const configDir = getConfigDir();
  
  try {
    // Create directory if not exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
    
    writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
    return true;
  } catch (error) {
    // Fail gracefully - don't crash if we can't write state
    return false;
  }
}

/**
 * Check if CTA should be shown (respects 24h cooldown)
 */
export function shouldShowCta(): boolean {
  const state = readCtaState();
  
  if (!state.lastCtaShownAt) {
    // Never shown before
    return true;
  }
  
  const now = Date.now();
  const timeSinceLastShow = now - state.lastCtaShownAt;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24h in milliseconds
  
  return timeSinceLastShow >= TWENTY_FOUR_HOURS;
}

/**
 * Show CTA message (GitHub star + Discord invite)
 */
export function showCta(): void {
  console.log('');
  console.log('⭐ If Cerber helped you, star the repo: https://github.com/Agaslez/cerber-core');
  console.log('💬 Join Discord for feedback/support: https://discord.gg/V8G5qw5D');
}

/**
 * Show CTA if conditions are met (success + 24h cooldown)
 * 
 * @param success - Command success status (only show on success)
 */
export function tryShowCta(success: boolean): void {
  if (!success) {
    // Don't show CTA on failure
    return;
  }
  
  if (!shouldShowCta()) {
    // Already shown in last 24h
    return;
  }
  
  // Show CTA
  showCta();
  
  // Update state (fail gracefully if can't write)
  writeCtaState({ lastCtaShownAt: Date.now() });
}
