#!/usr/bin/env node

/**
 * Cerber SOLO - Smart Rollback
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Features:
 * - Rollback specific file from commit
 * - Conflict detection
 * - Safety checks
 * - Dry-run mode
 * 
 * Usage: node cerber-rollback.js <commit-hash> --file=path/to/file.ts [--dry-run]
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⏪ Cerber SOLO - Smart Rollback\n');

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node cerber-rollback.js <commit-hash> --file=path/to/file.ts [--dry-run]\n');
  console.log('Options:');
  console.log('  <commit-hash>    Git commit hash to rollback from');
  console.log('  --file=<path>    File path to rollback');
  console.log('  --dry-run        Show what would be done without making changes');
  console.log('  --help, -h       Show this help message\n');
  console.log('Examples:');
  console.log('  node cerber-rollback.js abc123 --file=src/api/users.ts');
  console.log('  node cerber-rollback.js abc123 --file=src/api/users.ts --dry-run');
  process.exit(0);
}

let commitHash = null;
let filePath = null;
let isDryRun = false;

args.forEach(arg => {
  if (arg === '--dry-run') {
    isDryRun = true;
  } else if (arg.startsWith('--file=')) {
    filePath = arg.split('=')[1];
  } else if (!arg.startsWith('--')) {
    commitHash = arg;
  }
});

if (!commitHash) {
  console.error('❌ Error: Commit hash is required\n');
  console.log('Usage: node cerber-rollback.js <commit-hash> --file=path/to/file.ts\n');
  process.exit(1);
}

if (!filePath) {
  console.error('❌ Error: File path is required\n');
  console.log('Usage: node cerber-rollback.js <commit-hash> --file=path/to/file.ts\n');
  process.exit(1);
}

console.log(`Commit: ${commitHash}`);
console.log(`File: ${filePath}`);
console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`);

/**
 * Check if we're in a git repository
 */
function checkGitRepo() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    console.log('✅ Git repository detected\n');
    return true;
  } catch (error) {
    console.error('❌ Error: Not a git repository\n');
    return false;
  }
}

/**
 * Verify commit exists
 */
function verifyCommit(hash) {
  try {
    execSync(`git cat-file -t ${hash}`, { stdio: 'pipe' });
    const commitMsg = execSync(`git log -1 --pretty=format:"%s" ${hash}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log(`✅ Commit found: "${commitMsg}"\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error: Commit ${hash} not found\n`);
    return false;
  }
}

/**
 * Check if file exists in commit
 */
function checkFileInCommit(hash, file) {
  try {
    execSync(`git cat-file -e ${hash}:${file}`, { stdio: 'pipe' });
    console.log(`✅ File exists in commit ${hash}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Error: File ${file} does not exist in commit ${hash}\n`);
    return false;
  }
}

/**
 * Check for uncommitted changes
 */
function checkUncommittedChanges(file) {
  try {
    const status = execSync(`git status --porcelain ${file}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (status.trim()) {
      console.log(`⚠️  Warning: File ${file} has uncommitted changes\n`);
      console.log('   Current changes will be lost if you proceed!\n');
      return true;
    }
    
    console.log(`✅ No uncommitted changes for ${file}\n`);
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Show file diff
 */
function showDiff(hash, file) {
  try {
    console.log('📊 Changes that will be rolled back:\n');
    console.log('─'.repeat(60));
    
    const diff = execSync(`git diff HEAD ${hash} -- ${file}`, { 
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    if (diff) {
      // Show first 30 lines
      const lines = diff.split('\n').slice(0, 30);
      console.log(lines.join('\n'));
      
      if (diff.split('\n').length > 30) {
        console.log('\n... (diff truncated, showing first 30 lines) ...');
      }
    } else {
      console.log('(no changes - file is identical)');
    }
    
    console.log('─'.repeat(60));
    console.log();
  } catch (error) {
    console.log('⚠️  Could not generate diff\n');
  }
}

/**
 * Perform rollback
 */
function rollbackFile(hash, file) {
  try {
    console.log(`🔄 Rolling back ${file} to ${hash}...\n`);
    
    if (!isDryRun) {
      execSync(`git checkout ${hash} -- ${file}`, { stdio: 'inherit' });
      console.log('✅ Rollback successful!\n');
      console.log('💡 Changes are staged. Run `git status` to review.\n');
      console.log('   To commit: git commit -m "rollback: revert changes to ${file}"');
      console.log('   To undo: git checkout HEAD -- ${file}\n');
    } else {
      console.log('🔍 DRY RUN: Would execute: git checkout ${hash} -- ${file}\n');
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error during rollback: ${error.message}\n`);
    return false;
  }
}

// Run checks and rollback
if (!checkGitRepo()) {
  process.exit(1);
}

if (!verifyCommit(commitHash)) {
  process.exit(1);
}

if (!checkFileInCommit(commitHash, filePath)) {
  process.exit(1);
}

const hasUncommitted = checkUncommittedChanges(filePath);

if (hasUncommitted && !isDryRun) {
  console.log('⚠️  SAFETY CHECK: Uncommitted changes detected\n');
  console.log('   Options:');
  console.log('   1. Commit your current changes first');
  console.log('   2. Stash your changes: git stash');
  console.log('   3. Run with --dry-run to preview\n');
  console.log('❌ Rollback aborted for safety\n');
  process.exit(1);
}

showDiff(commitHash, filePath);

const success = rollbackFile(commitHash, filePath);

console.log('='.repeat(60));

process.exit(success ? 0 : 1);
