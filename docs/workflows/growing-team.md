# 🏢 Growing Team Workflow (5-20 Developers)

> Cerber Core guide for scaling teams with complex architecture

---

## 🎯 Who This Is For

- **5-20 developers** across multiple squads
- **Large codebase** (20,000-100,000+ LOC)
- **Multiple products** or microservices
- **Heavy AI usage** for development
- **Need governance** without bureaucracy

**Time to setup:** 1-2 days (includes planning)  
**Daily time per developer:** 5-10 minutes  
**Expected ROI:** 3-5 hours saved per developer per day

---

## 📦 Initial Setup (1-2 days)

### Phase 1: Architecture Planning (4 hours - Leadership)

**Gather tech leads, architects, senior devs:**

#### 1. Define Module Strategy (1 hour)

**Option A: Monorepo with Modules**
```
project/
  src/
    modules/
      auth/           ← Team 1
      booking/        ← Team 2
      pricing/        ← Team 2
      payment/        ← Team 3
      notifications/  ← Team 1
      analytics/      ← Team 4
      admin/          ← Team 3
```

**Option B: Multi-Repo (Microservices)**
```
auth-service/         ← Team 1
booking-service/      ← Team 2
pricing-service/      ← Team 2
payment-service/      ← Team 3
notification-service/ ← Team 1
analytics-service/    ← Team 4
admin-service/        ← Team 3
```

**Option C: Hybrid (Recommended for 10-20 devs)**
```
backend-monorepo/
  src/modules/...
frontend-app/
  src/features/...
mobile-app/
  src/screens/...
shared-libs/
  packages/...
```

#### 2. Define Team Structure (30 min)

```
Squad 1 (Auth & Notifications):
  - Lead: Stefan
  - Devs: Anna, Marek
  - Modules: auth, notifications

Squad 2 (Core Business):
  - Lead: Agata
  - Devs: Kasia, Piotr, Tomek
  - Modules: booking, pricing

Squad 3 (Payments & Admin):
  - Lead: Jacek
  - Devs: Ola, Wojtek
  - Modules: payment, admin

Squad 4 (Analytics):
  - Lead: Bartek
  - Devs: Ania
  - Modules: analytics
```

#### 3. Define Governance Model (1 hour)

**Architecture Review Board (ARB):**
- Who: Tech leads from each squad
- When: Weekly, 30 minutes
- What: Review cross-module changes, new patterns, exceptions

**Approval Tiers:**
```
Tier 1: Team Lead (within module)
  - Module internal changes
  - Non-breaking API changes
  - Performance optimizations

Tier 2: Architecture Review Board (cross-module)
  - New module dependencies
  - Breaking API changes
  - New shared patterns

Tier 3: CTO/VP Engineering (strategic)
  - New technology adoption
  - Infrastructure changes
  - Security model changes
```

#### 4. Define Quality Standards (1.5 hours)

```json
{
  "quality": {
    "testCoverage": {
      "minimum": 80,
      "target": 90,
      "blocking": true
    },
    "moduleSizeLimit": {
      "soft": 3000,
      "hard": 5000,
      "message": "Consider splitting module"
    },
    "documentationRequired": [
      "MODULE.md",
      "API.md",
      "CHANGELOG.md",
      "README.md"
    ],
    "performanceBudget": {
      "bundleSize": "200KB",
      "firstContentfulPaint": "1.5s",
      "timeToInteractive": "3.5s"
    }
  }
}
```

### Phase 2: Technical Setup (3 hours - Senior Devs)

#### 1. Install & Configure Cerber (30 min)

```bash
# In each repository
npm install cerber-core --save-dev

# Initialize all layers
npx cerber-guardian init
npx cerber-team init
npx cerber-solo init

# Install git hooks
npm install husky --save-dev
npx husky init
```

#### 2. Create Organization-Wide Schema (1 hour)

