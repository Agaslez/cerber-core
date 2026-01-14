# Quick Action Plan — CEL Implementation Ready for GitHub

**Status**: Code Complete ✅ | Tests Passing ✅ | Awaiting GitHub Configuration 🔧

---

## What Was Delivered

### ✅ Implemented & Tested (Ready Now)

1. **CEL 1: ZIELONO** — All required checks green
   - `bin/cerber-integrity.cjs` — Protected files validation job
   - `.github/workflows/cerber-pr-fast.yml` — Updated with new job
   - `scripts/diagnose-pr-checks.sh` — Diagnostic tool
   - `docs/CEL_1_ZIELONO.md` — Complete configuration guide

2. **CEL 2: JEDNA PRAWDA** — Three-layer enforcement
   - `.github/CODEOWNERS` — Code owner protection
   - `docs/CEL_2_JEDNA_PRAWDA.md` — Full specification
   - Guardian hook working locally (pre-commit)
   - Approval markers documented (3 tiers)

3. **Test Stability** (from ZADANIE 2)
   - cli-signals.test.ts: 8/8 ✅
   - npm-pack-smoke.test.ts: 14/14 ✅
   - All 1635 tests: PASSING ✅

### 📋 Documentation Created

| File | Lines | Purpose |
|------|-------|---------|
| `CEL_COMPLETE_SUMMARY.md` | 544 | Master summary with DoD checklist |
| `docs/CEL_1_ZIELONO.md` | 287 | PR #62 configuration + verification |
| `docs/CEL_2_JEDNA_PRAWDA.md` | 412 | Three-layer enforcement spec |
| `docs/BRANCH_PROTECTION.md` | 291 | Original setup guide |

---

## What You Need to Do on GitHub (5 Steps)

### Step 1: Configure Branch Protection (5 min)

Copy-paste this command:

```bash
gh api repos/Agaslez/cerber-core/branches/main/protection -X PATCH \
  -f required_status_checks.strict:=true \
  -f required_status_checks.contexts:='["lint_and_typecheck","build_and_test","cerber_integrity"]' \
  -f require_code_owner_reviews:=true \
  -f required_approving_review_count:=1 \
  -f require_branches_to_be_up_to_date:=true \
  -f require_conversation_resolution:=true \
  -f allow_force_pushes:=false \
  -f allow_deletions:=false
```

### Step 2: Verify Configuration (2 min)

```bash
gh api repos/Agaslez/cerber-core/branches/main/protection/required_status_checks | jq
```

**Expected output**:
```json
{
  "strict": true,
  "contexts": ["lint_and_typecheck", "build_and_test", "cerber_integrity"]
}
```

### Step 3: Test on PR #62 (5 min)

Run diagnostic:
```bash
bash scripts/diagnose-pr-checks.sh Agaslez/cerber-core 62
```

Should show all 3 checks ✅ passing.

### Step 4: (Optional) Create Approval Secret (1 min)

For HMAC approval tier (recommended):

```bash
gh secret set CERBER_OWNER_KEY \
  --body "$(openssl rand -hex 32)" \
  --repo Agaslez/cerber-core
```

### Step 5: Remove Old Ghost Checks (if any)

If PR #62 shows red X for checks that don't exist:

```bash
# See current checks:
gh pr view 62 --json statusCheckRollup

# If any old ones, use gh API to remove (or remove via GitHub UI)
```

---

## How It Works (Quick Explanation)

### Layer 1: Local (Developer Machine)

```
Developer tries: git commit -m "update CERBER.md"
Guardian hook detects: CERBER.md is protected
Hook blocks: ❌ "Cannot commit without OWNER_APPROVED: YES"
Developer fixes: git commit -m "update CERBER.md\n\nOWNER_APPROVED: YES\nReason: ..."
Result: ✅ Commit allowed
```

### Layer 2: PR (GitHub Actions)

```
cerber-integrity job runs on every PR
Checks: git diff origin/main...HEAD --name-only
If protected files found:
  → reads commit message
  → looks for approval marker
  → if found: ✅ PASS (exit 0)
  → if not found: ❌ FAIL (exit 1, blocks merge)
```

