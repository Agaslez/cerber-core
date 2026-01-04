import { existsSync } from 'fs';
import { resolve } from 'path';
import { parseCerberContract } from './contract-parser.js';
import { validateOverride } from './override-validator.js';
import type { CerberContract } from './types.js';

export interface DoctorResult {
  success: boolean;
  exitCode: number;
  issues: DoctorIssue[];
  contract?: CerberContract;
}

export interface DoctorIssue {
  type: 'missing' | 'warning' | 'info';
  file: string;
  message: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
}

export async function runDoctor(cwd: string = process.cwd()): Promise<DoctorResult> {
  const issues: DoctorIssue[] = [];
  let exitCode = 0;

  const cerberMdPath = resolve(cwd, 'CERBER.md');
  if (!existsSync(cerberMdPath)) {
    issues.push({
      type: 'missing',
      file: 'CERBER.md',
      message: 'Contract file not found',
      severity: 'critical'
    });
    return { success: false, exitCode: 2, issues };
  }

  const parseResult = await parseCerberContract(cwd);
  if (!parseResult.success || !parseResult.contract) {
    issues.push({
      type: 'warning',
      file: 'CERBER.md',
      message: 'Parse error: ' + (parseResult.error?.message || 'Unknown'),
      severity: 'error'
    });
    return { success: false, exitCode: 2, issues };
  }

  const contract = parseResult.contract;

  if (contract.schema.enabled && contract.schema.mode === 'strict') {
    const schemaPath = resolve(cwd, contract.schema.file);
    if (!existsSync(schemaPath)) {
      issues.push({
        type: 'missing',
        file: contract.schema.file,
        message: 'Schema file required in strict mode',
        severity: 'critical'
      });
      if (exitCode === 0) exitCode = 3;
    }
  }

  if (contract.guardian.enabled && contract.guardian.hook === 'husky') {
    const preCommitPath = resolve(cwd, '.husky', 'pre-commit');
    if (!existsSync(preCommitPath)) {
      issues.push({
        type: 'missing',
        file: '.husky/pre-commit',
        message: 'Pre-commit hook not found',
        severity: 'error'
      });
      if (exitCode === 0) exitCode = 4;
    }
  }

  if (contract.guardian.enabled) {
    const guardianScriptPath = resolve(cwd, 'scripts', 'cerber-guardian.mjs');
    if (!existsSync(guardianScriptPath)) {
      issues.push({
        type: 'missing',
        file: 'scripts/cerber-guardian.mjs',
        message: 'Guardian script not found',
        severity: 'error'
      });
      if (exitCode === 0) exitCode = 4;
    }
  }

  if (contract.ci.provider === 'github') {
    const workflowPath = resolve(cwd, '.github', 'workflows', 'cerber.yml');
    if (!existsSync(workflowPath)) {
      issues.push({
        type: 'missing',
        file: '.github/workflows/cerber.yml',
        message: 'GitHub workflow not found',
        severity: 'error'
      });
      if (exitCode === 0) exitCode = 4;
    }
  }

  return { success: exitCode === 0, exitCode, issues, contract };
}

export function printDoctorReport(result: DoctorResult): void {
  console.log('[Cerber Doctor] Setup Validation\n');

  if (result.success) {
    console.log('[OK] All checks passed!\n');
    
    if (result.contract) {
      console.log('Configuration:');
      console.log('  Mode: ' + result.contract.mode);
      console.log('  Guardian: ' + (result.contract.guardian.enabled ? 'enabled' : 'disabled'));
      console.log('  Health: ' + (result.contract.health.enabled ? 'enabled' : 'disabled'));
      console.log('  CI: ' + result.contract.ci.provider);
      
      // Check override state
      const overrideValidation = validateOverride(result.contract.override);
      console.log('  Override: ' + overrideValidation.state);
      
      if (overrideValidation.state === 'ACTIVE') {
        console.log('\n[WARN] Emergency override is ACTIVE');
        console.log('       Expires: ' + result.contract.override?.expires);
        console.log('       Reason: ' + result.contract.override?.reason);
      } else if (overrideValidation.state === 'EXPIRED') {
        console.log('         (Expired - treated as disabled)');
      } else if (overrideValidation.state === 'INVALID') {
        console.log('         (Invalid configuration)');
        if (overrideValidation.errors) {
          overrideValidation.errors.forEach((err: string) => {
            console.log('         - ' + err);
          });
        }
      }
      
      console.log('');
    }
    
    console.log('[READY] Ready to commit!');
    return;
  }

  console.log('[FAIL] Issues found:\n');
  
  const criticalIssues = result.issues.filter(i => i.severity === 'critical' || i.severity === 'error');

  criticalIssues.forEach(issue => {
    const icon = issue.severity === 'critical' ? '[!]' : '[WARN]';
    console.log(icon + ' ' + issue.file);
    console.log('    ' + issue.message + '\n');
  });

  console.log('Next Steps:\n');
  
  if (result.exitCode === 2) {
    console.log('1. Initialize Cerber:');
    console.log('   npx cerber init --mode=solo\n');
  } else if (result.exitCode === 3) {
    console.log('1. Create schema file (strict mode requires it):');
    console.log('   touch ' + (result.contract?.schema.file || 'BACKEND_SCHEMA.mjs') + '\n');
    console.log('2. Or change schema mode to template_only in CERBER.md\n');
  } else if (result.exitCode === 4) {
    console.log('1. Re-run initialization to generate missing files:');
    console.log('   npx cerber init\n');
  }

  console.log('Help: https://github.com/Agaslez/cerber-core/discussions');
}
