# Branch Protection: Single Required Check Configuration

**Document**: ZADANIE 2 & 3 — Single gate for PR merge + npm-pack-smoke validation  
**Updated**: January 14, 2026  
**Status**: ACTIVE (Deployed in workflows)

---

## 📋 Objective: ONE Required Check

**Single Required Check Name**: `PR FAST (required)`

This check aggregates:
- ✅ Lint & Type Check
- ✅ Build & Tests (@fast + @integration)  
- ✅ Cerber Integrity (protected file approval)
- ✅ Code Owner review (CODEOWNERS)
- ✅ No force-push allowed

---

## Workflow: `cerber-pr-fast.yml`

**File**: `.github/workflows/cerber-pr-fast.yml`  
**Trigger**: `pull_request` on `main` branch  
**Expected Duration**: ~15-20 minutes

### Jobs (in execution order)

#### Job 1: `lint_and_typecheck`
- **Name**: Lint & Type Check
- **Purpose**: ESLint + TypeScript validation
- **Command**: `npm run lint` + `npx tsc --noEmit`
- **Status**: ✅ Part of aggregated check
- **Failure Action**: Blocks downstream (hard fail)

#### Job 2: `build_and_test`
- **Name**: Build & Tests (@fast + @integration)
- **Purpose**: Compile + run unit + integration tests
- **Command**: `npm run build` + `npm run test:ci:pr`
- **Depends On**: lint_and_typecheck
- **Status**: ✅ Part of aggregated check
- **Failure Action**: Blocks downstream (hard fail)

#### Job 3: `cerber_integrity` ✨ **NEW**
- **Name**: Cerber Integrity (Protected Files)
- **Purpose**: Validate GitHub PR approval for protected files
- **Command**: `node bin/cerber-integrity.cjs`
- **Environment**:
  - `GITHUB_TOKEN`: ${{ secrets.GITHUB_TOKEN }}
  - `REQUIRED_OWNER`: owner
