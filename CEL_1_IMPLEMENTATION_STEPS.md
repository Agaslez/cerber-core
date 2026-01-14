# 🚀 CEL 1: CI GATES SEPARATION (Implementation Steps)

**Target**: PR checks run in 5 minutes, Heavy checks run on main only  
**Status**: READY TO EXECUTE

---

## 📊 CURRENT WORKFLOW ANALYSIS

### Current: cerber-verification.yml (424 lines)
```
Triggered on: PR + main push + workflow_dispatch
Jobs (9 total):
├─ lint_and_typecheck        [2 min]   ← FAST (deterministic)
├─ build_and_unit            [3 min]   ← FAST (deterministic)
├─ pack_tarball              [1 min]   ← FAST (deterministic)
├─ cerber_doctor             [3 min]   ← FAST (install from tarball + doctor)
├─ guardian_precommit_sim     [2 min]   ← FAST (pre-commit hook simulation)
├─ guardian_ci               [2 min]   ← FAST (ci post-gate)
├─ cerber_e2e_all_modes      [4 min]   ← MEDIUM (E2E all 3 modes)
├─ ci_summary                [0 min]   ← UTILITY (always runs, hard fail check)
└─ npm_package_validation    [2 min]   ← MEDIUM (package validation)

Total: ~24 minutes on PR (not ideal!)
Problem: ALL jobs run on EVERY PR, including slow ones
```

### Target State

**PR Workflow** (cerber-pr-fast.yml):
```
Triggered on: pull_request to main
Jobs (4 required):
├─ lint_and_typecheck        [2 min]   ✅ FAST
├─ build_and_unit            [3 min]   ✅ FAST
├─ cerber_doctor             [3 min]   ✅ FAST (deterministic tarball ops)
└─ ci_summary                [0 min]   ✅ UTILITY

Total: ~8 minutes on PR (3x FASTER!)
Branch Protection: Only these 4 required
```

**Main Workflow** (cerber-main-heavy.yml - renamed from cerber-verification.yml):
```
Triggered on: push to main + workflow_dispatch
All 9 jobs from current workflow
├─ FAST jobs (for feedback)
├─ HEAVY jobs (no longer blocking PR)
│  ├─ guardian_precommit_sim
│  ├─ guardian_ci
│  ├─ cerber_e2e_all_modes
│  └─ npm_package_validation
└─ ci_summary (hard fail check)

Total: ~24 minutes on main (acceptable, not blocking merge)
```

---

## ✅ EXECUTION PLAN

### KROK 1: Create cerber-pr-fast.yml (NEW FILE)
**File**: `.github/workflows/cerber-pr-fast.yml`  
**Triggers**: `pull_request` to `main`  
**Jobs**:
- lint_and_typecheck (2 min)
- build_and_unit (3 min)
- cerber_doctor (3 min) - Use pack from build_and_unit artifact
- ci_summary (0 min)

**Output**: Green checks in 8 minutes on PR

---

### KROK 2: Rename cerber-verification.yml → cerber-main-heavy.yml
**Action**: Keep ALL content, just rename  
**Triggers**: Change from `pull_request + push` → only `push` to `main`  
**Keep**: All 9 jobs as-is

---

### KROK 3: Update .github/workflows/cerber-pr-fast.yml
**Add job**: `cerber_drift` (once CEL 2 is ready)  
**For now**: Skip drift check, add placeholder comment

---

### KROK 4: Update branch protection rules
**File**: `.github/settings/branch-protection.json` (if exists) or via GitHub UI  
**Required checks**:
```
[
  "Lint & Type Check",
  "Build & Unit",
  "Cerber Doctor (install + doctor)",
  "CI Summary (hard fail if any gate fails)"
]
```
**Not required**:
```
[
  "Guardian PRE (pre-commit simulation)",
  "Guardian CI (post gate)",
  "E2E (solo/dev/team) + artifacts",
  "npm Package Validation"
]
```

---

### KROK 5: Test & Validate
**On PR**: Verify only fast workflow triggers (4 jobs, 8 min)  
**On main**: Verify heavy workflow triggers (all 9 jobs)  
**CI Summary**: Must succeed for both

---

## 📝 FILES TO CREATE/MODIFY

| File | Action | Lines | Notes |
|------|--------|-------|-------|
| `.github/workflows/cerber-pr-fast.yml` | CREATE | ~200 | PR fast checks |
| `.github/workflows/cerber-verification.yml` | RENAME to `cerber-main-heavy.yml` | 424 | Keep as-is, change trigger |
| `.github/workflows/cerber-main-heavy.yml` | MODIFY | 424 | Update trigger `on:` section |
| Branch protection rules | UPDATE | - | Only require PR fast jobs |

---

## 🎯 SUCCESS CRITERIA

- ✅ PR triggered = Only fast workflow runs (4 jobs)
- ✅ Main push triggered = Heavy workflow runs (9 jobs)
- ✅ Fast jobs complete in <10 minutes
- ✅ PR merge not blocked by slow tests
- ✅ All tests still run (just different timing)
- ✅ No job output changes (same assertions)

---

## 💡 QUICK REFERENCE

**PR Workflow Structure** (cerber-pr-fast.yml):
```yaml
name: Cerber PR (Fast - Required Checks)

on:
  pull_request:
    branches: [main]

jobs:
  lint_and_typecheck:  # Reuse from cerber-verification.yml
  build_and_unit:       # Reuse from cerber-verification.yml
  cerber_doctor:        # Reuse from cerber-verification.yml (depends: pack_tarball)
  ci_summary:          # Reuse from cerber-verification.yml
```

**Main Workflow Structure** (cerber-main-heavy.yml):
```yaml
name: Cerber Verification (Doctor + Guardian + E2E)

on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'  # Nightly

jobs:
  # All 9 jobs from cerber-verification.yml
```

---

## 🔗 DEPENDENCIES

- KROK 1 depends on nothing (can start immediately)
- KROK 2 depends on KROK 1 (need new PR workflow to exist first)
- KROK 3 is optional (for drift checking in CEL 2)
- KROK 4 depends on KROK 1 + KROK 2 (must have both workflows first)

---

**READY TO START KROK 1?**

Tell me: `Rób KROK 1` and I'll create cerber-pr-fast.yml
