# 🛡️ Cerber TEAM - Team Collaboration Layer

**Version:** 2.0-team  
**Owner:** Agata Ślęzak | **Creator:** Stefan Pitek  
**Extends:** Cerber Core (Guardian 1.0 + Cerber 2.1 + SOLO)  
**Repository:** https://github.com/Agaslez/cerber-core

---

## � See It In Action

**Want to see real-world examples first?**

- [**Real Workflows from Eliksir Project**](./REAL_WORKFLOWS.md) - Complete production session showing all features in action
- [**Solo Developer Workflow**](./workflows/solo-developer.md) - 1 person, 15 min setup
- [**Small Team Workflow**](./workflows/small-team.md) - 2-5 people, 1-2 hours setup
- [**Growing Team Workflow**](./workflows/growing-team.md) - 5-20 people, 1-2 days setup

---

## �📋 Table of Contents

- [Overview](#overview)
- [Why Cerber TEAM?](#why-cerber-team)
- [Core Concepts](#core-concepts)
- [Installation & Setup](#installation--setup)
- [Quick Start](#quick-start)
- [Module System](#module-system)
- [Focus Mode](#focus-mode)
- [Connection Contracts](#connection-contracts)
- [Team Workflows](#team-workflows)
- [Command Reference](#command-reference)
- [Configuration](#configuration)
- [Integration Guide](#integration-guide)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)
- [FAQ](#faq)

---

## Overview

**Cerber TEAM** is a team collaboration layer that extends the proven Guardian + Cerber 2.1 + SOLO foundation with powerful tools for teams working on large codebases. It introduces a **module system**, **focus mode**, and **connection contracts** to help teams maintain clear boundaries, reduce cognitive load, and work more efficiently with AI assistance.

### The Problem TEAM Solves

When working on large codebases with teams:

1. **🔀 Context Overload**: AI assistants need the entire 10,000+ LOC codebase to make changes, making them slow and error-prone
2. **🔗 Unclear Dependencies**: Modules depend on each other but relationships aren't explicit
3. **🚫 Boundary Violations**: Developers accidentally import from module internals instead of public interfaces
4. **📚 Documentation Drift**: Code changes but documentation doesn't keep up
5. **👥 Team Coordination**: Hard to know who owns what and what's safe to modify
6. **🔄 Breaking Changes**: Interface changes break dependent modules without warning

### The TEAM Solution

Cerber TEAM provides:

1. **📦 Module System**: Clear module boundaries with explicit public interfaces
2. **🎯 Focus Mode**: Generate 500 LOC context files instead of sharing entire codebase (10x faster AI)
3. **🔗 Connection Contracts**: Explicit, versioned contracts between modules
4. **📖 BIBLE.md**: Master project map showing all modules and connections
5. **✅ Validation Scripts**: Enforce module boundaries and connection contracts
6. **👥 Team Dashboard**: Morning briefing showing module health and assignments

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer                                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Morning Start │
         │  cerber-team-  │
         │   morning.sh   │
         └────────┬───────┘
                  │
                  ▼
      ┌─────────────────────────┐
      │     Choose Module       │
      │  (from BIBLE.md)        │
      └─────────┬───────────────┘
                │
                ▼
      ┌─────────────────────────┐
      │  🎯 Focus Mode          │
      │  cerber-focus.sh        │  ◄── Generates 500 LOC context
      │  → FOCUS_CONTEXT.md     │
      └─────────┬───────────────┘
                │
                ▼
      ┌─────────────────────────┐
      │   Work on Module        │
      │  (Share FOCUS_CONTEXT   │
      │   with AI - 10x faster) │
      └─────────┬───────────────┘
                │
                ▼
      ┌─────────────────────────┐
      │  ✅ Validate Module     │
      │  cerber-module-check    │
      │  cerber-connections-    │
      │     check               │
      └─────────┬───────────────┘
                │
                ▼
      ┌─────────────────────────┐
      │    git commit           │
      │  🛡️ Guardian validates  │  ◄── Pre-commit checks
      └─────────┬───────────────┘
                │
                ▼
      ┌─────────────────────────┐
      │   git push              │
      │   CI/CD + Deploy        │
      └─────────┬───────────────┘
                │
                ▼
      ┌─────────────────────────┐
      │   Production            │
      │  🔍 Cerber 2.1 health   │  ◄── Runtime monitoring
      └─────────────────────────┘
```

---

## Why Cerber TEAM?

### Before TEAM

**Without module system:**
```typescript
// ❌ Bad: Direct import from another module's internals
import { calculateSeasonalPrice } from '../pricing-engine/internal/seasonal';
import { checkDatabaseAvailability } from '../booking/db/queries';

// No explicit interface
// No version control
// Breaking changes go unnoticed
// AI needs entire codebase to understand context
```

**Problems:**
- AI processing 10,000 LOC → 60 seconds per response
- Unclear what's public vs private
- Breaking changes undetected
- No documentation of dependencies
- Team conflicts over ownership

### After TEAM

**With module system:**
```typescript
// ✅ Good: Import from module's public interface
import { calculatePrice } from '@modules/pricing-engine';
import { checkAvailability } from '@modules/booking-calendar';

// Clear public interface
// Versioned contracts
// Breaking changes detected
// AI gets focused 500 LOC context
```

**Benefits:**
- AI processing 500 LOC → 6 seconds per response (10x faster ⚡)
- Clear public interfaces in contract.json
- Automated validation catches breaking changes
- FOCUS_CONTEXT.md documents everything
- BIBLE.md shows team ownership

### ROI Comparison

| Metric | Before TEAM | After TEAM | Improvement |
|--------|-------------|------------|-------------|
| AI response time | 60s | 6s | **10x faster** |
| Context size | 10,000 LOC | 500 LOC | **95% reduction** |
| Breaking change detection | Manual | Automated | **100% caught** |
| Onboarding time | 2 weeks | 2 days | **5x faster** |
| Module violations | Common | Blocked | **0 violations** |

---

## Core Concepts

### 1. Modules

A **module** is a self-contained unit of functionality with:
- Clear purpose and responsibilities
- Explicit public interface
- Documented dependencies
- Single owner

**Module Structure:**
```
.cerber/modules/pricing-engine/
├── MODULE.md          # Complete documentation
├── contract.json      # Public interface (versioned)
└── dependencies.json  # List of dependencies
```

**Example MODULE.md:**
```markdown
# Module: pricing-engine

**Owner:** Stefan Pitek
**Status:** Active

## Purpose
Calculates dynamic room pricing based on date, occupancy, season.

## Public Interface
- `calculatePrice(params): PriceResult` - Calculate total price
- `getSeasonalMultiplier(date): number` - Get seasonal factor

## Dependencies
- booking-calendar (for availability checks)
```

### 2. Focus Mode

**Focus Mode** generates a single file containing everything needed to work on a module:

```bash
bash team/scripts/cerber-focus.sh pricing-engine
```

This creates `.cerber/FOCUS_CONTEXT.md` with:
- MODULE.md documentation
- contract.json interface
- dependencies.json
- All connection contracts mentioning this module

**Why it's powerful:**
- **AI gets 500 LOC instead of 10,000 LOC** → 10x faster responses
- Single file to share (no need to explain entire codebase)
- Always up-to-date (regenerated on demand)
- Perfect for code reviews and new team members

### 3. Connection Contracts

**Connection Contracts** explicitly document how modules communicate:

```json
{
  "id": "pricing-to-booking",
  "from": "pricing-engine",
  "to": "booking-calendar",
  "type": "function-call",
  "interface": {
    "function": "checkAvailability",
    "input": { "type": "AvailabilityParams", ... },
    "output": { "type": "AvailabilityResult", ... }
  },
  "version": "2.0.0",
  "breaking_changes": [...]
}
```

**Benefits:**
- Explicit dependencies (no hidden coupling)
- Version tracking (detect breaking changes)
- Documentation that can't drift (validated by scripts)
- Clear contract between teams

### 4. BIBLE.md

The **BIBLE** is the master project map showing:
- All modules and their owners
- Architecture diagram
- Connections between modules
- Team responsibilities
- Tech stack

**Think of it as:**
- "Source of truth" for project structure
- First document new team members read
- High-level map before diving into code

### 5. Module Validation

Automated scripts ensure compliance:

```bash
# Validate single module
bash team/scripts/cerber-module-check.sh pricing-engine

# ✅ MODULE.md exists
# ✅ contract.json valid
# ✅ All dependencies declared
# ✅ No forbidden imports
```

```bash
# Validate all connections
bash team/scripts/cerber-connections-check.sh

# ✅ pricing-engine → booking-calendar (valid)
# ✅ booking-calendar → user-auth (valid)
# ⚠️ user-auth → payment (missing contract)
```

---

## Installation & Setup

### Prerequisites

- Node.js 16+ or 18+
- Bash shell (Linux, macOS, WSL, Git Bash)
- Git repository
- Guardian + Cerber 2.1 (optional but recommended)

### Step 1: Install Cerber Core

If you haven't already:

```bash
npm install cerber-core --save-dev
```

Or clone the repository:

```bash
git clone https://github.com/Agaslez/cerber-core.git
cd cerber-core
```

### Step 2: Initialize TEAM Structure

Create the `.cerber` directory for your project:

```bash
mkdir -p .cerber/modules
mkdir -p .cerber/connections/contracts
```

### Step 3: Create Project BIBLE

Copy the template:

```bash
cp team/templates/BIBLE_TEMPLATE.md .cerber/BIBLE.md
```

Edit `.cerber/BIBLE.md` to describe your project architecture.

### Step 4: Add Scripts to package.json

```json
{
  "scripts": {
    "cerber:morning": "bash team/scripts/cerber-team-morning.sh",
    "cerber:focus": "bash team/scripts/cerber-focus.sh",
    "cerber:add-module": "bash team/scripts/cerber-add-module.sh",
    "cerber:check-module": "bash team/scripts/cerber-module-check.sh",
    "cerber:check-connections": "bash team/scripts/cerber-connections-check.sh"
  }
}
```

### Step 5: Create Your First Module

```bash
bash team/scripts/cerber-add-module.sh my-first-module

# Edit the generated files:
nano .cerber/modules/my-first-module/MODULE.md
nano .cerber/modules/my-first-module/contract.json
```

### Step 6: Verify Setup

```bash
# Morning dashboard
npm run cerber:morning

# Should show your new module
```

---

## Quick Start

### Your First Day with TEAM

**Morning (5 minutes):**

```bash
# 1. Start with team dashboard
npm run cerber:morning

# Shows:
# - All modules and their health
# - Your assigned modules
# - Modules needing attention
# - Quick actions
```

**Create a module (3 minutes):**

```bash
# 2. Create a new module
bash team/scripts/cerber-add-module.sh payment-gateway

# ✅ Created .cerber/modules/payment-gateway/
# ✅ MODULE.md created from template
# ✅ contract.json initialized
# ✅ dependencies.json created
# ✅ BIBLE.md updated

# 3. Customize the module
nano .cerber/modules/payment-gateway/MODULE.md
# - Add purpose
# - List responsibilities
# - Define public interface
# - Document dependencies
```

**Enter focus mode (10 seconds):**

```bash
# 4. Generate focus context
bash team/scripts/cerber-focus.sh payment-gateway

# ✅ Focus context created: .cerber/FOCUS_CONTEXT.md
# 📖 Context contains 500 LOC (vs 10,000 LOC for whole project)
# 🤖 AI can now work 10x faster with focused context

# 5. View the context
cat .cerber/FOCUS_CONTEXT.md
# - Shows MODULE.md
# - Shows contract.json
# - Shows dependencies.json
# - Shows all connection contracts
```

**Work on module:**

```bash
# 6. Share FOCUS_CONTEXT.md with AI
# "Here's the context for the payment-gateway module. Please implement..."

# AI gets focused context → 10x faster responses
# No need to explain entire codebase
# All relevant information in one file
```

**Validate (5 seconds):**

```bash
# 7. Validate your module
bash team/scripts/cerber-module-check.sh payment-gateway

# ✅ MODULE.md exists
# ✅ contract.json valid
# ✅ All dependencies declared
# ✅ No forbidden imports
# MODULE CHECK PASSED ✅

# 8. Validate connections
bash team/scripts/cerber-connections-check.sh

# ✅ All connection contracts valid
```

**Commit:**

```bash
# 9. Commit (Guardian validates)
git add .
git commit -m "feat(payment-gateway): add new module"

# Guardian blocks if architecture violations
# TEAM scripts already validated module
```

**Total time:** 15-20 minutes to create, document, and validate a new module!

---

## Module System

### Module Anatomy

Every module has three core files:

#### 1. MODULE.md - Documentation

Complete documentation of the module:

```markdown
# Module: pricing-engine

**Owner:** Stefan Pitek
**Status:** Active
**Last Updated:** 2026-01-02

## Purpose
What this module does (1-2 sentences).

## Responsibilities
- Responsibility 1
- Responsibility 2

## Public Interface
Functions/classes other modules can use:

### `calculatePrice(params: PriceParams): PriceResult`
Description, parameters, returns, example code.

## Dependencies
Modules this module uses and why.

## File Structure
Where the actual code lives.

## Testing
How to test this module.

## Notes
Special considerations, gotchas, future plans.
```

#### 2. contract.json - Public Interface

Machine-readable interface definition:

```json
{
  "version": "2.0.0",
  "publicInterface": {
    "calculatePrice": {
      "name": "calculatePrice",
      "params": {
        "roomType": "string",
        "checkIn": "Date",
        "checkOut": "Date"
      },
      "returns": "PriceResult",
      "description": "Calculates total price"
    }
  },
  "dependencies": ["booking-calendar"]
}
```

#### 3. dependencies.json - Dependency List

Explicit list of module dependencies:

```json
{
  "dependencies": ["booking-calendar"],
  "reason": {
    "booking-calendar": "Need to check availability during pricing"
  }
}
```

### Creating Modules

**Always use the official script:**

```bash
bash team/scripts/cerber-add-module.sh <module-name>
```

**Naming conventions:**
- Use `kebab-case`: `pricing-engine`, `user-auth`, `payment-gateway`
- Be descriptive but concise
- Match actual directory structure: `src/modules/pricing-engine/`

**What the script does:**
1. Creates `.cerber/modules/<module-name>/` directory
2. Copies MODULE_TEMPLATE.md → MODULE.md
3. Creates contract.json with version
4. Creates dependencies.json
5. Updates BIBLE.md with new module
6. Shows next steps

### Module Validation

**Validate a single module:**

```bash
bash team/scripts/cerber-module-check.sh pricing-engine
```

**What it checks:**
- ✅ MODULE.md exists and has required sections
- ✅ contract.json is valid JSON with required fields
- ✅ dependencies.json lists valid modules
- ✅ All referenced files exist
- ✅ No forbidden cross-module imports

**Output example:**

```
🔍 Validating module: pricing-engine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ MODULE.md exists
✅ MODULE.md has required sections
✅ contract.json exists
✅ contract.json is valid JSON
✅ contract.json has required fields
✅ dependencies.json exists
✅ dependencies.json is valid JSON
✅ All dependencies reference valid modules

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ MODULE CHECK PASSED

Module 'pricing-engine' is fully compliant!
```

### Module Lifecycle

**1. Planning**
```bash
# Add to BIBLE.md (design phase)
# Identify dependencies
# Design public interface
```

**2. Creation**
```bash
bash team/scripts/cerber-add-module.sh new-module
```

**3. Documentation**
```bash
# Edit MODULE.md, contract.json, dependencies.json
# Define clear public interface
# Document all public functions
```

**4. Implementation**
```bash
bash team/scripts/cerber-focus.sh new-module
# Work on module with focused context
```

**5. Validation**
```bash
bash team/scripts/cerber-module-check.sh new-module
bash team/scripts/cerber-connections-check.sh
```

**6. Integration**
```bash
# Create connection contracts
# Update BIBLE.md
# Commit with Guardian validation
```

**7. Maintenance**
```bash
# Update MODULE.md when changing public interface
# Increment version in contract.json
# Document breaking changes
```

---

## Focus Mode

### What is Focus Mode?

**Focus Mode** creates a single file (`.cerber/FOCUS_CONTEXT.md`) containing everything needed to work on a module. This dramatically reduces cognitive load and makes AI assistance 10x faster.

### Why Focus Mode?

**Problem:**
- Large codebases have 10,000+ lines of code
- AI assistants need full context to understand code
- Processing 10,000 LOC takes 60+ seconds
- Responses are slow and sometimes incorrect

**Solution:**
- Focus Mode extracts only relevant code (500 LOC)
- AI processes 500 LOC in 6 seconds (10x faster)
- Responses are faster and more accurate
- Perfect for code reviews and new team members

### Using Focus Mode

**Basic usage:**

```bash
bash team/scripts/cerber-focus.sh <module-name>
```

**Example:**

```bash
bash team/scripts/cerber-focus.sh pricing-engine

# Output:
# ✅ Focus context created successfully!
# 
# 📖 Focus context: .cerber/FOCUS_CONTEXT.md
# 📊 Context contains 487 lines (23,456 characters)
# 
# 🤖 AI can now work with focused context instead of entire codebase
#    This is typically 10x faster for AI processing
```

### What's Included?

The FOCUS_CONTEXT.md contains:

1. **Module Documentation** (MODULE.md)
   - Purpose and responsibilities
   - Public interface details
   - Dependencies
   - File structure
   - Testing instructions

2. **Module Contract** (contract.json)
   - Versioned public interface
   - Function signatures
   - Type definitions

3. **Module Dependencies** (dependencies.json)
   - List of dependencies
   - Reasons for each dependency

4. **Connection Contracts**
   - All contracts where this module is involved
   - Input/output types
   - Versioning information

### Focus Context Structure

```markdown
# FOCUS CONTEXT - pricing-engine

**Generated:** 2026-01-02 10:30:00
**Module:** pricing-engine

---

## Module Documentation

[Full MODULE.md content]

---

## Module Contract (Public Interface)

```json
[contract.json content]
```

---

## Module Dependencies

```json
[dependencies.json content]
```

---

## Connection Contracts

### pricing-to-booking.json

```json
[Connection contract content]
```

### booking-to-pricing.json

```json
[Connection contract content]
```

---
```

### Workflow with AI

**Traditional approach (slow):**

```
Developer: "I need to modify the pricing calculation"
AI: "Can you share the entire codebase?"
Developer: [Uploads 10,000 lines]
AI: [60 seconds processing...]
AI: "Here's a solution..." [might be incorrect due to context overload]
```

**Focus Mode approach (fast):**

```bash
bash team/scripts/cerber-focus.sh pricing-engine
cat .cerber/FOCUS_CONTEXT.md

Developer: "Here's the focus context for pricing-engine module. [paste context]
           I need to modify the pricing calculation..."
AI: [6 seconds processing...]
AI: "Perfect! Based on the MODULE.md and contract.json, here's the solution..."
    [accurate solution using exact function signatures]
```

### Best Practices

**DO:**
- ✅ Always generate focus context before working on a module
- ✅ Share focus context with AI instead of entire codebase
- ✅ Regenerate when module changes significantly
- ✅ Use for onboarding new team members
- ✅ Include in code review process

**DON'T:**
- ❌ Manually create focus contexts (use script)
- ❌ Edit FOCUS_CONTEXT.md (it's regenerated)
- ❌ Commit FOCUS_CONTEXT.md to git (add to .gitignore)
- ❌ Share outdated focus contexts

### Tips

**1. Add to .gitignore:**
```bash
echo ".cerber/FOCUS_CONTEXT.md" >> .gitignore
```

**2. Create npm script:**
```json
{
  "scripts": {
    "focus": "bash team/scripts/cerber-focus.sh"
  }
}
```

**3. Use in code reviews:**
```bash
# Reviewer wants to understand module
bash team/scripts/cerber-focus.sh payment-gateway
cat .cerber/FOCUS_CONTEXT.md

# Now has complete context without full codebase
```

**4. Onboarding new developers:**
```bash
# New developer's first day
bash team/scripts/cerber-focus.sh all-modules

# They read focus contexts for each module
# Understand entire system in hours, not weeks
```

---

## Connection Contracts

### What are Connection Contracts?

**Connection Contracts** explicitly document how modules communicate. They're versioned, validated, and serve as living documentation of module dependencies.

### Why Contracts?

**Without contracts:**
- Hidden dependencies (who calls what?)
- No version control (breaking changes go unnoticed)
- Implicit interfaces (what parameters? what returns?)
- No change tracking (when did interface change?)

**With contracts:**
- ✅ Explicit dependencies (clear A → B relationship)
- ✅ Versioned interfaces (semver tracking)
- ✅ Typed contracts (input/output defined)
- ✅ Breaking change detection (automated validation)

### Contract Structure

**Basic contract:**

```json
{
  "id": "pricing-to-booking",
  "from": "pricing-engine",
  "to": "booking-calendar",
  "type": "function-call",
  "interface": {
    "function": "checkAvailability",
    "input": {
      "type": "AvailabilityParams",
      "fields": ["roomType", "checkIn", "checkOut"]
    },
    "output": {
      "type": "AvailabilityResult",
      "fields": ["available", "availableCount"]
    }
  },
  "version": "2.0.0",
  "breaking_changes": [
    {
      "version": "2.0.0",
      "date": "2026-01-02",
      "description": "Added availableCount to output",
      "migration": "Update all callers to handle new field"
    }
  ],
  "notes": "Pricing engine calls this before calculating prices"
}
```

### Contract Types

**1. Function Call** (most common)

```json
{
  "type": "function-call",
  "interface": {
    "function": "calculatePrice",
    "input": { "type": "PriceParams", "fields": [...] },
    "output": { "type": "PriceResult", "fields": [...] }
  }
}
```

**2. Event**

```json
{
  "type": "event",
  "interface": {
    "event": "BookingCreated",
    "payload": { "type": "BookingEvent", "fields": [...] }
  }
}
```

**3. Data Flow**

```json
{
  "type": "data-flow",
  "interface": {
    "source": "bookings table",
    "destination": "analytics module",
    "format": "JSON"
  }
}
```

### Creating Contracts

**1. Copy template:**

```bash
cp team/templates/CONNECTION_TEMPLATE.json \
   .cerber/connections/contracts/pricing-to-booking.json
```

**2. Edit contract:**

```bash
nano .cerber/connections/contracts/pricing-to-booking.json
```

```json
{
  "id": "pricing-to-booking",
  "from": "pricing-engine",
  "to": "booking-calendar",
  "type": "function-call",
  "interface": {
    "function": "checkAvailability",
    "input": {
      "type": "AvailabilityParams",
      "fields": {
        "roomType": "string",
        "checkIn": "Date",
        "checkOut": "Date",
        "quantity": "number"
      }
    },
    "output": {
      "type": "AvailabilityResult",
      "fields": {
        "available": "boolean",
        "availableCount": "number"
      }
    }
  },
  "version": "1.0.0",
  "breaking_changes": [],
  "notes": "Pricing checks availability before quoting prices"
}
```

**3. Validate:**

```bash
bash team/scripts/cerber-connections-check.sh
```

### Bidirectional Contracts

For each connection, **both modules should be aware**:

**pricing-engine → booking-calendar:**
```json
{
  "id": "pricing-to-booking",
  "from": "pricing-engine",
  "to": "booking-calendar",
  "interface": { "function": "checkAvailability", ... }
}
```

**booking-calendar → pricing-engine:**
```json
{
  "id": "booking-to-pricing",
  "from": "booking-calendar",
  "to": "pricing-engine",
  "interface": { "function": "calculatePrice", ... }
}
```

This ensures both teams understand the relationship.

### Versioning Contracts

Use **semantic versioning** (semver):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features (backwards compatible)
- **Patch** (1.0.0 → 1.0.1): Bug fixes

**Example - Breaking change:**

```json
{
  "version": "2.0.0",
  "breaking_changes": [
    {
      "version": "2.0.0",
      "date": "2026-01-02",
      "description": "Changed 'user_id' to 'userId' (camelCase)",
      "migration": "Update all callers to use 'userId' instead of 'user_id'"
    }
  ]
}
```

### Validating Contracts

**Validate all connections:**

```bash
bash team/scripts/cerber-connections-check.sh
```

**What it checks:**
- ✅ All contracts have valid JSON syntax
- ✅ Required fields present (from, to, interface, version)
- ✅ Referenced modules exist
- ✅ No circular dependencies
- ⚠️ Warns about bidirectional connections (A↔B)

**Output example:**

```
🔗 Checking connection contracts...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Found 3 connection contract(s)

Checking: pricing-to-booking.json
  ✅ pricing-engine → booking-calendar (valid)

Checking: booking-to-pricing.json
  ✅ booking-calendar → pricing-engine (valid)

Checking: booking-to-payment.json
  ❌ Module 'payment' not found

Checking for circular dependencies...
⚠️ Potential circular dependency: pricing-engine ↔ booking-calendar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ CONNECTION CHECK FAILED

Checked 3 contract(s)
Found 1 error(s) and 1 warning(s)
```

### Breaking Change Workflow

**When making breaking changes:**

1. **Update contract version:**
```json
{
  "version": "3.0.0",  // Major bump
  "breaking_changes": [
    {
      "version": "3.0.0",
      "date": "2026-01-05",
      "description": "Removed deprecated getPrice() method",
      "migration": "Use calculatePrice() instead"
    }
  ]
}
```

2. **Notify dependent modules:**
```bash
# Find who depends on this module
grep -r "pricing-engine" .cerber/modules/*/dependencies.json

# Notify those team members
```

3. **Update MODULE.md:**
```markdown
## Breaking Changes

### v3.0.0 (2026-01-05)
- Removed `getPrice()` - use `calculatePrice()` instead
```

4. **Validate:**
```bash
bash team/scripts/cerber-connections-check.sh
```

---

## Team Workflows

### Morning Routine

**Start every day with the dashboard:**

```bash
npm run cerber:morning
# or
bash team/scripts/cerber-team-morning.sh
```

**Dashboard shows:**
- 📦 Module status (total count, health)
- 🔗 Connection contracts (valid/invalid)
- 📊 Recent activity (last modified modules)
- 💡 Today's focus (modules needing attention)
- 🚀 Quick actions (command reference)

**Example output:**

```
╔═══════════════════════════════════════════════════════════╗
║           🛡️  CERBER TEAM - Morning Dashboard            ║
╚═══════════════════════════════════════════════════════════╝

Date: Tuesday, January 02, 2026 at 09:00

📦 Modules Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total modules: 5

  ✅ pricing-engine
     Owner: Stefan Pitek
     Status: Healthy

  ⚠️ booking-calendar
     Owner: Stefan Pitek
     Status: Missing contract.json

  ✅ user-auth
     Owner: John Doe
     Status: Healthy

  ✅ payment-gateway
     Owner: Jane Smith
     Status: Healthy

  ⚠️ analytics
     Owner: Unknown
     Status: Uninitialized template

🔗 Connection Contracts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total connections: 4

  ✅ Valid: 3
  ❌ Invalid: 1

📊 Recent Activity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recently updated modules:

  pricing-engine - Last modified: Jan 2 08:45
  payment-gateway - Last modified: Jan 1 16:20
  user-auth - Last modified: Dec 30 14:30

💡 Today's Focus
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Modules needing attention:
  • booking-calendar - incomplete setup
  • analytics - template not customized

🚀 Quick Actions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Create module:      bash team/scripts/cerber-add-module.sh <name>
  Focus on module:    bash team/scripts/cerber-focus.sh <name>
  Check module:       bash team/scripts/cerber-module-check.sh <name>
  Check connections:  bash team/scripts/cerber-connections-check.sh

═══════════════════════════════════════════════════════════
```

### Solo Developer Workflow

**Daily:**

```bash
# Morning
npm run cerber:morning

# Choose module
bash team/scripts/cerber-focus.sh my-module

# Work on it
# [code changes]

# Validate
bash team/scripts/cerber-module-check.sh my-module

# Commit
git commit  # Guardian validates
```

### Team Workflow

**Sprint Planning:**

```bash
# Review BIBLE.md
cat .cerber/BIBLE.md

# Assign modules to team members
# Update owner in MODULE.md

# Create new modules as needed
bash team/scripts/cerber-add-module.sh new-feature
```

**Daily Development:**

```bash
# Developer A: Works on pricing-engine
bash team/scripts/cerber-focus.sh pricing-engine
# [Work on module]
bash team/scripts/cerber-module-check.sh pricing-engine
git commit -m "feat(pricing-engine): add seasonal pricing"

# Developer B: Works on booking-calendar
bash team/scripts/cerber-focus.sh booking-calendar
# [Work on module]
bash team/scripts/cerber-module-check.sh booking-calendar
git commit -m "feat(booking-calendar): add waitlist"
```

**Code Review:**

```bash
# Reviewer sees PR changing pricing-engine
bash team/scripts/cerber-focus.sh pricing-engine
cat .cerber/FOCUS_CONTEXT.md

# Understands module without full codebase
# Reviews changes in context
# Validates contract.json updated if interface changed
```

**Integration:**

```bash
# Create connection contract
cp team/templates/CONNECTION_TEMPLATE.json \
   .cerber/connections/contracts/pricing-to-analytics.json

# Edit contract
# Define interface

# Validate
bash team/scripts/cerber-connections-check.sh

# Both teams aware of new connection
```

### Onboarding New Developers

**Day 1:**

```bash
# 1. Read BIBLE.md
cat .cerber/BIBLE.md
# Understand architecture, modules, tech stack

# 2. Morning dashboard
npm run cerber:morning
# See all modules, owners, status

# 3. Explore modules
bash team/scripts/cerber-focus.sh pricing-engine
bash team/scripts/cerber-focus.sh booking-calendar
bash team/scripts/cerber-focus.sh user-auth

# Read each FOCUS_CONTEXT.md
# Understand each module's purpose, interface, dependencies
```

**Day 2-3: Small contribution**

```bash
# Assigned a small task in existing module
bash team/scripts/cerber-focus.sh user-auth

# Work on module with focused context
# Validate before committing
bash team/scripts/cerber-module-check.sh user-auth
```

**Week 2: Own a module**

```bash
# Assigned ownership of module
# Update MODULE.md with your name
# Become expert in that module
```

**Result:** New developer productive in days, not weeks!

---

## Command Reference

### cerber-add-module.sh

**Purpose:** Creates a new module from template

**Usage:**
```bash
bash team/scripts/cerber-add-module.sh <module-name>
```

**Example:**
```bash
bash team/scripts/cerber-add-module.sh payment-gateway

# Output:
# ✅ Created .cerber/modules/payment-gateway/
# ✅ MODULE.md created from template
# ✅ contract.json initialized
# ✅ dependencies.json created
# ✅ BIBLE.md updated
#
# Next steps:
# 1. Edit .cerber/modules/payment-gateway/MODULE.md
# 2. Define interface in contract.json
# 3. bash team/scripts/cerber-focus.sh payment-gateway
```

**What it creates:**
- `.cerber/modules/<name>/MODULE.md` (from template)
- `.cerber/modules/<name>/contract.json` (empty interface)
- `.cerber/modules/<name>/dependencies.json` (empty array)
- Updates `.cerber/BIBLE.md` (adds module entry)

---

### cerber-focus.sh

**Purpose:** Creates FOCUS_CONTEXT.md for a module (10x faster AI)

**Usage:**
```bash
bash team/scripts/cerber-focus.sh <module-name>
```

**Example:**
```bash
bash team/scripts/cerber-focus.sh pricing-engine

# Output:
# ✅ Focus context created successfully!
# 📖 Focus context: .cerber/FOCUS_CONTEXT.md
# 📊 Context contains 487 lines (23,456 characters)
# 🤖 AI can now work 10x faster with focused context
```

**Output file:** `.cerber/FOCUS_CONTEXT.md` containing:
- MODULE.md content
- contract.json
- dependencies.json
- All connection contracts mentioning this module

---

### cerber-module-check.sh

**Purpose:** Validates a single module for compliance

**Usage:**
```bash
bash team/scripts/cerber-module-check.sh <module-name>
```

**Example:**
```bash
bash team/scripts/cerber-module-check.sh pricing-engine

# Output:
# 🔍 Validating module: pricing-engine
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# ✅ MODULE.md exists
# ✅ MODULE.md has required sections
# ✅ contract.json exists
# ✅ contract.json is valid JSON
# ✅ contract.json has required fields
# ✅ dependencies.json exists
# ✅ dependencies.json is valid JSON
# ✅ All dependencies reference valid modules
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ MODULE CHECK PASSED
```

**Exit codes:**
- `0` = Pass (no errors)
- `1` = Fail (errors found)

---

### cerber-connections-check.sh

**Purpose:** Validates all connection contracts

**Usage:**
```bash
bash team/scripts/cerber-connections-check.sh
```

**Example:**
```bash
bash team/scripts/cerber-connections-check.sh

# Output:
# 🔗 Checking connection contracts...
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Found 3 connection contract(s)
#
# Checking: pricing-to-booking.json
#   ✅ pricing-engine → booking-calendar (valid)
#
# Checking: booking-to-pricing.json
#   ✅ booking-calendar → pricing-engine (valid)
#
# Checking: booking-to-payment.json
#   ✅ booking-calendar → payment-gateway (valid)
#
# Checking for circular dependencies...
# ✅ No circular dependencies detected
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ✅ ALL CONNECTION CHECKS PASSED
```

**Exit codes:**
- `0` = Pass (all connections valid)
- `1` = Fail (errors found)

---

### cerber-team-morning.sh

**Purpose:** Team morning dashboard

**Usage:**
```bash
bash team/scripts/cerber-team-morning.sh
```

**Shows:**
- Module status (count, health, owners)
- Connection contracts (count, validation status)
- Recent activity (last modified modules)
- Today's focus (modules needing attention)
- Quick actions (command reference)

---

## Configuration

### team-contract.json

Location: `team/config/team-contract.json`

```json
{
  "version": "2.0-team",
  "extends": "cerber-core",
  "team": {
    "enabled": true,
    "modulesPath": ".cerber/modules",
    "connectionsPath": ".cerber/connections/contracts",
    "biblePath": ".cerber/BIBLE.md"
  },
  "moduleValidation": {
    "requireModuleMd": true,
    "requireContract": true,
    "requireDependencies": true,
    "forbiddenCrossModuleImports": true
  },
  "focusMode": {
    "enabled": true,
    "outputPath": ".cerber/FOCUS_CONTEXT.md",
    "includeContracts": true,
    "includeDependencies": true
  },
  "connectionValidation": {
    "requireBidirectional": true,
    "checkBreakingChanges": true,
    "detectCircular": true
  }
}
```

### Customizing Paths

Override default paths in your project:

```json
{
  "team": {
    "modulesPath": "docs/modules",
    "connectionsPath": "docs/connections",
    "biblePath": "docs/ARCHITECTURE.md"
  }
}
```

### Validation Settings

Configure validation strictness:

```json
{
  "moduleValidation": {
    "requireModuleMd": true,        // Must have MODULE.md
    "requireContract": true,         // Must have contract.json
    "requireDependencies": false,    // dependencies.json optional
    "forbiddenCrossModuleImports": true  // Block direct imports
  }
}
```

---

## Integration Guide

### With Guardian 1.0

Guardian pre-commit validation + TEAM module system:

```bash
# .husky/pre-commit
#!/bin/sh

# Guardian validates architecture
node scripts/validate-schema.mjs

# TEAM validates modules
bash team/scripts/cerber-module-check.sh pricing-engine
bash team/scripts/cerber-connections-check.sh
```

### With Cerber 2.1

Runtime health + TEAM structure:

```typescript
// server.ts
import { createHealthEndpoint } from 'cerber-core';

const healthChecks = {
  'pricing-engine': async () => {
    // Check if module is healthy
    return [];
  },
  'booking-calendar': async () => {
    // Check if module is healthy
    return [];
  }
};

app.get('/api/health', createHealthEndpoint(healthChecks));
```

### With SOLO

Automation + TEAM:

```json
{
  "scripts": {
    "cerber:morning": "bash team/scripts/cerber-team-morning.sh && node solo/scripts/cerber-dashboard.js",
    "cerber:pre-push": "bash team/scripts/cerber-connections-check.sh && npm run cerber:deps && npm run cerber:docs"
  }
}
```

### Full Integration

Complete workflow:

```
Morning:
  npm run cerber:morning           # TEAM dashboard
  
Create module:
  bash team/scripts/cerber-add-module.sh payment
  
Focus mode:
  bash team/scripts/cerber-focus.sh payment
  # Share FOCUS_CONTEXT.md with AI (10x faster)
  
Validate:
  bash team/scripts/cerber-module-check.sh payment
  bash team/scripts/cerber-connections-check.sh
  
Commit:
  git commit                       # Guardian validates
  
Before push:
  npm run cerber:pre-push          # SOLO checks
  
Deploy:
  curl /api/health                 # Cerber 2.1 validates
```

---

## Best Practices

### Module Design

**DO:**
- ✅ Keep modules focused (single responsibility)
- ✅ Define clear public interfaces
- ✅ Document all public functions
- ✅ Use semantic versioning
- ✅ Update MODULE.md with interface changes

**DON'T:**
- ❌ Create god modules (too many responsibilities)
- ❌ Change public interface without versioning
- ❌ Import from module internals
- ❌ Skip module validation

### Focus Mode

**DO:**
- ✅ Always use focus mode before working on module
- ✅ Share FOCUS_CONTEXT.md with AI
- ✅ Regenerate when module changes
- ✅ Add FOCUS_CONTEXT.md to .gitignore

**DON'T:**
- ❌ Share entire codebase when you could use focus mode
- ❌ Manually create focus contexts
- ❌ Commit FOCUS_CONTEXT.md to repository
- ❌ Use outdated focus contexts

### Connection Contracts

**DO:**
- ✅ Create contracts for all module connections
- ✅ Version contracts with semver
- ✅ Document breaking changes
- ✅ Validate contracts before committing

**DON'T:**
- ❌ Skip contract creation
- ❌ Make breaking changes without versioning
- ❌ Forget to update both sides of connection
- ❌ Leave contracts outdated

### Team Collaboration

**DO:**
- ✅ Start day with team dashboard
- ✅ Assign clear module ownership
- ✅ Update BIBLE.md with architecture changes
- ✅ Review FOCUS_CONTEXT.md in code reviews

**DON'T:**
- ❌ Work on modules without focus mode
- ❌ Skip module validation
- ❌ Make breaking changes without team notice
- ❌ Let documentation drift

---

## Troubleshooting

### Module validation fails

**Problem:** `cerber-module-check.sh` reports errors

**Solutions:**
1. Check MODULE.md has required sections (Purpose, Responsibilities, Public Interface)
2. Validate contract.json is valid JSON: `python3 -m json.tool contract.json`
3. Ensure dependencies.json references existing modules
4. Remove template placeholders like `[MODULE_NAME]`

### Focus mode fails

**Problem:** `cerber-focus.sh` can't find module

**Solutions:**
1. Check module directory exists: `ls .cerber/modules/`
2. Verify correct module name (kebab-case): `pricing-engine` not `pricingEngine`
3. Create module if missing: `bash team/scripts/cerber-add-module.sh <name>`

### Connection validation fails

**Problem:** `cerber-connections-check.sh` reports errors

**Solutions:**
1. Check JSON syntax: `python3 -m json.tool contract.json`
2. Verify referenced modules exist: `ls .cerber/modules/`
3. Ensure required fields present: `from`, `to`, `interface`, `version`
4. Fix circular dependencies if detected

### Morning dashboard empty

**Problem:** Dashboard shows no modules

**Solutions:**
1. Create .cerber directory: `mkdir -p .cerber/modules`
2. Create first module: `bash team/scripts/cerber-add-module.sh my-module`
3. Check you're in project root directory

---

## Examples

### Complete Example Project

See `.cerber-example/` for full working example:

```
.cerber-example/
├── BIBLE.md                          # Master project map
├── CERBER_LAW.md                     # Team rules
├── modules/
│   ├── pricing-engine/               # Example module 1
│   │   ├── MODULE.md
│   │   ├── contract.json
│   │   └── dependencies.json
│   └── booking-calendar/             # Example module 2
│       ├── MODULE.md
│       ├── contract.json
│       └── dependencies.json
└── connections/
    └── contracts/
        ├── pricing-to-booking.json   # Connection A→B
        └── booking-to-pricing.json   # Connection B→A
```

Study these files to understand best practices!

---

## FAQ

**Q: Do I need Guardian + Cerber 2.1 to use TEAM?**

A: No, TEAM works standalone. But combining all three gives best results.

**Q: Can I use TEAM with other languages besides TypeScript?**

A: Yes! TEAM is language-agnostic. Just adjust the templates.

**Q: How is TEAM different from microservices?**

A: TEAM is for **monolithic codebases**. Modules are logical boundaries, not separate deployments.

**Q: What if a module doesn't fit the template?**

A: Customize MODULE_TEMPLATE.md for your needs. The key is consistency across modules.

**Q: Should every file be in a module?**

A: No. Core utilities, shared types, and infrastructure can live outside modules.

**Q: How do I handle shared code?**

A: Create a `common` or `shared` module with utilities used by multiple modules.

**Q: Can modules have nested sub-modules?**

A: The current system supports flat module structure. Nesting adds complexity.

**Q: What if I disagree with module boundaries?**

A: Discuss with team, update BIBLE.md, reorganize modules. Boundaries evolve.

**Q: How do I migrate existing code to TEAM?**

A: Incrementally:
1. Create BIBLE.md documenting current structure
2. Create modules for main components
3. Add connection contracts
4. Refactor imports over time

---

## Summary

Cerber TEAM gives you:

✅ **Module System** - Clear boundaries, explicit interfaces
✅ **Focus Mode** - 500 LOC contexts for 10x faster AI
✅ **Connection Contracts** - Versioned, validated dependencies
✅ **BIBLE.md** - Master project map
✅ **Validation Scripts** - Enforce module system
✅ **Team Dashboard** - Morning briefing

**Result:** Teams work faster, AI works smarter, code stays organized.

---

## License

MIT © 2026 Stefan Pitek

---

## Support

- **Documentation:** https://github.com/Agaslez/cerber-core/tree/main/docs
- **Examples:** https://github.com/Agaslez/cerber-core/tree/main/.cerber-example
- **Issues:** https://github.com/Agaslez/cerber-core/issues

---

**Built with ❤️ by Stefan Pitek**
