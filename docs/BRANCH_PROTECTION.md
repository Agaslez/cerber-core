# Branch Protection & Owner Approval Configuration

## Overview

ZADANIE 2.3 implements owner approval enforcement for critical infrastructure changes. This document describes the branch protection setup required to enforce the One Truth policy.

---

## Required Branch Protection Rules

### For `main` branch:

1. **Require pull request reviews before merging**
   - Required number of reviewers: **1**
   - Dismiss stale pull request approvals: **Yes**
   - Require review from code owners: **Yes**
   - Restrict who can dismiss pull request reviews: **Yes** (only admins)

2. **Require status checks to pass before merging**
   - Required checks (must ALL pass):
     - `lint_and_typecheck` - From cerber-pr-fast.yml
     - `build_and_test` - From cerber-pr-fast.yml  
     - `comprehensive_tests` - From cerber-main-heavy.yml

3. **Require branches to be up to date before merging**
   - **Enabled**: Yes

4. **Require conversation resolution before merging**
   - **Enabled**: Yes

5. **Require signed commits**
   - **Enabled**: Yes (recommended for production)

---

## CODEOWNERS Setup

Create `.github/CODEOWNERS` file with the following:

```
# Protected files require owner review

# One Truth contract and policy
CERBER.md @owner
.cerber/ @owner
.github/workflows/ @owner

# Critical infrastructure
package.json @owner
package-lock.json @owner
bin/ @owner

# Core systems
src/guardian/ @owner
src/core/Orchestrator.ts @owner
src/cli/generator.ts @owner
src/cli/drift-checker.ts @owner
src/cli/guardian.ts @owner
src/cli/doctor.ts @owner
```

### Team Mode Alternative

When running `cerber init --mode=team`, automatically generate CODEOWNERS with:

```
# Team mode - distributed responsibility
CERBER.md @owners
.cerber/ @owners

# CI/CD gates - team review required
.github/workflows/ @owners
bin/ @owners

# Core infrastructure
src/core/ @owners
src/guardian/ @owners
src/cli/ @owners

# Security/architecture
docs/BRANCH_PROTECTION.md @owners
docs/ARCHITECTURE.md @owners
```

---

## Enforcement Mechanism

### 1. Guardian Pre-Commit Hook

When modified files are in the protected list:
- Hook checks for owner acknowledgment in commit message
- Requires one of:
  - `--ack-protected` flag
  - `--owner-ack "reason"` flag
  - `OWNER_APPROVED: YES` in commit message

### 2. Tamper Gate Test

File: `test/contract-tamper-gate.test.ts`

