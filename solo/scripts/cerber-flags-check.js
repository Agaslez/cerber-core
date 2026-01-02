#!/usr/bin/env node

/**
 * Cerber SOLO - Feature Flags Checker
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Features:
 * - List active flags
 * - Detect expired flags
 * - Per-environment status
 * - Cleanup suggestions
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const fs = require('fs');
const path = require('path');

console.log('🚩 Cerber SOLO - Feature Flags Checker\n');

/**
 * Find feature flag files
 */
function findFeatureFlagFiles() {
  const possiblePaths = [
    'solo/lib/feature-flags.ts',
    'src/lib/feature-flags.ts',
    'lib/feature-flags.ts',
    'src/config/feature-flags.ts',
    'config/feature-flags.ts',
    'src/features/flags.ts'
  ];
  
  const found = [];
  
  possiblePaths.forEach(p => {
    const fullPath = path.join(process.cwd(), p);
    if (fs.existsSync(fullPath)) {
      found.push(fullPath);
    }
  });
  
  return found;
}

/**
 * Parse feature flags from file
 */
function parseFeatureFlags(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const flags = [];
    
    // Look for flag definitions (simplified parsing)
    const flagRegex = /['"]([a-z-_]+)['"]\s*:\s*{[\s\S]*?enabled:\s*(true|false)[\s\S]*?}/gi;
    let match;
    
    while ((match = flagRegex.exec(content)) !== null) {
      flags.push({
        name: match[1],
        enabled: match[2] === 'true',
        source: filePath
      });
    }
    
    // Also look for simple boolean flags
    const simpleFlagRegex = /export\s+const\s+([A-Z_]+)\s*=\s*(true|false)/gi;
    
    while ((match = simpleFlagRegex.exec(content)) !== null) {
      flags.push({
        name: match[1],
        enabled: match[2] === 'true',
        source: filePath
      });
    }
    
    return flags;
  } catch (error) {
    console.log(`⚠️  Error parsing ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Check for expired flags
 */
function checkExpiredFlags(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const expired = [];
    
    // Look for expiresAt dates
    const expiryRegex = /expiresAt:\s*['"](\d{4}-\d{2}-\d{2})['"]/g;
    let match;
    
    const now = new Date();
    
    while ((match = expiryRegex.exec(content)) !== null) {
      const expiryDate = new Date(match[1]);
      
      if (expiryDate < now) {
        // Find flag name near this expiry
        const before = content.substring(Math.max(0, match.index - 200), match.index);
        const nameMatch = before.match(/['"]([a-z-_]+)['"]\s*:\s*{[^}]*$/i);
        
        if (nameMatch) {
          expired.push({
            name: nameMatch[1],
            expiryDate: match[1]
          });
        }
      }
    }
    
    return expired;
  } catch (error) {
    return [];
  }
}

/**
 * Find flag usage in codebase
 */
function findFlagUsage(flagName) {
  try {
    const { execSync } = require('child_process');
    const cmd = `grep -r "${flagName}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | wc -l`;
    const count = parseInt(execSync(cmd, { encoding: 'utf8' }).trim());
    return count;
  } catch (error) {
    return 0;
  }
}

// Find and analyze feature flags
const flagFiles = findFeatureFlagFiles();

if (flagFiles.length === 0) {
  console.log('ℹ️  No feature flag files found\n');
  console.log('Expected locations:');
  console.log('  - solo/lib/feature-flags.ts');
  console.log('  - src/lib/feature-flags.ts');
  console.log('  - src/config/feature-flags.ts\n');
  console.log('💡 Create feature-flags.ts to use this checker');
  process.exit(0);
}

console.log(`📁 Found ${flagFiles.length} feature flag file(s):\n`);

let totalFlags = 0;
let enabledFlags = 0;
let disabledFlags = 0;
let allExpiredFlags = [];

flagFiles.forEach(file => {
  const relativePath = path.relative(process.cwd(), file);
  console.log(`   ${relativePath}`);
  
  const flags = parseFeatureFlags(file);
  const expired = checkExpiredFlags(file);
  
  totalFlags += flags.length;
  
  flags.forEach(flag => {
    if (flag.enabled) {
      enabledFlags++;
    } else {
      disabledFlags++;
    }
  });
  
  allExpiredFlags = allExpiredFlags.concat(expired);
});

console.log();

if (totalFlags === 0) {
  console.log('ℹ️  No feature flags detected in files\n');
  console.log('💡 Define flags in your feature-flags.ts file:\n');
  console.log('   export const FLAGS = {');
  console.log('     "new-feature": { enabled: true, description: "..." },');
  console.log('     "beta-ui": { enabled: false, description: "..." }');
  console.log('   };\n');
  process.exit(0);
}

// Summary
console.log('📊 Feature Flags Summary\n');
console.log(`   Total flags: ${totalFlags}`);
console.log(`   ✅ Enabled: ${enabledFlags}`);
console.log(`   ❌ Disabled: ${disabledFlags}\n`);

// Expired flags
if (allExpiredFlags.length > 0) {
  console.log('⏰ Expired Flags (cleanup recommended)\n');
  allExpiredFlags.forEach(flag => {
    console.log(`   🔴 ${flag.name} (expired: ${flag.expiryDate})`);
  });
  console.log();
}

// Environment detection
console.log('🌍 Environment Detection\n');
const env = process.env.NODE_ENV || 'development';
console.log(`   Current environment: ${env}\n`);

// Recommendations
console.log('💡 Recommendations\n');

if (allExpiredFlags.length > 0) {
  console.log('   1. Remove expired feature flags from code');
  console.log('   2. Clean up flag-related code branches');
}

if (disabledFlags > enabledFlags * 2) {
  console.log('   3. Review disabled flags - can any be removed?');
}

if (totalFlags > 20) {
  console.log('   4. Consider flag cleanup - you have many flags');
}

console.log();
console.log('='.repeat(60));

process.exit(allExpiredFlags.length > 0 ? 1 : 0);
