# AGENTS.md — CERBER CORE: RULES (ONE TRUTH)

**Version:** 2.0  
**Last Updated:** 2026-01-09  
**Purpose:** Canonical instructions for AI agents, developers, and CI bots working on Cerber.

---

## 0) Non-negotiables

### 1) ONE TRUTH
- **Contract:** `.cerber/contract.yml` (canonical configuration)
- **Spec:** `CERBER.md` (canonical behavior documentation)
- **Output:** Deterministic JSON (canonical schema)

**Rule:** If contract says X, and code does Y, the code is wrong.

### 2) NO REINVENTING
- Cerber does **NOT** re-implement deep semantic lint/security if a mature tool exists.
- Cerber **orchestrates** tools + normalizes output + applies profiles/gating.
- **Example:**
  - ✅ Cerber runs `actionlint` and parses output
  - ❌ Cerber re-implements GitHub Actions YAML parsing

### 3) Determinism
- Deterministic core output **MUST** be stable across runs for same inputs.
- **No required timestamps** in deterministic core.
- Violations sorted by: `path`, `line`, `column`, `id`, `source`.
- **Test:** Same input → byte-identical JSON (except optional metadata).

### 4) Tests-first gate
- Any behavior change requires tests (unit OR fixture OR e2e snapshot).
- CI must stay green. No "drive-by refactors".
- **Rule:** If tests don't exist for behavior X, behavior X doesn't exist.

### 5) Backward compatibility
- Keep v1 CLI working unless `MIGRATION.md` exists and major bump is planned.
- Contract versioning: `contractVersion: 1` → `contractVersion: 2` requires migration guide.

---

## 1) Adapter Rules

### Required Interface
Every adapter **MUST** implement:

```typescript
interface Adapter {
  name: string;
  
  // Detection
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string | null>;
  getInstallHint(): string;
  
  // Execution
  run(options: RunOptions): Promise<AdapterResult>;
  
  // Parsing
  parseOutput(rawOutput: string): Violation[];
}
```

### Adapter Testing Rules

**CRITICAL:** Adapters MUST NOT require tool installation for unit tests.

1. **Unit tests:** Feed `parseOutput()` with **fixtures**
   - Fixtures stored in `fixtures/tool-outputs/<tool>/<case>.*`
   - Example: `fixtures/tool-outputs/actionlint/syntax-error.txt`
   - Test: `expect(adapter.parseOutput(fixture)).toMatchSnapshot()`

2. **Integration tests:** Optional (skip if tool not installed)
   ```typescript
   it.skipIf(!await adapter.isInstalled())('runs real tool', async () => {
     // ...
   });
   ```

3. **CI:** Installs tools in controlled way (see Installation Rules)

### Parsing Rules

- **Never assume tool output format.** Use documented formats only.
- If tool has JSON mode: use it and document which version requires it.
- If tool has template mode: provide template and document it.
- If tool has only text mode: parse with well-tested regex + fixtures.

**Example (actionlint):**
```typescript
// ❌ WRONG: Assume JSON exists
const json = JSON.parse(stdout);

// ✅ CORRECT: Use template or parse text
const template = '{{json .}}';  // Document this!
const output = await execa('actionlint', ['-format', template]);
```

---

## 2) Tool Installation Rules

### Platform-specific Installation

**NEVER assume one package manager for all platforms.**

| Platform | Priority Order |
|----------|---------------|
| macOS | 1. Homebrew 2. Download binary 3. Go install |
| Linux (Ubuntu) | 1. Download binary 2. apt (if packaged) 3. Go install |
| Windows | 1. Chocolatey 2. Scoop 3. Download binary |

### CI Installation Strategy

**GitHub Actions (ubuntu-latest):**
```yaml
# ❌ WRONG: Assume brew
- run: brew install actionlint

# ✅ CORRECT: Download release binary
- name: Install actionlint
  run: |
    curl -sL https://github.com/rhysd/actionlint/releases/download/v1.6.27/actionlint_1.6.27_linux_amd64.tar.gz | tar xz
    sudo mv actionlint /usr/local/bin/
```

