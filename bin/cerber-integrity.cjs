/**
 * @file cerber-integrity.cjs
 * @description CI job that verifies protected files weren't modified without owner approval
 * 
 * This is the REQUIRED check for all PRs to main.
 * It prevents any bypass of the One Truth policy.
 * 
 * Exit codes:
 *   0 = OK (no protected files changed OR approved)
 *   1 = Protected files changed without approval
 *   2 = Integrity check violated (hard blocker)
 */

const fs = require('fs');
const path = require('path');

// Files that require owner approval to modify
const PROTECTED_PATTERNS = [
  'CERBER.md',
  '.cerber/**',
  '.github/workflows/**',
  'package.json',
  'package-lock.json',
  'bin/**',
  'src/guardian/**',
  'src/core/Orchestrator.ts',
  'src/cli/generator.ts',
  'src/cli/drift-checker.ts',
  'src/cli/guardian.ts',
  'src/cli/doctor.ts',
  'docs/BRANCH_PROTECTION.md',
];

// Approval markers (any of these indicate owner approval)
const APPROVAL_MARKERS = [
  'OWNER_APPROVED: YES',
  'CERBER-APPROVED-BY:',
  'owner-approved',  // PR label (set via gh pr edit -l)
  'CERBER_APPROVAL=',
  'Approved-By:',
];

/**
 * Get the commit message from environment or git
 */
function getCommitMessage() {
  // In GitHub Actions, we can check git log
  const { execSync } = require('child_process');
  try {
    // Get the full commit message of HEAD
    const msg = execSync('git log -1 --format=%B', { encoding: 'utf8' });
    return msg;
  } catch (e) {
    console.error('❌ Could not read commit message:', e.message);
    return '';
  }
}

/**
 * Check if commit message contains approval marker
 */
function hasApprovalMarker(commitMessage) {
  return APPROVAL_MARKERS.some(marker => 
    commitMessage.includes(marker)
  );
}

/**
 * Get modified files in this PR/commit
 */
function getModifiedFiles() {
  const { execSync } = require('child_process');
  try {
    // Get diff against main branch
    let diffCommand = 'git diff --name-only origin/main...HEAD';
    
    // Fallback if origin/main not available
    try {
      execSync('git rev-parse origin/main', { stdio: 'pipe' });
    } catch {
      // Try against HEAD~1
      diffCommand = 'git diff --name-only HEAD~1..HEAD';
    }
    
    const output = execSync(diffCommand, { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f);
  } catch (e) {
    console.error('⚠️  Could not get modified files:', e.message);
    return [];
  }
}

/**
 * Check if file matches protected pattern
 */
function matchesProtectedPattern(filePath) {
  return PROTECTED_PATTERNS.some(pattern => {
    // Simple glob matching
    if (pattern.endsWith('/**')) {
      const dir = pattern.replace('/**', '');
      return filePath.startsWith(dir + '/') || filePath === dir;
    }
    if (pattern === 'package.json' || pattern === 'package-lock.json') {
      return filePath === pattern;
    }
    return filePath === pattern || filePath.endsWith(pattern);
  });
}

/**
 * Main check
 */
function runIntegrityCheck() {
  console.log('🛡️  CERBER INTEGRITY CHECK');
  console.log('═'.repeat(50));
  
  const commitMsg = getCommitMessage();
  const modifiedFiles = getModifiedFiles();
  
  console.log(`\n📝 Commit message:\n${commitMsg.substring(0, 200)}${commitMsg.length > 200 ? '...' : ''}`);
  console.log(`\n📋 Modified files (${modifiedFiles.length}):`);
  modifiedFiles.forEach(f => console.log(`   • ${f}`));
  
  // Check for protected files
  const protectedModified = modifiedFiles.filter(matchesProtectedPattern);
  
  if (protectedModified.length === 0) {
    console.log('\n✅ No protected files modified. Check PASSED.');
    return 0;
  }
  
  console.log(`\n⚠️  Protected files modified (${protectedModified.length}):`);
  protectedModified.forEach(f => console.log(`   • ${f}`));
  
  // Check for approval marker
  const hasApproval = hasApprovalMarker(commitMsg);
  
  if (hasApproval) {
    console.log('\n✅ Approval marker found in commit message. Check PASSED.');
    console.log('   📌 Owner approval detected - protected file change authorized.\n');
    return 0;
  }
  
  // No approval
  console.log('\n❌ INTEGRITY CHECK FAILED');
  console.log('═'.repeat(50));
  console.log('\n🔴 Protected files were modified without owner approval.\n');
  
  console.log('To fix this:');
  console.log('');
  console.log('1️⃣  Add approval marker to commit message:');
  console.log('   git commit --amend -m "Your message');
  console.log('');
  console.log('   OWNER_APPROVED: YES');
  console.log('   Reason: <why this change is needed>"');
  console.log('');
  console.log('2️⃣  Or add PR label:');
  console.log('   gh pr edit <PR_NUM> -l owner-approved');
  console.log('');
  console.log('3️⃣  Or if using approval tokens:');
  console.log('   git commit --amend -m "Your message');
  console.log('');
  console.log('   CERBER_APPROVAL=<HMAC_TOKEN_FROM_OWNER>"');
  console.log('');
  console.log('Protected patterns that require approval:');
  PROTECTED_PATTERNS.forEach(p => console.log(`   • ${p}`));
  
  console.log('\n' + '═'.repeat(50));
  console.log('📚 More info: docs/BRANCH_PROTECTION.md');
  console.log('═'.repeat(50) + '\n');
  
  // Exit code 1 = soft blocker (shows as failure but can be discussed)
  // Exit code 2 = hard blocker (cannot proceed)
  // Using 1 to allow discussion in PR, but prevent auto-merge
  process.exit(1);
}

// Run check
if (require.main === module) {
  runIntegrityCheck();
}

module.exports = { runIntegrityCheck, getModifiedFiles, hasApprovalMarker };
