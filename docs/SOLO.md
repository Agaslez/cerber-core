# 🛡️ Cerber SOLO - Automation for Solo Developers

**Version:** 2.0  
**Author:** Stefan Pitek  
**Extends:** Cerber Core (Guardian 1.0 + Cerber 2.1)

---

## � See It In Action

**Want to see real-world examples first?**

- [**Real Workflows from Eliksir Project**](./REAL_WORKFLOWS.md) - Complete production session showing all features
- [**Solo Developer Workflow**](./workflows/solo-developer.md) - 15 min setup, 1+ hour saved/day

---

## �📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Daily Workflow](#daily-workflow)
- [Command Reference](#command-reference)
- [Configuration](#configuration)
- [Integration with Guardian](#integration-with-guardian)
- [Feature Flags](#feature-flags)
- [Troubleshooting](#troubleshooting)

---

## Overview

**Cerber SOLO** extends the Guardian + Cerber foundation with automation specifically designed for solo developers. It adds intelligent tools that automate repetitive tasks, maintain code quality, and provide daily health checks.

### What Problems Does It Solve?

- ⏰ **Time-consuming manual checks** → Automated daily health dashboard
- 🔧 **Repetitive fixes** → Auto-repair for common issues
- 📦 **Dependency drift** → Weekly health checks with actionable reports
- 📊 **Performance regressions** → Automated bundle size enforcement
- 📚 **Documentation decay** → Sync validation between code and docs
- 🚩 **Feature flag sprawl** → Expiry detection and cleanup suggestions
- ⏪ **Risky rollbacks** → Surgical file-level rollback with safety checks

### Architecture

```
Cerber SOLO (Automation Layer)
    ↓
Guardian 1.0 (Pre-commit)  +  Cerber 2.1 (Runtime)
    ↓
Your Backend Application
```

---

## Installation

### Prerequisites

- Node.js 16+ or 18+
- npm or yarn
- Git repository
- Guardian + Cerber 2.1 (optional but recommended)

### Setup

```bash
# Clone or install Cerber Core
npm install cerber-core --save-dev

# All SOLO scripts are in solo/scripts/
# Add them to your package.json (see Quick Start)
```

---

## Quick Start

### 1. Add SOLO Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "cerber:morning": "node solo/scripts/cerber-daily-check.js",
    "cerber:repair": "node solo/scripts/cerber-auto-repair.js",
    "cerber:repair:dry": "node solo/scripts/cerber-auto-repair.js --dry-run",
    "cerber:deps": "node solo/scripts/cerber-deps-health.js",
    "cerber:perf": "node solo/scripts/cerber-performance-budget.js",
    "cerber:docs": "node solo/scripts/cerber-docs-sync.js",
    "cerber:flags": "node solo/scripts/cerber-flags-check.js",
    "cerber:snapshot": "node solo/scripts/cerber-snapshot.js",
    "cerber:dashboard": "node solo/scripts/cerber-dashboard.js",
    "cerber:pre-push": "npm run cerber:deps && npm run cerber:docs && npm run cerber:perf"
  }
}
```

### 2. Try Your First Command

```bash
npm run cerber:morning
```

This runs your morning dashboard showing:
- Backend health status
- Guardian validation status
- Git status
- Yesterday's snapshot
- Today's priorities

---

## Daily Workflow

### Morning (2 minutes)

```bash
npm run cerber:morning
```

**What it does:**
- Checks backend health via `/api/health`
- Shows Guardian validation status
- Displays git status and unpushed commits
- Reviews yesterday's snapshot
- Suggests today's priorities

### During Development

```bash
# Auto-fix common issues
npm run cerber:repair

# Check in dry-run mode first
npm run cerber:repair:dry

# Check dependencies weekly
npm run cerber:deps

# Validate docs are in sync
npm run cerber:docs
```

### Before Pushing

```bash
npm run cerber:pre-push
```

**What it does:**
- Checks dependency health
- Validates documentation sync
- Enforces performance budget

### End of Day

```bash
npm run cerber:snapshot
```

**What it does:**
- Captures git statistics
- Counts files and LOC
- Saves snapshot to `.cerber/snapshots/`
- Retains 30 days of history

---

## Command Reference

### `cerber:morning` - Daily Dashboard

**Usage:** `npm run cerber:morning`

Shows comprehensive morning overview:
- Backend health check
- Guardian status
- Git status
- Recent snapshot
- Suggested workflow

**Exit code:** Always 0

---

### `cerber:repair` - Auto-Repair

**Usage:** `npm run cerber:repair [--dry-run] [--approve]`

Automatically fixes:
- ✅ Format and sort `package.json`
- ✅ Sync `.env.example` with code usage
- ✅ Generate `CHANGELOG.md` from git log
- ⚠️ Remove `console.log` (requires `--approve`)

**Options:**
- `--dry-run` - Preview changes without modifying files
- `--approve` - Enable console.log removal

**Examples:**

```bash
# Dry run (safe preview)
npm run cerber:repair:dry

# Apply fixes
npm run cerber:repair

# With console.log removal
npm run cerber:repair -- --approve
```

**Exit code:** Always 0

---

### `cerber:deps` - Dependency Health

**Usage:** `npm run cerber:deps`

Checks:
- 🔒 Security vulnerabilities (npm audit)
- 📦 Outdated packages
- ⚠️ Deprecated packages
- 📄 package-lock.json sync

**Output:** Health score (0-100) and grade (A-F)

**Exit code:** 
- 0 if score ≥ 60
- 1 if score < 60

**Example output:**

```
✅ Health Score: 85/100 (Grade: B)
   Issues Found: 2

🔧 Recommended Actions:

1. [HIGH] 3 vulnerabilities found
   → Run: npm audit fix

2. [LOW] 5 packages are outdated
   → Run: npm update
```

---

### `cerber:perf` - Performance Budget

**Usage:** `npm run cerber:perf`

Enforces:
- Total bundle size limit (500 KB)
- Largest chunk limit (250 KB)
- Image size constraints (200 KB)

**Configuration:** `solo/config/performance-budget.json`

**Exit code:**
- 0 if all budgets met
- 1 if any budget violated

**Example output:**

```
📦 Checking bundle sizes...

  ✅ main.js: 180.5 KB
  ✅ vendor.js: 220.3 KB
  🟡 chunk-abc.js: 210.0 KB (warning: 200 KB)

📊 Total bundle size: 610.8 KB
  ✅ Within budget (500 KB)
```

---

### `cerber:docs` - Documentation Sync

**Usage:** `npm run cerber:docs`

Validates:
- API endpoints in code vs README
- Environment variables in code vs `.env.example`
- TODO/FIXME comments

**Exit code:**
- 0 if docs in sync
- 1 if issues found

**Example output:**

```
📚 Documentation Sync Report

Issues found: 2

1. 🟡 [MODERATE] 3 endpoints missing from README
2. 🟡 [MODERATE] 2 env vars not in .env.example

💡 Recommended Actions:
   1. Update README.md with missing endpoints
   2. Run: npm run cerber:repair
```

---

### `cerber:flags` - Feature Flags

**Usage:** `npm run cerber:flags`

Checks:
- Active feature flags
- Expired flags
- Flag usage in codebase

**Configuration:** `solo/lib/feature-flags.ts`

**Exit code:**
- 0 if no expired flags
- 1 if expired flags found

---

### `cerber:rollback` - Smart Rollback

**Usage:** `node solo/scripts/cerber-rollback.js <commit> --file=<path> [--dry-run]`

Features:
- Rollback specific file from any commit
- Safety checks for uncommitted changes
- Diff preview
- Dry-run mode

**Examples:**

```bash
# Dry run
node solo/scripts/cerber-rollback.js abc123 --file=src/api/users.ts --dry-run

# Perform rollback
node solo/scripts/cerber-rollback.js abc123 --file=src/api/users.ts
```

---

### `cerber:snapshot` - Daily Snapshot

**Usage:** `npm run cerber:snapshot`

Captures:
- Git statistics (commits, changes)
- File counts by extension
- Lines of code (requires `cloc`)
- Guardian status
- Package info

**Storage:** `.cerber/snapshots/YYYY-MM-DD.json`  
**Retention:** 30 days (auto-cleanup)

---

### `cerber:dashboard` - Terminal UI

**Usage:** `npm run cerber:dashboard`

Beautiful colored terminal dashboard with:
- System status
- Git status
- Guardian status
- Quick actions menu

---

## Configuration

### Main Configuration

**File:** `solo/config/solo-contract.json`

```json
{
  "version": "2.0-solo",
  "autoRepair": {
    "enabled": true,
    "safe": ["format-package-json", "sync-env", "changelog"]
  },
  "performanceBudget": {
    "bundleSize": { "max": 500, "warning": 400, "unit": "KB" },
    "largestChunk": { "max": 250, "warning": 200, "unit": "KB" }
  },
  "snapshots": {
    "enabled": true,
    "retentionDays": 30
  }
}
```

### Performance Budget

**File:** `solo/config/performance-budget.json`

```json
{
  "bundleSize": { "max": 500, "warning": 400, "unit": "KB" },
  "largestChunk": { "max": 250, "warning": 200, "unit": "KB" },
  "images": { "max": 200, "unit": "KB" }
}
```

Adjust these values based on your project needs.

---

## Integration with Guardian

Cerber SOLO works seamlessly **alongside** Guardian:

```
Morning:
  npm run cerber:morning       # SOLO dashboard
  
Development:
  git commit                   # Guardian validates (pre-commit)
  npm run cerber:repair        # SOLO auto-fixes
  
Before Push:
  npm run cerber:pre-push      # SOLO full check
  
Deploy:
  curl /api/health             # Cerber 2.1 validates
```

### Example Workflow

**Day Start:**
```bash
npm run cerber:morning          # See health + priorities
npm run cerber:deps             # Weekly dependency check
```

**During Development:**
```bash
# Write code
git add .
git commit -m "feat: new feature"   # Guardian blocks if violations
npm run cerber:repair               # Fix any issues
```

**Before Push:**
```bash
npm run cerber:pre-push         # Comprehensive check
git push
```

**End of Day:**
```bash
npm run cerber:snapshot         # Capture today's progress
```

---

## Feature Flags

### TypeScript API

**File:** `solo/lib/feature-flags.ts`

```typescript
import { 
  isFeatureEnabled, 
  useFeatureFlag, 
  withFeatureFlag 
} from './solo/lib/feature-flags';

// Check if feature is enabled
if (isFeatureEnabled('new-ui')) {
  // Show new UI
}

// React hook (for React apps)
const isEnabled = useFeatureFlag('beta-feature');

// HOC for conditional rendering
const BetaComponent = withFeatureFlag(
  'beta-feature',
  MyComponent,
  FallbackComponent
);
```

### Flag Configuration

```typescript
export const FLAGS = {
  "new-ui": {
    enabled: true,
    description: "New UI redesign",
    owner: "frontend-team",
    environments: ["development", "staging"]
  },
  "beta-api": {
    enabled: false,
    description: "Beta API endpoints",
    owner: "backend-team",
    expiresAt: "2026-03-01"
  }
};
```

### Checking Flags

```bash
npm run cerber:flags
```

Shows:
- All flags with status
- Expired flags
- Environment-specific flags
- Cleanup recommendations

---

## Troubleshooting

### Command Not Found

**Problem:** `npm run cerber:morning` fails with "command not found"

**Solution:**
1. Ensure scripts are in your `package.json`
2. Check file paths are correct
3. Make sure you're in the project root

### Permission Denied

**Problem:** Scripts fail with permission errors

**Solution:**
```bash
chmod +x solo/scripts/*.js
```

### Grep Errors

**Problem:** grep commands fail on some systems

**Solution:** These are usually safe to ignore. Scripts handle missing grep gracefully.

### No Health Endpoint

**Problem:** Morning check says backend not running

**Solution:**
- Start your backend server
- Ensure `/api/health` endpoint exists
- Check the URL in `solo/config/solo-contract.json`

### Performance Budget Fails

**Problem:** Build fails with bundle size violation

**Solution:**
1. Run your build: `npm run build`
2. Check: `npm run cerber:perf`
3. Adjust limits in `solo/config/performance-budget.json` or optimize bundles

### Snapshot Directory Issues

**Problem:** Cannot write snapshots

**Solution:**
```bash
mkdir -p .cerber/snapshots
```

Add to `.gitignore`:
```
.cerber/snapshots/
```

---

## Best Practices

### 1. Run Morning Dashboard Daily

Start each day with:
```bash
npm run cerber:morning
```

### 2. Check Dependencies Weekly

```bash
npm run cerber:deps
```

### 3. Before Every Push

```bash
npm run cerber:pre-push
```

### 4. Snapshot End of Day

```bash
npm run cerber:snapshot
```

### 5. Keep Performance Budget Tight

Start conservative, relax as needed. It's harder to reduce sizes later.

### 6. Document Everything

Let SOLO help you:
```bash
npm run cerber:docs    # Find undocumented APIs
npm run cerber:repair  # Sync .env.example
```

---

## Examples

See [`examples/solo-integration/`](../examples/solo-integration/) for:
- Complete `package.json` setup
- Integration with Guardian
- Sample workflows
- Configuration examples

---

## Support

- **Issues:** https://github.com/Agaslez/cerber-core/issues
- **Discussions:** https://github.com/Agaslez/cerber-core/discussions
- **Documentation:** https://github.com/Agaslez/cerber-core/wiki

---

## License

MIT © 2026 Stefan Pitek

---

## Changelog

### v2.0-solo (2026-01-02)

**Initial release of Cerber SOLO**

- ✨ Auto-repair system
- ✨ Dependency health checker
- ✨ Performance budget enforcer
- ✨ Documentation sync validator
- ✨ Smart rollback tool
- ✨ Feature flags system
- ✨ Daily check dashboard
- ✨ Snapshot tool
- ✨ Terminal UI dashboard

---

**Built with ❤️ by Stefan Pitek for solo developers**
