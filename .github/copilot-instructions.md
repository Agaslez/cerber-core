# Copilot Instructions — Cerber Core

**Primary Rule:** Follow `AGENTS.md`. If conflict: `AGENTS.md` wins.

---

## Core Principles

1. **Do not reimplement linters/security scanners** when mature tools exist.
   - ✅ Orchestrate actionlint, zizmor, gitleaks
   - ❌ Re-implement GitHub Actions parsing

2. **Keep deterministic output:** stable sorting, no required timestamps in core.
   - Sort violations by: path → line → column → id → source
   - Timestamps only in optional `runMetadata`

3. **Any behavior change requires tests and fixtures.**
   - Unit tests use fixtures from `fixtures/tool-outputs/<tool>/`
   - Integration tests skip if tool not installed

4. **No drive-by refactors.** One PR = one atomic change.
   - Focus on task at hand
   - Don't "fix" unrelated code

5. **Tests must pass without tools installed.**
   - Adapters test `parseOutput()` with fixtures
   - Real tool execution is optional integration test

---

## Quick Reference

### Output Schema
```json
{
  "deterministic": true,
  "summary": { "total": 5, "errors": 2, "warnings": 3 },
  "violations": [/* sorted */],
  "metadata": { "tools": {/* sorted */} },
  "runMetadata": { /* optional, can have timestamp */ }
}
```

### Exit Codes
- `0` = Success
- `1` = Validation failed (violations)
- `2` = Config error (invalid contract)
- `3` = Tool error (missing, crashed, timeout)

### Contract Structure
```yaml
tools:         # Tool configuration
  actionlint:
    enabled: true
    version: '1.6.27'

rules:         # Cerber rules
  github-actions:
    severity: error
    gate: true

profiles:      # Execution profiles
  team:
    tools: [actionlint, zizmor]
    failOn: [error, warning]
```

---

## Common Pitfalls to Avoid

❌ **Don't assume brew on Ubuntu CI**
✅ Download release binary or use apt if available

❌ **Don't put timestamps in deterministic core**
✅ Put them in `runMetadata` (optional)

❌ **Don't require tools for unit tests**
✅ Use fixtures from `fixtures/tool-outputs/`

❌ **Don't assume tool has JSON output**
✅ Check docs, use template mode if needed

❌ **Don't crash if tool missing**
✅ Warn and continue with other tools

---

**Full rules:** See `AGENTS.md` in repository root.
