# Guardian Protection System

Three-layer security to protect critical Cerber files from accidental breaking changes.

## 🛡️ Layer 1: GitHub Branch Protection

**Files Protected:**
- `CERBER.md` - Core documentation
- `.cerber/contract.yml` - Contract definitions
- `bin/cerber-guardian` - Guardian binary
- `src/guardian/**` - Guardian implementation
- `package.json` - Dependencies

**Rules:**
- ✅ Requires pull request (no direct pushes to `main`)
- ✅ Requires code owner approval via `CODEOWNERS`
- ✅ Requires status checks to pass (`test:v3`, `lint`, `build`)
- ✅ Branch must be up to date
- ✅ No force pushes allowed
- ✅ Dismiss stale PR reviews

**Configuration:** See `BRANCH_PROTECTION.json`

## 🔒 Layer 2: Local Guardian Hook

**Activates:** Automatically on `npm install`

**Behavior:**
- Detects when you stage changes to protected files
- Blocks commit attempt
- Shows friendly error message

**To Allow Changes:**

```bash
# Option 1: Quick acknowledgment
git commit -m "Update CERBER.md" --ack-protected

# Option 2: With justification (logged)
git commit -m "Update guardian policy" --owner-ack "Fixing issue #123"
```

**Protected Patterns in Hook:**
```
CERBER.md
CERBER.yml
.cerber/contract.yml
.cerber/contracts/**
bin/cerber-guardian
src/guardian/**
src/contracts/**
src/core/Orchestrator.ts
package.json
tsconfig.json
```

**Implementation:**
- Hook: `bin/guardian-protected-files-hook.js`
- Setup: `bin/setup-guardian-hooks.js`
- Config: `.cerber/contract.yml` → `protectedFiles` section

## 🔐 Layer 3: Commit Signature Verification (Optional)

**Purpose:** Ensure changes come from trusted developers

**Mechanism:**
1. Check if commit is GPG-signed
2. If not signed, check author email against approved list
3. If neither, reject in CI

**Approved Maintainers:**
- `owner@cerber-core.dev`
- `maintainer@cerber-core.dev`
- `architect@cerber-core.dev`

**To Sign Your Commits:**

```bash
# One-time setup
gpg --gen-key
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true

# Or sign individual commits
git commit -S -m "message"
```

**CI Enforcement:**
- GitHub Actions workflow: `.github/workflows/guardian-protected-files.yml`
- Runs on any PR touching protected files
- Can enable strict mode with `strict-verification` label

## 📋 Usage Examples

### Modifying CERBER.md

```bash
# Try to commit (will be blocked)
git add CERBER.md
git commit -m "Update documentation"
# ❌ Error: Protected files require --ack-protected

# Fix 1: Quick bypass
git commit --amend --ack-protected

# Fix 2: With justification
git commit --amend --owner-ack "Clarifying contract expectations"
```

### Modifying guardian/**

```bash
git add src/guardian/index.ts
git commit -m "Fix guardian bug" --ack-protected

# This pushes to remote and creates PR
git push origin my-branch
```

**PR will then:**
1. ✅ Check branch protection rules
2. ✅ Verify commit signatures (if strict mode)
3. ✅ Wait for `@owner` approval
4. ✅ Run `test:v3` to ensure guardian still works
5. ✅ Merge only if all checks pass

### Emergency Override

```bash
# For CI/CD systems or automated fixes
export GUARDIAN_OVERRIDE=true
npm run repair  # Auto-repair scripts can bypass local checks
```

## 🧪 Testing Protections

```bash
# Test local hook
npm run test:v3

# Manually verify commit signatures
node bin/guardian-verify-commit.js HEAD

# Check what's protected
grep "protectedFiles:" .cerber/contract.yml
```

## 📝 Configuration

### In `.cerber/contract.yml`:

```yaml
protectedFiles:
  enabled: true
  requireOwnerAck: true
  blockingPatterns:
    - CERBER.md
    - .cerber/**
    - src/guardian/**
    - package.json
  allowedFlagsForBypass:
    - '--ack-protected'
    - '--owner-ack'
  requireCommentWhen:
    - Changes contract definitions
    - Changes guardian policy
    - Changes core orchestration logic
```

### In `CODEOWNERS`:

```
CERBER.md @owner
.cerber/ @owner
src/guardian/ @owner
src/core/Orchestrator.ts @architect
```

## ❓ FAQ

**Q: Why is my commit blocked?**  
A: Protected files like `CERBER.md`, `.cerber/contract.yml`, or `package.json` are staged. Use `--ack-protected` to acknowledge the change.

**Q: Can I bypass these protections?**  
A: Layer 1 (GitHub) can only be bypassed by code owners.  
Layer 2 (Local hook) can be bypassed with `--ack-protected` flag.  
Layer 3 (Signatures) required in CI only if `strict-verification` label is set.

**Q: What if the hook is broken?**  
A: Delete `.git/hooks/pre-commit` and re-run `npm install` to reinstall.

**Q: How do I disable this?**  
A: Remove `.git/hooks/pre-commit` file. (Not recommended!)  
Or export `SKIP_GUARDIAN_HOOKS=true` (for scripting only).

**Q: I'm a bot/automated system, how do I commit?**  
A: Use `--ack-protected` in commit message, or set `GUARDIAN_OVERRIDE=true` environment variable.

## 🚀 Roadmap

- [ ] Encrypted approval workflow (PR requires comment from owner)
- [ ] Commit message templates for protected file changes
- [ ] Slack notifications on protected file changes
- [ ] Dashboard showing who changed what
- [ ] Time-window restrictions (e.g., no deploys Friday evening)

## 📞 Support

If you have issues with Guardian protections:

1. Check error message for which file triggered it
2. Use `--ack-protected` to acknowledge changes
3. Ensure your branch is up to date with `main`
4. Verify you're using Node.js 18+
5. Ask `@owner` for help if protection seems incorrect
