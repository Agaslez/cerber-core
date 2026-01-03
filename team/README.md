# 🛡️ Cerber TEAM - Quick Start

**Team collaboration layer for large codebases**

Owner: Agata Ślęzak | Creator: Stefan Pitek  
Version: 2.0-team

---

## What is Cerber TEAM?

Cerber TEAM adds module system and focus mode to help teams work on large codebases more efficiently.

**Key Features:**
- **📦 Module System** - Clear boundaries between components
- **🎯 Focus Mode** - AI gets 500 LOC instead of 10,000 LOC (10x faster)
- **🔗 Connection Contracts** - Explicit interfaces between modules
- **📖 CERBER.md** - Master project map
- **✅ Validation** - Enforce module boundaries automatically

---

## Quick Start (5 minutes)

### 1. Setup

```bash
# Create .cerber directory
mkdir -p .cerber/modules
mkdir -p .cerber/connections/contracts

# Create project CERBER
cp team/templates/CERBER_TEMPLATE.md .cerber/CERBER.md

# Edit CERBER.md to describe your project
nano .cerber/CERBER.md
```

### 2. Create Your First Module

```bash
# Create module
bash team/scripts/cerber-add-module.sh my-first-module

# Output:
# ✅ Created .cerber/modules/my-first-module/
# ✅ MODULE.md created from template
# ✅ contract.json initialized
# ✅ dependencies.json created
# ✅ CERBER.md updated

# Edit module documentation
nano .cerber/modules/my-first-module/MODULE.md
```

### 3. Use Focus Mode

```bash
# Generate focus context (10x faster AI)
bash team/scripts/cerber-focus.sh my-first-module

# Output:
# ✅ Focus context created: .cerber/FOCUS_CONTEXT.md
# 📖 Context contains 500 LOC (vs 10,000 LOC for whole project)
# 🤖 AI can now work 10x faster

# View the context
cat .cerber/FOCUS_CONTEXT.md

# Share this with AI instead of entire codebase!
```

### 4. Validate

```bash
# Validate module
bash team/scripts/cerber-module-check.sh my-first-module

# Output:
# ✅ MODULE.md exists
# ✅ contract.json valid
# ✅ All dependencies declared
# ✅ MODULE CHECK PASSED

# Validate connections
bash team/scripts/cerber-connections-check.sh
```

### 5. Daily Workflow

```bash
# Morning dashboard
bash team/scripts/cerber-team-morning.sh

# Shows:
# - All modules and their health
# - Connection contracts status
# - Recent activity
# - Today's focus

# Work on a module
bash team/scripts/cerber-focus.sh my-module
# [Share FOCUS_CONTEXT.md with AI]
# [Make changes]

# Validate before commit
bash team/scripts/cerber-module-check.sh my-module
git commit
```

---

## Scripts Reference

### cerber-add-module.sh
Creates new module from template

```bash
bash team/scripts/cerber-add-module.sh <module-name>
```

### cerber-focus.sh ⭐ MOST IMPORTANT
Generates FOCUS_CONTEXT.md for a module (10x faster AI)

```bash
bash team/scripts/cerber-focus.sh <module-name>
```

### cerber-module-check.sh
Validates single module

```bash
bash team/scripts/cerber-module-check.sh <module-name>
```

### cerber-connections-check.sh
Validates all connection contracts

```bash
bash team/scripts/cerber-connections-check.sh
```

### cerber-team-morning.sh
Team morning dashboard

```bash
bash team/scripts/cerber-team-morning.sh
```

---

## Module Structure

Every module has:

```
.cerber/modules/my-module/
├── MODULE.md          # Complete documentation
├── contract.json      # Public interface (versioned)
└── dependencies.json  # List of dependencies
```

**MODULE.md** - Human-readable documentation:
- Purpose and responsibilities
- Public interface (functions, parameters, returns)
- Dependencies and why
- File structure
- Testing instructions

**contract.json** - Machine-readable interface:
- Version (semver)
- Public functions with types
- Dependencies list

**dependencies.json** - Explicit dependencies:
- List of modules this module uses
- Reason for each dependency

---

## Connection Contracts

Document how modules communicate:

```json
{
  "id": "module-a-to-module-b",
  "from": "module-a",
  "to": "module-b",
  "type": "function-call",
  "interface": {
    "function": "processData",
    "input": { "type": "ProcessParams", "fields": [...] },
    "output": { "type": "ProcessResult", "fields": [...] }
  },
  "version": "1.0.0",
  "breaking_changes": []
}
```

**Create contract:**
```bash
cp team/templates/CONNECTION_TEMPLATE.json \
   .cerber/connections/contracts/module-a-to-module-b.json

# Edit the contract
nano .cerber/connections/contracts/module-a-to-module-b.json

# Validate
bash team/scripts/cerber-connections-check.sh
```

---

## CERBER.md

Master project map showing:
- Architecture overview
- All modules and owners
- Connections between modules
- Team responsibilities
- Tech stack

**Create CERBER:**
```bash
cp team/templates/CERBER_TEMPLATE.md .cerber/CERBER.md
nano .cerber/CERBER.md
```

---

## Integration with Guardian + Cerber + SOLO

Cerber TEAM works alongside existing tools:

```
Morning:
  bash team/scripts/cerber-team-morning.sh  (TEAM dashboard)
  
Development:
  bash team/scripts/cerber-focus.sh <module>  (TEAM focus mode)
  git commit                                  (Guardian validates)
  
Pre-push:
  npm run cerber:pre-push                     (SOLO checks)
  
Deploy:
  curl /api/health                           (Cerber 2.1 validates)
```

---

## Add to package.json

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

---

## Example Project

See `.cerber-example/` for complete working example:
- CERBER.md
- CERBER_LAW.md
- Two complete modules (pricing-engine, booking-calendar)
- Connection contracts

Study these files to understand best practices!

---

## Documentation

**Full documentation:** [docs/TEAM.md](../docs/TEAM.md) (20+ KB)

Topics covered:
- Complete installation guide
- Module system deep dive
- Focus mode workflow
- Connection contracts guide
- Team collaboration workflows
- Best practices
- Troubleshooting
- FAQ

---

## Benefits

**Before TEAM:**
- AI processes 10,000 LOC → 60 seconds
- Unclear module boundaries
- Hidden dependencies
- Documentation drift

**After TEAM:**
- AI processes 500 LOC → 6 seconds (10x faster ⚡)
- Clear module boundaries
- Explicit dependencies
- Living documentation

---

## License

MIT © 2026 Stefan Pitek

---

## Support

- **Documentation:** [docs/TEAM.md](../docs/TEAM.md)
- **Examples:** `.cerber-example/`
- **Issues:** https://github.com/Agaslez/cerber-core/issues

---

**Built with ❤️ by Stefan Pitek**
