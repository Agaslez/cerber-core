import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { parseCerberContract } from './contract-parser.js';
import { tryShowCta } from './cta.js';
import { validateOverride } from './override-validator.js';
import type { CerberContract } from './types.js';

export interface ToolStatus {
  name: string;
  installed: boolean;
  version?: string;
  installCommand?: string;
}

export interface DoctorResult {
  success: boolean;
  exitCode: number;
  issues: DoctorIssue[];
  contract?: CerberContract;
  contractFound?: boolean;
  toolsStatus?: ToolStatus[];
}

export interface DoctorIssue {
  type: 'missing' | 'warning' | 'info';
  file: string;
  message: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
}

export async function getDoctorToolStatus(toolName: string): Promise<ToolStatus> {
  const tools: Record<string, { command: string; versionFlag: string; installCmd: string }> = {
    actionlint: {
      command: 'actionlint',
      versionFlag: '--version',
      installCmd: 'npm install actionlint'
    },
    zizmor: {
      command: 'zizmor',
      versionFlag: '--version',
      installCmd: 'npm install zizmor'
    },
    gitleaks: {
      command: 'gitleaks',
      versionFlag: '--version',
      installCmd: 'npm install gitleaks'
    }
  };

  const toolConfig = tools[toolName];
  if (!toolConfig) {
    return {
      name: toolName,
      installed: false,
      installCommand: `npm install ${toolName}`
    };
  }

  try {
    // Try to execute version command
    const versionOutput = execSync(`${toolConfig.command} ${toolConfig.versionFlag}`, {
      stdio: 'pipe',
      timeout: 5000
    }).toString().trim();

    // Extract version number (e.g., "actionlint 1.6.27" -> "1.6.27")
    const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+|\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : versionOutput.split('\n')[0];

    return {
      name: toolName,
      installed: true,
      version
    };
  } catch {
    return {
      name: toolName,
      installed: false,
      installCommand: toolConfig.installCmd
    };
  }
}

export async function runDoctor(cwd: string = process.cwd()): Promise<DoctorResult> {
  const issues: DoctorIssue[] = [];
  let exitCode = 0;

  // Check for contract file
  const contractPath = resolve(cwd, '.cerber', 'contract.yml');
  let contract: CerberContract | undefined;
  let contractFound = false;

  const cerberMdPath = resolve(cwd, 'CERBER.md');
  if (!existsSync(cerberMdPath)) {
    issues.push({
      type: 'missing',
      file: 'CERBER.md',
      message: 'Contract file not found',
      severity: 'critical'
    });
    contractFound = false;
  } else {
    contractFound = true;
  }

  // Get tool status
  const toolsStatus = await Promise.all([
    getDoctorToolStatus('actionlint'),
    getDoctorToolStatus('zizmor'),
    getDoctorToolStatus('gitleaks')
  ]);

  if (contractFound) {
    try {
      const parseResult = await parseCerberContract(cwd);
      if (parseResult.success && parseResult.contract) {
        contract = parseResult.contract;
      } else {
        issues.push({
          type: 'warning',
          file: 'CERBER.md',
          message: 'Parse error: ' + (parseResult.error?.message || 'Unknown'),
          severity: 'error'
        });
      }
    } catch (e) {
      // Ignore parse errors
    }

    // Additional checks if contract is found
    if (contract) {
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
    }
  } else {
    exitCode = 2;
  }

  // Set exit code based on tool status if we have a contract
  if (contractFound && exitCode === 0) {
    const missingTools = toolsStatus.filter(t => !t.installed);
    if (missingTools.length > 0) {
      exitCode = 1; // Warning level for missing tools
    }
  }

  return { 
    success: exitCode === 0, 
    exitCode, 
    issues, 
    contract,
    contractFound,
    toolsStatus
  };
}

export function printDoctorReport(result: DoctorResult): void {
  console.log('[Cerber Doctor] Setup Validation\n');

  // Show contract status
  if (result.contractFound) {
    console.log('✅ Contract: .cerber/contract.yml found');
    if (result.contract) {
      console.log(`   Profile: ${result.contract.mode}`);
    }
  } else {
    console.log('❌ Contract: .cerber/contract.yml missing');
  }
  console.log('');

  // Show tool status
  if (result.toolsStatus && result.toolsStatus.length > 0) {
    console.log('Tools:');
    result.toolsStatus.forEach(tool => {
      if (tool.installed && tool.version) {
        console.log(`✅ ${tool.name} v${tool.version}`);
      } else {
        console.log(`⚠️  ${tool.name} not found`);
      }
    });
    console.log('');

    // Show status summary
    const readyCount = result.toolsStatus.filter(t => t.installed).length;
    const totalTools = result.toolsStatus.length;
    console.log(`Status: ${readyCount}/${totalTools} tools ready`);

    if (result.exitCode > 0) {
      console.log('');
      const missingTools = result.toolsStatus.filter(t => !t.installed);
      if (missingTools.length > 0) {
        const fixes = missingTools.map(t => t.installCommand).filter(Boolean);
        if (fixes.length > 0) {
          console.log('Fix: ' + fixes.join(' && '));
        }
      }
      if (!result.contractFound) {
        console.log('\nFix: npx cerber init --mode=solo');
      }
    } else {
      console.log('\n[READY] All checks passed! Ready to commit.');
    }
  } else if (result.success) {
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
    
    // Show CTA after success
    tryShowCta(true);
    
    return;
  } else {
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
    
    // Don't show CTA on failure
    tryShowCta(false);
  }
}