```json
// .cerber/ARCHITECTURE_SCHEMA.json
{
  "version": "2.0",
  "organization": {
    "name": "Eliksir",
    "teams": {
      "squad1": ["stefan", "anna", "marek"],
      "squad2": ["agata", "kasia", "piotr", "tomek"],
      "squad3": ["jacek", "ola", "wojtek"],
      "squad4": ["bartek", "ania"]
    },
    "architects": ["stefan", "agata", "jacek", "bartek"]
  },
  "forbiddenPatterns": [
    {
      "id": "CONSOLE_LOG",
      "pattern": "console\\.log",
      "message": "Use structured logger (winston/pino)",
      "severity": "error",
      "exceptions": [
        "src/scripts/",
        "src/tools/",
        "*.test.ts",
        "*.spec.ts"
      ]
    },
    {
      "id": "PROCESS_EXIT",
      "pattern": "process\\.exit",
      "message": "Use graceful shutdown",
      "severity": "error",
      "exceptions": ["src/scripts/"]
    },
    {
      "id": "ANY_TYPE",
      "pattern": ":\\s*any\\b",
      "message": "Use specific types",
      "severity": "error",
      "exceptions": ["src/types/legacy.ts"]
    },
    {
      "id": "ENV_DIRECT_ACCESS",
      "pattern": "process\\.env\\.",
      "message": "Use config service for env vars",
      "severity": "warning",
      "exceptions": ["src/config/"]
    },
    {
      "id": "DIRECT_DB_QUERY",
      "pattern": "db\\.(query|execute|raw)",
      "message": "Use repository pattern",
      "severity": "warning",
      "exceptions": ["src/repositories/", "src/migrations/"]
    },
    {
      "id": "TODO_WITHOUT_TICKET",
      "pattern": "TODO(?!.*JIRA-\\d+)",
      "message": "TODO must reference JIRA ticket",
      "severity": "warning"
    }
  ],
  "requiredFiles": [
    "README.md",
    "CHANGELOG.md",
    "package.json",
    "tsconfig.json",
    ".env.example",
    ".gitignore",
    "docker-compose.yml"
  ],
  "requiredImports": [
    {
      "pattern": "^import.*from ['\"]\\.\\./\\.\\./types['\"]",
      "inFiles": ["src/modules/**/*.ts"],
      "message": "Import types from @/types"
    }
  ],
  "moduleSizeLimit": 3000,
  "testCoverageRequired": 80
}
```

#### 3. Setup Cross-Module Contracts (1 hour)

```typescript
// shared-libs/contracts/src/booking.contract.ts
export interface IBookingService {
  createBooking(data: CreateBookingDTO): Promise<Booking>;
  getBooking(id: string): Promise<Booking | null>;
  cancelBooking(id: string): Promise<void>;
}

export interface CreateBookingDTO {
  userId: string;
  tableId: string;
  date: Date;
  guests: number;
}

export interface Booking {
  id: string;
  userId: string;
  tableId: string;
  date: Date;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  price: number;
}
```

```typescript
// shared-libs/contracts/src/pricing.contract.ts
export interface IPricingService {
  calculatePrice(booking: BookingInput): Promise<number>;
  applyDiscount(price: number, code: string): Promise<number>;
}

export interface BookingInput {
  tableId: string;
  date: Date;
  guests: number;
  userId: string;
}
```

#### 4. Setup Shared Health Checks (30 min)

```typescript
// shared-libs/cerber-checks/src/database.check.ts
import { CheckFunction } from 'cerber-core';

export const databaseCheck: CheckFunction = async () => {
  try {
    await db.query('SELECT 1');
    const connections = await db.getActiveConnections();
    const maxConnections = 100;
    
    return {
      healthy: connections < maxConnections * 0.9,
      message: `DB OK (${connections}/${maxConnections} connections)`,
      severity: connections > maxConnections * 0.8 ? 'warning' : 'info',
      metadata: {
        activeConnections: connections,
        maxConnections: maxConnections,
        utilizationPercent: (connections / maxConnections) * 100
      }
    };
  } catch (error) {
    return {
      healthy: false,
      message: `DB connection failed: ${error.message}`,
      severity: 'critical',
      fix: 'Check DATABASE_URL and verify DB is running',
      rootCause: error.code === 'ECONNREFUSED' 
        ? 'Database server unreachable' 
        : 'Authentication or query error'
    };
  }
};
```

