# Cerber TEAM Integration Example

This example shows how to integrate Cerber TEAM with Guardian, Cerber 2.1, and SOLO for complete workflow automation.

## Overview

**Cerber TEAM** adds module system and focus mode to the proven Guardian + Cerber 2.1 + SOLO foundation.

```
Guardian 1.0 (Pre-commit) + Cerber 2.1 (Runtime) + SOLO (Automation) + TEAM (Modules)
```

## Installation

```bash
npm install cerber-core --save-dev
```

## Directory Structure

```
your-project/
├── .cerber/                      # TEAM structure
│   ├── CERBER.md                  # Master project map
│   ├── CERBER_LAW.md             # Team rules (optional)
│   ├── modules/                  # Module definitions
│   │   ├── pricing-engine/
│   │   │   ├── MODULE.md
│   │   │   ├── contract.json
│   │   │   └── dependencies.json
│   │   └── booking-calendar/
│   │       ├── MODULE.md
│   │       ├── contract.json
│   │       └── dependencies.json
│   └── connections/
│       └── contracts/            # Connection contracts
│           └── pricing-to-booking.json
│
├── src/                          # Actual source code
│   └── modules/
│       ├── pricing-engine/
│       │   └── index.ts
│       └── booking-calendar/
│           └── index.ts
│
├── package.json                  # Scripts (see below)
└── README.md
```

## Setup

### 1. Initialize TEAM

```bash
# Create structure
mkdir -p .cerber/modules
mkdir -p .cerber/connections/contracts

# Copy CERBER template
cp node_modules/cerber-core/team/templates/CERBER_TEMPLATE.md .cerber/CERBER.md

# Edit CERBER.md to describe your project
```

### 2. Add Scripts to package.json

See the included `package.json` for complete script setup.

```json
{
  "scripts": {
    "cerber:morning": "bash node_modules/cerber-core/team/scripts/cerber-team-morning.sh",
    "cerber:add-module": "bash node_modules/cerber-core/team/scripts/cerber-add-module.sh",
    "cerber:focus": "bash node_modules/cerber-core/team/scripts/cerber-focus.sh",
    "cerber:check-module": "bash node_modules/cerber-core/team/scripts/cerber-module-check.sh",
    "cerber:check-connections": "bash node_modules/cerber-core/team/scripts/cerber-connections-check.sh"
  }
}
```

### 3. Create First Module

```bash
npm run cerber:add-module my-first-module
```

## Daily Workflow

### Morning Routine

```bash
# Start day with dashboard
npm run cerber:morning

# Shows:
# - All modules and health
# - Connection contracts status
# - Recent activity
# - Today's focus
```

### Working on Module

```bash
# 1. Enter focus mode
npm run cerber:focus my-module

# 2. View focus context (500 LOC vs 10,000 LOC)
cat .cerber/FOCUS_CONTEXT.md

# 3. Share FOCUS_CONTEXT.md with AI
# "Here's the context for my-module. Please implement..."
# AI processes 10x faster with focused context

# 4. Make changes
# [code changes]

# 5. Validate module
npm run cerber:check-module my-module

# 6. Validate connections
npm run cerber:check-connections

# 7. Commit (Guardian validates)
git commit -m "feat(my-module): add feature"
```

### Creating New Module

```bash
# 1. Create module
npm run cerber:add-module payment-gateway

# 2. Edit documentation
nano .cerber/modules/payment-gateway/MODULE.md
nano .cerber/modules/payment-gateway/contract.json
nano .cerber/modules/payment-gateway/dependencies.json

# 3. Enter focus mode
npm run cerber:focus payment-gateway

# 4. Implement module
# [code in src/modules/payment-gateway/]

# 5. Validate
npm run cerber:check-module payment-gateway
npm run cerber:check-connections
```

### Creating Connection Contract

```bash
# 1. Copy template
cp node_modules/cerber-core/team/templates/CONNECTION_TEMPLATE.json \
   .cerber/connections/contracts/module-a-to-module-b.json

# 2. Edit contract
nano .cerber/connections/contracts/module-a-to-module-b.json

# 3. Validate
npm run cerber:check-connections
```

