/**
 * Cerber init command
 * 
 * Initializes Cerber in client project with instant setup
 * 
 * @author Stefan Pitek
 * @license MIT
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { getDefaultContract, parseCerberContract } from './contract-parser.js';
import { TemplateGenerator } from './template-generator.js';
import { CerberContract, InitOptions } from './types.js';

const CERBER_MD_TEMPLATE = `# CERBER.md - Architecture Roadmap

> **This is your single source of truth. AI agents and developers enforce this contract.**

## CERBER_CONTRACT
\`\`\`yaml
version: 1
mode: dev  # solo | dev | team

guardian:
  enabled: true
  schemaFile: BACKEND_SCHEMA.ts
  hook: husky
  approvalsTag: ARCHITECT_APPROVED

health:
  enabled: true
  endpoint: /api/health
  failOn:
    critical: true
    error: true
    warning: false

ci:
  provider: github
  branches: [main]
  requiredOnPR: true
  postDeploy:
    enabled: false
    waitSeconds: 90
    healthUrlVar: CERBER_HEALTH_URL
    authHeaderSecret: CERBER_HEALTH_AUTH_HEADER
\`\`\`

---

## 🎯 Architecture Roadmap

**Status:** Initial Setup

### Phase 1: Foundation (Current)
- [ ] Setup Guardian pre-commit validation
- [ ] Configure health checks
- [ ] Integrate CI/CD pipeline

### Phase 2: Production Readiness
- [ ] Add monitoring
- [ ] Configure alerting
- [ ] Load testing

---

## 📋 Guidelines

### Code Organization
- Routes in \`src/routes/\`
- Business logic in \`src/services/\`
- Database schema in \`src/shared/schema.ts\`

### Standards
- TypeScript strict mode
- ESLint configuration
- Test coverage > 80%

---

## 🛡️ Guardian Rules

See \`${getDefaultContract().guardian.schemaFile}\` for complete architecture rules.

---

*This file is protected by CODEOWNERS. Changes require architect approval.*
`;

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const projectRoot = process.cwd();
  
  console.log(chalk.bold.cyan('🛡️  Cerber Core - Project Initialization'));
  console.log('');
  
  if (options.dryRun) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No files will be created'));
    console.log('');
  }
  
  // Step 1: Check for CERBER.md
  const cerberPath = path.join(projectRoot, 'CERBER.md');
  let contract = await parseCerberContract(projectRoot);
  
  if (!contract) {
    console.log(chalk.yellow('📄 CERBER.md not found'));
    console.log('Creating template...');
    console.log('');
    
    if (!options.dryRun) {
      await fs.writeFile(cerberPath, CERBER_MD_TEMPLATE, 'utf-8');
      console.log(chalk.green('✅ Created CERBER.md'));
    } else {
      console.log(chalk.gray('[DRY RUN] Would create CERBER.md'));
    }
    
    console.log('');
    console.log(chalk.bold('📝 Next Steps:'));
    console.log('1. Edit CERBER.md and customize the contract for your project');
    console.log('2. Set your desired mode: solo | dev | team');
    console.log('3. Run npx cerber init again to generate files');
    console.log('');
    
    return;
  }
  
  // Step 2: Override mode if specified
  if (options.mode) {
    console.log(chalk.blue(`📋 Overriding mode: ${contract.mode} → ${options.mode}`));
    contract.mode = options.mode;
  }
  
  console.log(chalk.bold(`📋 Contract found:`));
  console.log(`   Mode: ${chalk.cyan(contract.mode)}`);
  console.log(`   Guardian: ${contract.guardian.enabled ? chalk.green('enabled') : chalk.gray('disabled')}`);
  console.log(`   Health: ${contract.health.enabled ? chalk.green('enabled') : chalk.gray('disabled')}`);
  console.log(`   CI: ${contract.ci.provider}`);
  if (contract.ci.postDeploy.enabled) {
    console.log(`   Post-deploy gate: ${chalk.green('enabled')} → ${contract.ci.postDeploy.healthUrlVar}`);
  }
  console.log('');
  
  // Step 3: Generate files
  console.log(chalk.bold('🔧 Generating files...'));
  console.log('');
  
  const generator = new TemplateGenerator(projectRoot, contract, options);
  const files = await generator.generateAll();
  
  await generator.writeFiles(files);
  
  // Step 4: Update package.json
  if (!options.dryRun && contract.guardian.enabled) {
    await updatePackageJson(projectRoot);
  }
  
  console.log('');
  console.log(chalk.bold.green('✅ Cerber initialization complete!'));
  console.log('');
  
  // Step 5: Show next steps
  showNextSteps(contract, options);
}

async function updatePackageJson(projectRoot: string): Promise<void> {
  const packagePath = path.join(projectRoot, 'package.json');
  
  try {
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);
    
    if (!pkg.scripts) {
      pkg.scripts = {};
    }
    
    if (!pkg.scripts['cerber:guardian']) {
      pkg.scripts['cerber:guardian'] = 'node scripts/cerber-guardian.mjs';
      
      await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
      console.log(chalk.green('✅ Updated package.json scripts'));
    }
  } catch (err) {
    console.log(chalk.yellow('⚠️  Could not update package.json (file may not exist)'));
  }
}

function showNextSteps(contract: CerberContract, options: InitOptions): void {
  console.log(chalk.bold('📝 Next Steps:'));
  console.log('');
  
  if (contract.guardian.enabled && !options.noHusky) {
    console.log(chalk.cyan('1. Install Husky (if not already installed):'));
    console.log('   npm install husky --save-dev');
    console.log('   npx husky install');
    console.log('');
  }
  
  if (contract.guardian.enabled) {
    console.log(chalk.cyan(`2. Create your schema file: ${contract.guardian.schemaFile}`));
    console.log('   See: https://github.com/Agaslez/cerber-core#guardian-configuration');
    console.log('');
  }
  
  if (contract.health.enabled && !options.noHealth) {
    console.log(chalk.cyan('3. Customize health checks:'));
    console.log('   Edit: src/cerber/health-checks.ts');
    console.log('   Add route to your server: src/cerber/health-route.ts');
    console.log(`   Endpoint: ${contract.health.endpoint}`);
    console.log('');
  }
  
  if (contract.ci.provider === 'github' && !options.noWorkflow) {
    console.log(chalk.cyan('4. GitHub Actions workflow created:'));
    console.log('   .github/workflows/cerber.yml');
    
    if (contract.ci.postDeploy.enabled) {
      console.log('');
      console.log(chalk.yellow('   ⚠️  Post-deploy health check requires:'));
      console.log(`      - GitHub Variable: ${contract.ci.postDeploy.healthUrlVar}`);
      console.log('      - Optional Secret: CERBER_HEALTH_AUTH_HEADER');
      console.log('      - Set in: Settings > Secrets and variables > Actions > Variables');
      console.log(`      - Example: https://your-api.com${contract.health.endpoint}`);
    }
    console.log('   Required check name: Cerber CI / job: cerber-ci');
    console.log('');
  }
  
  if (contract.mode === 'team') {
    console.log(chalk.cyan('5. Team mode setup:'));
    console.log('   - Edit .github/CODEOWNERS (replace @OWNER_USERNAME)');
    console.log('   - Enable branch protection: Settings > Branches');
    console.log('   - Require review from Code Owners');
    console.log('   - Set required checks to: Cerber CI');
    console.log('');
  }
  
  console.log(chalk.bold.green('🚀 Ready to commit!'));
  console.log('   git add .');
  console.log('   git commit -m "feat: add Cerber protection"');
  console.log('');
  console.log(chalk.gray('Need help? https://github.com/Agaslez/cerber-core/discussions'));
}
