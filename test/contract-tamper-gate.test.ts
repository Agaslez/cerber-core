/**
 * @file Contract Tamper Gate Test
 * @description Prevents unauthorized changes to protected files (CERBER.md, workflows, etc.)
 * 
 * If PR modifies protected files without Owner approval marker, test fails.
 * This is an "anti-bypass" mechanism for Cerber's One Truth policy.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

describe('@fast Contract Tamper Gate', () => {
  const workflowPath = join(process.cwd(), '.github/workflows/cerber-pr-fast.yml');
  const integrityScriptPath = join(process.cwd(), 'bin/cerber-integrity.cjs');

  it('includes cerber_integrity job and PR FAST required summary in PR workflow', () => {
    const workflow = readFileSync(workflowPath, 'utf-8');

    expect(workflow).toContain('cerber_integrity:');
    expect(workflow).toContain('name: Cerber Integrity (Protected Files)');
    expect(workflow).toContain('GITHUB_TOKEN:');
    expect(workflow).toContain('REQUIRED_OWNER: owner');
    expect(workflow).toContain('name: PR FAST (required)');
    expect(workflow).toContain('needs: [lint_and_typecheck, build_and_test, cerber_integrity]');
  });

  it('enforces GitHub approval (reviews API) instead of file markers', () => {
    const script = readFileSync(integrityScriptPath, 'utf-8');

    expect(script).toContain('/pulls/${prNumber}/reviews');
    expect(script).toContain('GITHUB_TOKEN');
    expect(script).toContain('REQUIRED_OWNER');
    expect(script).toContain('Missing GITHUB_TOKEN');
  });

  it('protects critical files list', () => {
    const script = readFileSync(integrityScriptPath, 'utf-8');

    const requiredPatterns = [
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
    ];

    requiredPatterns.forEach(pattern => {
      expect(script).toContain(pattern);
    });
  });
});
