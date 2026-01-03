# 👥 Small Team Workflow (2-5 Developers)

> Cerber Core guide for small, growing teams

---

## 🎯 Who This Is For

- **2-5 developers** working together
- **Growing codebase** (5,000-20,000 LOC)
- **Multiple features** in parallel
- **Shared responsibility** for code quality
- **Some AI usage** for development

**Time to setup:** 1-2 hours (one-time)  
**Daily time per developer:** 10 minutes  
**Expected ROI:** 2-3 hours saved per developer per day

---

## 📦 Initial Setup (1-2 hours)

### Step 1: Install & Configure (15 min)

```bash
cd your-project
npm install cerber-core --save-dev

# Initialize Guardian
npx cerber-guardian init

# Initialize TEAM layer
npx cerber-team init
```

### Step 2: Define Architecture Schema (30 min)

**Gather team, discuss:**
- What patterns to forbid?
- What files are required?
- What imports are mandatory?
- Who approves exceptions?

**Create `.cerber/ARCHITECTURE_SCHEMA.json`:**

```json
{
  "version": "1.0",
  "team": {
    "name": "Eliksir Team",
    "architects": ["stefan", "agata"],
    "size": 3
  },
  "forbiddenPatterns": [
    {
      "id": "CONSOLE_LOG",
      "pattern": "console\\.log",
      "message": "Use logger instead",
      "severity": "error"
    },
    {
      "id": "ANY_TYPE",
      "pattern": ":\\s*any\\b",
      "message": "Use specific types",
      "severity": "error"
    },
    {
      "id": "DEBUGGER",
      "pattern": "debugger",
      "message": "Remove debugger statement",
      "severity": "error"
    }
  ],
  "requiredFiles": [
    "README.md",
    "CHANGELOG.md",
    ".env.example",
    "package.json",
    "tsconfig.json"
  ],
  "requiredImports": [
    {
      "pattern": "^import.*from ['\"]\\.\\./types['\"]",
      "inFiles": ["src/**/*.ts"],
      "message": "Import types from centralized location"
    }
  ]
}
```

### Step 3: Setup Shared Health Checks (20 min)

```typescript
// src/cerber-health.ts
import { Cerber } from 'cerber-core';

const cerber = new Cerber();

// Database
cerber.check('DB_CONNECTION', async () => {
  try {
    await db.query('SELECT 1');
    return {
      healthy: true,
      message: 'PostgreSQL connection OK',
      severity: 'critical'
    };
  } catch (error) {
    return {
      healthy: false,
      message: `DB connection failed: ${error.message}`,
      severity: 'critical',
      fix: 'Check DATABASE_URL in .env'
    };
  }
});

// External API
cerber.check('CLOUDINARY_API', async () => {
  const configured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  return {
    healthy: configured,
    message: configured ? 'Cloudinary configured' : 'Cloudinary not configured',
    severity: 'warning' // Non-critical
  };
});

// File system
cerber.check('UPLOAD_DIR', async () => {
  const uploadDir = './uploads';
  const exists = await fs.access(uploadDir).then(() => true).catch(() => false);
  return {
    healthy: exists,
    message: exists ? 'Upload directory exists' : 'Upload directory missing',
    severity: 'error',
    fix: 'mkdir uploads'
  };
});

// Environment variables
cerber.check('ENV_VARS', async () => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV'
  ];
  const missing = required.filter(v => !process.env[v]);
  return {
    healthy: missing.length === 0,
    message: missing.length 
      ? `Missing: ${missing.join(', ')}` 
      : 'All required vars present',
    severity: 'critical',
    fix: 'Add missing vars to .env'
  };
});

export default cerber;
```

### Step 4: Setup Git Hooks for Team (10 min)

```bash
npm install husky --save-dev
npx husky init

# Pre-commit: Validate architecture
echo "npx cerber-guardian validate" > .husky/pre-commit

# Pre-push: Run health checks
echo "npm run test && npx cerber-health" > .husky/pre-push
```

### Step 5: Define Modules (30 min)

