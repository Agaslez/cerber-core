#!/usr/bin/env node

/**
 * Guardian Commit Signature Verification
 * 
 * Verifies that commits modifying protected files are properly signed
 * or come from approved maintainers.
 * 
 * Requirements:
 * - Protected file changes must be GPG-signed commits
 * - OR from pre-approved maintainer email list
 * - OR have explicit owner override
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROTECTED_FILES = [
  'CERBER.md',
  '.cerber/contract.yml',
  'bin/cerber-guardian',
  'src/guardian/**',
  'src/core/Orchestrator.ts',
  'package.json',
];

/**
 * Approved maintainer emails (read from contract or env)
 */
const APPROVED_MAINTAINERS = [
  process.env.GUARDIAN_OWNER_EMAIL || 'owner@cerber-core.dev',
  'maintainer@cerber-core.dev',
  'architect@cerber-core.dev',
];

/**
 * Check if commit is GPG-signed
 */
function isCommitSigned(commitSha) {
  try {
    const output = execSync(`git verify-commit ${commitSha}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { signed: true, verified: output.includes('Good signature') };
  } catch (e) {
    return { signed: false, verified: false, error: e.message };
  }
}

/**
 * Get commit author email
 */
function getCommitAuthorEmail(commitSha) {
  try {
    const output = execSync(`git show -s --format=%ae ${commitSha}`, {
      encoding: 'utf-8',
    });
    return output.trim();
  } catch (e) {
    return null;
  }
}

/**
 * Check if commit modifies protected files
 */
function modifiesProtectedFiles(commitSha) {
  try {
    const files = execSync(`git show --name-only --format="" ${commitSha}`, {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    return files.some((file) =>
      PROTECTED_FILES.some((pattern) => {
        const regex = pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*');
        return new RegExp(`^${regex}$`).test(file);
      })
    );
  } catch (e) {
    return false;
  }
}

/**
 * Verify commit integrity for protected files
 */
function verifyCommitIntegrity(commitSha) {
  const modifiesProtected = modifiesProtectedFiles(commitSha);

  if (!modifiesProtected) {
    // Regular commit - no extra verification needed
    return { valid: true, reason: 'Non-protected files only' };
  }

  // Commit modifies protected files - requires verification
  console.log(
    `\n🔍 Verifying commit modifying protected files: ${commitSha.substring(0, 7)}`
  );

  const signatureCheck = isCommitSigned(commitSha);
  const author = getCommitAuthorEmail(commitSha);

  // Check 1: Is it GPG-signed?
  if (signatureCheck.verified) {
    return {
      valid: true,
      reason: 'GPG-signed by trusted key',
      signed: true,
    };
  }

  // Check 2: Is author in approved list?
  if (author && APPROVED_MAINTAINERS.includes(author)) {
    return {
      valid: true,
      reason: `Author ${author} is approved maintainer`,
      author,
    };
  }

  // Check 3: Environment override?
  if (process.env.GUARDIAN_OVERRIDE === 'true') {
    return {
      valid: true,
      reason: 'Override enabled via GUARDIAN_OVERRIDE env var',
      override: true,
    };
  }

  // Failed all checks
  return {
    valid: false,
    reason: `Protected files modified but signature verification failed.
Author: ${author || 'unknown'}
Signed: ${signatureCheck.signed}
Approved maintainer: ${author ? APPROVED_MAINTAINERS.includes(author) : false}

To fix:
  1. Sign your commits: git config --global commit.gpgsign true
  2. Set up GPG key and add to GitHub
  3. Or add your email to APPROVED_MAINTAINERS
  4. Or set GUARDIAN_OVERRIDE=true for CI/CD`,
  };
}

/**
 * Main verification (can be called from CI/CD)
 */
function verify(commitSha) {
  const result = verifyCommitIntegrity(commitSha);

  if (!result.valid) {
    console.error(`\n❌ Commit verification FAILED:\n${result.reason}`);
    process.exit(1);
  }

  console.log(`✅ Commit verification passed: ${result.reason}`);
  process.exit(0);
}

// If called directly
if (require.main === module) {
  const commitSha = process.argv[2] || 'HEAD';
  verify(commitSha);
}

module.exports = { verifyCommitIntegrity, isCommitSigned, getCommitAuthorEmail };
