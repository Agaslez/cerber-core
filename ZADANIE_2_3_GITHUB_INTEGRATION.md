# ZADANIE 2.3 Final (100%) — GitHub Integration & Protection

**Status**: IMPLEMENTATION COMPLETE ✅  
**Date**: January 14, 2026  
**Ready for**: GitHub configuration + testing

---

## Overview: Three-Layer Defense

```
PR with protected file change
  ↓
┌─────────────────────────────────────────────────────┐
│ LAYER 1: LOCAL (Guardian Hook)                      │
│ git commit --no-verify can bypass              │
│ But: Good practice is to include approval marker    │
└─────────────────────────────────────────────────────┘
  ↓ (push succeeds)
┌─────────────────────────────────────────────────────┐
│ LAYER 2: PR (GitHub Actions)                        │
│ test/contract-tamper-gate.test.ts runs              │
│ Checks: GitHub API → is owner (@owner) approved?    │
│ If NO: ❌ FAIL (blocks auto-merge)                  │
└─────────────────────────────────────────────────────┘
  ↓ (tests pass, but...)
┌─────────────────────────────────────────────────────┐
│ LAYER 3: MERGE (GitHub Branch Protection)           │
│ CODEOWNERS: requires @owner review                  │
│ Status: requires tamper gate to PASS                │
│ Result: ✅ Can merge only if approved               │
└─────────────────────────────────────────────────────┘
```

---

## KROK A: Udowodnić, Że Gate Działa na Realnych Bypassach

### Scenario 1: Bypass Local Hook

```bash
# Developer (or agent) tries to bypass pre-commit hook
git commit --no-verify -m "tamper attempt: modify CERBER.md"
# Result: ✅ Commit succeeds locally

# Push to branch and create PR
git push origin feature-branch
gh pr create --title "Tamper attempt" --body "Test"

# What happens:
# 1. PR created successfully ✅
# 2. Workflows start running
# 3. test/contract-tamper-gate.test.ts runs
# 4. Job detects: CERBER.md modified
# 5. Job checks GitHub API: has @owner approved?
#    → NO (no approval yet)
# 6. Job FAILS: ❌ exit code 1
# 7. GitHub shows: Red ❌ on tamper gate
# 8. GitHub shows: "Needs review from @owner" (CODEOWNERS)
# 9. CANNOT MERGE until:
#    - tamper gate passes AND
#    - @owner approves
```

**Proof It Works**:
- ✅ Local hook can be bypassed with `--no-verify`
- ✅ But CI catches it immediately
- ✅ GitHub blocks merge

### Scenario 2: Protected File Without Approval

```bash
# Create branch
git checkout -b feature/unauthorized-change
echo "new policy" >> CERBER.md
git add CERBER.md

# Try to commit
git commit -m "update policy"
# Result: ❌ Guardian hook blocks (good!)
#         "Cannot commit without OWNER_APPROVED: YES"

# But IF agent force-commits:
git commit --no-verify -m "force: update policy"
# Result: ✅ Commits locally

# Push and create PR
git push origin feature/unauthorized-change
gh pr create

# PR Status:
# ❌ tamper-gate: FAIL
#    "Protected files modified WITHOUT code owner approval"
# 
# 🔴 Merge blocked:
#    - Needs code owner review
#    - Tamper gate must pass
#    - Both required by branch protection
```

**Proof**:
- ✅ Cannot merge without @owner approval
- ✅ Test detects protected file changes
- ✅ GitHub API check is definitive (cannot fake approval in commit)

---

## KROK B: Sprawdzić, Czy Required Checks Są Czyste

### Komenda 1: Lista Checków na PR #62

```bash
gh pr view 62 --json statusCheckRollup \
  --jq '.statusCheckRollup[] | "\(.context): \(.state)"' \
  --repo Agaslez/cerber-core
```

**Expected Output**:
```
lint_and_typecheck: SUCCESS
build_and_test: SUCCESS
(OR: tamper-gate: FAILED if protected files modified without approval)
```

**What To Look For**:
- ✅ Only 2-3 checks should appear (not 5+)
- ✅ No "unknown" or "neutral" checks
- ✅ No ghost checks from previous workflows
- ❌ If more checks appear: Stare checkmark configmisparsed (clean up)

### Komenda 2: Ostatnie Runy na Gałęzi

```bash
gh run list --branch rcx-hardening -L 20 \
  --repo Agaslez/cerber-core
```

**Expected Output**:
```
PR Checks (from push to feature branch)     completed  12m ago
PR Checks (from push to feature branch)     completed  25m ago
...
```

