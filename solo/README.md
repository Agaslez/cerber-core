# 🛡️ Cerber SOLO

> **Automation tools for solo developers**

Extends Cerber Core (Guardian 1.0 + Cerber 2.1) with intelligent automation specifically designed for solo developers.

**Owner:** Agata Ślęzak | **Creator:** Stefan Pitek  
**Version:** 2.0

---

## 🎯 What is Cerber SOLO?

Cerber SOLO adds an automation layer on top of Guardian and Cerber, providing:

- **Auto-repair** - Fixes package.json, .env.example, CHANGELOG automatically
- **Performance budget** - Enforces bundle size limits
- **Dependency health** - Weekly security & deprecation checks
- **Documentation sync** - Validates code vs docs
- **Feature flags** - Toggle features without redeploy
- **Daily dashboard** - Morning health overview
- **Smart rollback** - Surgical file rollback

---

## ⚡ Quick Start

### Add Scripts to package.json

```json
{
  "scripts": {
    "cerber:morning": "node solo/scripts/cerber-daily-check.js",
    "cerber:repair": "node solo/scripts/cerber-auto-repair.js",
    "cerber:deps": "node solo/scripts/cerber-deps-health.js",
    "cerber:perf": "node solo/scripts/cerber-performance-budget.js",
    "cerber:docs": "node solo/scripts/cerber-docs-sync.js",
    "cerber:flags": "node solo/scripts/cerber-flags-check.js",
    "cerber:snapshot": "node solo/scripts/cerber-snapshot.js",
    "cerber:pre-push": "npm run cerber:deps && npm run cerber:docs && npm run cerber:perf"
  }
}
```

### Daily Workflow

```bash
# Morning
npm run cerber:morning      # Start day (2 min)

# Development
npm run cerber:repair       # Auto-fix issues
git commit                  # Guardian validates

# Before Push
npm run cerber:pre-push     # Full check (3 min)

# End of Day
npm run cerber:snapshot     # Capture progress
```

---

## 📚 Tools Overview

### 🔧 Auto-Repair

```bash
npm run cerber:repair
```

**Automatically fixes:**
- Format and sort package.json
- Sync .env.example with code
- Generate CHANGELOG from git log
- Remove console.logs (with approval)

### 🏥 Dependency Health

```bash
npm run cerber:deps
```

**Checks:**
- Security vulnerabilities
- Outdated packages
- Deprecated packages
- Lock file sync

**Output:** Health score (0-100) and actionable report

### 📊 Performance Budget

```bash
npm run cerber:perf
```

**Enforces:**
- Total bundle size limit (500 KB)
- Largest chunk limit (250 KB)
- Image size constraints

**Configuration:** `solo/config/performance-budget.json`

### 📚 Documentation Sync

```bash
npm run cerber:docs
```

**Validates:**
- API endpoints in code vs README
- ENV vars in code vs .env.example
- Detects stale documentation

### 🚩 Feature Flags

```bash
npm run cerber:flags
```

**Checks:**
- Active flags
- Expired flags
- Per-environment status

**TypeScript API:** `solo/lib/feature-flags.ts`

### ⏪ Smart Rollback

```bash
node solo/scripts/cerber-rollback.js <hash> --file=path.ts
```

**Features:**
- Rollback specific file from commit
- Safety checks
- Diff preview
- Dry-run mode

### ☀️ Daily Check

```bash
npm run cerber:morning
```

**Shows:**
- Backend health
- Guardian status
- Git status
- Yesterday's snapshot
- Today's priorities

### 📸 Snapshot

```bash
npm run cerber:snapshot
```

**Captures:**
- Git statistics
- File counts
- LOC metrics
- Saves to `.cerber/snapshots/` (30-day retention)

---

## 🎨 Feature Flags

### Usage

```typescript
import { isFeatureEnabled } from './solo/lib/feature-flags';

if (isFeatureEnabled('new-feature')) {
  // Show new feature
}
```

### Configuration

```typescript
export const FLAGS = {
  "new-ui": {
    enabled: true,
    description: "New UI redesign",
    owner: "team",
    environments: ["development", "staging"],
    expiresAt: "2026-06-01"
  }
};
```

---

## 🔧 Configuration

### Main Config

**File:** `solo/config/solo-contract.json`

```json
{
  "version": "2.0-solo",
  "autoRepair": {
    "enabled": true,
    "safe": ["format-package-json", "sync-env", "changelog"]
  },
  "performanceBudget": {
    "bundleSize": { "max": 500, "warning": 400 }
  },
  "snapshots": {
    "retentionDays": 30
  }
}
```

---

## 📖 Full Documentation

**[Read complete documentation →](../docs/SOLO.md)**

- Installation
- Daily workflow
- Command reference
- Integration with Guardian
- Troubleshooting
- Best practices

---

## 🤝 Integration with Guardian

Cerber SOLO works **alongside** your existing Guardian setup:

```
Morning:     npm run cerber:morning    # SOLO dashboard
Development: git commit                # Guardian validates
Before Push: npm run cerber:pre-push   # SOLO checks
Deploy:      curl /api/health          # Cerber 2.1 validates
```

---

## 💡 Example Project

See [`examples/solo-integration/`](../examples/solo-integration/) for complete integration example.

---

## 📄 License

MIT © 2026 Stefan Pitek

---

**Built with ❤️ for solo developers**