**Meet as team, identify logical modules:**

```
Project structure:
  src/
    modules/
      auth/        ← Module 1
      booking/     ← Module 2
      pricing/     ← Module 3
      payment/     ← Module 4
      notifications/ ← Module 5
```

**Create modules:**

```bash
# Create auth module
bash team/scripts/cerber-add-module.sh auth "Stefan" "User authentication & authorization"

# Create booking module
bash team/scripts/cerber-add-module.sh booking "Agata" "Table booking management"

# Create pricing module
bash team/scripts/cerber-add-module.sh pricing "Stefan" "Pricing calculations"

# ... repeat for all modules
```

**This creates for each module:**
- `src/modules/[name]/MODULE.md` - Documentation
- `src/modules/[name]/contract.json` - Public API contract
- `src/modules/[name]/dependencies.json` - Dependencies list

### Step 6: Define Module Connections (15 min)

```bash
# Booking depends on Pricing
bash team/scripts/cerber-add-connection.sh booking pricing "Pricing calculations for bookings"

# Booking depends on Payment
bash team/scripts/cerber-add-connection.sh booking payment "Payment processing for bookings"

# Notifications depends on Booking
bash team/scripts/cerber-add-connection.sh notifications booking "Booking status notifications"
```

**Done! ✅** You now have:
- ✅ Shared architecture schema
- ✅ Team health checks
- ✅ Git hooks for everyone
- ✅ Module system with clear ownership

---

## 🌅 Daily Team Workflow

### Morning Standup (5 minutes)

```bash
# Team lead runs:
bash team/scripts/cerber-team-morning.sh
```

**Output:**

```
☀️ CERBER TEAM DASHBOARD - January 3, 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 TEAM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Active developers: 3
   Active modules: 5
   Total LOC: 12,450

📊 SYSTEM HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Status: ✅ healthy
   Critical issues: 0
   Warnings: 2 (non-blocking)

📦 MODULES OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   auth         [Stefan]   ✅ healthy   (890 LOC)
   booking      [Agata]    ✅ healthy   (2,340 LOC)
   pricing      [Stefan]   ⚠️ warning   (1,120 LOC)
   payment      [Marek]    ✅ healthy   (780 LOC)
   notifications [Agata]   ✅ healthy   (560 LOC)

⚠️ ATTENTION NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   pricing: Missing test coverage (warning)
   
🎯 TODAY'S PRIORITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. Stefan: Add tests to pricing module
   2. Agata: Complete notification templates
   3. Marek: Integrate payment provider

📈 YESTERDAY'S STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Commits: 24 (Stefan: 12, Agata: 8, Marek: 4)
   Guardian blocks: 3 (bugs prevented)
   Cerber checks: 18 (1 deployment blocked)
   Time saved: ~3.5 hours

⏱️ Generated in 2.1 seconds
```

**Team discusses priorities based on dashboard.**

### Individual Development (Throughout Day)

#### Before Starting Work

```bash
# Check module status
bash team/scripts/cerber-module-check.sh pricing
```

**Output:**

```
📦 MODULE: pricing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 METADATA
   Owner: Stefan
   Description: Pricing calculations and discounts
   Status: ⚠️ warning
   LOC: 1,120

🔗 DEPENDENCIES (uses)
   ✅ auth - For user tier pricing
   ✅ booking - For table pricing

🔌 DEPENDENTS (used by)
   ✅ booking - Calculates booking prices
   ✅ notifications - Price change alerts

⚠️ ISSUES
   - Missing test coverage (warning)
   - TODO: Add happy hour pricing

📊 CONTRACT
   Exports:
   - calculatePrice(booking): number
   - applyDiscount(price, code): number
   - getHappyHourPrice(item): number

💡 READY TO WORK
```

#### Using AI with Focus Mode

**Problem:** Need AI help, but codebase is 12,450 LOC

**Solution:** Generate focused context

```bash
# Generate focus for pricing module
bash team/scripts/cerber-focus.sh pricing
```

**Output:**

