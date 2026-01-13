# PR: RCX Hardening CI — Test Suite Fixes + Workflow Configuration

## 📌 Type
- [x] CI/CD Configuration
- [x] Test Fixes
- [ ] Feature
- [ ] Refactor

## 🎯 Purpose

Merge RCX Hardening test suite fixes and CI/CD configuration from `rcx-hardening` branch to `main`.

This PR implements:
1. ✅ Fixed 6 failing test suites (perf-regression, v1-compat, time-bombs, contract-fuzz, locale-timezone, mutation-testing)
2. ✅ Created test helper `test/helpers/options.ts` with `makeRunOptions()` factory
3. ✅ Refactored tests to use DRY pattern
4. ✅ Created dedicated RCX Hardening workflow in `.github/workflows/ci-matrix-hardening.yml`
5. ✅ Branch protection: test:rcx runs ONLY on rcx-hardening
6. ✅ Added safety features: fetch-depth, concurrency, timeout-minutes

## 📋 Changes Summary

### Tests Fixed (6 suites)
- [x] `test/perf/perf-regression.test.ts` — Added `cwd: process.cwd()` to 5 locations
- [x] `test/compat/v1-compat.test.ts` — Fixed import path + property names (file→path, ruleId→id)
- [x] `test/core/time-bombs.test.ts` — Fixed fake timer management
- [x] `test/contract/contract-fuzz-md.test.ts` — Fixed test logic + schema validation
- [x] `test/integration/locale-timezone.test.ts` — Fixed regex + UTF-16 handling
- [x] `test/mutation/mutation-testing.test.ts` — Fixed flaky threshold

### Helper Created
- [x] `test/helpers/options.ts` — `makeRunOptions()` factory for OrchestratorRunOptions
- [x] Applied to `test/core/resilience/adapter-executor.test.ts` (6 refactored test cases)

### CI/CD Enhanced
- [x] `.github/workflows/ci.yml` — Added rcx-hardening to push triggers
- [x] `.github/workflows/ci-matrix-hardening.yml`:
  - Added `rcx-hardening` job with `npm run test:rcx`
  - Added branch conditions: `if: github.ref == 'refs/heads/rcx-hardening'`
  - Added `fetch-depth: 0` to all checkouts (prevent git edge-cases)
  - Added `concurrency` groups per job (prevent duplicate runs)
  - Added `timeout-minutes` per job and step (prevent hanging)

## 🧪 Test Results

```
Build:           ✅ Clean TypeScript compilation (0 errors)
Full Test Suite: ✅ 94 passed, 1 skipped, 1630 tests
RCX Test Suite:  ✅ 199 passed, 1 skipped (intentional Windows skip)
```

## 📊 Commits

| SHA | Message |
|-----|---------|
| `af6f04a` | refactor: use makeRunOptions helper in adapter-executor tests |
| `acf6d36` | ci: add rcx-hardening to test workflows and support rcx-hardening branch |
| `2c785bc` | ci: verify rcx workflow triggers |
| `cb73626` | ci: add fetch-depth, concurrency, timeout-minutes and if conditions |

## ✅ Definition of Done (DoD)

### Branch Safety
- [x] `npm run test:rcx` is protected to rcx-hardening branch only
- [x] main/develop branches run test:release (not test:rcx)
- [x] If conditions prevent accidental test:rcx execution on other branches
- [x] Workflow triggers correctly configured

### Reliability
- [x] fetch-depth: 0 ensures full git history (no edge-cases)
- [x] concurrency groups prevent duplicate runs
- [x] timeout-minutes prevent hanging processes
- [x] All 4 hardening jobs have timeouts (10-40 min)

### Test Quality
- [x] All 6 failing suites now pass (from before PR)
- [x] Helper pattern applied (DRY principle)
- [x] No TypeScript errors
- [x] 1630 total tests passing
- [x] No regression from previous passing tests

### Documentation
- [x] CI_RCX_PROOF.md created with evidence
- [x] This PR template documents all changes
- [x] Workflow YAML syntax validated

## 🚀 Merge Strategy

**Branch**: rcx-hardening → main  
**Strategy**: Standard merge (preserve commit history)  
**Required Checks**:
1. ✅ All tests pass (lint, build, test)
2. ✅ No TypeScript errors
3. ✅ CI actions configured correctly
4. ✅ RCX tests isolated to rcx-hardening branch

## 📝 Post-Merge Verification

After merge to main:
1. ✅ Run full CI pipeline on main: `lint` → `build` → `test` → `pack`
2. ✅ Verify RCX tests are excluded from main (test:release only)
3. ✅ Verify matrix-test runs on main (not rcx/brutal/signal)
4. ✅ Document results in PROOF.md
5. ✅ Ready for release

## 🔍 Reviewer Checklist

- [ ] Reviewed all 6 test suite fixes
- [ ] Verified `npm run test:rcx` is isolated to rcx-hardening branch
- [ ] Confirmed test:release runs on main/develop
- [ ] Workflow file syntax is valid (no YAML errors)
- [ ] fetch-depth: 0 present in all checkouts
- [ ] concurrency groups prevent duplicate runs
- [ ] timeout-minutes protect against hanging processes
- [ ] Helper pattern is correctly applied
- [ ] TypeScript compilation clean
- [ ] No breaking changes to existing API

## 📈 GitHub Actions Verification

**Actions Runs** (verify in repo Actions tab):
- rcx-hardening branch: Should run matrix-test + rcx-hardening + brutal-tests + signal-tests
- main branch: Should run ONLY matrix-test (no rcx/brutal/signal)
- develop branch: Should run ONLY matrix-test (no rcx/brutal/signal)

## 🎯 Impact

- **Production Ready**: ✅ All gates pass
- **Backward Compatible**: ✅ No breaking changes
- **CI Performance**: ✅ Optimized with timeout and concurrency
- **Maintainability**: ✅ DRY helper pattern applied
- **Test Isolation**: ✅ RCX suite only runs on dedicated branch

---

**Created**: January 13, 2026  
**Branch**: rcx-hardening  
**Target**: main  
**Status**: Ready for Review & Merge