```typescript
// shared-libs/cerber-checks/src/redis.check.ts
export const redisCheck: CheckFunction = async () => {
  try {
    await redis.ping();
    const memoryUsage = await redis.info('memory');
    const usedMemory = parseMemory(memoryUsage);
    const maxMemory = 512 * 1024 * 1024; // 512 MB
    
    return {
      healthy: usedMemory < maxMemory * 0.9,
      message: `Redis OK (${formatBytes(usedMemory)}/${formatBytes(maxMemory)})`,
      severity: usedMemory > maxMemory * 0.8 ? 'warning' : 'info'
    };
  } catch (error) {
    return {
      healthy: false,
      message: `Redis connection failed: ${error.message}`,
      severity: 'error',
      fix: 'Check REDIS_URL and verify Redis is running'
    };
  }
};
```

### Phase 3: Team Onboarding (2 hours per team)

#### For Each Squad:

1. **Architecture Walkthrough (30 min)**
   - Show module boundaries
   - Explain contracts
   - Demo Focus Mode

2. **Setup Developer Machines (30 min)**
   ```bash
   # Clone repos
   git clone https://github.com/eliksir/backend-monorepo
   cd backend-monorepo
   
   # Install dependencies
   npm install
   
   # Setup git hooks
   npx husky install
   
   # Verify setup
   npm run cerber:morning
   ```

3. **Practice Workflow (1 hour)**
   - Make a sample change
   - Commit (see Guardian in action)
   - Generate focus context
   - Use AI with focused context
   - Deploy to staging
   - See Cerber validation

---

## 🌅 Daily Team Workflow

### Morning (Squad Leads - 5 min)

```bash
# Each squad lead runs team dashboard
bash team/scripts/cerber-team-morning.sh squad2
```

**Output:**

```
☀️ CERBER SQUAD DASHBOARD - Squad 2 (Core Business)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 SQUAD STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Lead: Agata
   Developers: Kasia, Piotr, Tomek (4 total)
   Modules owned: booking, pricing
   Total LOC: 8,450

📊 SYSTEM HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Status: ✅ healthy
   Critical issues: 0
   Warnings: 1 (test coverage 78% in pricing)

📦 MODULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   booking  [Agata]   ✅ healthy   (4,890 LOC, 89% coverage)
   pricing  [Tomek]   ⚠️ warning   (3,560 LOC, 78% coverage)

🎯 YESTERDAY (Squad 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Commits: 18 (Agata: 6, Kasia: 5, Piotr: 4, Tomek: 3)
   Guardian blocks: 2 (bugs prevented)
   Focus Mode uses: 8 (AI: 10x faster)
   PRs merged: 4
   Deployments: 2 (both successful)

⚠️ ATTENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   pricing: Test coverage below 80%
   
💡 PRIORITY
   Tomek: Add tests to pricing module (reach 80%)

🔗 CROSS-SQUAD DEPENDENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   booking → payment (Squad 3) - Stable
   pricing → auth (Squad 1) - Stable
   booking → notifications (Squad 1) - Stable

⏱️ Generated in 1.8 seconds
```

### Individual Development

#### 1. Check Your Module

```bash
bash team/scripts/cerber-module-check.sh booking
```

**Output:**

```
📦 MODULE: booking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 METADATA
   Owner: Agata
   Squad: Squad 2 (Core Business)
   Description: Table booking management
   Status: ✅ healthy
   LOC: 4,890
   Coverage: 89%
   Last updated: 2 hours ago

📊 QUALITY METRICS
   ✅ Test coverage: 89% (target: 80%)
   ✅ Module size: 4,890 LOC (limit: 5,000 LOC)
   ✅ Documentation: Complete
   ✅ Performance: 245ms avg (budget: 500ms)

🔗 DEPENDENCIES (uses 3)
   ✅ pricing (Squad 2) - v2.1.0 - Stable
   ✅ payment (Squad 3) - v1.8.0 - Stable
   ✅ auth (Squad 1) - v3.2.0 - Stable

🔌 DEPENDENTS (used by 2)
   ✅ notifications (Squad 1) - For booking alerts
   ✅ analytics (Squad 4) - For booking metrics

📊 CONTRACT (v2.1.0)
   Exports:
   - createBooking(data: CreateBookingDTO): Promise<Booking>
   - getBooking(id: string): Promise<Booking | null>
   - cancelBooking(id: string): Promise<void>
   - updateBooking(id: string, data: Partial<Booking>): Promise<Booking>

🎯 RECENT ACTIVITY (Last 7 days)
   Commits: 24
   Contributors: Agata (18), Kasia (6)
   PRs: 5 (all merged)
   Issues: 2 (1 open, 1 closed)

💡 READY TO WORK
```