```
🎯 Generating focus context for: pricing

📝 Extracting files...
   ✅ src/modules/pricing/calculator.ts (245 LOC)
   ✅ src/modules/pricing/discounts.ts (180 LOC)
   ✅ src/modules/pricing/types.ts (95 LOC)
   ✅ src/modules/pricing/index.ts (45 LOC)

🔗 Including dependencies...
   ✅ auth/types.ts (contract only)
   ✅ booking/types.ts (contract only)

✅ FOCUS CONTEXT GENERATED
   File: .cerber/FOCUS_CONTEXT.md
   Size: 565 LOC (vs 12,450 LOC full codebase)
   Reduction: 95% smaller
```

**Share with AI:**

```
I need to add happy hour pricing (50% off, 17:00-19:00, Mon-Fri).

Here's the focused context (565 LOC):
[paste .cerber/FOCUS_CONTEXT.md]

How should I implement this?
```

**AI Response:** 8 seconds (vs 90 seconds with full codebase)

#### Committing Code

```bash
git add .
git commit -m "feat(pricing): add happy hour pricing"
```

**Guardian validates automatically:**

```
🛡️ GUARDIAN SCHEMA VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Checking required files...
   ✅ All required files present

🔍 Checking for forbidden patterns...
   ❌ CONSOLE_LOG found in:
      src/modules/pricing/calculator.ts:89

💡 FIX: Remove console.log or add architect approval

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ COMMIT BLOCKED
```

**Fix and retry:**

```bash
# Remove debug code
git add .
git commit -m "feat(pricing): add happy hour pricing"
```

```
✅ ALL CHECKS PASSED

[main f7a2e3c] feat(pricing): add happy hour pricing
 2 files changed, 67 insertions(+), 8 deletions(-)
```

### Before Deployment (Team Lead)

```bash
# Validate all module connections
bash team/scripts/cerber-connections-check.sh
```

**Output:**

```
🔗 CHECKING MODULE CONNECTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ auth → (no dependencies)
✅ pricing → auth (OK)
✅ booking → pricing (OK)
✅ booking → payment (OK)
✅ notifications → booking (OK)
✅ payment → auth (OK)

⚠️ WARNINGS
   notifications → booking: Tight coupling detected
   (notifications imports 5+ symbols from booking)
   
💡 RECOMMENDATION: Consider event bus for loose coupling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ ALL CONNECTIONS VALID
```

### Deployment

```bash
git push origin main
# CI/CD runs Cerber health checks
```

**GitHub Actions:**

```yaml
# .github/workflows/ci-cd.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        run: # ... deployment steps
        
  cerber-gatekeeper:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        run: sleep 90
        
      - name: Health Check
        run: |
          RESPONSE=$(curl -s https://api.yourapp.com/health)
          echo $RESPONSE | jq .
          
          CRITICAL=$(echo $RESPONSE | jq '.summary.criticalIssues')
          ERRORS=$(echo $RESPONSE | jq '.summary.errorIssues')
          
          if [ "$CRITICAL" -gt 0 ] || [ "$ERRORS" -gt 0 ]; then
            echo "❌ DEPLOYMENT UNHEALTHY"
            exit 1
          fi
          
          echo "✅ DEPLOYMENT HEALTHY"
```

**If health check fails → automatic rollback**

### End of Day (Optional)

```bash
# Generate team snapshot
npm run cerber:team-snapshot
```

**Output:**

```
📸 TEAM SNAPSHOT - 2026-01-03
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 COMMITS
   Total: 24
   Stefan: 12 commits (+456 LOC, -123 LOC)
   Agata: 8 commits (+234 LOC, -67 LOC)
   Marek: 4 commits (+123 LOC, -34 LOC)

🛡️ GUARDIAN
   Blocks: 3
   - Stefan: 2 (console.log, debugger)
   - Agata: 1 (missing import)

🔍 CERBER
   Health checks: 18 (all passed)
   Warnings: 2 (non-critical)

🎯 TEAM FOCUS MODE
   Uses: 6
   - Stefan: 3 (pricing, auth)
   - Agata: 2 (booking, notifications)
   - Marek: 1 (payment)
   AI time saved: ~4.5 minutes

💰 VALUE
   Time saved: ~3.5 hours
   Bugs prevented: 5
   Incidents: 0

📸 Snapshot: .cerber/snapshots/team/2026-01-03.json
```

