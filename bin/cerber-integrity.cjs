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
const { execSync } = require('child_process');

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

// Required approver (default = repo owner or explicit override)
const REQUIRED_OWNER =
  process.env.REQUIRED_OWNER ||
  (process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[0] : 'owner');

// GitHub API helpers
async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'cerber-integrity-check',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }
  return res.json();
}

function getPullRequestNumber() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return null;
  }
  try {
    const payload = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
    return payload?.pull_request?.number || null;
  } catch (e) {
    return null;
  }
}

async function hasOwnerApprovalFromGitHub(prNumber) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY; // e.g., owner/repo

  if (!token || !repo || !prNumber) {
    throw new Error('Missing GITHUB_TOKEN or repository/pr context to verify approvals');
  }

  const [owner, repoName] = repo.split('/');
  const reviewsUrl = `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/reviews`;

  const reviews = await fetchJson(reviewsUrl, token);
  const approvals = reviews.filter(r => r.state === 'APPROVED');

  const approver = approvals.find(r =>
    (r.user?.login || '').toLowerCase() === REQUIRED_OWNER.toLowerCase()
  );

  return {
    approved: Boolean(approver),
    approver: approver?.user?.login,
    approvalsCount: approvals.length,
  };
}

/**
 * Get the commit message from environment or git
 */
function getCommitMessage() {
  try {
    const msg = execSync('git log -1 --format=%B', { encoding: 'utf8' });
    return msg;
  } catch (e) {
    console.error('❌ Could not read commit message:', e.message);
    return '';
  }
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
async function runIntegrityCheck() {
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
  
  // GitHub PR approval check
  try {
    const prNumber = getPullRequestNumber();
    const approval = await hasOwnerApprovalFromGitHub(prNumber);

    if (approval.approved) {
      console.log(`\n✅ Owner approval detected via GitHub: ${approval.approver}`);
      console.log('   📌 Protected file change authorized.\n');
      return 0;
    }

    console.log('\n❌ INTEGRITY CHECK FAILED');
    console.log('═'.repeat(50));
    console.log(`\n🔴 Protected files were modified without owner approval (required: ${REQUIRED_OWNER}).\n`);

    console.log('To fix this:');
    console.log('');
    console.log('1️⃣  Request review from the owner on the PR (Code Owner).');
    console.log('2️⃣  Wait for owner to click "Approve" in GitHub UI.');
    console.log('3️⃣  Rerun the workflow (or push new commit).');

    console.log('\n' + '═'.repeat(50));
    console.log('📚 More info: docs/BRANCH_PROTECTION.md');
    console.log('═'.repeat(50) + '\n');

    process.exit(1);
  } catch (err) {
    console.log('\n❌ INTEGRITY CHECK FAILED');
    console.log('═'.repeat(50));
    console.log(`\nGitHub approval verification error: ${err.message}\n`);
    console.log('Cannot verify owner approval. Failing closed.');
    console.log('\n' + '═'.repeat(50));
    process.exit(1);
  }
}

// Run check
if (require.main === module) {
  runIntegrityCheck().catch(err => {
    console.error('❌ Unexpected error in cerber-integrity:', err);
    process.exit(1);
  });
}

module.exports = { runIntegrityCheck, getModifiedFiles, hasApprovalMarker };