### Auto-install Strategy

```typescript
// Priority order:
1. Tool in PATH → use system tool
2. Tool in ~/.cerber/tools/ → use cached
3. Auto-install flag → download to cache
4. No auto-install → show installHint
```

**Rule:** Never fail hard if tool missing in local dev. Show hint and continue with other tools.

---

## 3) Contract Structure Rules

### Separation: Tools vs Rules

**CRITICAL:** Don't mix tool configuration with Cerber rules.

```yaml
# ✅ CORRECT STRUCTURE
contractVersion: 1

# Tool execution config
tools:
  actionlint:
    enabled: true
    version: '1.6.27'  # Pin version
    args: ['-ignore', 'SC2086']  # Tool-specific args
  
  zizmor:
    enabled: true
    version: 'latest'

# Cerber rules (gating, severity mapping)
rules:
  github-actions:
    severity: error
    gate: true  # Fail CI if violated
  
  secrets:
    severity: warning
    gate: false  # Don't fail, just warn

# Profiles
profiles:
  solo:
    tools: [actionlint, gitleaks]
    failOn: [error]
  
  team:
    tools: [actionlint, zizmor, gitleaks]
    failOn: [error, warning]
```

### Violation Source

Every violation **MUST** have `source`:

```json
{
  "id": "action-syntax-error",
  "source": "actionlint",  // Tool name OR "cerber-core"
  "message": "...",
  "severity": "error"
}
```

---

## 4) Output Schema Rules

### Determinism Requirements

**CRITICAL:** Core output must be deterministic.

```json
{
  "contractVersion": 1,
  "deterministic": true,
  
  "summary": {
    "total": 5,
    "errors": 2,
    "warnings": 3
  },
  
  "violations": [
    // Sorted by: path, line, column, id, source
  ],
  
  "metadata": {
    "tools": {
      "actionlint": { "version": "1.6.27", "exitCode": 1 }
      // Sorted by key
    }
    // ❌ NO TIMESTAMP HERE (breaks determinism)
  },
  
  "runMetadata": {
    // ✅ Optional metadata (not part of deterministic core)
    "generatedAt": "2026-01-09T12:00:00Z",
    "executionTime": 1234,
    "cwd": "/path/to/repo"
  }
}
```

### Timestamp Rule

- **Deterministic core:** NO required timestamp
- **Optional metadata:** `runMetadata.generatedAt` is OK (but optional)
- **Test:** `deepEqual(run1.summary, run2.summary)` must pass

### Sorting Rule

All arrays in deterministic output **MUST** be sorted:

```typescript
violations.sort((a, b) => {
  if (a.path !== b.path) return a.path.localeCompare(b.path);
  if (a.line !== b.line) return a.line - b.line;
  if (a.column !== b.column) return a.column - b.column;
  if (a.id !== b.id) return a.id.localeCompare(b.id);
  return a.source.localeCompare(b.source);
});
```

---

## 5) Profile Rules

Profiles decide:

1. **Which tools run** (pre-commit → fast tools only)
2. **Which severities fail CI** (team → fail on warnings, solo → only errors)
3. **Time budget** (pre-commit < 5s, full scan unlimited)

### Built-in Profiles

```yaml
profiles:
  solo:
    description: Fast checks for solo dev
    tools: [actionlint]
    failOn: [error]
    timeout: 5000  # 5s
  
  dev:
    description: Pre-commit checks
    tools: [actionlint, gitleaks-staged]
    failOn: [error]
    timeout: 10000  # 10s
  
  team:
    description: Full CI checks
    tools: [actionlint, zizmor, gitleaks, hadolint]
    failOn: [error, warning]
    timeout: 60000  # 60s
```

### Profile Selection

```bash
# Explicit
cerber validate --profile=team

# Auto-detect from contract
cerber validate  # Uses contract.activeProfile

# Pre-commit (always fast)
cerber guard  # Uses dev profile
```

---

## 6) Exit Code Rules

