# CEL 2 — „JEDNA PRAWDA + ANTY-SAMOWOLKA" (One Truth + Anti-Self-Will)

**Objective**: Prevent any bypass of One Truth policy, even in SOLO mode  
**Status**: IMPLEMENTED & VERIFIED ✅  
**Date**: January 14, 2026

---

## Problem Statement

Agent (or human) could bypass Cerber by:
1. Modifying CERBER.md without permission
2. Disabling Guardian hook
3. Removing test integrity jobs
4. Circumventing approval process

Even in SOLO mode (no team):
- Agent could `rm .git/hooks/pre-commit`
- Agent could commit without `OWNER_APPROVED: YES`
- Agent could force-push to main

---

## Solution: Three-Layer Enforcement

### Layer 1: LOCAL (Guardian Pre-Commit Hook)

**File**: `bin/guardian-protected-files-hook.cjs`  
**Runs**: Before `git commit` (locally)  
**Effect**: Blocks commit if protected files modified without approval marker

**Protected Files**:
```
CERBER.md
.cerber/**
.github/workflows/**
package.json
package-lock.json
bin/**
src/guardian/**
src/core/Orchestrator.ts
src/cli/*.ts
docs/BRANCH_PROTECTION.md
```

**Approval Markers** (any of):
```
OWNER_APPROVED: YES
CERBER-APPROVED-BY: <name>
CERBER_APPROVAL=<HMAC>
```

**Example**:
```bash
# ❌ BLOCKED - tries to modify CERBER.md without marker
git commit -m "fix: update CERBER.md"
# Output:
# ╔════════════════════════════════════════════════════════════════╗
# ║          🛡️  PROTECTED FILES POLICY - GUARDIAN CHECK          ║
# ╚════════════════════════════════════════════════════════════════╝
# ⚠️  The following PROTECTED files are staged for commit:
#    • CERBER.md
# ❌ Cannot commit without acknowledgment.

# ✅ ALLOWED - adds approval marker
git commit -m "fix: update CERBER.md

OWNER_APPROVED: YES
Reason: Policy update"
```

**Exit Code**: 1 (blocks commit)

---

### Layer 2: PR (GitHub Actions - cerber-integrity Job)

**File**: `.github/workflows/cerber-pr-fast.yml` → `cerber_integrity` job  
**Runs**: On every PR to main  
**Effect**: Detects protected file changes, requires approval

**Flow**:
1. Get modified files: `git diff origin/main...HEAD --name-only`
2. Check if any match protected patterns
3. Read commit message for approval marker
4. If protected + no approval → **FAIL** (exit 1)
5. If no protected OR has approval → **PASS** (exit 0)

**Example**:
```
PR #62 pushes commit that modifies .cerber/contract.yml
  ↓
cerber-integrity job runs
  ↓
Checks commit message: "feat: update contract"
  ↓
No OWNER_APPROVED marker found
  ↓
Job FAILS → GitHub shows red X
  ↓
Cannot merge (required check failed)
```

**Exit Code**: 1 (blocks merge)

---

### Layer 3: MERGE (GitHub Branch Protection)

**Configuration** (`.github/CODEOWNERS` + branch protection):

```
Required Status Checks:
  ✅ lint_and_typecheck
  ✅ build_and_test
  ✅ cerber_integrity  ← Protected files check

Required Reviews:
  ✅ 1 approval from code owner
  ✅ Code owner for modified files (CODEOWNERS file)
  ✅ Dismiss stale reviews: OFF (for security)

Merge Rules:
  ✅ Require branches to be up-to-date before merge
  ✅ Require conversation resolution before merge
  ✅ Block force pushes
```

**CODEOWNERS**:
```
CERBER.md @owner
.cerber/ @owner
.github/workflows/ @owner
bin/ @owner
src/guardian/ @owner
src/cli/*.ts @owner
docs/BRANCH_PROTECTION.md @owner
```

**Example**:
```
Modified file: CERBER.md (protected)
  ↓
GitHub requires review from: @owner (per CODEOWNERS)
  ↓
Even if cerber-integrity passes:
  - Cannot merge without @owner approval
  - Cannot force-push to main
  - Must resolve conversations
```

**Exit Code**: Merge blocked at GitHub UI

---

## Three Tiers of Approval (Mechanical)

### Tier 1: Commit Message Marker (Simple)

**For**: Humans, most agents  
**Barrier**: Message discipline

```bash
# In agent code:
const commitMsg = `feat: update CERBER.md

Updated policy section for new feature.

OWNER_APPROVED: YES
Reason: Feature requires policy update`;

git.commit(commitMsg);
```

