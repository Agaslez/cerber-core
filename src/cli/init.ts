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
import { CerberContract, GeneratedFile, InitOptions } from './types.js';

function getCerberMdTemplate(mode: string = 'dev'): string {
  return `# CERBER.md - Architecture Roadmap

> **This is your single source of truth. AI agents and developers enforce this contract.**

## CERBER_CONTRACT
\`\`\`yaml
version: 1
mode: ${mode}  # solo | dev | team

guardian:
  enabled: true
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

## SCHEMA

> **Schema rules enforce security and architecture. Customize for your project.**

\`\`\`yaml
SCHEMA:
  mode: required   # required | disabled
  rules:
    forbiddenPatterns:
      - "pwd="              # Example: detect password patterns
      - "secret="           # Example: detect secret patterns  
      - "apikey="           # Example: detect API key patterns
    forbidConsole: true
    forbidDebugger: true
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

## 🔒 CERBER_GUARDRAILS - Protected Assets

> **Self-Protection:** These files enforce the contract. Deleting or disabling them breaks project integrity.

### Protected Files (DO NOT DELETE / DISABLE)

1. **CERBER.md** - Single source of truth (this file)
2. **${getDefaultContract().guardian.schemaFile}** - Architecture schema (in strict mode)
3. **.github/workflows/cerber.yml** - CI validation pipeline
4. **scripts/cerber-guardian.mjs** - Pre-commit guardian
5. **.husky/pre-commit** - Git hook trigger
6. **.github/CODEOWNERS** - Ownership enforcement (team mode)

### Change Policy

- **Never:**
  - Delete protected files
  - Disable Guardian/CI checks
  - Rename workflow job IDs (\`cerber-ci\`, \`cerber-integrity\`)
  - Bypass pre-commit hooks

- **Allowed (with justification in PR):**
  - Update schema rules (must match CERBER.md contract)
  - Adjust CI branches/triggers
  - Modify health check thresholds
  - Add new Guardian patterns

**Emergency Override:** If you must temporarily disable Guardian (hotfix), use \`CERBER_OVERRIDE\` section below with TTL expiry.

---

## 🚨 CERBER_OVERRIDE - Emergency Safety Fuse (Use with Extreme Care)

> **Purpose:** Allow temporary bypass for critical hotfixes. **This is NOT a power switch.**

\`\`\`yaml
CERBER_OVERRIDE:
  enabled: false
  reason: ""           # REQUIRED if enabled (e.g., "P0 production incident hotfix")
  expires: ""          # REQUIRED if enabled (ISO 8601: 2026-01-05T10:00:00Z)
  approvedBy: ""       # REQUIRED if enabled (GitHub username or email)
\`\`\`

### What Override DOES (when enabled and not expired):

✅ **Pre-commit:** Allows commit to proceed **WITH WARNING** (prints full override metadata)  
✅ **Post-deploy gate:** May skip health check validation (if flaky/blocking hotfix)

### What Override NEVER DOES (hard limits):

❌ **NEVER disables \`cerber-integrity\` job** (self-protection always active)  
❌ **NEVER disables entire CI pipeline**  
❌ **NEVER disables \`cerber-ci\` validation**  
❌ **NEVER bypasses CODEOWNERS** (team mode)

### Rules:

1. **All fields required** when \`enabled: true\` (reason, expires, approvedBy)
2. **If expired** → treated as \`enabled: false\` (no bypass)
3. **TTL recommended:** 1-24 hours (force conscious re-approval)
4. **Audit:** Override usage logged in pre-commit output (full metadata printed)

### Example (P0 Hotfix):

\`\`\`yaml
CERBER_OVERRIDE:
  enabled: true
  reason: "P0: Payment processor down, bypassing schema check for emergency config change"
  expires: "2026-01-04T18:00:00Z"  # 6 hours from now
  approvedBy: "@stefan-pitek"
\`\`\`

**After hotfix:** Immediately create follow-up PR to fix properly + disable override.

---

*This file is protected by CODEOWNERS. Changes require architect approval.*
`;
}

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const projectRoot = process.cwd();
    // Handle --print-template flag
  if (options.printTemplate) {
    const templateMode = options.mode || 'dev';
    console.log(getCerberMdTemplate(templateMode));
    return;
  }
    console.log(chalk.bold.cyan('🛡️  Cerber Core - Project Initialization'));
  console.log('');
  
  if (options.dryRun) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No files will be created'));
    console.log('');
  }
  
  // Step 1: Check for CERBER.md
  const cerberPath = path.join(projectRoot, 'CERBER.md');
  const parseResult = await parseCerberContract(projectRoot);
  
  if (!parseResult.success) {
    const error = parseResult.error!;
    
    // File not found - create template
    if (error.message === 'CERBER.md not found') {
      console.log(chalk.yellow('📄 CERBER.md not found'));
      console.log('Creating template...');
      console.log('');
      
      const templateMode = options.mode || 'dev';
      const template = getCerberMdTemplate(templateMode);
      
      if (!options.dryRun) {
        await fs.writeFile(cerberPath, template, 'utf-8');
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
    
    // Invalid contract - show detailed error
    console.error(chalk.red('❌ Failed to parse CERBER.md'));
    console.error('');
    console.error(chalk.yellow('Error:'), error.message);
    if (error.line) {
      console.error(chalk.gray(`Line ${error.line}`));
    }
    if (error.context) {
      console.error('');
      console.error(chalk.gray('Expected format:'));
      console.error(chalk.gray(error.context));
    }
    console.error('');
    console.error(chalk.blue('💡 Tip: Run'), chalk.cyan('npx cerber init'), chalk.blue('in an empty repo to see a valid template'));
    console.error('');
    
    process.exit(1);
  }
  
  let contract = parseResult.contract!;
  
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
  await showNextSteps(contract, options, files, projectRoot);
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

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function showNextSteps(contract: CerberContract, options: InitOptions, generatedFiles: GeneratedFile[], projectRoot: string): Promise<void> {
  console.log(chalk.bold('📝 Next Steps:'));
  console.log('');
  
  if (contract.guardian.enabled && !options.noHusky) {
    console.log(chalk.cyan('1. Install Husky (if not already installed):'));
    console.log('   npm install husky --save-dev');
    console.log('   npx husky install');
    console.log('');
  }
  
  // Schema section (based on schema config in CERBER.md)
  if (contract.schema && contract.schema.enabled) {
    const schemaFile = contract.schema.file;
    const schemaGenerated = generatedFiles.some(f => f.path.endsWith(schemaFile));
    const schemaExists = await fileExists(path.join(projectRoot, schemaFile));
    
    if (schemaGenerated) {
      // Template was generated
      console.log(chalk.cyan(`2. Customize your architecture schema:`));
      console.log(chalk.yellow(`   ⚠️  ${schemaFile} is a TEMPLATE (not source of truth)`));
      console.log(`   Edit it to match your architecture defined in CERBER.md`);
      console.log('   See: https://github.com/Agaslez/cerber-core#guardian-configuration');
    } else if (!schemaExists && contract.schema.mode === 'strict') {
      // Strict mode: schema required but not generated
      console.log(chalk.cyan(`2. Create your schema file:`));
      console.log(chalk.yellow(`   Schema mode: strict (you must create ${schemaFile})`));
      console.log(`   Template: npx cerber init --print-schema-template > ${schemaFile}`);
      console.log('   See: https://github.com/Agaslez/cerber-core#guardian-configuration');
    } else if (schemaExists) {
      // Schema exists, don't mention creating it
      console.log(chalk.green(`✅ Schema file exists: ${schemaFile}`));
    }
    console.log('');
  } else if (contract.guardian.enabled) {
    // Legacy: guardian enabled but no schema config (backward compat)
    const schemaGenerated = generatedFiles.some(f => f.path.endsWith(contract.guardian.schemaFile));
    if (schemaGenerated) {
      console.log(chalk.cyan(`2. Customize your architecture schema:`));
      console.log(`   Edit: ${contract.guardian.schemaFile}`);
      console.log('   Add your project-specific rules and patterns');
    } else {
      console.log(chalk.cyan(`2. Create your schema file: ${contract.guardian.schemaFile}`));
    }
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
