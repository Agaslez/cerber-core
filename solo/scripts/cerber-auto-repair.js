#!/usr/bin/env node

/**
 * Cerber SOLO - Auto-Repair System
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Automatically fixes common issues:
 * - Format package.json (sort scripts and deps)
 * - Sync .env.example (add missing environment variable keys)
 * - Auto-generate CHANGELOG (from git log)
 * - Remove console.logs (with approval system)
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const requiresApproval = args.includes('--approve');

console.log('🔧 Cerber SOLO - Auto-Repair System\n');
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);

let changesCount = 0;

/**
 * Format and sort package.json
 */
function formatPackageJson() {
  console.log('📦 Checking package.json...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('  ⚠️  No package.json found, skipping');
    return;
  }
  
  try {
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Sort scripts alphabetically
    if (packageData.scripts) {
      const sortedScripts = Object.keys(packageData.scripts)
        .sort()
        .reduce((acc, key) => {
          acc[key] = packageData.scripts[key];
          return acc;
        }, {});
      packageData.scripts = sortedScripts;
    }
    
    // Sort dependencies
    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
      if (packageData[depType]) {
        const sorted = Object.keys(packageData[depType])
          .sort()
          .reduce((acc, key) => {
            acc[key] = packageData[depType][key];
            return acc;
          }, {});
        packageData[depType] = sorted;
      }
    });
    
    const formatted = JSON.stringify(packageData, null, 2) + '\n';
    
    if (!isDryRun) {
      fs.writeFileSync(packagePath, formatted, 'utf8');
    }
    
    console.log('  ✅ Package.json formatted and sorted');
    changesCount++;
  } catch (error) {
    console.log(`  ❌ Error formatting package.json: ${error.message}`);
  }
}

/**
 * Sync .env.example with environment variables used in code
 */
function syncEnvExample() {
  console.log('\n🔐 Checking .env.example...');
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    // Find all VITE_* and REACT_APP_* variables in source code
    let envVars = new Set();
    
    try {
      const grepCommand = 'grep -r "VITE_\\|REACT_APP_\\|NEXT_PUBLIC_" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null || true';
      const grepOutput = execSync(grepCommand, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      
      const envRegex = /(VITE_[A-Z_]+|REACT_APP_[A-Z_]+|NEXT_PUBLIC_[A-Z_]+)/g;
      const matches = grepOutput.match(envRegex);
      
      if (matches) {
        matches.forEach(v => envVars.add(v));
      }
    } catch (error) {
      // grep may fail if no files found, that's okay
    }
    
    if (envVars.size === 0) {
      console.log('  ℹ️  No environment variables found in code');
      return;
    }
    
    // Read existing .env.example
    let existingVars = new Set();
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      content.split('\n').forEach(line => {
        const match = line.match(/^([A-Z_]+)=/);
        if (match) {
          existingVars.add(match[1]);
        }
      });
    }
    
    // Find missing variables
    const missingVars = Array.from(envVars).filter(v => !existingVars.has(v));
    
    if (missingVars.length === 0) {
      console.log('  ✅ .env.example is up to date');
      return;
    }
    
    console.log(`  📝 Found ${missingVars.length} missing variables: ${missingVars.join(', ')}`);
    
    if (!isDryRun) {
      let content = fs.existsSync(envExamplePath) ? 
        fs.readFileSync(envExamplePath, 'utf8') : '';
      
      if (content && !content.endsWith('\n')) {
        content += '\n';
      }
      
      content += '\n# Auto-added by Cerber SOLO\n';
      missingVars.forEach(varName => {
        content += `${varName}=\n`;
      });
      
      fs.writeFileSync(envExamplePath, content, 'utf8');
      console.log('  ✅ Updated .env.example');
    }
    
    changesCount++;
  } catch (error) {
    console.log(`  ❌ Error syncing .env.example: ${error.message}`);
  }
}

/**
 * Auto-generate CHANGELOG from git log
 */
function generateChangelog() {
  console.log('\n📝 Checking CHANGELOG...');
  
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  
  try {
    // Check if git repo exists
    if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
      console.log('  ⚠️  Not a git repository, skipping');
      return;
    }
    
    // Get recent commits
    const gitLog = execSync('git log --pretty=format:"%h - %s (%an, %ar)" -20', { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 
    });
    
    if (!gitLog) {
      console.log('  ℹ️  No commits found');
      return;
    }
    
    const date = new Date().toISOString().split('T')[0];
    const changelog = `# Changelog\n\n## [Unreleased] - ${date}\n\n### Recent Changes\n\n${gitLog.split('\n').map(line => `- ${line}`).join('\n')}\n\n---\n*Generated by Cerber SOLO*\n`;
    
    if (!isDryRun) {
      fs.writeFileSync(changelogPath, changelog, 'utf8');
    }
    
    console.log('  ✅ CHANGELOG generated from git log');
    changesCount++;
  } catch (error) {
    console.log(`  ⚠️  Error generating CHANGELOG: ${error.message}`);
  }
}

/**
 * Remove console.logs with approval
 */
function removeConsoleLogs() {
  console.log('\n🧹 Checking for console.log statements...');
  
  if (!requiresApproval) {
    console.log('  ℹ️  Use --approve flag to enable console.log removal');
    return;
  }
  
  try {
    const grepCommand = 'grep -rn "console\\.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null || true';
    const consoleLogFiles = execSync(grepCommand, { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 
    });
    
    if (!consoleLogFiles) {
      console.log('  ✅ No console.log statements found');
      return;
    }
    
    const lines = consoleLogFiles.split('\n').filter(line => line.trim());
    console.log(`  📊 Found ${lines.length} console.log statements`);
    
    if (lines.length > 0) {
      console.log('  ⚠️  Manual review recommended - showing first 5:');
      lines.slice(0, 5).forEach(line => {
        console.log(`     ${line}`);
      });
    }
    
    changesCount++;
  } catch (error) {
    // grep may fail if no files found
  }
}

// Run all repairs
formatPackageJson();
syncEnvExample();
generateChangelog();
removeConsoleLogs();

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n✨ Auto-repair complete!`);
console.log(`   Changes detected: ${changesCount}`);
console.log(`   Mode: ${isDryRun ? 'DRY RUN (no files modified)' : 'LIVE (files updated)'}`);

if (isDryRun && changesCount > 0) {
  console.log('\n💡 Run without --dry-run to apply changes');
}

console.log('\n' + '='.repeat(50));

process.exit(0);
