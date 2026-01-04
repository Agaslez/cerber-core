# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.7] - 2026-01-04

### Added

#### 🩺 `npx cerber doctor` - Setup Validation Command
- New diagnostic command validates Cerber installation
- Checks: `CERBER.md`, schema file (strict mode), hooks, workflow
- Returns stable exit codes: 0=OK, 2=missing contract, 3=missing schema, 4=missing hooks/workflow
- Shows override state: DISABLED/ACTIVE/EXPIRED/INVALID
- Prints actionable "Next Steps" for each failure scenario
- MVP implementation (ASCII-only output for stability)

#### 🛡️ `CERBER_GUARDRAILS` - Protected Assets Declaration
- Added to `CERBER.md` template
- Documents protected files: contract, schema, workflow, guardian, hooks, CODEOWNERS
- Change policy: never delete/disable, never rename job IDs
- Allowed changes: schema rules (must match contract), CI config with PR justification
- Emergency override placeholder for TTL mechanism

#### 🔐 Self-Protection Mechanisms

**cerber-integrity Workflow Job:**
- New first job (runs before `cerber-ci`)
- Validates protected files exist
- In strict mode: checks schema file presence
- Verifies `cerber-ci` job ID intact (prevents sabotage)
- **Cannot be skipped or disabled** (fail-safe)

**CODEOWNERS Protection (Team Mode):**
- Now includes all Cerber files: contract, schema, workflow, guardian, hooks
- Self-protection: `/.github/CODEOWNERS` requires owner approval
- Prevents unauthorized changes to enforcement infrastructure

#### 🚨 Emergency Override (TTL-based, Controlled)

**`CERBER_OVERRIDE` Contract Section:**
- Time-to-live based safety fuse (NOT a power switch)
- Required fields when enabled: `reason`, `expires` (ISO 8601), `approvedBy`
- If expired → treated as disabled
- If invalid (missing fields) → treated as disabled

**What Override DOES:**
- ✅ Pre-commit: Allows commit WITH WARNING (prints full metadata)
- ✅ Post-deploy: May skip health gate (if flaky/blocking hotfix)

**What Override NEVER DOES (Hard Limits):**
- ❌ NEVER disables `cerber-integrity` job
- ❌ NEVER disables entire CI pipeline
- ❌ NEVER disables `cerber-ci` validation
- ❌ NEVER bypasses CODEOWNERS (team mode)

**Implementation:**
- Guardian checks override at startup
- Doctor shows override state
- Override metadata printed for audit trail
- Applied to all modes: solo, dev, team

#### 🔒 Guided Schema Templates (Security Baseline)
- Added commented security patterns to `BACKEND_SCHEMA.mjs` template
- Categories: hardcoded secrets, dev artifacts, critical TODOs
- Examples: `password=`, `API_KEY=`, `JWT_SECRET=`, `console.log`, `debugger`
- Clear instruction: "Uncomment patterns that match rules in your CERBER.md"
- Enforces "never invent rules" principle (translation only)

#### 📦 Supply-Chain Security Policy
- Updated `SECURITY.md` with comprehensive supply-chain guidance
- npm 2FA required for all maintainers
- CI-only publishing strongly recommended
- No risky lifecycle scripts (`postinstall`, `preinstall`)
- Dependencies updated only via reviewed PRs
- Installation safety guarantees documented
- Package verification steps provided
- Compromise response procedures added

#### 🛡️ Generator Path Safety
- Resolves repository root via `git rev-parse --show-toplevel`
- Writes ONLY inside repository root (fail-closed if root unknown)
- Blocks `..` path traversal attempts
- Whitelists allowed outputs (contract, schema, workflow, guardian, hooks, CODEOWNERS)
- Validates every file path before write operation
- Path traversal protection prevents security issues with malicious contracts

### Changed

#### 📝 Hardened "For AI Agents" Section (README)

**New MUST Rules:**
1. **Schema Generation = Translation Only**
   - Agent can ONLY translate explicit rules from `CERBER.md`
   - If rule not in `CERBER.md` → ask user / fail / leave empty
   - Never invent, guess, or auto-generate architecture rules

2. **NO-HEREDOC for TS/JS Files**
   - Never create TypeScript/JavaScript files using bash `cat <<EOF`
   - Reason: Causes `${}` template literal corruption and UTF-8 encoding issues
   - Use editor tools, `fs.writeFile`, or proper file generation utilities

### Fixed
- Added final newline to `CODEOWNERS.tpl` (prevented last line truncation)

### Security
- **Supply-chain hardening**: No postinstall scripts, 2FA required, CI-only publish
- **Path safety**: Generator validates all file writes (repo-root + whitelist)
- **Self-protection**: cerber-integrity job prevents sabotage/deletion
- **Emergency override**: Controlled bypass with TTL and audit trail (never disables integrity)

### Breaking Changes
None. All changes are backward compatible with existing Cerber installations.

---

## [1.1.4] - 2026-01-04

### Fixed

- **CLI Template Generator**: `--mode` flag now correctly sets mode in generated CERBER.md
  - `npx cerber init --mode=team` now creates template with `mode: team` (not hardcoded `dev`)
  - Applies to solo/dev/team modes
  - Fixed E2E testing workflow

## [1.1.3] - 2026-01-04

### Fixed

