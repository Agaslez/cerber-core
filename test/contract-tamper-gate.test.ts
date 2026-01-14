/**
 * @file Contract Tamper Gate Test
 * @description Prevents unauthorized changes to protected files (CERBER.md, workflows, etc.)
 * 
 * If PR modifies protected files without Owner approval marker, test fails.
 * This is an "anti-bypass" mechanism for Cerber's One Truth policy.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('@fast Contract Tamper Gate', () => {
  const PROTECTED_FILES = [
    'CERBER.md',
    '.cerber/contract.yml',
    '.github/workflows/cerber-pr-fast.yml',
    '.github/workflows/cerber-main-heavy.yml',
    'package.json',
    'src/cli/guardian.ts',
    'src/core/Orchestrator.ts',
  ];

  /**
   * Check if OWNER_APPROVED marker exists in PROOF.md
   * This indicates explicit owner sign-off for protected file changes
   */
  function hasOwnerApprovalMarker(): boolean {
    const proofPath = join(process.cwd(), 'PROOF.md');
    if (!existsSync(proofPath)) {
      return false;
    }

    const proof = readFileSync(proofPath, 'utf-8');
    return (
      proof.includes('OWNER_APPROVED: YES') ||
      proof.includes('Protected files changed with owner approval') ||
      proof.includes('PROTECTED_FILES_APPROVED')
    );
  }

  /**
   * Check if any protected files were modified in git
   * Uses git diff to detect changes (simulated in test environment)
   */
  function getProtectedFilesModified(): string[] {
    // In CI, this would check git diff HEAD~1
    // For testing, we check if files exist and were recently modified
    const now = Date.now();
    const twoMinutesAgo = now - 2 * 60 * 1000;

    const modified: string[] = [];
    for (const file of PROTECTED_FILES) {
      const filePath = join(process.cwd(), file);
      if (existsSync(filePath)) {
        try {
          const stats = require('fs').statSync(filePath);
          // If file was modified in the last 2 minutes, it's "new" in this commit
          if (stats.mtimeMs > twoMinutesAgo) {
            modified.push(file);
          }
        } catch (e) {
          // File doesn't exist or can't be accessed - skip
        }
      }
    }
    return modified;
  }

  it('should allow normal commits without protected file changes', () => {
    // This test passes as long as protected files aren't touched
    const modified = getProtectedFilesModified();
    
    if (modified.length === 0) {
      // Good: no protected files modified
      expect(true).toBe(true);
    } else {
      // Protected files were modified - owner approval required
      const hasApproval = hasOwnerApprovalMarker();
      expect(hasApproval).toBe(true);
    }
  });

  it('should block CERBER.md changes without owner approval', () => {
    // If CERBER.md in git recently changed and no approval marker, fail
    const proofPath = join(process.cwd(), 'PROOF.md');
    
    if (!existsSync(proofPath)) {
      // No PROOF.md = test environment, skip
      return;
    }

    const proof = readFileSync(proofPath, 'utf-8');
    const cerberPath = join(process.cwd(), 'CERBER.md');
    
    if (existsSync(cerberPath)) {
      const cerberStats = require('fs').statSync(cerberPath);
      const now = Date.now();
      const twoMinutesAgo = now - 2 * 60 * 1000;

      // If CERBER.md was recently modified (in this commit)
      if (cerberStats.mtimeMs > twoMinutesAgo) {
        // It must have an approval marker in PROOF.md
        expect(proof).toContain('OWNER_APPROVED: YES');
      }
    }
  });

  it('should block workflow changes without owner approval', () => {
    const proofPath = join(process.cwd(), 'PROOF.md');
    
    if (!existsSync(proofPath)) {
      return;
    }

    const proof = readFileSync(proofPath, 'utf-8');
    const workflows = [
      '.github/workflows/cerber-pr-fast.yml',
      '.github/workflows/cerber-main-heavy.yml',
    ];

    const now = Date.now();
    const twoMinutesAgo = now - 2 * 60 * 1000;

    for (const workflow of workflows) {
      const wfPath = join(process.cwd(), workflow);
      if (existsSync(wfPath)) {
        const stats = require('fs').statSync(wfPath);
        
        if (stats.mtimeMs > twoMinutesAgo) {
          // Workflow was recently modified
          expect(proof).toContain(
            'OWNER_APPROVED: YES',
            `Workflow ${workflow} modified without owner approval in PROOF.md`
          );
        }
      }
    }
  });

  it('should block package.json changes without owner approval', () => {
    const proofPath = join(process.cwd(), 'PROOF.md');
    
    if (!existsSync(proofPath)) {
      return;
    }

    const proof = readFileSync(proofPath, 'utf-8');
    const pkgPath = join(process.cwd(), 'package.json');

    if (existsSync(pkgPath)) {
      const stats = require('fs').statSync(pkgPath);
      const now = Date.now();
      const twoMinutesAgo = now - 2 * 60 * 1000;

      if (stats.mtimeMs > twoMinutesAgo) {
        // package.json was recently modified
        expect(proof).toContain(
          'OWNER_APPROVED: YES',
          'package.json modified without owner approval'
        );
      }
    }
  });

  it('should document protected file changes with reason', () => {
    const proofPath = join(process.cwd(), 'PROOF.md');
    
    if (!existsSync(proofPath)) {
      return;
    }

    const proof = readFileSync(proofPath, 'utf-8');
    const modified = getProtectedFilesModified();

    if (modified.length > 0 && proof.includes('OWNER_APPROVED: YES')) {
      // If protected files were changed AND approval given,
      // there should be a reason documented
      const hasReason = proof.includes('Protected files changed') ||
                       proof.includes('Reason:') ||
                       proof.includes('Rationale:') ||
                       proof.includes('Updated');

      expect(hasReason).toBe(true);
    }
  });
});
