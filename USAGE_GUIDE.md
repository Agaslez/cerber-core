# How to Use Cerber in Your Project

## Quick Start (Recommended)

1. **Install Cerber Core**
   ```bash
   npm install cerber-core --save-dev
   ```

2. **Run init command**
   ```bash
   npx cerber init
   ```

3. **Follow the prompts**
   - If no `CERBER.md` exists, one will be created for you
   - Customize the contract (mode, endpoints, branches)
   - Run `npx cerber init` again to generate files

4. **Review generated files**
   - `CERBER.md` - Your architecture contract
   - `scripts/cerber-guardian.mjs` - Pre-commit validator
   - `.husky/pre-commit` - Git hook
   - `src/cerber/health-checks.ts` - Health check templates
   - `.github/workflows/cerber.yml` - CI/CD workflow

5. **Customize for your project**
   - Create `BACKEND_SCHEMA.ts` with your architecture rules
   - Edit `src/cerber/health-checks.ts` to add your checks
   - Update `.github/CODEOWNERS` if in team mode

6. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add Cerber protection"
   git push
   ```

---

## Configuration Modes

### Solo Mode
**Best for:** Individual developers, prototypes, small projects

**Features:**
- Guardian pre-commit validation
- Basic health checks (optional)
- Simple CI workflow

**Setup:**
```yaml
# In CERBER.md CERBER_CONTRACT
mode: solo
```

### Dev Mode (Default)
**Best for:** Small teams (2-5 developers), standard projects

**Features:**
- Guardian with required imports
- Health check endpoints
- GitHub Actions CI/CD
- Optional post-deploy health gates

**Setup:**
```yaml
# In CERBER.md CERBER_CONTRACT
mode: dev
```

### Team Mode
**Best for:** Larger teams, strict architecture enforcement

**Features:**
- Everything from Dev mode
- CODEOWNERS protection
- Required PR reviews for architecture files
- Post-deploy health validation (enabled by default)

**Setup:**
```yaml
# In CERBER.md CERBER_CONTRACT
mode: team
```

---

## CERBER_CONTRACT Reference

```yaml
version: 1
mode: dev  # solo | dev | team

guardian:
  enabled: true                    # Enable pre-commit validation
  schemaFile: BACKEND_SCHEMA.ts    # Path to your schema
  hook: husky                      # husky | manual
  approvalsTag: ARCHITECT_APPROVED # Tag for exceptions

health:
  enabled: true                    # Generate health check templates
  endpoint: /api/health            # Your health endpoint path
  failOn:
    critical: true                 # Block deploy on critical issues
    error: true                    # Block deploy on errors
    warning: false                 # Allow warnings

ci:
  provider: github                 # github | gitlab | manual
  branches: [main]                 # Protected branches
  requiredOnPR: true               # Run Guardian on PRs
  postDeploy:
    enabled: false                 # Post-deploy health gate
    waitSeconds: 90                # Wait time before check
    healthUrlVar: CERBER_HEALTH_URL          # GitHub Variable name
    authHeaderSecret: CERBER_HEALTH_AUTH_HEADER  # GitHub Secret name (optional)
```

---

## CLI Flags

### Basic Usage
```bash
npx cerber init                    # Interactive setup
npx cerber init --mode dev         # Override mode
npx cerber init --dry-run          # Preview without creating files
npx cerber init --force            # Overwrite existing files
```

### Advanced Flags
```bash
--mode <mode>           # Override contract mode (solo|dev|team)
--force                 # Overwrite existing files
--dry-run               # Show what would be generated
--no-husky              # Skip Husky hook generation
--no-workflow           # Skip GitHub Actions workflow
--no-health             # Skip health check templates
--write-contract        # Update CERBER.md with CLI options
```

### Examples
```bash
# Preview dev mode setup
npx cerber init --mode dev --dry-run

# Generate only Guardian files (no health checks)
npx cerber init --no-health --no-workflow

# Force regenerate all files in team mode
npx cerber init --mode team --force
```

---

## GitHub Actions Setup

### Required Variables

If you enable post-deploy health checks, set up GitHub Variables:

1. Go to: **Settings** > **Secrets and variables** > **Actions** > **Variables**
2. Add new repository variable:
   - **Name:** `CERBER_HEALTH_URL`
   - **Value:** `https://your-api.com/api/health`

### Optional Secrets

For authenticated health endpoints:

1. Go to: **Settings** > **Secrets and variables** > **Actions** > **Secrets**
2. Add new repository secret:
   - **Name:** `CERBER_HEALTH_AUTH_HEADER`
   - **Value:** `Bearer your-token-here`

---

## Team Mode Setup

### CODEOWNERS Configuration

1. Edit `.github/CODEOWNERS`:
   ```
   /CERBER.md @your-username
   /BACKEND_SCHEMA.ts @your-username
   /.github/workflows/cerber.yml @your-username
   ```

2. Replace `@your-username` with:
   - Your GitHub username (individual)
   - Team name like `@org/architects` (organization)

### Branch Protection

1. Go to: **Settings** > **Branches** > **Branch protection rules**
2. Add rule for `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require review from Code Owners
   - ✅ Require status checks to pass
     - Add: `cerber-guardian`
     - Add: `post-deploy-health` (if enabled)

---

## Troubleshooting

### "CERBER.md not found"
Run `npx cerber init` - it will create a template for you.

### "Schema file not found"
Create `BACKEND_SCHEMA.ts` at your project root with Guardian rules. See [Guardian Configuration](https://github.com/Agaslez/cerber-core#guardian-configuration).

### Guardian hook not running
```bash
npx husky install
chmod +x .husky/pre-commit
```

### Post-deploy health check fails
- Verify `CERBER_HEALTH_URL` is set in GitHub Variables
- Check health endpoint returns proper JSON format
- Review `failOn` settings in `CERBER_CONTRACT`

### Files already exist error
Use `--force` flag to overwrite:
```bash
npx cerber init --force
```

---

## Migration from Manual Setup

If you have existing Guardian/Cerber setup:

1. Create `CERBER.md` with contract matching your current config
2. Run `npx cerber init --dry-run` to preview changes
3. Backup existing files
4. Run `npx cerber init --force` to migrate
5. Review and test generated files

---

## Next Steps

- 📖 Read [Guardian Configuration Guide](https://github.com/Agaslez/cerber-core#guardian-configuration)
- 🔍 Explore [Cerber Health Examples](https://github.com/Agaslez/cerber-core#cerber-examples)
- 💬 Ask questions in [GitHub Discussions](https://github.com/Agaslez/cerber-core/discussions)
- ⭐ Star the repo if Cerber saved you time!

---

**Need help?** Open an issue or discussion: https://github.com/Agaslez/cerber-core
