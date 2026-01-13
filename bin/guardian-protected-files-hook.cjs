#!/usr/bin/env node

/**
 * Guardian Pre-Commit Hook: Protected Files Policy
 * 
 * Blocks commits that modify protected files without explicit acknowledgment
 * Files: CERBER.md, .cerber/**, contract.yml, guardian/**
 * 
 * Usage:
 *   git commit -m "message"                           # Blocks if protected files staged
 *   git commit -m "message" --ack-protected           # Bypasses with acknowledgment
 *   git commit -m "message" --owner-ack "reason..."   # Requires justification
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROTECTED_PATTERNS = [
  'CERBER.md',
  'CERBER.yml',
  '.cerber/contract.yml',
  '.cerber/contracts/**',
  'bin/cerber-guardian',
  'src/guardian/**',
  'src/contracts/**',
  'src/core/Orchestrator.ts',
  'package.json',
  'tsconfig.json',
];

const BYPASS_FLAGS = ['--ack-protected', '--owner-ack'];

/**
 * Check if file matches any protected pattern
 */
function isProtectedFile(filePath) {
  return PROTECTED_PATTERNS.some((pattern) => {
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '[\\\\/]');
    return new RegExp(`^${regex}$`).test(filePath);
  });
}

/**
 * Get staged files
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Check for bypass flags in git commit message
 */
function hasBypassFlag() {
  const commitMsg = process.env.GIT_COMMIT_MESSAGE || '';
  return BYPASS_FLAGS.some((flag) => commitMsg.includes(flag));
}

/**
 * Main guardian check
 */
function checkProtectedFiles() {
  const stagedFiles = getStagedFiles();
  const protectedModified = stagedFiles.filter(isProtectedFile);

  if (protectedModified.length === 0) {
    // No protected files modified, allow commit
    process.exit(0);
  }

  // Protected files are staged
  const hasFlag = hasBypassFlag();

  console.error(`
╔════════════════════════════════════════════════════════════════╗
║          🛡️  PROTECTED FILES POLICY - GUARDIAN CHECK          ║
╚════════════════════════════════════════════════════════════════╝

⚠️  The following PROTECTED files are staged for commit:
${protectedModified.map((f) => `   • ${f}`).join('\n')}

These files require explicit OWNER acknowledgment to prevent
accidental breaking changes to contract, guardian policy, or core.

${
  hasFlag
    ? `✅ Bypass flag detected (--ack-protected / --owner-ack)
   Proceeding with acknowledgment...`
    : `❌ Cannot commit without acknowledgment.

To proceed, use one of:
  • git commit -m "message" --ack-protected
  • git commit -m "message" --owner-ack "reason for change"

If you believe this is an error, contact @owner.`
}

╚════════════════════════════════════════════════════════════════╝
`);

  if (!hasFlag) {
    process.exit(2); // Blocker exit code
  }

  // Flag detected - allow but log acknowledgment
  console.log(
    '\n✅ Commit allowed with protected file acknowledgment.\n'
  );
  process.exit(0);
}

// Run check
checkProtectedFiles();
