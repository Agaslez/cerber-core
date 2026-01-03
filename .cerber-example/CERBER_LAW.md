# CERBER LAW - Team Rules

**Project:** Hotel Booking System  
**Version:** 2.0-team  
**Last Updated:** 2026-01-02

## Core Principles

1. **Module Boundaries Are Sacred**
   - Modules communicate only through declared contracts
   - No direct imports between modules (use public interface)
   - All connections must have documented contracts

2. **Focus Mode First**
   - Always use `cerber-focus.sh` before working on a module
   - Share FOCUS_CONTEXT.md with AI instead of entire codebase
   - Keep context small and focused

3. **Documentation Is Code**
   - MODULE.md must be updated with every public interface change
   - Connection contracts are versioned
   - Breaking changes must be documented

## Module Rules

### Creating Modules

```bash
# Always use the official script
bash team/scripts/cerber-add-module.sh <module-name>

# Never create modules manually
```

### Module Structure

Each module MUST have:
- `MODULE.md` - Complete documentation
- `contract.json` - Public interface definition
- `dependencies.json` - List of dependencies

### Naming Conventions

- Module names: `kebab-case` (e.g., `pricing-engine`)
- File names: `camelCase.ts` or `kebab-case.ts`
- Exports: Named exports only (no default exports)

## Connection Rules

### Creating Connections

1. Define interface in both modules
2. Create connection contract in `.cerber/connections/contracts/`
3. Version the contract (semver)
4. Document breaking changes

### Connection Contract Template

```json
{
  "id": "module-a-to-module-b",
  "from": "module-a",
  "to": "module-b",
  "type": "function-call",
  "interface": { ... },
  "version": "1.0.0",
  "breaking_changes": []
}
```

### Breaking Changes

When making breaking changes:
1. Increment major version
2. Add to `breaking_changes` array
3. Update both modules
4. Notify team in PR description

## Validation Rules

### Before Commit

```bash
# Validate module
bash team/scripts/cerber-module-check.sh <module-name>

# Validate all connections
bash team/scripts/cerber-connections-check.sh

# Guardian validates architecture
git commit
```

### Before PR

1. All modules pass validation
2. All connections valid
3. CERBER.md updated
4. FOCUS_CONTEXT.md generated
5. Tests pass
6. Guardian pre-commit passed

## Workflow

### Daily Start

```bash
npm run cerber:morning
# or
bash team/scripts/cerber-team-morning.sh
```

### Working on Module

```bash
# 1. Enter focus mode
bash team/scripts/cerber-focus.sh pricing-engine

# 2. Work on module (share FOCUS_CONTEXT.md with AI)

# 3. Validate changes
bash team/scripts/cerber-module-check.sh pricing-engine

# 4. Commit (Guardian validates)
git commit -m "feat(pricing-engine): add seasonal pricing"
```

### Adding Module

```bash
# 1. Create module
bash team/scripts/cerber-add-module.sh payment-gateway

# 2. Edit MODULE.md, contract.json, dependencies.json

# 3. Enter focus mode
bash team/scripts/cerber-focus.sh payment-gateway

# 4. Implement module

# 5. Validate
bash team/scripts/cerber-module-check.sh payment-gateway
```

## Forbidden Practices

❌ **DO NOT:**
- Import directly from another module's internals
- Skip module validation before committing
- Modify MODULE.md without updating contract.json
- Create modules without using `cerber-add-module.sh`
- Make breaking changes without versioning
- Work on entire codebase when you could use focus mode

✅ **DO:**
- Use focus mode for every module
- Validate before committing
- Document all public interfaces
- Version connection contracts
- Update CERBER.md with changes
- Follow module boundaries strictly

## Integration with Guardian + Cerber

Cerber TEAM works alongside existing tools:

```
Morning:
  bash team/scripts/cerber-team-morning.sh  (TEAM)
  
Development:
  bash team/scripts/cerber-focus.sh <module>  (TEAM)
  git commit                                  (Guardian validates)
  
Pre-push:
  npm run cerber:pre-push                     (SOLO checks)
  
Deploy:
  curl /api/health                           (Cerber 2.1 validates)
```

## Enforcement

- **Guardian**: Pre-commit validation of architecture
- **Module Check**: Validates module compliance
- **Connection Check**: Validates contracts
- **Code Review**: Human review of module boundaries
- **CI/CD**: Automated validation on PR

## Exceptions

When you need to break the rules:
1. Document reason in MODULE.md
2. Add `ARCHITECT_APPROVED:` comment in code
3. Create issue to fix properly
4. Notify team in PR

## Contact

Questions? Contact Stefan Pitek or see [docs/TEAM.md](../../docs/TEAM.md)