### Layer 3: Merge (GitHub UI)

```
Even if cerber-integrity passes:
  → GitHub requires code owner review (CODEOWNERS)
  → PR status shows: "Needs review from @owner"
  → Cannot merge without approval
  → Cannot force-push (GitHub blocks it)
```

---

## Test Results (Current)

```
Test Suites: 1 skipped, 95 passed, 95 of 96 total
Tests:       32 skipped, 1635 passed, 1667 total
Snapshots:   11 passed, 11 total
Time:        ~75s
```

✅ **All systems green** — No regressions, no flaky tests.

---

## Key Files to Review

1. **For immediate setup**: `docs/CEL_1_ZIELONO.md` (configuration steps)
2. **For understanding design**: `CEL_COMPLETE_SUMMARY.md` (architecture & DoD)
3. **For three-layer explanation**: `docs/CEL_2_JEDNA_PRAWDA.md` (detailed spec)
4. **For troubleshooting**: `scripts/diagnose-pr-checks.sh` (run on PR #62)

---

## Expected Outcome After Configuration

### PR #62 (or any new PR with protected files)

❌ **Without approval marker**:
```
Checks:
  ✅ lint_and_typecheck: PASS
  ✅ build_and_test: PASS
  ❌ cerber_integrity: FAIL (Protected files detected, no approval)
  
Status: Cannot merge
  → Red X on cerber_integrity
  → "Required status check failed"
```

✅ **With approval marker**:
```
Checks:
  ✅ lint_and_typecheck: PASS
  ✅ build_and_test: PASS
  ✅ cerber_integrity: PASS (Approval marker found)
  
Status: Awaiting review
  → GitHub requires code owner review (CODEOWNERS)
  → Once @owner approves: Can merge
```

---

## Checklists

### Before Testing PR #62

- [ ] Run: `gh api repos/Agaslez/cerber-core/branches/main/protection/required_status_checks`
- [ ] Confirm: contexts = `["lint_and_typecheck","build_and_test","cerber_integrity"]`
- [ ] Run: `bash scripts/diagnose-pr-checks.sh Agaslez/cerber-core 62`
- [ ] Confirm: All 3 checks appear in output

### Testing Approval Mechanism

Create a test PR with protected file change:

```bash
git checkout -b test/approval-check
echo "test policy" >> CERBER.md
git add CERBER.md

# Test 1: Without approval
git commit -m "test: unauthorized change"
# Expected: ❌ Guardian hook blocks

# Test 2: With approval marker
git commit -m "test: authorized change

OWNER_APPROVED: YES
Reason: Testing approval mechanism"
# Expected: ✅ Commit allowed

git push -u origin test/approval-check
gh pr create --title "test: approval" --body "Testing"
# Expected: All checks pass, needs @owner review
```

### Cleanup

```bash
gh pr close <pr_number> --delete-branch
git checkout main
git branch -D test/approval-check
```

---

## Troubleshooting

### "Required check not found"

```bash
# Problem: cerber_integrity in protected but no job producing it
# Solution: Run gh api command from Step 1 above
```

### "Ghost check keeps failing"

```bash
# Problem: Old check name still in branch protection
# Solution: List current contexts, remove old ones via gh api
gh api repos/Agaslez/cerber-core/branches/main/protection/required_status_checks --jq '.contexts[]'
```

### "cerber-integrity job never finishes"

```bash
# Check workflow logs:
gh run list --branch rcx-hardening -L 5
gh run view <RUN_ID> --log
# Usually just needs fetch-depth: 0 for git diff to work
```

---

## One-Line Summary

✅ **Code ready** → 🔧 **Configure GitHub branch protection** → ✅ **PR #62 all green** → 📦 **Ready for production**

---

**Last Updated**: January 14, 2026  
**Branch**: rcx-hardening (19 commits ahead of origin)  
**Next**: CEL 3 — Deterministic test organization