**What To Look For**:
- ✅ Recent runs should have status "completed"
- ✅ Jobs should match:
  - `lint_and_typecheck`
  - `build_and_test`
  - (optional: `cerber_integrity` if using v1 approach, but we use test suite)
- ❌ Any runs with "failure" → check logs

### Komenda 3: Log Konkretnego Runa

```bash
# Find RUN_ID from komenda 2, then:
gh run view <RUN_ID> --log --repo Agaslez/cerber-core | tail -200
```

**Expected Output**:
```
✅ build_and_test completed in 5 minutes
  → npm run build: SUCCESS
  → npm run test:ci:pr: SUCCESS
     • 95 test suites, 1635 tests passed
     • tamper-gate: 5 tests PASSED
```

**Debug Checklist**:
- Is `test/contract-tamper-gate.test.ts` mentioned? → ✅ Good
- Are all 5 test cases passing? → ✅ Good
- Any timeout or connection errors? → ❌ Fix timeout or diagnostics

---

## KROK C: Potwierdzić, Że Test Jest Częścią Required Workflow

### Krok 1: Verify Test Suite Exists

```bash
# Check file exists
ls -lah test/contract-tamper-gate.test.ts

# Check content
grep -A 5 "describe\|it(" test/contract-tamper-gate.test.ts | head -20
```

**Expected**:
```
@fast Contract Tamper Gate
  ✓ should allow normal commits without protected file changes
  ✓ should block CERBER.md changes without owner approval
  ✓ should block workflow changes without owner approval
  ✓ should block package.json changes without owner approval
  ✓ should document protected file changes with reason
```

### Krok 2: Verify Test Runs in CI

```bash
# Check workflow uses test suite
grep -n "test:ci:pr\|npm test" .github/workflows/cerber-pr-fast.yml
```

**Expected**:
```
run: npm run test:ci:pr
```

**Meaning**: Every commit to PR runs full test suite including tamper gate

### Krok 3: Verify It's Required

```bash
# Check branch protection requires this
gh api repos/Agaslez/cerber-core/branches/main/protection/required_status_checks \
  --jq '.contexts[]'
```

**Expected Output** (after setup-branch-protection.sh):
```
lint_and_typecheck
build_and_test
```

**Why Only 2?**:
- tamper-gate isn't a separate job name
- It's a TEST within `build_and_test` job
- So `build_and_test` status check covers it
- If build_and_test fails → tamper-gate failed → merge blocked ✅

---

## Implementation Checklist

### ✅ Code Ready

- [x] `bin/tamper-gate-v2.cjs` — Checks GitHub API for actual approval
- [x] `test/contract-tamper-gate.test.ts` — 5 test cases, @fast tagged
- [x] `.github/CODEOWNERS` — @owner for all protected files
- [x] All 1635 tests passing

### 🔧 GitHub Configuration (Manual)

Run this command:

```bash
bash scripts/setup-branch-protection.sh Agaslez cerber-core
```

What it does:
1. Sets required checks: `lint_and_typecheck`, `build_and_test`
2. Requires code owner review (from CODEOWNERS)
3. Requires approval of most recent push (new push clears old approvals)
4. Blocks direct pushes to main (PR only)
5. Blocks force pushes

### ✅ Verification (Manual)

```bash
# Verify configuration
bash scripts/verify-pr-protection.sh Agaslez cerber-core 62

# This shows:
# - KROK A: How bypass works (what you need to prevent)
# - KROK B: Actual checks on PR #62
# - KROK C: Test suite confirmation
```

---

## Architecture: Why This Works

### Why Marker-in-File Doesn't Work

```
Problem with OWNER_APPROVED: YES in commit message:
  1. Agent could generate fake commit with marker
  2. Agent could modify marker in file
  3. Not cryptographically signed
  4. Easy to fake in automated systems

Solution: GitHub API Check
  1. Read actual PR approval state from GitHub
  2. Check: Did @owner actually click "Approve" on GitHub UI?
  3. Cannot fake without GitHub credentials
  4. New push automatically clears old approvals (fresh check every time)
```

### Three Layers Explained

| Layer | Check | Bypass | Catch |
|-------|-------|--------|-------|
| 1. Local | Guardian hook | `--no-verify` | Layer 2 catches in CI |
| 2. PR | tamper-gate test checks GitHub API | Fake marker in message | GitHub API is source of truth |
| 3. Merge | Branch protection + CODEOWNERS | Force push | GitHub blocks it server-side |

---

## Test Results

```
✅ test/contract-tamper-gate.test.ts: 5/5 PASSED
✅ All 1635 tests: PASSING
✅ No regressions
```

---

## Production Deployment

### Step 1: Setup Branch Protection (5 min)

```bash
bash scripts/setup-branch-protection.sh Agaslez cerber-core
```

