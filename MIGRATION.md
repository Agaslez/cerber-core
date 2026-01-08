# 🔄 Migration Guide: v1.x → v2.0

**Cerber Core v2.0 is 100% backward compatible. No breaking changes!**

---

## TL;DR

✅ **All v1.x features work in v2.0**  
✅ **No code changes required**  
✅ **New features are opt-in**  
✅ **Update takes 2 minutes**

---

## Quick Migration

```bash
# 1. Update package
npm install cerber-core@latest

# 2. Verify it works
npx cerber-guardian --version
# Should show: 2.0.0-beta.1

# 3. Try new features (optional)
npx cerber-validate .github/workflows/ci.yml
```

**Done!** That's the entire migration. 🎉

---

## What's Changed

### ✅ Still Works (v1.x Features)

Everything you use today still works:

```bash
# Pre-commit validation
cerber-guardian

# Health checks
cerber-health

# Contract initialization
cerber init

# Focus mode
cerber-focus

# Morning checks
cerber-morning

# Auto-repair
cerber-repair
```

### ✨ New Features (v2.0 Only)

These are **new** commands you can start using:

```bash
# NEW: Workflow validation
cerber-validate .github/workflows/ci.yml

# NEW: Auto-fix
cerber-validate ci.yml --fix

# NEW: Template selection
cerber init --template nodejs
```

---

## API Migration

### v1.x API (Still Works)

```typescript
// Old imports work exactly the same
import { Cerber, Guardian, makeIssue } from 'cerber-core';

// Everything works
const cerber = new Cerber(checks);
const result = await cerber.runChecks();
```

### v2.0 New APIs (Optional)

```typescript
// New imports available
import { 
  SemanticComparator,  // NEW
  RuleManager,         // NEW
  WorkflowAST,         // NEW
  ContractAST          // NEW
} from 'cerber-core';

// Old imports still work
import { Cerber, Guardian } from 'cerber-core';
```

---

## Step-by-Step Migration

### For npm/yarn Users

```bash
# 1. Update package.json
npm install cerber-core@latest

# 2. Test existing functionality
npm run test

# 3. Verify pre-commit hooks
git commit -m "test" --allow-empty
# Should run Guardian as before

# 4. Done!
```

### For Package Consumers

If you import cerber-core in your code:

```typescript
// ✅ This still works (v1.x)
import { Cerber } from 'cerber-core';

// ✅ This now works too (v2.0)
import { SemanticComparator } from 'cerber-core';
```

No changes needed to existing code!

---

## Feature Adoption Timeline

### Day 1: Update Package
```bash
npm install cerber-core@latest
```
- ✅ All existing features work
- ✅ No changes needed

### Day 2-7: Explore v2.0 Features
```bash
# Try workflow validation
npx cerber-validate .github/workflows/ci.yml

# See what auto-fix can do
npx cerber-validate ci.yml --fix --dry-run
```
- ✅ Learn new capabilities
- ✅ Preview auto-fixes

### Week 2: Adopt Templates
```bash
# Create contract from template
npx cerber init --template nodejs

# Customize .cerber/contract.yml
# Add to CI/CD
```
- ✅ Structured contracts
- ✅ Best practices built-in

### Week 3+: Full v2.0 Workflow
```bash
# Validate on every PR
npx cerber-validate .github/workflows/*.yml --fix
```
- ✅ Automated validation
- ✅ Auto-fix in CI

---

## Configuration Changes

### v1.x Config (Still Works)

```yaml
# CERBER.md (v1.x format)
CERBER_CONTRACT:
  version: 1
  mode: dev
  guardian:
    enabled: true
```

### v2.0 Contract (New, Optional)

```yaml
# .cerber/contract.yml (v2.0 format)
name: my-contract
version: 1.0.0
rules:
  security/no-hardcoded-secrets: error
```

You can use **both** formats simultaneously!

---

## Common Migration Scenarios

### Scenario 1: Solo Developer

**Before (v1.x):**
```bash
npm install -D cerber-core
npx cerber init
```

**After (v2.0):**
```bash
npm install -D cerber-core@latest
npx cerber init --template nodejs  # NEW: Template selection
npx cerber-validate ci.yml          # NEW: Validate workflows
```

### Scenario 2: Team with CI/CD

**Before (v1.x):**
```yaml
# .github/workflows/cerber.yml
- run: npx cerber-guardian
- run: npx cerber-health
```

**After (v2.0):**
```yaml
# .github/workflows/cerber.yml
- run: npx cerber-guardian              # Still works
- run: npx cerber-health                # Still works
- run: npx cerber-validate ci.yml       # NEW: Validate workflow
```

### Scenario 3: Package Consumer

**Before (v1.x):**
```typescript
import { Cerber } from 'cerber-core';

const cerber = new Cerber(checks);
await cerber.runChecks();
```

**After (v2.0):**
```typescript
// Old code still works
import { Cerber } from 'cerber-core';
const cerber = new Cerber(checks);
await cerber.runChecks();

// New features available
import { SemanticComparator } from 'cerber-core';
const result = await new SemanticComparator().compare(workflow);
```

---

## Troubleshooting

### Issue: "Module not found: yaml"
```bash
# v2.0 added yaml dependency
npm install
```

### Issue: "cerber-validate not found"
```bash
# Make sure you're on v2.0+
npm list cerber-core
# Should show: cerber-core@2.0.0-beta.1

# Reinstall if needed
npm install cerber-core@latest
```

### Issue: "Old behavior changed"
This shouldn't happen! v2.0 is 100% backward compatible.

If you encounter this:
1. Check your version: `npm list cerber-core`
2. Report on GitHub Issues
3. Temporarily pin to v1.x: `npm install cerber-core@1.1.12`

---

## Rollback (If Needed)

If you need to rollback to v1.x:

```bash
# Install specific v1.x version
npm install cerber-core@1.1.12

# Verify
npx cerber-guardian --version
# Should show: 1.1.12
```

---

## Testing Your Migration

### 1. Test Existing Features
```bash
# Pre-commit
git commit -m "test" --allow-empty

# Health check
npx cerber-health

# Contract init
npx cerber init
```

### 2. Test New Features
```bash
# Validation
npx cerber-validate .github/workflows/ci.yml

# Auto-fix (dry-run)
npx cerber-validate ci.yml --fix --dry-run
```

### 3. Run Your Test Suite
```bash
npm test
```

All tests should pass!

---

## Need Help?

- **Discord:** https://discord.gg/V8G5qw5D (`#help` channel)
- **GitHub Issues:** Report migration issues
- **Email:** (if configured in package.json)

---

## Summary

| Aspect | v1.x | v2.0 | Action Required |
|--------|------|------|----------------|
| Guardian | ✅ Works | ✅ Works | None |
| Health Check | ✅ Works | ✅ Works | None |
| Contract Init | ✅ Works | ✅ Enhanced | Optional |
| Validation | ❌ No | ✅ NEW | Opt-in |
| Auto-Fix | ❌ No | ✅ NEW | Opt-in |
| Templates | ❌ No | ✅ NEW | Opt-in |
| API | ✅ Works | ✅ Works + NEW | None |

**Migration Risk: ZERO** ✅  
**New Value: HIGH** 🚀  
**Time Required: 2 MINUTES** ⏱️

---

**Ready to migrate? Update now!**

```bash
npm install cerber-core@latest
```

🎉 **Welcome to v2.0!**
