/**
 * Template generator for Cerber init
 * 
 * Generates files based on CERBER_CONTRACT and mode
 * 
 * @author Stefan Pitek
 * @license MIT
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { CerberContract, GeneratedFile, InitOptions } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TemplateGenerator {
  private projectRoot: string;
  private contract: CerberContract;
  private options: InitOptions;
  private templateRoot: string;
  
  constructor(projectRoot: string, contract: CerberContract, options: InitOptions = {}) {
    this.projectRoot = projectRoot;
    this.contract = contract;
    this.options = options;
    this.templateRoot = path.resolve(__dirname, '..', '..');
  }
  
  async generateAll(): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // Guardian files
    if (this.contract.guardian.enabled && !this.options.noHusky) {
      files.push(...await this.generateGuardianFiles());
    }
    
    // Health files
    if (this.contract.health.enabled && !this.options.noHealth) {
      files.push(...await this.generateHealthFiles());
    }
    
    // CI workflow
    if (this.contract.ci.provider === 'github' && !this.options.noWorkflow) {
      files.push(...await this.generateCIFiles());
    }
    
    // Team mode extras
    if (this.contract.mode === 'team') {
      files.push(...await this.generateTeamFiles());
    }
    
    return files;
  }
  
  private async generateGuardianFiles(): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    const guardianScript = await this.renderTemplate('cerber-guardian.mjs.tpl', {
      SCHEMA_FILE: this.contract.guardian.schemaFile,
      APPROVALS_TAG: this.contract.guardian.approvalsTag
    });
    files.push({
      path: path.join(this.projectRoot, 'scripts', 'cerber-guardian.mjs'),
      content: guardianScript,
      generated: true
    });
    
    // .husky/pre-commit
    if (this.contract.guardian.hook === 'husky') {
      const preCommitHook = await this.renderTemplate('pre-commit.tpl', {
        GUARDIAN_COMMAND: 'npm run cerber:guardian'
      });
      files.push({
        path: path.join(this.projectRoot, '.husky', 'pre-commit'),
        content: preCommitHook,
        generated: true
      });
    }
    
    return files;
  }
  
  private async generateHealthFiles(): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // src/cerber/health-checks.ts
    const healthChecks = await this.renderTemplate('health-checks.ts.tpl', {});
    files.push({
      path: path.join(this.projectRoot, 'src', 'cerber', 'health-checks.ts'),
      content: healthChecks,
      generated: true
    });
    
    // src/cerber/health-route.ts
    const healthRoute = await this.renderTemplate('health-route.ts.tpl', {
      HEALTH_ENDPOINT: this.contract.health.endpoint
    });
    files.push({
      path: path.join(this.projectRoot, 'src', 'cerber', 'health-route.ts'),
      content: healthRoute,
      generated: true
    });
    
    return files;
  }
  
  private async generateCIFiles(): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // .github/workflows/cerber.yml
    const postDeployEnabled = this.contract.ci.postDeploy.enabled;
    const workflow = await this.renderTemplate('cerber.yml.tpl', {
      CI_BRANCHES: JSON.stringify(this.contract.ci.branches),
      HEALTH_URL_VAR: this.contract.ci.postDeploy.healthUrlVar,
      WAIT_SECONDS: String(this.contract.ci.postDeploy.waitSeconds),
      FAIL_ON_ERROR: String(this.contract.health.failOn.error),
      FAIL_ON_WARNING: String(this.contract.health.failOn.warning),
      POST_DEPLOY_BLOCK: postDeployEnabled ? this.getPostDeployBlock() : ''
    });
    files.push({
      path: path.join(this.projectRoot, '.github', 'workflows', 'cerber.yml'),
      content: workflow,
      generated: true
    });
    
    return files;
  }
  
  private async generateTeamFiles(): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];
    
    // .github/CODEOWNERS
    const owners = this.contract.team?.schemaOwners?.join(' ') || '@OWNER_USERNAME';
    const codeowners = await this.renderTemplate('CODEOWNERS.tpl', {
      SCHEMA_FILE: this.contract.guardian.schemaFile,
      OWNERS: owners
    });
    files.push({
      path: path.join(this.projectRoot, '.github', 'CODEOWNERS'),
      content: codeowners,
      generated: true
    });
    
    return files;
  }
  
  async writeFiles(files: GeneratedFile[]): Promise<void> {
    for (const file of files) {
      if (this.options.dryRun) {
        console.log(`[DRY RUN] Would create: ${file.path}`);
        continue;
      }
      
      // Check if file exists
      const exists = await fs.access(file.path).then(() => true).catch(() => false);
      
      if (exists && !this.options.force) {
        console.log(`⚠️  Skipping (already exists): ${path.relative(this.projectRoot, file.path)}`);
        continue;
      }
      
      // Create directory if needed
      await fs.mkdir(path.dirname(file.path), { recursive: true });
      
      // Write file
      await fs.writeFile(file.path, file.content, 'utf-8');
      console.log(`✅ Generated: ${path.relative(this.projectRoot, file.path)}`);

      // Ensure husky hook is executable when applicable
      if (file.path.endsWith('.husky/pre-commit')) {
        const success = await this.ensureExecutable(file.path);
        if (!success) {
          console.log(`   ℹ️  If hook doesn't run, execute: git add ${path.relative(this.projectRoot, file.path)} && git update-index --chmod=+x ${path.relative(this.projectRoot, file.path)}`);
        }
      }
    }
  }
  
  private async renderTemplate(templateName: string, replacements: Record<string, string>): Promise<string> {
    const templateContent = await this.loadTemplate(templateName);
    return this.applyReplacements(templateContent, replacements);
  }
  
  private async loadTemplate(templateName: string): Promise<string> {
    // Prefer mode-specific template, fallback to solo
    const modeDir = path.join(this.templateRoot, this.contract.mode, 'templates');
    const soloDir = path.join(this.templateRoot, 'solo', 'templates');
    const modePath = path.join(modeDir, templateName);
    const fallbackPath = path.join(soloDir, templateName);
    const chosenPath = await fs.access(modePath).then(() => modePath).catch(() => fallbackPath);
    return fs.readFile(chosenPath, 'utf-8');
  }
  
  private applyReplacements(template: string, replacements: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      const token = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(token, value);
    }
    return result;
  }
  
  private getPostDeployBlock(): string {
    return `  cerber-postdeploy:
    name: Post-Deploy Health Gate
    runs-on: ubuntu-latest
    needs: []
    env:
      CERBER_HEALTH_URL: \${{ vars.${this.contract.ci.postDeploy.healthUrlVar} }}
      CERBER_AUTH_HEADER: \${{ secrets.${this.contract.ci.postDeploy.authHeaderSecret || 'CERBER_HEALTH_AUTH_HEADER'} }}
    steps:
      - name: Wait for deployment
        run: sleep ${this.contract.ci.postDeploy.waitSeconds}

      - name: Verify production health
        run: |
          node -e "const wait=${this.contract.ci.postDeploy.waitSeconds}; const url=process.env.CERBER_HEALTH_URL; const auth=process.env.CERBER_AUTH_HEADER; if(!url){console.error('CERBER_HEALTH_URL not set'); process.exit(1);} const opts=auth?{headers:{Authorization:auth}}:{}; (async()=>{await new Promise(r=>setTimeout(r,wait*1000)); const res=await fetch(url,opts); const json=await res.json(); const s=json.summary||{}; const crit=s.criticalIssues||0; const err=s.errorIssues||0; const warn=s.warningIssues||0; console.log('Health summary', s); if(crit>0){console.error('Critical issues detected'); process.exit(1);} if(${this.contract.health.failOn.error} && err>0){console.error('Error issues detected'); process.exit(1);} if(${this.contract.health.failOn.warning} && warn>0){console.error('Warning issues detected'); process.exit(1);} console.log('✅ Production health check passed');})();"`;
  }
  
  private async ensureExecutable(filePath: string): Promise<boolean> {
    try {
      await fs.chmod(filePath, 0o755);
    } catch (err) {
      // ignore chmod issues on Windows
    }
    
    // Try to make it executable in git (only works if file is already staged)
    try {
      // First, try to add to git if in a git repo
      await new Promise<void>((resolve, reject) => {
        exec('git rev-parse --git-dir', (err) => {
          if (err) {
            reject(err);
          } else {
            exec(`git add "${filePath}"`, (addErr) => {
              if (addErr) {
                reject(addErr);
              } else {
                exec(`git update-index --chmod=+x "${filePath}"`, (chmodErr) => {
                  if (chmodErr) reject(chmodErr);
                  else resolve();
                });
              }
            });
          }
        });
      });
      return true;
    } catch (err) {
      // git not available or failed - return false to show manual instruction
      return false;
    }
  }
}