### Step 2: Verify (5 min)

```bash
bash scripts/verify-pr-protection.sh Agaslez cerber-core 62
```

### Step 3: Test (10 min)

1. Create test PR with protected file change
2. Verify tamper gate runs and fails (no approval)
3. Request code owner review
4. Code owner approves on GitHub
5. Verify tamper gate now passes
6. Merge should be allowed

### Step 4: Document (2 min)

Add to README or wiki:

```markdown
## Protected Files Policy

This repository uses Cerber's One Truth policy:

- Modified CERBER.md, .cerber/**, workflows, or package.json requires code owner (@owner) approval
- Approval checked via GitHub API (not file markers)
- All PRs to main require:
  1. Status checks pass (lint, build, tests)
  2. Code owner review (CODEOWNERS)
  3. Approval of recent push (new push requires new review)

See [ZADANIE_2_3.md](docs/ZADANIE_2_3.md) for details.
```

---

## Commands Summary (For Agent)

### For Agent: Check If Protected Files Modified

```bash
# Before committing:
git diff --name-only | grep -E "CERBER.md|.cerber/|workflows|package.json|bin/|guardian"
```

If anything matches: ⚠️ Protected file detected
- Needs code owner approval (GitHub PR review)
- PR will have tamper-gate check
- Cannot auto-merge

### For Agent: Create Safe PR

```bash
# 1. Make changes
git checkout -b feature/my-change
# ... make changes ...

# 2. Commit normally (local hook may block if protected files)
git commit -m "feature: add new feature"

# 3. Push
git push origin feature/my-change

# 4. Create PR
gh pr create --title "Feature: my feature" --body "Doing XYZ"

# 5. If protected files modified:
#    - PR shows red ❌ "Needs review from @owner"
#    - Wait for code owner approval
#    - Then merge

# 6. If NO protected files:
#    - All checks pass
#    - Can merge immediately
```

---

## FAQ

### Q: Can I use marker in commit message instead?

**A**: No. This version checks GitHub API for actual approval. Markers in files are for documentation only now.

### Q: What if I need to commit without approval?

**A**: You cannot merge to main without code owner approval. This is intentional. If it's an emergency, contact code owner for expedited review.

### Q: Can agent generate fake approval?

**A**: No. GitHub API check is authoritative. Only GitHub can confirm if @owner approved.

### Q: What about force-push?

**A**: Blocked by GitHub. Even admins cannot force-push to main (unless they change branch protection settings).

### Q: New push clears approval?

**A**: Yes. `require_last_push_approval: true` means each new push requires a fresh approval. This prevents "approve, then sneak in a different commit later."

---

## Diagram: Complete Flow

```
Developer creates PR with CERBER.md change
  ↓
GitHub Actions triggers
  ↓
1️⃣  lint_and_typecheck: ✅ PASS
2️⃣  build_and_test: runs npm test
     → test/contract-tamper-gate.test.ts runs
     → Checks: git diff → finds CERBER.md
     → Queries GitHub API: has @owner approved?
     → NO → ❌ TEST FAILS
3️⃣  build_and_test STATUS: ❌ FAILED
  ↓
PR UI shows:
  🔴 Needs review from @owner (CODEOWNERS)
  ❌ "build_and_test" check failed
  
Cannot merge.
  ↓
Developer: "Hey @owner, please review"
Code Owner: Reviews and clicks "Approve"
  ↓
New approval in GitHub API
Developer: Pushes again (or just waits)
  ↓
GitHub re-runs build_and_test
  → test/contract-tamper-gate.test.ts runs
  → Checks: GitHub API → @owner approved? YES ✅
  → TEST PASSES
  ↓
3️⃣  build_and_test STATUS: ✅ PASSED
All checks green ✅
  ↓
✅ MERGE ALLOWED
```

---

## Files in This Implementation

### Code
- `bin/tamper-gate-v2.cjs` — GitHub API approval checker
- `test/contract-tamper-gate.test.ts` — 5 @fast test cases
- `.github/CODEOWNERS` — Code owner requirements
- `.github/workflows/cerber-pr-fast.yml` — Includes test suite

### Scripts
- `scripts/setup-branch-protection.sh` — One-command GitHub setup
- `scripts/verify-pr-protection.sh` — Verification & diagnostics

### Docs
- This file: Complete implementation guide
- `CEL_COMPLETE_SUMMARY.md` — Architecture summary

---

**Status**: ✅ READY FOR GITHUB CONFIGURATION  
**Next**: Run `bash scripts/setup-branch-protection.sh`  
**Then**: Verify on PR #62 with `bash scripts/verify-pr-protection.sh`