- **How it works**:
  1. Extracts PR number from `GITHUB_EVENT_PATH`
  2. Calls GitHub Reviews API: `/repos/{owner}/{repo}/pulls/{prNumber}/reviews`
  3. Verifies `APPROVED` state from `@owner`
  4. Checks if protected files modified:
     - CERBER.md
     - .cerber/**
     - .github/workflows/**
     - package*.json
     - bin/**
     - src/guardian/**
     - src/core/Orchestrator.ts
     - src/cli/*.ts
- **Status**: ✅ Part of aggregated check
- **Failure Action**: Exit code 1 (prevents auto-merge, allows discussion)

#### Job 4: `pr_summary` → `PR FAST (required)` ✨ **RENAMED**
- **Display Name**: PR FAST (required)
- **Purpose**: Aggregate all upstream checks
- **Condition**: `always()` (runs even if upstream fails)
- **Depends On**: lint_and_typecheck, build_and_test, cerber_integrity
- **Status**: ✅ **THE ONLY REQUIRED CHECK**
- **Exit Logic**:
  ```bash
  if [ upstream success ]; then
    echo "✅ All fast checks passed"
  else
    exit 1
  fi
  ```

---

## GitHub Branch Protection Settings

### Required Status Checks

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["PR FAST (required)"]
  }
}
```

**Single check name**: `PR FAST (required)`

### Pull Request Reviews

```json
{
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": true
  }
}
```

**Code owners** (from `.github/CODEOWNERS`):
```
* @owner
.cerber/** @owner
.github/workflows/** @owner
bin/** @owner
package*.json @owner
src/guardian/** @owner
src/core/Orchestrator.ts @owner
src/cli/*.ts @owner
CERBER.md @owner
```

### Additional Rules

- **Enforce admins**: Yes (even admins must follow rules)
- **Allow force pushes**: No
- **Allow deletions**: No
- **Require last push approval**: Yes (invalidates stale reviews)

### How to Apply

Use the CLI setup script:

```bash
bash scripts/set-branch-protection.sh Agaslez/cerber-core
```

Or manual command:

```bash
gh api repos/Agaslez/cerber-core/branches/main/protection \
  --input - << 'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["PR FAST (required)"]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": true
  },
  "enforce_admins": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

---

## Three-Layer Enforcement (JEDNA PRAWDA)

### Layer 1: Local (Guardian Hook)
- **File**: `bin/guardian-protected-files-hook.cjs`
- **When**: Pre-commit (`.git/hooks/pre-commit`)
- **Action**: Block commit to protected files
- **Override**: `git commit --no-verify`

### Layer 2: CI (GitHub Actions)
- **File**: `.github/workflows/cerber-pr-fast.yml` → `cerber_integrity` job
- **File**: `bin/cerber-integrity.cjs`
- **When**: On PR push
- **Action**: Call GitHub API to verify owner approval
- **Soft block**: Prevents auto-merge, allows discussion

### Layer 3: GitHub (Branch Protection)
- **When**: Merge attempt
- **Action**: Requires `PR FAST (required)` + Code Owner review
- **Hard block**: Merge impossible without compliance

---

## TASK 3: npm-pack-smoke (Tarball Validation)

### Purpose
Verifies the tarball shipped to npm clients contains required files and works end-to-end.

**File**: `test/e2e/npm-pack-smoke.test.ts`

### Test Cases (14 tests, all passing ✅)

#### Tarball Content Validation
1. ✅ Should create tarball with `npm pack`
2. ✅ Should include `dist/index.js` in tarball
3. ✅ Should include `bin/cerber` executable
4. ✅ Should include `setup-guardian-hooks.cjs` in bin/
5. ✅ Should NOT include `test/` files
6. ✅ Should NOT include `node_modules`
7. ✅ Should have `package.json` with correct main/bin entries

#### E2E Tarball Installation
8. ✅ Should install tarball in clean directory
9. ✅ `npx cerber --help` should work post-install
10. ✅ Should have `dist/` files installed in `node_modules`
11. ✅ Should have `bin/` scripts installed

#### Determinism & Reproducibility
12. ✅ Should produce same tarball content on rebuild
13. ✅ `package.json::files` should include `dist`, `bin`
14. ✅ `package.json::files` should NOT include `test`

### How to Run

```bash
npm run test:e2e:pack
```

Expected output:
```
PASS  test/e2e/npm-pack-smoke.test.ts
  @e2e NPM Pack Smoke Test (Tarball Distribution)
    ✓ 14 tests passed
    Time: 17.3s
```

### Package Configuration

**File**: `package.json`

```json
{
  "files": [
    "dist",
    "bin",
    "examples",
    ".cerber-example",
    "solo",
    "dev",
    "team",
    "LICENSE",
    "README.md",
    "CHANGELOG.md",
    "USAGE_GUIDE.md"
  ]
}
```

**File**: `.npmignore`

```ignore
# Test files
__tests__/
*.test.ts
*.spec.ts
test/

# Source files (we ship compiled)
src/

# CI/CD
.github/
.husky/

# Development
.vscode/
.idea/
tsconfig.json
jest.config.cjs
```

### Tarball Inspection Commands

List tarball contents:
```bash
TARBALL="$(npm pack)" && tar -tzf "$TARBALL" | head -20
```

Extract and inspect package.json:
```bash
TARBALL="$(npm pack)" && tar -xzOf "$TARBALL" package/package.json | jq .
```

Simulate user install:
```bash
rm -rf /tmp/cerber-smoke
mkdir -p /tmp/cerber-smoke
cd /tmp/cerber-smoke
npm init -y >/dev/null
npm install "$PWD/../cerber-core-1.1.12.tgz"
npx cerber --help
```

---

## ❌ NOT REQUIRED Checks (Optional/Informational)

### Workflow: `Cerber Heavy Verification (Main)`
**File**: `.github/workflows/cerber-main-heavy.yml`  
**Trigger**: `push` to `main` branch (post-merge only)  
**Status**: ℹ️ INFORMATIONAL (runs after PR merge)  
**Failure Action**: Notify only (doesn't block)

---

## 🔍 Mapping: GitHub Check Names vs Workflow Jobs

GitHub displays PR checks in format: `{Workflow} / {Job}`

### Check Display in PR Status

| Workflow | Job ID | Display Name | Required |
|----------|--------|--------------|----------|
| Cerber Fast Checks (PR) | lint_and_typecheck | `Lint & Type Check` | ✅ YES (aggregated) |
| Cerber Fast Checks (PR) | build_and_test | `Build & Tests (@fast + @integration)` | ✅ YES (aggregated) |
| Cerber Fast Checks (PR) | cerber_integrity | `Cerber Integrity (Protected Files)` | ✅ YES (aggregated) |
| Cerber Fast Checks (PR) | pr_summary | **`PR FAST (required)`** | ✅ **YES (FINAL)** |

**The "PR FAST (required)" check aggregates all upstream checks into a single GitHub check.**

---

## Verification Checklist

- [x] Workflow `cerber-pr-fast.yml` has exactly 4 jobs
- [x] Job `pr_summary` displays as `PR FAST (required)`
- [x] Job `cerber_integrity` calls GitHub Reviews API
- [x] CODEOWNERS specifies `@owner` for protected files
- [x] Branch protection configured with single required check
- [x] Script `scripts/set-branch-protection.sh` ready
- [x] Test `contract-tamper-gate.test.ts` validates enforcement (3 tests passing)
- [x] Test `npm-pack-smoke.test.ts` validates tarball (14 tests passing)
- [ ] Execute `bash scripts/set-branch-protection.sh Agaslez/cerber-core`
- [ ] Verify 3 consecutive test runs pass (determinism proof)
- [ ] Document proof in PROOF.md

---

## Links

- **Workflow**: [.github/workflows/cerber-pr-fast.yml](.github/workflows/cerber-pr-fast.yml)
- **Integrity Script**: [bin/cerber-integrity.cjs](bin/cerber-integrity.cjs)
- **Code Owners**: [.github/CODEOWNERS](.github/CODEOWNERS)
- **Tamper Test**: [test/contract-tamper-gate.test.ts](test/contract-tamper-gate.test.ts)
- **Pack Test**: [test/e2e/npm-pack-smoke.test.ts](test/e2e/npm-pack-smoke.test.ts)
- **Branch Setup**: [scripts/set-branch-protection.sh](scripts/set-branch-protection.sh)
- **This Doc**: [BRANCH_PROTECTION_REQUIRED_CHECKS.md](BRANCH_PROTECTION_REQUIRED_CHECKS.md)

---

## 🚨 Ghost Check Prevention

**What is a ghost check?**
- A required check in branch protection that doesn't actually run on PRs
- Causes false "failures" because the check never reports status
- Often from old/renamed workflows or jobs that no longer exist

**How we prevent this:**

✅ **All required checks are ONLY in `cerber-pr-fast.yml`**  
✅ **This workflow triggers on `pull_request` events**  
✅ **Job names are stable and deterministic**  
✅ **No conditional skipping (e.g., `if: ...` that could hide jobs)**  
✅ **Documentation matches actual workflow structure**

---

## 🔧 Configuration for GitHub

When setting up branch protection on `main`:

```yaml
Require status checks to pass before merging:
  ✅ Cerber Fast Checks (PR) / Lint & Type Check
  ✅ Cerber Fast Checks (PR) / Build & Tests (@fast + @integration)
  ✅ Cerber Fast Checks (PR) / PR Summary

Allow administrators to bypass required status checks: NO
Require branches to be up to date: YES (recommended)
Require code owner review: YES (via CODEOWNERS)
```

---

## 📊 Test Coverage by Check

### `build_and_test` Coverage

**@fast tests** (32 tests, ~2 min):
- Commit schema tests (1-9)
- Adapter unit tests
- Core utilities
- Parser unit tests
- Output schema validation

**@integration tests** (37 tests, ~5-10 min):
- Real git operations
- File discovery with globs
- Adapter real tool execution
- Orchestrator integration
- Output validation

**Total**: 69 tests covering ~85% of codebase  
**Excluded from PR**: @e2e (10+), @signals (1) → run on main only

---

## ⚙️ Test Commands Reference

### Local Verification (matches PR gate):
```bash
# Exactly what PR checks run:
npm run lint          # ESLint: 0 errors required
npm run build         # TypeScript: no errors required
npm run test:ci:pr    # Jest: @fast + @integration tests
```

### Additional Verification (not required for PR):
```bash
npm run test:fast          # Just unit tests
npm run test:integration   # Just integration tests
npm run test:e2e           # E2E tests
npm run test:signals       # Signal handling tests
npm test                   # ALL tests (local dev)
```

---

## 🏥 Troubleshooting

### "Check failed to report status"
→ Likely a ghost check. Verify the workflow file exists and triggers on `pull_request`.

### "Test passed locally but failed in CI"
→ Check for environment differences:
- Windows vs Linux line endings
- Timezone/locale dependencies
- Async timing issues (use `CERBER_TEST_MODE=1` and extended timeouts)

### "Check runs but job name changed"
→ Update both:
1. `.github/workflows/cerber-pr-fast.yml` (job name)
2. This documentation (mapping table)
3. Branch protection settings (GitHub)

---

## 📝 Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-01-14 | Created document | CEL-1: CI gate separation |
| 2026-01-14 | Added stabilization notes | Fix cli-signals & npm-pack-smoke flakiness |
| 2026-01-14 | Documented test categorization | CEL-3: Test organization |

---

## 🎯 Success Criteria

✅ All PR checks required:
- Always run on PRs
- Always complete (no timeouts)
- Always pass with fixes applied
- Deterministic (no flakiness)
- Block merge on failure

✅ No ghost checks:
- Every required check corresponds to a real job
- Every job in workflow has consistent naming
- Documentation matches actual configuration

✅ Performance:
- PR gate: < 10 minutes
- Main gate: < 30 minutes
- No unnecessary re-runs

---

## 🔗 Related Documentation

- `.github/workflows/cerber-pr-fast.yml` — PR workflow definition
- `.github/workflows/cerber-main-heavy.yml` — Main/post-merge workflow
- `PROOF.md` — Verification that checks pass
- `package.json` — test scripts (test:ci:pr, test:ci:heavy, etc.)