#### 2. Use Focus Mode for AI

**Scenario:** Need to add "VIP booking" feature

```bash
# Generate focus for booking module
bash team/scripts/cerber-focus.sh booking --include-deps
```

**Output:**

```
🎯 Generating focus context for: booking

📝 Extracting module files...
   ✅ src/modules/booking/service.ts (890 LOC)
   ✅ src/modules/booking/repository.ts (456 LOC)
   ✅ src/modules/booking/validator.ts (234 LOC)
   ✅ src/modules/booking/types.ts (156 LOC)
   ✅ src/modules/booking/events.ts (89 LOC)

🔗 Including dependencies (contracts only)...
   ✅ pricing/types.ts (45 LOC)
   ✅ pricing/contract.ts (32 LOC)
   ✅ payment/types.ts (38 LOC)
   ✅ auth/types.ts (52 LOC)

📚 Including documentation...
   ✅ src/modules/booking/MODULE.md (120 LOC)
   ✅ src/modules/booking/API.md (78 LOC)

✅ FOCUS CONTEXT GENERATED
   File: .cerber/FOCUS_CONTEXT_booking.md
   Size: 2,190 LOC
   
   Compared to full codebase:
   Full: 68,450 LOC
   Focus: 2,190 LOC
   Reduction: 97% smaller

💡 Optimized for AI:
   - Response time: ~12s (vs 180s full)
   - Accuracy: 100% (all context relevant)
   - Cost: $0.15 (vs $2.50 full)
   
📎 Share with AI for precise responses!
```

**Prompt to AI:**

```
I need to add VIP booking feature with these requirements:

1. VIP users can book any table at any time
2. Regular bookings can be overridden by VIP bookings (with notification)
3. VIP users get 25% discount automatically
4. VIP status comes from auth module (user.tier === 'VIP')

Here's the focused context (2,190 LOC):
[paste .cerber/FOCUS_CONTEXT_booking.md]

Please:
1. Show me how to implement this
2. Maintain existing contract compatibility
3. Include proper error handling
4. Add validation for VIP override scenarios
```

**AI Response:** 12 seconds ⚡ (vs 180s with full codebase)

#### 3. Implement & Test

```bash
# Implement feature
# ... code changes ...

# Run tests
npm test -- booking

# Check coverage
npm run coverage -- booking
```

#### 4. Commit with Guardian Validation

```bash
git add .
git commit -m "feat(booking): add VIP booking override"
```

**Guardian validates:**

```
🛡️ GUARDIAN SCHEMA VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Checking required files...
   ✅ All required files present

🔍 Checking for forbidden patterns...
   ✅ No violations found

📊 Checking module size...
   ✅ booking: 4,957 LOC (limit: 5,000 LOC)

📈 Checking test coverage...
   ✅ booking: 91% (target: 80%)

🔗 Checking contracts...
   ✅ No breaking changes detected
   ℹ️ New method added: overrideWithVIP()

✅ ALL CHECKS PASSED

[main b8e4f2d] feat(booking): add VIP booking override
 4 files changed, 234 insertions(+), 45 deletions(-)
```

#### 5. Create Pull Request

```bash
git push origin feature/vip-booking
# Open PR on GitHub/GitLab
```

**PR Description Template:**

```markdown
## 🎯 Feature: VIP Booking Override

**Module:** booking  
**Squad:** Squad 2  
**Owner:** @agata

### Changes
- Added VIP booking override logic
- Integrated with auth module for VIP status
- Implemented 25% automatic discount
- Added notification for overridden bookings

### Testing
- ✅ Unit tests: 91% coverage
- ✅ Integration tests: All passing
- ✅ Manual testing: Verified on staging

### Contract Changes
- ✅ No breaking changes
- ℹ️ New method: `overrideWithVIP()`

### Dependencies
- auth@3.2.0 (no changes)
- pricing@2.1.0 (no changes)
- payment@1.8.0 (no changes)

### Checklist
- [x] Tests added
- [x] Documentation updated
- [x] Guardian validation passed
- [x] Focus Mode used for AI assistance
- [x] No console.logs or debugger statements
```