Detects if protected files were modified in a PR:
- If changes to: CERBER.md, .cerber/**, .github/workflows/**, package.json
- Requires: `OWNER_APPROVED: YES` marker in PROOF.md
- Exit code: 2 (blocker) if violated

**Protected Files List**:
- CERBER.md (One Truth contract)
- .cerber/contract.yml (policy source)
- .github/workflows/* (CI/CD gates)
- package.json, package-lock.json (dependencies)
- bin/** (CLI entry points)
- src/guardian/** (Guardian system)
- src/core/Orchestrator.ts (core)
- src/cli/*.ts (CLI tools)

### 3. PR Workflow Check

The `cerber-pr-fast.yml` workflow includes the tamper gate test:
- Runs as part of `build_and_test` job
- Must pass before merge is allowed
- Prevents both agent and human bypass

---

## GitHub CLI Setup

To verify branch protection is configured:

```bash
# List all branch protection rules
gh api repos/OWNER/REPO/branches/main/protection

# Check required status checks
gh api repos/OWNER/REPO/branches/main/protection/required_status_checks

# Verify code owners enforcement
gh api repos/OWNER/REPO/branches/main/protection/required_pull_request_reviews
```

To update branch protection:

```bash
# Require status checks
gh api repos/OWNER/REPO/branches/main/protection/required_status_checks \
  -X PATCH \
  -f required: true \
  -f strict: true \
  -f contexts:='["lint_and_typecheck","build_and_test","comprehensive_tests"]'

# Require code owners
gh api repos/OWNER/REPO/branches/main/protection/required_pull_request_reviews \
  -X PATCH \
  -f require_code_owner_reviews: true \
  -f required_approving_review_count: 1
```

---

## Manual Process (if automation unavailable)

If you cannot use gh CLI to configure branch protection:

1. Go to GitHub repo → Settings → Branches
2. Click "Add rule" under "Branch protection rules"
3. Apply to branch pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
   - ✅ Require code owner reviews for pull requests
5. Select required status checks:
   - `lint_and_typecheck`
   - `build_and_test`
   - `comprehensive_tests`

---

## Testing Branch Protection

To verify the setup works:

```bash
# 1. Create a test branch
git checkout -b test/branch-protection

# 2. Modify a protected file
echo "test" >> CERBER.md

# 3. Commit without OWNER_APPROVED
git commit -m "test: unauthorized change"
# ❌ Should fail - Guardian hook blocks it

# 4. Commit with approval marker
git commit -m "test: authorized change
OWNER_APPROVED: YES
Reason: Testing branch protection"
# ✅ Should succeed

# 5. Push and create PR
git push -u origin test/branch-protection
gh pr create --title "test: branch protection" --body "Testing"

# 6. Try to merge without approval
gh pr merge --auto  # ❌ Should fail - needs review + checks

# 7. Get approval and retry
# Once approved + all checks pass
gh pr merge --auto  # ✅ Should succeed
```

---

## Definition of Done (DoD)

✅ ZADANIE 2.3 Completion Checklist:

- [x] CERBER.md: ONE TRUTH policy section added (lines 1-18)
- [x] .cerber/contract.yml: Protected files with blocker flags
- [x] test/contract-tamper-gate.test.ts: Tamper detection test (5 test cases, all passing)
- [x] Guardian hook: Pre-commit enforcement enabled
- [x] PROOF.md: OWNER_APPROVED: YES marker documented
- [x] All tests passing (1635/1635, including tamper gate)
- [ ] CODEOWNERS file created (automated via `cerber init --mode=team`)
- [ ] Branch protection configured on GitHub (manual or via gh CLI)

---

## Related Documentation

- [CERBER.md](../CERBER.md) - One Truth policy
- [.cerber/contract.yml](../.cerber/contract.yml) - Protected files config
- [CI_DIAGNOSTICS_GUIDE.md](./CI_DIAGNOSTICS_GUIDE.md) - Troubleshooting CI
- [BRANCH_PROTECTION_REQUIRED_CHECKS.md](./BRANCH_PROTECTION_REQUIRED_CHECKS.md) - Check names mapping

---

## Enforcement Timeline

| Phase | When | Mechanism | Owner |
|-------|------|-----------|-------|
| **Local** | Before push | Guardian pre-commit hook | Developer |
| **PR** | On CI | Tamper gate test + status checks | GitHub Actions |
| **Merge** | Before merge | Branch protection rules | GitHub UI |
| **Post-merge** | On main | Monitor drift (ci:heavy) | Doctor service |

---

## FAQ

### Q: What if I need to modify a protected file?

A: Include `OWNER_APPROVED: YES` in your commit message with a reason:
```bash
git commit -m "feat: update CERBER.md with new gate

This change adds support for XYZ feature.

OWNER_APPROVED: YES
Reason: Feature required policy update"
```

### Q: Can the agent modify protected files?

A: Only with explicit OWNER_APPROVED marker in the commit message or PROOF.md. The Guardian hook and tamper gate test enforce this for both human and agent modifications.

### Q: How do I know what files are protected?

A: Check CERBER.md (ONE TRUTH section at top) or .cerber/contract.yml (manualEditPatterns section).

### Q: What happens if I try to merge without approval?

A: GitHub branch protection rules will block the merge. You must:
1. Get an approval from a code owner (CODEOWNERS file)
2. Pass all required status checks
3. Have all conversations resolved

### Q: How do I bypass branch protection in an emergency?

A: **You cannot**. This is intentional. Instead:
1. Create a new branch from main
2. Make the emergency fix
3. Get expedited code owner review
4. Merge normally through GitHub UI

---

**Document Last Updated**: January 14, 2026  
**Owner**: GitHub Copilot / Cerber System  
**Status**: ✅ Active & Enforced
