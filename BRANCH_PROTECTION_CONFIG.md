# Branch Protection Rules for `main`

**Purpose**: Enforce required checks from cerber-pr-fast.yml while allowing heavy tests to run optionally

---

## 📋 CONFIGURATION FOR GITHUB UI

### Settings Path:
```
GitHub → Repository → Settings → Branches → Branch Protection Rules → main
```

### Required Status Checks (FAST GATE ONLY)

**Enable**: "Require status checks to pass before merging"  
**Enable**: "Require branches to be up to date before merging"

**Required checks** (these MUST pass to merge PR):
```
✓ Lint & Type Check
✓ Build & Unit
✓ Pack (npm pack)
✓ Cerber Doctor (install + doctor)
✓ CI Summary (PR checks passed)
```

**Do NOT require** (these run but don't block):
```
✗ Guardian PRE (pre-commit simulation)        [runs on main-heavy only]
✗ Guardian CI (post gate)                     [runs on main-heavy only]
✗ E2E (solo/dev/team) + artifacts             [runs on main-heavy only]
✗ npm Package Validation                      [runs on main-heavy only]
```

---

## 🔧 GITHUB API CONFIGURATION (Optional)

If you want to automate this via API or gh CLI:

```bash
# Install gh CLI if not already installed
gh repo edit Agaslez/cerber-core \
  --enable-branch-protection \
  --require-status-checks \
  --require-status-checks-strict \
  --required-status-checks "Lint & Type Check" \
                            "Build & Unit" \
                            "Pack (npm pack)" \
                            "Cerber Doctor (install + doctor)" \
                            "CI Summary (PR checks passed)"
```

---

## ✅ WHAT HAPPENS AFTER THIS CONFIG

### On Pull Request:
```
Status:
  ✓ Lint & Type Check             [REQUIRED]  2 min
  ✓ Build & Unit                  [REQUIRED]  3 min
  ✓ Pack (npm pack)               [REQUIRED]  1 min
  ✓ Cerber Doctor (install + doctor) [REQUIRED]  3 min
  ✓ CI Summary (PR checks passed)    [REQUIRED]  0 min
  ────────────────────────────────────────────────
  Total: ~9 minutes ⏱️

  ✓ Can merge when all 5 above pass
  
  (No wait for Guardian, E2E, Package Validation on PR)
```

### On Push to Main:
```
Status (PR workflow still runs):
  ✓ Lint & Type Check             [FAST]      2 min
  ✓ Build & Unit                  [FAST]      3 min
  ✓ Pack (npm pack)               [FAST]      1 min
  ✓ Cerber Doctor (install + doctor) [FAST]      3 min
  ✓ CI Summary (PR checks passed)    [FAST]      0 min

PLUS (Main-Heavy workflow):
  ↻ Guardian PRE (pre-commit simulation)     [OPTIONAL]  2 min
  ↻ Guardian CI (post gate)                  [OPTIONAL]  2 min
  ↻ E2E (solo/dev/team) + artifacts         [OPTIONAL]  4 min
  ↻ npm Package Validation                   [OPTIONAL]  2 min
  ────────────────────────────────────────────────
  Total: ~24 minutes

  ✓ Comprehensive testing (all 9 jobs)
  ✗ Not blocking anything (already merged)
```

---

## 🎯 ACTUAL JOB NAMES (from YAML)

These are the exact names from `.github/workflows/cerber-pr-fast.yml`:

| Job ID in YAML | Name in GitHub Actions |
|---|---|
| `lint_and_typecheck` | **Lint & Type Check** |
| `build_and_unit` | **Build & Unit** |
| `pack_tarball` | **Pack (npm pack)** |
| `cerber_doctor` | **Cerber Doctor (install + doctor)** |
| `ci_summary` | **CI Summary (PR checks passed)** |

---

## 📝 MANUAL SETUP STEPS (GitHub UI)

1. Go to: **Repository → Settings → Branches**
2. Click **Add rule**
3. **Branch name pattern**: `main`
4. Check: ✓ **Require a pull request before merging**
   - ✓ Require approvals: `1`
   - ✓ Dismiss stale pull request approvals when new commits are pushed
5. Check: ✓ **Require status checks to pass before merging**
   - ✓ Require branches to be up to date before merging
   - **Search for status checks**:
     - Add: `Lint & Type Check`
     - Add: `Build & Unit`
     - Add: `Pack (npm pack)`
     - Add: `Cerber Doctor (install + doctor)`
     - Add: `CI Summary (PR checks passed)`
6. Check: ✓ **Require code reviews** (optional, customize as needed)
7. Check: ✓ **Include administrators** (recommended)
8. Click **Create**

---

## 🚀 VERIFICATION

After applying the rule:

**Test #1**: Create a dummy PR
- Expected: Only 5 fast checks run (no heavy tests)
- Timeline: Should complete in ~9 minutes

**Test #2**: Merge PR (if all checks pass)
- Expected: Can merge immediately when 5 fast checks pass
- No blocking on Guardian/E2E/Package tests

**Test #3**: Push directly to main (via commit)
- Expected: Both workflows trigger:
  - `cerber-pr-fast.yml` (fast checks)
  - `cerber-main-heavy.yml` (all comprehensive tests)
- Timeline: Heavy tests run in parallel (~24 minutes total)

---

## ⚠️ IMPORTANT NOTES

1. **Job names must match exactly** - If GitHub can't find a status check, it won't be listed
   - Solution: After first run of `cerber-pr-fast.yml`, names will appear in the "Search" box
   
2. **Timing**: After you create this PR with the new workflows:
   - First run: Workflows will appear as pending
   - GitHub will then offer them as available status checks
   - Then you can add them to branch protection

3. **Testing workflow**:
   - Create PR → Let fast workflow run (~9 min) → Check green ✅
   - Then go to Settings → Branches → Add rule → Select the 5 checks
   
4. **Old workflow removal**:
   - Delete `.github/workflows/cerber-verification.yml` from the codebase
   - It was split into `cerber-pr-fast.yml` + `cerber-main-heavy.yml`

---

## 📊 SUMMARY TABLE

| Workflow | Triggers | Jobs | Time | Required for PR? |
|---|---|---|---|---|
| **cerber-pr-fast.yml** | pull_request to main | 5 (FAST) | ~9 min | ✓ YES |
| **cerber-main-heavy.yml** | push to main + nightly | 9 (all) | ~24 min | ✗ NO |

---

**Ready to verify?** After you create this PR:
1. GitHub will show available status checks
2. Go to Settings → Branches → main → Add the 5 required checks
3. Subsequent PRs will only need to pass fast checks