## Full Integration

### With Guardian (Pre-commit)

```bash
# .husky/pre-commit
#!/bin/sh

# Guardian validates architecture
node scripts/validate-schema.mjs

# TEAM validates modules (optional)
bash node_modules/cerber-core/team/scripts/cerber-connections-check.sh
```

### With Cerber 2.1 (Runtime)

```typescript
// server.ts
import { createHealthEndpoint } from 'cerber-core';

const healthChecks = {
  'pricing-engine': async () => {
    // Check module health
    return [];
  },
  'booking-calendar': async () => {
    // Check module health
    return [];
  }
};

app.get('/api/health', createHealthEndpoint(healthChecks));
```

### With SOLO (Automation)

```json
{
  "scripts": {
    "cerber:morning": "bash team/scripts/cerber-team-morning.sh && node solo/scripts/cerber-dashboard.js",
    "cerber:pre-push": "npm run cerber:check-connections && npm run cerber:deps && npm run cerber:docs"
  }
}
```

## Complete Workflow Example

```bash
# Morning (5 min)
npm run cerber:morning              # TEAM + SOLO dashboard

# Create feature in new module (10 min)
npm run cerber:add-module notifications
nano .cerber/modules/notifications/MODULE.md
nano .cerber/modules/notifications/contract.json

# Work on module (focused!)
npm run cerber:focus notifications
cat .cerber/FOCUS_CONTEXT.md        # Share with AI
# [AI implements 10x faster with 500 LOC context]

# Validate (5 sec)
npm run cerber:check-module notifications
npm run cerber:check-connections

# Commit (Guardian validates)
git commit -m "feat(notifications): add email notifications"

# Pre-push checks
npm run cerber:pre-push             # SOLO automation

# Deploy
git push
# CI/CD pipeline runs
# Deployment succeeds

# Validate production
curl https://api.example.com/api/health  # Cerber 2.1 checks
```

## Benefits

**Before TEAM:**
- AI needs entire 10,000 LOC codebase → 60 second responses
- Unclear module boundaries
- Hidden dependencies between components
- Documentation drifts from code

**After TEAM:**
- AI gets focused 500 LOC context → 6 second responses (10x faster ⚡)
- Clear module boundaries with validation
- Explicit connection contracts
- Living documentation that can't drift

## Scripts Breakdown

### Morning Dashboard
```bash
npm run cerber:morning
```
Shows module health, connections status, recent activity

### Focus Mode (⭐ Most Important)
```bash
npm run cerber:focus <module-name>
```
Generates 500 LOC context file for 10x faster AI

### Module Validation
```bash
npm run cerber:check-module <module-name>
```
Validates MODULE.md, contract.json, dependencies.json

### Connection Validation
```bash
npm run cerber:check-connections
```
Validates all connection contracts

### Add Module
```bash
npm run cerber:add-module <module-name>
```
Creates new module from template

## Tips

1. **Always use focus mode** before working on a module
2. **Share FOCUS_CONTEXT.md with AI** instead of entire codebase
3. **Validate before committing** to catch issues early
4. **Start day with morning dashboard** to see what needs attention
5. **Update CERBER.md** when adding major modules
6. **Version connection contracts** to track breaking changes

## Troubleshooting

### Module validation fails

Check that MODULE.md has required sections:
- Purpose
- Responsibilities
- Public Interface
- Dependencies

Validate JSON files:
```bash
python3 -m json.tool .cerber/modules/my-module/contract.json
```

### Focus mode fails

Ensure module exists:
```bash
ls .cerber/modules/
```

Create module if missing:
```bash
npm run cerber:add-module my-module
```

### Connection check fails

Validate JSON syntax:
```bash
python3 -m json.tool .cerber/connections/contracts/my-contract.json
```

Ensure referenced modules exist:
```bash
ls .cerber/modules/
```

## Documentation

- **Full TEAM docs:** `node_modules/cerber-core/docs/TEAM.md`
- **Quick start:** `node_modules/cerber-core/team/README.md`
- **Example project:** `node_modules/cerber-core/.cerber-example/`

## License

MIT © 2026 Stefan Pitek