---

## 💰 Expected Results

### Week 1

```
Time investment:
  - Setup: 2 hours (team)
  - Daily per dev: 10 min × 5 days = 50 min

Time saved per dev:
  - Guardian blocks: 2 bugs × 45 min = 1.5 hours
  - Focus Mode: 10 uses × 1 min = 10 min
  - Health checks: 1 issue × 1 hour = 1 hour
  - Total: ~2.5 hours

Team time saved: 2.5h × 3 devs = 7.5 hours
ROI per dev: 200%
```

### Month 1

```
Time saved per dev: ~10 hours
Team time saved: ~30 hours
Bugs prevented: ~40 bugs
Incidents prevented: ~3 incidents

ROI per dev: 400%
```

---

## 🎯 Best Practices for Small Teams

### 1. Module Ownership

**Each module has ONE owner** who:
- Reviews all PRs to that module
- Maintains MODULE.md documentation
- Ensures test coverage
- Approves architect exceptions

### 2. Morning Sync

**Start day with dashboard** (`cerber-team-morning.sh`):
- See what everyone worked on yesterday
- Identify blockers
- Coordinate on shared modules

### 3. Focus Mode for AI

**Always generate focus before AI prompts:**
- 95% smaller context → 10x faster responses
- More accurate answers
- Lower API costs

### 4. Pre-Deployment Checks

**Before deploy, validate:**
```bash
npm test
bash team/scripts/cerber-connections-check.sh
curl http://localhost:3000/api/health
```

### 5. Weekly Module Review

**Every Friday, review:**
- Module sizes (keep < 2,000 LOC)
- Dependencies (minimize coupling)
- Test coverage (> 80%)
- Documentation (up to date)

---

## 🔧 Troubleshooting

### Module Coupling Too Tight?

**Problem:** Module A imports too much from Module B

**Solution:** Use event bus or shared contracts

```typescript
// BAD: Direct coupling
import { BookingService, BookingRepository, BookingValidator } from '@/modules/booking';

// GOOD: Contract-based
import type { IBooking } from '@/modules/booking/types';
import { bookingEvents } from '@/modules/booking/events';

bookingEvents.on('booking.created', (booking: IBooking) => {
  // Handle event
});
```

### Focus Mode Missing Files?

**Problem:** Generated context missing important files

**Solution:** Update module dependencies

```bash
# Add dependency
bash team/scripts/cerber-add-connection.sh pricing auth "User tier for pricing"
```

### Too Many Guardian Blocks?

**Problem:** Team frustrated by blocks

**Solution:** Team meeting to review schema

```bash
# Review patterns with team
cat .cerber/ARCHITECTURE_SCHEMA.json

# Vote on each pattern:
# - Keep as-is?
# - Make warning instead of error?
# - Remove?
```

---

## 📚 Learn More

- **Full documentation:** [SYSTEM_COMPLETE_DOCUMENTATION.md](../SYSTEM_COMPLETE_DOCUMENTATION.md)
- **Real-world example:** [REAL_WORKFLOWS.md](../REAL_WORKFLOWS.md)
- **Solo workflow:** [solo-developer.md](./solo-developer.md)
- **Growing team:** [growing-team.md](./growing-team.md)

---

## 🚀 Next Steps

### You're Ready When:

- ✅ All devs have Guardian hooks
- ✅ Module system defined
- ✅ Health checks pass
- ✅ Team uses Focus Mode

### Your Team is Growing (5-20 people)?

→ See [Growing Team Workflow](./growing-team.md) for:
- Multi-repo strategies
- Advanced module management
- Team performance metrics
- CI/CD optimization

---

**End of Small Team Workflow**

*Small team. Big impact. Ship with confidence.*

```bash
npm install cerber-core --save-dev
```