Cerber **MUST** use consistent exit codes:

| Code | Meaning | When |
|------|---------|------|
| 0 | Success | No violations OR all below threshold |
| 1 | Validation failed | Violations above threshold |
| 2 | Configuration error | Invalid contract, missing required field |
| 3 | Tool error | Tool not found, tool crashed, timeout |

**Example:**
```typescript
if (hasConfigError) process.exit(2);
if (hasToolError && !options.continueOnError) process.exit(3);
if (hasBlockingViolations) process.exit(1);
process.exit(0);
```

---

## 7) Definition of Done (per PR)

Before merging, verify:

- [ ] Tests updated/added (unit OR fixture OR e2e)
- [ ] Docs updated if behavior changes (`CERBER.md`)
- [ ] Output schema unchanged OR versioned
- [ ] Deterministic ordering verified by snapshot test
- [ ] Windows compatibility preserved (`execa`, path handling with `/`)
- [ ] No drive-by refactors (one PR = one atomic change)
- [ ] CI green on all platforms (ubuntu, windows, macos)

---

## 8) Format Support Rules

### Required Formats

- `--format=text` (human-readable, default)
- `--format=json` (machine-readable, deterministic)

### Future Formats

- `--format=sarif` (GitHub Code Scanning integration)
- `--format=github` (GitHub Actions annotations)

### Implementation

```typescript
interface Reporter {
  format: 'text' | 'json' | 'sarif' | 'github';
  report(result: ValidationResult): string;
}
```

**Rule:** Tool adapters that support SARIF (e.g., zizmor) should expose it.

---

## 9) Orchestrator Rules

### Timeout per Tool

```typescript
const result = await adapter.run({
  timeout: profile.timeout || 30000,  // 30s default
  reject: false  // Don't throw, return error in result
});
```

### Concurrency Limit

```typescript
// Run tools in parallel, but limit concurrency
const results = await pLimit(3)(tools.map(tool => runTool(tool)));
```

### Graceful Degradation

```typescript
if (!await adapter.isInstalled()) {
  console.warn(`⚠️  ${adapter.name} not installed, skipping`);
  metadata.tools[adapter.name] = { status: 'skipped', reason: 'not-installed' };
  continue;  // Don't crash, continue with other tools
}
```

---

## 10) Windows Compatibility Rules

### Path Handling

```typescript
// ❌ WRONG: Hardcoded /
const file = basePath + '/.github/workflows/ci.yml';

// ✅ CORRECT: Use path.join
const file = path.join(basePath, '.github', 'workflows', 'ci.yml');
```

### Command Execution

```typescript
// ❌ WRONG: Shell-specific syntax
await execa('which', ['actionlint']);

// ✅ CORRECT: Cross-platform
const { stdout } = await execa('actionlint', ['--version'], { reject: false });
```

---

## 11) Version Compatibility

### Semver Comparison

```typescript
function isVersionCompatible(installed: string, minimum: string): boolean {
  const [iMajor, iMinor, iPatch] = installed.split('.').map(Number);
  const [mMajor, mMinor, mPatch] = minimum.split('.').map(Number);
  
  // Major version must match (except 0.x)
  if (iMajor !== mMajor && mMajor !== 0) return false;
  
  // Compare minor.patch
  if (iMinor > mMinor) return true;
  if (iMinor < mMinor) return false;
  return iPatch >= mPatch;
}
```

---

## Summary: The Golden Rules

1. **ONE TRUTH:** Contract = source of truth
2. **NO REINVENTING:** Orchestrate, don't reimplement
3. **DETERMINISTIC:** Same input → same output
4. **TESTS FIRST:** No behavior without tests
5. **FIXTURES:** Adapters test on fixtures, not real tools
6. **GRACEFUL:** Tool missing → warn and continue
7. **CROSS-PLATFORM:** Windows is first-class citizen
8. **EXIT CODES:** 0/1/2/3 consistently

---

**If in doubt, ask:** "Does this follow ONE TRUTH?"

If answer is no → it's wrong.