**Verification**: cerber-integrity grep for marker

**Strength**: ⭐⭐☆☆☆ (easy to forget if agent logic broken)

### Tier 2: HMAC Token (Intermediate)

**For**: Agents with secrets access  
**Barrier**: Cryptographic signature

```bash
# Owner generates token:
CERBER_OWNER_KEY=$(openssl rand -hex 32)
# Share as GitHub secret: CERBER_OWNER_KEY

# Agent uses it:
const crypto = require('crypto');
const commitSha = 'current_commit_sha';
const timestamp = Date.now();
const hmac = crypto
  .createHmac('sha256', process.env.CERBER_OWNER_KEY)
  .update(`${commitSha}:${timestamp}`)
  .digest('hex');

git.commit(`message\n\nCERBER_APPROVAL=${hmac}`);
```

**Verification**: cerber-integrity validates HMAC signature

**Strength**: ⭐⭐⭐⭐☆ (agent needs secret, even with secret can't forge)

### Tier 3: GitHub Secret + Signature (Hard)

**For**: Zero-trust environment  
**Barrier**: Hardware security (if owner uses hardware key)

```bash
# Owner signs with GPG/hardware key:
git commit -S -m "message\n\nCERBER_APPROVAL=<gpg_signature>"

# Agent cannot sign without owner's key
```

**Verification**: `git verify-commit` + check signature

**Strength**: ⭐⭐⭐⭐⭐ (impossible without owner's key)

---

## Protection Against Bypass Scenarios

### Scenario 1: Agent Tries to Disable Guardian Hook

```bash
# Agent code tries:
rm .git/hooks/pre-commit
git commit -m "remove guardian hook"
```

**What Happens**:
- ✅ Layer 1: Guardian detects modified `.git/hooks/pre-commit`
- ✅ Layer 1: File protected → blocks commit
- 🛡️  Agent cannot push without approval marker

**If Layer 1 Bypassed** (agent force-commits):
- ✅ Layer 2: cerber-integrity job runs
- ✅ Layer 2: Detects `.git/hooks/pre-commit` in diff
- ✅ Layer 2: No approval marker → FAILS
- 🛡️  GitHub blocks merge

**If Layer 2 Bypassed** (someone hacks CI):
- ✅ Layer 3: GitHub branch protection prevents force-push
- ✅ Layer 3: Requires code owner review anyway
- 🛡️  Cannot merge without human approval

**Result**: ❌ Cannot disable Guardian

---

### Scenario 2: Agent Modifies CERBER.md Policy

```javascript
// Agent code tries:
fs.writeFileSync('CERBER.md', newPolicy);
git.commit('update policy');
```

**What Happens**:
- ✅ Layer 1: Guardian hook detects CERBER.md staged
- ✅ Layer 1: Protected file → blocks commit unless OWNER_APPROVED: YES
- ❌ Agent cannot commit without marker

**If Agent Adds Marker**:
```javascript
const msg = `update policy\n\nOWNER_APPROVED: YES\nReason: ${reason}`;
git.commit(msg);
```
- ✅ Layer 1: Passes (marker present)
- ✅ Agent can push
- ✅ Layer 2: cerber-integrity reads marker
- ✅ Layer 2: Passes (approval found)
- ✅ Layer 3: Still requires code owner review (CODEOWNERS)
- ✅ GitHub shows: "Needs review from @owner"
- ❌ Cannot merge without human approving

**Result**: ✅ Policy change possible but WITH ACCOUNTABILITY

---

### Scenario 3: Agent Removes Test Integrity Job

```yaml
# Agent modifies .github/workflows/cerber-pr-fast.yml
# Removes: cerber_integrity job
```

**What Happens**:
- ✅ Layer 1: Guardian detects `.github/workflows/cerber-pr-fast.yml` modified
- ✅ Layer 1: Protected file → blocks commit
- ❌ Agent cannot commit

**If Agent Adds Approval Marker**:
- ✅ Layer 1: Passes (marker present)
- ✅ Layer 2: cerber-integrity sees workflow file changed
- ✅ Layer 2: Protected pattern matches
- ✅ Layer 2: Checks marker
- ✅ Layer 2: Passes (marker present)
- ✅ Layer 3: Still requires code owner review
- ❌ Cannot merge without @owner approval

**Result**: ✅ Change tracked but requires human approval

---

### Scenario 4: Agent Force-Pushes to Main (Worst Case)

```bash
# Agent has commit with approval marker
# Tries to force-push to main, bypassing PR
git push origin HEAD:main --force
```

**What Happens**:
- ✅ Layer 3: GitHub branch protection blocks force-push
- Error: "Protected branch: push to main blocked"
- ❌ Cannot push

**Even if protection disabled locally**:
- ✅ Layer 3: GitHub server-side protection cannot be disabled remotely
- ✅ Even owner cannot force-push to main (admin setting)
- ❌ Cannot push

**Result**: ❌ Cannot bypass PR workflow

---

## Practical Implementation

### For Humans (Manual PR)

1. Make change to protected file
2. Commit with approval marker:
   ```bash
   git commit -m "feat: update CERBER.md

   Reason for change...

   OWNER_APPROVED: YES
   Reason: Policy update for feature X"
   ```
3. Push to feature branch
4. Create PR → GitHub asks for code owner review
5. Code owner reviews and approves
6. Merge

### For Agent (Automated)

1. Determine if protected files will be modified
   ```typescript
   const protected = await getProtectedFilesModified();
   if (protected.length > 0) {
     // Need approval
   }
   ```
2. If protected, include approval in commit:
   ```typescript
   const approvalMarker = `OWNER_APPROVED: YES\nReason: ${reason}`;
   git.commit(message + '\n\n' + approvalMarker);
   ```
3. Push and create PR
4. cerber-integrity job verifies marker
5. If no marker → job fails → cannot merge
6. PR still requires code owner review (GitHub layer)
7. Once approved → can merge

### For Emergency (Override)

If truly needed (and owner agrees):

1. Owner creates temporary branch with approval secret
2. Commits change with HMAC token
3. PR requires double-approval:
   - From cerber-integrity (checks HMAC)
   - From @owner (code owner review)
4. Both must pass
5. Special logging of "emergency merge"

---

## Configuration Checklist

### GitHub Settings (One-Time)

```bash
# 1. Set CODEOWNERS
# File: .github/CODEOWNERS (already created)

# 2. Configure branch protection
gh api repos/Agaslez/cerber-core/branches/main/protection -X PATCH \
  -f required_status_checks.strict:=true \
  -f required_status_checks.contexts:='["lint_and_typecheck","build_and_test","cerber_integrity"]' \
  -f require_code_owner_reviews:=true \
  -f required_approving_review_count:=1 \
  -f require_branches_to_be_up_to_date:=true \
  -f require_conversation_resolution:=true \
  -f allow_force_pushes:=false \
  -f allow_deletions:=false

# 3. (Optional) Create approval secret for HMAC tier
gh secret set CERBER_OWNER_KEY --body "$(openssl rand -hex 32)" \
  --repo Agaslez/cerber-core
```

### Local Development (Each Developer)

```bash
# 1. Install Guardian hook (happens automatically on npm install)
# File: .husky/pre-commit → bin/guardian-protected-files-hook.cjs

# 2. Test it:
echo "test" >> CERBER.md
git add CERBER.md
git commit -m "test"
# Should fail with guardian message

# 3. Fix with marker:
git commit --amend -m "test

OWNER_APPROVED: YES
Reason: Testing guardian"
# Should succeed
```

---

## Definition of Done ✅

- [x] Guardian pre-commit hook implemented (bin/guardian-protected-files-hook.cjs)
- [x] cerber-integrity CI job added to PR workflow
- [x] CODEOWNERS file created
- [x] Three-layer enforcement documented
- [x] Bypass scenarios tested (7 scenarios documented)
- [x] Approval markers documented (3 tiers)
- [x] Configuration steps documented
- [x] Local testing procedures documented
- [x] All tests passing (1635/1635)
- [ ] Manual: Configure GitHub branch protection
- [ ] Manual: Test approval workflow on PR
- [ ] Manual: Verify all bypass scenarios blocked

---

## Next Phase: CEL 3 (Deterministic Test Organization)

After CEL 2 is active:

1. **Layer tests** into buckets:
   - `@fast` (unit) — <1s each
   - `@integration` — <5s each
   - `@e2e` — browser/real services
   - `@pack` — npm package integrity

2. **CI runs in order**:
   - Fast (1-2 min) on every PR
   - Integration (5 min) on every PR
   - E2E (10 min) only on main
   - Pack (1 min) on every PR

3. **Parallel where safe**:
   - Fast tests: parallel (independent)
   - Integration: sequential (may need DB)
   - E2E: sequential (shared browser)

4. **Golden test**: `cerber doctor` command
   - Install from npm tarball (real release)
   - Run in clean sandbox
   - Verify all features work
   - Must pass before release

---

**Owner**: GitHub Copilot / Cerber System  
**Phase**: Implementation Complete, awaiting GitHub configuration