### Code Review (Squad Lead - 15 min)

**Reviewer checks:**
1. ✅ Guardian passed
2. ✅ Tests > 80% coverage
3. ✅ No breaking contract changes
4. ✅ Documentation updated
5. ✅ Code quality good

**Approve & Merge**

### Deployment (CI/CD Automatic)

**GitHub Actions Workflow:**

```yaml
# .github/workflows/deploy-squad2.yml
name: Deploy Squad 2 Modules

on:
  push:
    branches: [main]
    paths:
      - 'src/modules/booking/**'
      - 'src/modules/pricing/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test -- src/modules/booking src/modules/pricing
      
  cerber-pre-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Check module health
        run: |
          bash team/scripts/cerber-module-check.sh booking
          bash team/scripts/cerber-module-check.sh pricing
          
  deploy-staging:
    needs: cerber-pre-deploy
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: # ... deploy steps
        
  cerber-gatekeeper-staging:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        run: sleep 60
        
      - name: Staging health check
        run: |
          RESPONSE=$(curl -s https://staging.eliksir.com/api/health)
          CRITICAL=$(echo $RESPONSE | jq '.summary.criticalIssues')
          
          if [ "$CRITICAL" -gt 0 ]; then
            echo "❌ STAGING UNHEALTHY - Blocking production"
            exit 1
          fi
          
  deploy-production:
    needs: cerber-gatekeeper-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: # ... deploy steps
        
  cerber-gatekeeper-production:
    needs: deploy-production
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        run: sleep 90
        
      - name: Production health check
        run: |
          RESPONSE=$(curl -s https://api.eliksir.com/api/health)
          echo $RESPONSE | jq .
          
          CRITICAL=$(echo $RESPONSE | jq '.summary.criticalIssues')
          ERRORS=$(echo $RESPONSE | jq '.summary.errorIssues')
          
          if [ "$CRITICAL" -gt 0 ] || [ "$ERRORS" -gt 0 ]; then
            echo "❌ PRODUCTION UNHEALTHY - Triggering rollback"
            # ... rollback logic
            exit 1
          fi
          
          echo "✅ PRODUCTION HEALTHY"
          
      - name: Notify Squad
        run: |
          curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "✅ Squad 2: VIP booking deployed to production",
              "channel": "#squad2-deploys"
            }'
```

---

## 📊 Weekly Architecture Review (30 min)

**Every Friday, Architecture Review Board meets:**

### Agenda:

1. **Module Health Report** (10 min)
   ```bash
   bash team/scripts/cerber-team-report.sh --weekly
   ```

2. **Cross-Module Dependencies** (5 min)
   - Review new connections
   - Identify tight coupling
   - Plan decoupling strategies

3. **Performance Metrics** (5 min)
   - Module response times
   - Bundle sizes
   - Test execution times

4. **Exception Requests** (10 min)
   - Review ARCHITECT_APPROVED comments
   - Decide if patterns should be allowed
   - Update schema if needed

### Weekly Report Output:

```
📊 WEEKLY ARCHITECTURE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Week: Jan 1-7, 2026

👥 TEAM STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Active developers: 14
   Commits: 286
   PRs merged: 42
   Deployments: 18 (all successful)

🛡️ GUARDIAN METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Commits blocked: 28 (9.8%)
   Bugs prevented: 28
   Architect approvals: 4
   
   Top violations:
   1. CONSOLE_LOG: 12
   2. ANY_TYPE: 8
   3. TODO_WITHOUT_TICKET: 5

🔍 CERBER METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Health checks: 342
   Issues detected: 23
   - Critical: 2 (fixed)
   - Errors: 5 (fixed)
   - Warnings: 16 (documented)
   
   Deployments blocked: 2 (prevented production incidents)

📦 MODULE HEALTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Healthy: 6 modules
   ⚠️ Warning: 1 module (pricing - coverage 78%)
   ❌ Critical: 0 modules

🔗 DEPENDENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total connections: 18
   New this week: 2
   Removed: 1
   
   Tight coupling detected:
   - notifications → booking (8 imports)
   
   Recommendation: Event bus for loose coupling

🎯 TEAM FOCUS MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Uses: 124
   Avg context size: 2,450 LOC (vs 68,450 LOC full)
   Avg reduction: 96%
   
   AI improvements:
   - Response time: 15s (vs 180s) = 12x faster
   - Accuracy: 98% (relevant context)
   - Cost savings: $187 this week

💰 VALUE DELIVERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Time saved: 42 hours (3 hours per dev)
   Bugs prevented: 28
   Incidents prevented: 2
   Cost savings: $3,187
   
   ROI: 1,580% this week

🎯 ACTION ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. Squad 2: Improve pricing test coverage to 80%
   2. Squad 1: Refactor notifications to use event bus
   3. All: Review console.log violations (top pattern)
   4. ARB: Discuss TODO ticket requirements

📈 TRENDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Commits: ↑ 12% vs last week
   Guardian blocks: ↓ 5% vs last week
   Deployments: ↑ 20% vs last week
   Time saved: ↑ 8% vs last week
```

---

## 💰 Expected Results (Growing Team)

### Month 1

```
Time investment:
  - Setup: 16 hours (leadership + senior devs)
  - Daily per dev: 10 min × 20 days = 200 min

Time saved per dev:
  - Guardian blocks: 10 bugs × 45 min = 7.5 hours
  - Focus Mode: 40 uses × 2 min = 1.3 hours
  - Health checks: 2 incidents × 2 hours = 4 hours
  - Total: ~13 hours per dev

Team time saved: 13h × 14 devs = 182 hours
ROI: 1,038% (team-wide)
```

### Year 1

```
Time saved per dev: ~150 hours = 18 workdays
Team time saved: 2,100 hours = 262 workdays = 1.3 years of work

Bugs prevented: ~1,400 bugs
Incidents prevented: ~28 incidents

Financial impact (at $75/hour):
  - Time: $157,500
  - Bugs: $105,000
  - Incidents: $42,000
  - Total: $304,500

ROI: 15,000%+ annually
```

---

## 🎯 Advanced Patterns

### Pattern 1: Monorepo with Module Federation

```typescript
// webpack.config.js (for frontend)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'bookingModule',
      filename: 'remoteEntry.js',
      exposes: {
        './BookingForm': './src/modules/booking/components/BookingForm',
        './BookingList': './src/modules/booking/components/BookingList'
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'cerber-core': { singleton: true }
      }
    })
  ]
};
```

### Pattern 2: Distributed Health Checks

```typescript
// API Gateway aggregates health from all services
import { Cerber } from 'cerber-core';

const gatewayHealth = new Cerber();

gatewayHealth.check('auth-service', async () => {
  const response = await fetch('https://auth.eliksir.com/health');
  const health = await response.json();
  return {
    healthy: health.status === 'healthy',
    message: `Auth service: ${health.summary.criticalIssues} critical`,
    severity: health.summary.criticalIssues > 0 ? 'critical' : 'info',
    metadata: health
  };
});

// Repeat for all microservices
```

### Pattern 3: Automated Dependency Updates

```yaml
# .github/workflows/dependency-updates.yml
name: Automated Dependency Updates

on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday 9 AM

jobs:
  update-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm update
      - run: npm test
      
      - name: Check health
        run: npm run cerber:health
        
      - name: Create PR if tests pass
        if: success()
        run: |
          git checkout -b automated-deps-$(date +%Y%m%d)
          git add package.json package-lock.json
          git commit -m "chore: update dependencies"
          git push origin HEAD
          # Create PR via GitHub API
```

---

## 📚 Resources

- **Full documentation:** [SYSTEM_COMPLETE_DOCUMENTATION.md](../SYSTEM_COMPLETE_DOCUMENTATION.md)
- **Real-world example:** [REAL_WORKFLOWS.md](../REAL_WORKFLOWS.md)
- **Solo workflow:** [solo-developer.md](./solo-developer.md)
- **Small team workflow:** [small-team.md](./small-team.md)

---

**End of Growing Team Workflow**

*Scale with confidence. Ship with speed. Lead with data.*

```bash
npm install cerber-core --save-dev
```
