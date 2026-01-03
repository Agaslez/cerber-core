# 👤 Solo Developer Workflow

> Simplified Cerber Core guide for individual developers

---

## 🎯 Who This Is For

- **You work alone** on a project
- **You want quality** without complexity
- **You need speed** without sacrificing safety
- **You use AI** (Claude, ChatGPT, etc.) for coding help

**Time to setup:** 15 minutes  
**Daily time investment:** 5 minutes  
**Expected ROI:** 1+ hour saved per day

---

## 📦 Quick Setup (15 minutes)

### Step 1: Install Cerber (2 min)

```bash
cd your-project
npm install cerber-core --save-dev
```

### Step 2: Initialize Architecture (5 min)

```bash
# Create architecture schema
npx cerber-guardian init

# Answer a few questions:
# - What patterns to forbid? (console.log, debugger, any)
# - Required files? (README.md, package.json)
# - Required imports? (@/types, ./config)
```

This creates: `.cerber/ARCHITECTURE_SCHEMA.json`

### Step 3: Setup Health Checks (5 min)

```bash
# Create health check file
touch src/cerber-health.ts
```

```typescript
// src/cerber-health.ts
import { Cerber } from 'cerber-core';

const cerber = new Cerber();

// Database check (if you have one)
cerber.check('DB', async () => {
  const isConnected = await checkDatabase();
  return {
    healthy: isConnected,
    message: isConnected ? 'DB OK' : 'DB connection failed',
    severity: 'critical'
  };
});

// Environment check
cerber.check('ENV', async () => {
  const required = ['DATABASE_URL', 'API_KEY'];
  const missing = required.filter(v => !process.env[v]);
  return {
    healthy: missing.length === 0,
    message: missing.length ? `Missing: ${missing.join(', ')}` : 'All vars present',
    severity: 'error'
  };
});

export default cerber;
```

### Step 4: Setup Git Hook (3 min)

```bash
# Install husky
npm install husky --save-dev
npx husky init

# Add pre-commit hook
echo "npx cerber-guardian validate" > .husky/pre-commit
```

**Done! ✅** You now have:
- ✅ Pre-commit validation (catches bugs before commit)
- ✅ Health checks (validates system state)

---

## 🌅 Daily Workflow

### Morning (2 minutes)

```bash
# Start your day with a health check
npm run dev
# Visit: http://localhost:3000/api/health
```

**What to look for:**
- ✅ All checks green? → Good to go!
- ⚠️ Warnings? → Note them, fix when convenient
- ❌ Critical issues? → Fix before coding

### While Coding (0 minutes - automatic)

```bash
git add .
git commit -m "feat: add new feature"
```

**Guardian runs automatically:**
- ✅ Passes → Commit succeeds
- ❌ Fails → See violation, fix, retry

**Example block:**
```
❌ FORBIDDEN PATTERN 'CONSOLE_LOG' found in:
   src/utils/helper.ts:23
   console.log('Debug:', data);

💡 FIX: Remove console.log or add:
// ARCHITECT_APPROVED: Debug production issue - 2026-01-03 - Stefan
```

### Before Deploy (30 seconds)

```bash
# Check health before deploying
curl http://localhost:3000/api/health
```

**If healthy → deploy safely**  
**If unhealthy → fix issues first**

### End of Day (Optional - 2 minutes)

```bash
# See what you accomplished
git log --oneline --since="9am"
git diff --stat main@{9am}
```

---

## 🚀 Advanced Features (Optional)

### SOLO Layer - Automation Scripts

**Setup (5 min):**

```bash
# Add to package.json
{
  "scripts": {
    "cerber:morning": "cerber-morning",
    "cerber:repair": "cerber-repair",
    "cerber:snapshot": "cerber-snapshot"
  }
}
```

**Usage:**

```bash
# Morning check (shows health, git status, dependencies)
npm run cerber:morning

# Auto-repair (updates deps, formats package.json)
npm run cerber:repair

# Daily snapshot (saves progress)
npm run cerber:snapshot
```

### Feature Flags (when you need them)

```bash
# Create feature flags config
mkdir -p .cerber
touch .cerber/feature-flags.json
```

```json
{
  "features": {
    "new-pricing": {
      "enabled": false,
      "description": "New pricing algorithm",
      "owner": "stefan",
      "createdAt": "2026-01-03"
    }
  }
}
```

**Use in code:**

```typescript
import { loadFeatureFlags } from 'cerber-core/solo';

const flags = loadFeatureFlags();

if (flags.features['new-pricing'].enabled) {
  // Use new pricing
} else {
  // Use old pricing
}
```

---

## 💰 Expected Results

### Week 1

```
Time investment: 15 min setup + 5 min/day = 40 minutes
Time saved:
  - Guardian blocks: 2-3 bugs × 30 min = 1-1.5 hours
  - Health checks: 1 deployment issue × 1 hour = 1 hour
  - Total: 2-2.5 hours saved

ROI: 200-275%
```

