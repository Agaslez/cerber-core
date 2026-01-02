# Cerber SOLO Integration Example

This example shows how to integrate Cerber SOLO with your existing Guardian + Cerber setup.

---

## 📁 Project Structure

```
your-project/
├── solo/                       # Cerber SOLO tools
│   ├── scripts/                # Automation scripts
│   ├── lib/                    # Feature flags
│   └── config/                 # Configuration
├── package.json                # With SOLO scripts
├── README.md                   # Project documentation
└── .gitignore                  # Excludes snapshots
```

---

## 📦 package.json Setup

```json
{
  "name": "my-backend-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "test": "jest",
    
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

---

## 📅 Daily Workflow

### Morning Routine (2 minutes)

```bash
# 1. Start your day with the morning dashboard
npm run cerber:morning

# Output:
# ☀️ Morning Dashboard
# - Backend health: ✅ healthy
# - Guardian: ✅ installed
# - Git status: 3 files changed
# - Yesterday: 5 commits, +120 -45 lines
```

**What to do:**
- Review backend health
- Check git status
- Plan today's work

---

### During Development

```bash
# 2. Auto-fix common issues
npm run cerber:repair

# 3. Write your code
# ... develop features ...

# 4. Commit (Guardian validates automatically)
git add .
git commit -m "feat: add new endpoint"

# If Guardian blocks:
# - Review the violation
# - Fix or add ARCHITECT_APPROVED comment
# - Try again
```

---

### Weekly Check (5 minutes)

```bash
# Run dependency health check (once per week)
npm run cerber:deps

# Output:
# 🏥 Dependency Health Check
# ✅ Health Score: 85/100 (Grade: B)
# 
# Issues:
# 1. [MODERATE] 3 outdated packages
#    → Run: npm update
```

**What to do:**
- Review health score
- Run suggested fixes
- Update dependencies

---

### Before Pushing (3 minutes)

```bash
# Run comprehensive pre-push checks
npm run cerber:pre-push

# This runs:
# 1. Dependency health check
# 2. Documentation sync
# 3. Performance budget

# If any fail:
# - Review the issues
# - Fix them
# - Run again
```

---

### End of Day (1 minute)

```bash
# Capture today's snapshot
npm run cerber:snapshot

# Output:
# 📸 Daily Snapshot
# ✅ Total commits: 125
# ✅ Today's commits: 3
# ✅ Files changed: 5
# ✅ Lines: +180 -45
# 
# 💾 Saved to: .cerber/snapshots/2026-01-02.json
```

---

## 🔄 Integration with Guardian

Cerber SOLO works **alongside** Guardian, not instead of it:

### Pre-commit (Guardian)

```bash
git commit
# → Guardian validates architecture rules
# → Blocks commit if violations found
```

### Pre-push (SOLO)

```bash
npm run cerber:pre-push
# → Checks dependencies
# → Validates documentation
# → Enforces performance budget
# → You manually run this before pushing
```

### Post-deploy (Cerber 2.1)

```bash
curl https://your-api.com/api/health
# → Validates production health
# → Returns detailed diagnostics
```

---

## 🎯 Example Scenario: Adding New Feature

### 1. Morning

```bash
npm run cerber:morning
# Review status, plan work
```

### 2. Create Feature Branch

```bash
git checkout -b feature/user-search
```

### 3. Develop

```typescript
// src/routes/users.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/search', authenticateToken, async (req, res) => {
  // ... implementation
});
```

### 4. Auto-fix Issues

```bash
npm run cerber:repair
# Formats package.json
# Syncs .env.example
# Generates CHANGELOG
```

### 5. Commit (Guardian validates)

```bash
git add .
git commit -m "feat: add user search endpoint"
# Guardian checks:
# ✅ Router imported from express
# ✅ authenticateToken middleware used
# ✅ No forbidden patterns
```

### 6. Before Push

```bash
npm run cerber:pre-push
# Checks dependencies: ✅ healthy
# Validates docs: ⚠️ /search not in README
# Performance: ✅ within budget
```

### 7. Fix Documentation

```markdown
<!-- README.md -->
### User Search
GET /api/users/search?q=john
```

### 8. Push

```bash
git push origin feature/user-search
```

### 9. End of Day

```bash
npm run cerber:snapshot
```

---

## 🚨 Handling Issues

### Dependency Vulnerabilities

```bash
npm run cerber:deps
# Output: 🔴 Critical: 2 vulnerabilities

npm audit fix
npm run cerber:deps
# Output: ✅ Health Score: 95/100
```

### Performance Budget Violation

```bash
npm run cerber:perf
# Output: 🔴 Bundle size: 520 KB (limit: 500 KB)

# Fix by:
# 1. Enable code splitting
# 2. Use dynamic imports
# 3. Remove unused dependencies

npm run build
npm run cerber:perf
# Output: ✅ All budgets met
```

### Documentation Out of Sync

```bash
npm run cerber:docs
# Output: ⚠️ 3 endpoints not in README

# Add to README.md
npm run cerber:docs
# Output: ✅ Documentation in sync
```

---

## 📊 Snapshot History

Snapshots are saved to `.cerber/snapshots/`:

```
.cerber/snapshots/
├── 2026-01-01.json
├── 2026-01-02.json
└── 2026-01-03.json
```

**Add to .gitignore:**

```
.cerber/snapshots/
```

### Viewing Snapshots

```bash
cat .cerber/snapshots/2026-01-02.json
```

```json
{
  "date": "2026-01-02",
  "git": {
    "totalCommits": 125,
    "commitsToday": 3,
    "filesChanged": 5,
    "linesAdded": 180,
    "linesRemoved": 45
  },
  "files": {
    ".ts": 45,
    ".js": 12
  },
  "loc": {
    "total": 5420
  }
}
```

---

## 🎨 Feature Flags Example

### Define Flags

```typescript
// solo/lib/feature-flags.ts
export const FLAGS = {
  "new-search": {
    enabled: true,
    description: "New user search endpoint",
    owner: "backend-team",
    environments: ["development", "staging"]
  },
  "beta-export": {
    enabled: false,
    description: "Beta export feature",
    owner: "backend-team",
    expiresAt: "2026-03-01"
  }
};
```

### Use in Code

```typescript
import { isFeatureEnabled } from './solo/lib/feature-flags';

router.get('/search', async (req, res) => {
  if (isFeatureEnabled('new-search')) {
    // New search implementation
  } else {
    // Old search implementation
  }
});
```

### Check Flags

```bash
npm run cerber:flags
# Output:
# 📊 Feature Flags Summary
# Total: 2
# ✅ Enabled: 1
# ❌ Disabled: 1
# 
# ⏰ Expired Flags:
# 🔴 beta-export (expired: 2026-03-01)
```

---

## 🔧 Configuration

### Adjust Performance Budget

Edit `solo/config/performance-budget.json`:

```json
{
  "bundleSize": {
    "max": 750,        // Increase to 750 KB
    "warning": 600
  }
}
```

### Customize Auto-Repair

Edit `solo/config/solo-contract.json`:

```json
{
  "autoRepair": {
    "enabled": true,
    "safe": [
      "format-package-json",
      "sync-env"
      // Remove "changelog" if you maintain it manually
    ]
  }
}
```

---

## 📚 Resources

- **[Complete SOLO Documentation](../../docs/SOLO.md)**
- **[Main README](../../README.md)**
- **[Guardian Setup](../../README.md#guardian-setup)**

---

## 🤝 Contributing

This is an example project. For actual contributions, see the main repository.

---

## 📄 License

MIT © 2026 Stefan Pitek

---

**Example built for solo developers using Cerber SOLO**