#### 🐛 CRITICAL: Guardian Validation Logic
- **v1.1.2 shipped with non-functional Guardian** (MVP placeholder that always passed)
- Implemented full forbiddenPatterns validation logic
- Implemented requiredImports checking with architect approval override
- Fixed RegExp serialization issue (using string patterns with flags field)
- Guardian now **actually blocks commits** that violate architecture rules
- Removed debug output from production template

#### ✅ E2E Testing Results
- **TEST 1 PASSED**: Guardian successfully blocks commits with violations
  - Tested with: `const password = "admin123";` 
  - Result: ❌ Commit blocked with clear error message
  - Husky pre-commit hook working correctly
  - Fresh install from npm verified

### Breaking Fix
This is technically a BREAKING FIX because v1.1.2 did not enforce any validations. Projects that relied on the previous behavior (no enforcement) will now have commits blocked if they violate patterns defined in BACKEND_SCHEMA.ts.

**Migration**: If you have v1.1.2, upgrade to v1.1.3 immediately. Review and customize your `BACKEND_SCHEMA.ts` patterns before enabling in production.

## [1.1.0] - 2026-01-03

### Added

#### 🚀 Instant Setup Command
- **`npx cerber init`** - One-command project initialization
  - Detects or creates `CERBER.md` with architecture contract
  - Parses machine-readable `CERBER_CONTRACT` (YAML)
  - Generates Guardian hooks, health checks, and CI/CD workflows
  - Supports three modes: `solo`, `dev`, `team`
  - CLI flags: `--mode`, `--force`, `--dry-run`, `--no-husky`, `--no-workflow`, `--no-health`

#### 📋 CERBER_CONTRACT Format
- Machine-readable YAML contract embedded in `CERBER.md`
- Defines:
  - `mode`: solo | dev | team
  - `guardian`: pre-commit configuration
  - `health`: runtime health check settings
  - `ci`: GitHub Actions and deployment gates
- Single source of truth for tooling configuration

#### 🔧 Generated Files
- **Guardian**:
  - `scripts/cerber-guardian.mjs` - Pre-commit validator
  - `.husky/pre-commit` - Git hook
  - Updates `package.json` scripts
- **Health Checks** (optional):
  - `src/cerber/health-checks.ts` - Template checks
  - `src/cerber/health-route.ts` - Express route handler
- **CI/CD**:
  - `.github/workflows/cerber.yml` - GitHub Actions workflow
  - Reusable `cerber-gatekeeper.yml` workflow for post-deploy health
- **Team Mode**:
  - `.github/CODEOWNERS` - Protect architecture files

#### 🧪 Testing
- Unit tests for contract parser
- Manual smoke test script
- Dry-run mode for safe testing

#### 📖 Documentation
- New `USAGE_GUIDE.md` with complete setup instructions
- Updated README with 30-second Quick Start
- CERBER_CONTRACT reference documentation

### Changed
- **CLI Version** - Bumped to 1.1.0
- **README.md** - Updated Quick Start section with instant setup
- Template structure organized into `solo/`, `dev/`, `team/` folders

### Security
- All generated files include "Generated by Cerber init" comment
- `--force` flag required to overwrite existing files
- CODEOWNERS template for protecting critical files

---

## [1.0.4] - 2026-01-02

### Changed
- Updated package description with business value messaging
- Enhanced README with "Your Roadmap Becomes Executable Law" section
- Added ROI calculations and cost savings data

---

## [1.0.3] - 2026-01-02

### Changed
- Author metadata updates
- Documentation improvements

---

## [1.0.2] - 2026-01-02

### Fixed
- CI/CD workflow fixes
- Branch protection compatibility

---

## [1.0.1] - 2026-01-02

### Changed
- Initial production release
- Package metadata refinements

---

## [1.0.0] - 2026-01-03

### Added
- **Guardian 1.0**: Pre-commit architecture validator
  - Forbidden pattern detection with architect approval system
  - Required file validation
  - Required import checking
  - package.json rules validation
  - Recursive directory scanning
  - Detailed error/warning reporting
  - CLI with `--schema`, `--verbose`, `--fail-on-warning` options

- **Cerber 2.1**: Runtime health monitoring
  - Flexible health check system
  - Multiple severity levels (critical, error, warning, info)
  - Parallel and sequential check execution
  - Detailed diagnostics with fix suggestions
  - JSON output for CI/CD integration
  - CLI with `--checks`, `--url`, `--parallel` options

- **Architect Approval System**:
  - Comment-based approval format: `// ARCHITECT_APPROVED: reason - YYYY-MM-DD - Name`
  - Automatic parsing and tracking
  - Integration with Guardian validation

- **Examples**:
  - Frontend schema (React/Vue patterns)
  - Backend schema (Node.js/Express patterns)
  - Health check templates (DB, disk, memory, env vars)

- **Documentation**:
  - Comprehensive README with real-world metrics
  - Contributing guidelines
  - API documentation
  - MIT License

- **Production Testing**:
  - Extracted from Eliksir project
  - Real metrics: 18 commits, 43 issues detected, 4.5 hours saved
  - 95% bug detection rate pre-production
  - 2 commits blocked by Guardian

### Technical Details
- TypeScript with ES2022 target
- ESNext modules for modern bundlers
- Commander.js for CLI
- Chalk for colored output
- Full type definitions included
- Zero runtime dependencies (except CLI deps)

## [Unreleased]

### Planned
- Web dashboard for health check visualization
- Slack/Discord notifications
- Custom reporter plugins
- VS Code extension
- Git hooks integration (Husky)
- More built-in health checks
- Performance monitoring
- Metrics export (Prometheus, DataDog)