### Month 1

```
Time investment: 40 min setup + 100 min daily (5 min × 20 days) = 140 minutes
Time saved:
  - Guardian blocks: 10-15 bugs × 30 min = 5-7.5 hours
  - Health checks: 2-3 deployment issues × 1 hour = 2-3 hours
  - Total: 7-10.5 hours saved

ROI: 300-450%
```

### Year 1

```
Time saved: ~100 hours
Bugs prevented: ~120 bugs
Production incidents: ~24 incidents
Value: Priceless
```

---

## 🎯 Real Example - Solo Developer

**Name:** Stefan  
**Project:** Eliksir (bar booking system)  
**Team size:** 1  
**Date:** January 2, 2026

### Morning (9:00 AM)

```bash
npm run cerber:morning
```

**Output:**
```
✅ Backend healthy
⚠️ 2 outdated dependencies
⚠️ CLOUDINARY_NOT_CONFIGURED (warning)
📊 Yesterday: 12 commits, +245 LOC
```

**Action:** Mental note - fix Cloudinary later

**Time:** 2 minutes

### Coding (10:00-11:30 AM)

Implementing happy hour pricing feature.

**At commit:**
```bash
git commit -m "feat: add happy hour pricing"
```

**Guardian blocks:**
```
❌ CONSOLE_LOG found in src/pricing/calculator.ts:156
```

**Fix:** Remove debug code  
**Time to fix:** 10 seconds  
**Bug prevented:** Debug code in production

### Deploy (2:00 PM)

```bash
git push origin main
# Render auto-deploys
```

**Cerber health check in CI/CD:**
```yaml
- run: curl https://api.eliksir.com/health
- if: critical > 0 || errors > 0
  run: exit 1
```

**First deploy failed:**
```
❌ DB_CONNECTION_FAILED (critical)
💡 DATABASE_URL missing from Render.com
```

**Fix DATABASE_URL, redeploy:**
```
✅ All checks passed
```

**Result:** Production issue caught before users affected

### End of Day (5:00 PM)

```bash
npm run cerber:snapshot
```

**Output:**
```
📸 Today's Snapshot:
   - 18 commits
   - +456 LOC, -123 LOC
   - 2 Guardian blocks
   - 1 deployment blocked
   - 3 bugs prevented
```

**Time saved:** ~1.2 hours  
**Value:** Clean code + zero incidents

---

## 🔧 Troubleshooting

### Guardian Too Strict?

**Problem:** Blocks legitimate code

**Solution:** Add architect approval

```typescript
// ARCHITECT_APPROVED: Debug production issue - 2026-01-03 - Stefan
console.log('Critical debug info:', data);
```

### Health Check Fails in Dev?

**Problem:** Missing env vars in development

**Solution:** Use severity levels

```typescript
cerber.check('OPTIONAL_SERVICE', async () => {
  const isAvailable = await checkService();
  return {
    healthy: isAvailable,
    message: isAvailable ? 'Service OK' : 'Service unavailable',
    severity: 'warning' // Not critical in dev
  };
});
```

### Too Many False Positives?

**Problem:** Guardian blocks too often

**Solution:** Refine schema

```json
{
  "forbiddenPatterns": [
    {
      "id": "CONSOLE_LOG",
      "pattern": "console\\.log",
      "message": "Use logger instead",
      "severity": "error",
      "exceptions": [
        "src/scripts/", // Allow in scripts
        "src/tools/"    // Allow in tools
      ]
    }
  ]
}
```

---

## 📚 Learn More

- **Full documentation:** [SYSTEM_COMPLETE_DOCUMENTATION.md](../SYSTEM_COMPLETE_DOCUMENTATION.md)
- **Real-world example:** [REAL_WORKFLOWS.md](../REAL_WORKFLOWS.md)
- **API reference:** [API.md](../API.md)

---

## 💡 Pro Tips

1. **Trust Guardian** - If it blocks, there's usually a reason
2. **Check health before deploy** - Saves hours of debugging
3. **Use feature flags** - Deploy code, enable features later
4. **Fix warnings early** - They become critical later
5. **Daily snapshots** - Track your progress

---

## 🚀 Next Steps

### You're Ready When:

- ✅ Guardian blocks bad commits
- ✅ Health checks pass
- ✅ Zero production surprises

### Want More Power?

**If your project grows (2-5 people):**  
→ See [Small Team Workflow](./small-team.md)

**If you use AI heavily:**  
→ Consider TEAM layer for Focus Mode

**If you have complex architecture:**  
→ See [Growing Team Workflow](./growing-team.md)

---

**End of Solo Developer Workflow**

*Keep it simple. Stay productive. Ship with confidence.*

```bash
npm install cerber-core --save-dev
```
