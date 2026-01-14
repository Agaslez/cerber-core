# Branch Protection: Required Checks Configuration

**Document**: Definition of required PR checks for `main` branch protection  
**Updated**: January 14, 2026  
**Status**: ACTIVE (Deployed in workflows)

---

## 📋 Overview

This document defines which workflow jobs are **REQUIRED** for PR merge to `main` branch. Each check must:
1. Run on every pull request
2. Have a stable, consistent job name
3. Correspond to an actual workflow job (not a ghost check)
4. Not be flaky or non-deterministic

---

## ✅ REQUIRED Checks for PR Merge

### Workflow: `Cerber Fast Checks (PR)`
**File**: `.github/workflows/cerber-pr-fast.yml`  
**Trigger**: `pull_request` on `main` branch  
**Expected Duration**: ~9 minutes

#### Job 1: `lint_and_typecheck`
- **Name**: Lint & Type Check
- **Purpose**: ESLint + TypeScript validation
- **Command**: `npm run lint` + `npx tsc --noEmit`
- **Status**: ✅ REQUIRED for PR
- **Failure Action**: Block merge (hard fail)

#### Job 2: `build_and_test`
- **Name**: Build & Tests (@fast + @integration)
- **Purpose**: Compile + run @fast (unit) + @integration tests
- **Command**: `npm run build` + `npm run test:ci:pr`
- **Tests Included**: 
  - @fast: 32 unit tests (~2 min)
  - @integration: 37 integration tests (~5-10 min)
- **Status**: ✅ REQUIRED for PR
- **Failure Action**: Block merge (hard fail)

#### Job 3: `pr_summary`
- **Name**: PR Summary
- **Purpose**: Aggregate result from lint, build, and tests
- **Condition**: `always()` (runs even if previous fail)
- **Status**: ✅ REQUIRED for PR (gating)
- **Depends On**: lint_and_typecheck, build_and_test
- **Failure Action**: Block merge if any upstream failed

---

## ❌ NOT REQUIRED Checks for PR (Optional/Informational)

These run on `main` branch push only:

### Workflow: `Cerber Heavy Verification (Main)`
**File**: `.github/workflows/cerber-main-heavy.yml`  
**Trigger**: `push` to `main` branch (not PR)  
**Expected Duration**: ~24 minutes

#### Job: `comprehensive_tests`
- **Name**: Comprehensive Tests (@all)
- **Purpose**: Full test suite including @e2e and @signals
- **Command**: `npm run test:ci:heavy` (all tests)
- **Status**: ℹ️ INFORMATIONAL (runs post-merge)
- **Failure Action**: Notify (doesn't block PR)

---

## 🔍 Mapping: GitHub Check Names vs Workflow Jobs

When GitHub shows a PR status check, the displayed name follows this pattern:

```
{Workflow Name} / {Job Name}
```

### Example PR Check Display:

| Workflow | Job | Displayed As | Required |
|----------|-----|--------------|----------|
| Cerber Fast Checks (PR) | lint_and_typecheck | `Cerber Fast Checks (PR) / Lint & Type Check` | ✅ YES |
| Cerber Fast Checks (PR) | build_and_test | `Cerber Fast Checks (PR) / Build & Tests (@fast + @integration)` | ✅ YES |
| Cerber Fast Checks (PR) | pr_summary | `Cerber Fast Checks (PR) / PR Summary` | ✅ YES |
| Cerber Heavy... | comprehensive_tests | `Cerber Heavy Verification (Main) / Comprehensive Tests (@all)` | ❌ NO |

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
