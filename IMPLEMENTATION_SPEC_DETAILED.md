# 📋 ACTIONABLE SPEC - 3 CELE (Implementation Checklist)

**Date**: 14.01.2026  
**Status**: Ready for Implementation  
**Complexity**: HIGH (multi-file changes)

---

## ⚠️ IMPORTANT

To jest zbyt duże zadanie na jednego agenta. Poniżej znajduje się **kompletna specyfikacja** do wdrożenia.

Mogę to zrobić w jednym z dwóch sposobów:

**Opcja A**: Ty robisz, ja pomagam (szybciej, bardziej kontroli)  
**Opcja B**: Ja robię plik po pliku (wolniej, ale komplety)

**RECOMMENDATION**: Opcja A - Ty decydujesz kierunek, ja execute.

---

## 🎯 CEL 1: CI GATES SEPARATION

### PROBLEM (teraz)
```
cerber-verification.yml:
├─ PR triggeruje: lint + build + WSZYSTKIE testy (E2E, signals, pack)
└─ Result: PR czeka 15+ minut, flaki mogą blokować

Branch Protection:
├─ Required checks: ALL (lint, build, test, pack, signals, e2e)
└─ Result: Nawet flakytest blokuje PR
```

### SOLUTION (target)
```
cerber-pr-fast.yml (PR trigger) - REQUIRED:
├─ lint-typecheck (2 min)
├─ build (1 min)
└─ test:fast (2 min) = unit tests only
Total: 5 minutes

cerber-main-heavy.yml (main push trigger) - OPTIONAL:
├─ All above (5 min)
├─ test:integration (3 min)
├─ test:e2e (5 min) = pack + install sandbox
├─ test:signals (2 min) = process signals
└─ test:real-git-ops (2 min)
Total: 17 minutes (only on main, not blocking PRs)

Branch Protection:
├─ Required: [lint, build, test-fast]
└─ Ignored: [integration, e2e, signals, pack]
```

### FILES TO CREATE/MODIFY

```
NEW:
  .github/workflows/cerber-pr-fast.yml

MODIFY:
  .github/workflows/cerber-verification.yml → rename to cerber-main-heavy.yml
  .github/branch-protection.json (update required checks)

DELETE (or keep as reference):
  Keep cerber-verification.yml? Or fully migrate? 
  RECOMMENDATION: Delete (rename is delete + create)
```

### SPEC: cerber-pr-fast.yml

```yaml
name: Cerber PR (Fast - Required Checks)

on:
  pull_request:
    branches: [main]

env:
  NODE_VERSION: 20

jobs:
  lint_and_typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }} }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint_and_typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }} }
      - run: npm ci
      - run: npm run build

  test_fast:
    name: Unit Tests (Fast)
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }} }
      - run: npm ci
      - run: npm run build  # Ensure dist/ fresh
      - run: npm run test:fast  # Only @fast tagged tests
        env:
          CERBER_TEST_MODE: '1'
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results-fast
          path: |
            test-results/
            coverage/

  cerber_doctor:
    name: Cerber Health Check
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: ${{ env.NODE_VERSION }} }
      - run: npm ci
      - run: npm run build
      - run: npx cerber doctor
```

### SPEC: cerber-main-heavy.yml (renamed from cerber-verification.yml)

```yaml
name: Cerber Main (Heavy - Comprehensive Tests)

on:
  push:
    branches: [main]
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * *'  # Nightly 2 AM UTC

env:
  NODE_VERSION: 20
  INIT_TIMEOUT_SECONDS: 90

jobs:
  # Fast jobs (same as PR) for quick feedback
  lint_and_typecheck: ...
  build: ...
  test_fast: ...

  # Heavy jobs (only on main)
  test_integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:integration
        env:
          CERBER_TEST_MODE: '1'

  test_e2e:
    name: E2E Tests (Pack + Install)
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
        timeout-minutes: 10
        env:
          CERBER_TEST_MODE: '1'

  test_signals:
    name: Signal Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:signals
        timeout-minutes: 5
        env:
          CERBER_TEST_MODE: '1'

  test_real_git_ops:
    name: Real Git Operations
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run test:integration  # This includes git ops
        env:
          CERBER_TEST_MODE: '1'

  # Drift check (FAST gate, runs on main)
  cerber_drift:
    name: Cerber Drift Check
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm run cerber:drift || true  # Warn but don't fail (for now)
```

### Branch Protection Config

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint & Type Check",
      "Build",
      "Unit Tests (Fast)",
      "Cerber Health Check"
    ]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  }
}
```

---

## 🎯 CEL 2: ONE TRUTH ARCHITECTURE

### PROBLEM (teraz)
```
Brak centralnego kontraktu:
├─ CERBER.md pisze człowiek
├─ .github/workflows/* pisze CI
├─ .github/CODEOWNERS pisze team
└─ Brak synchro → DRIFT!

Reality: Jeśli zmienisz workflow = CERBER.md jest stary
```

### SOLUTION (target)
```
.cerber/contract.yml (źródło prawdy)
└─ Zawiera: Gates, protected files, modes, rules
   
Wygenerowane artefakty:
├─ CERBER.md (z contract.yml)
├─ .github/workflows/*.yml (z contract.yml)
└─ .github/CODEOWNERS (z contract.yml)

Komenda: npm run cerber:generate
└─ Aktualizuje wszystkie artefakty z contract.yml

Komenda: npm run cerber:drift
└─ Failuje jeśli artefakty != contract.yml

Guardian blokuje ręczne edity wygenerowanych plików
└─ "Can't edit AUTO-GENERATED file. Use cerber:generate instead."
```

### FILES TO CREATE

```
NEW:
  .cerber/contract.yml          (YAML source of truth)
  src/cli/generator.ts          (cerber:generate implementation)
  src/cli/drift-checker.ts      (cerber:drift implementation)

MODIFY:
  src/cli/doctor.ts             (add drift reporting)
  src/cli/guardian.ts           (block edits to generated files)
  package.json                  (add cerber:generate and cerber:drift scripts)

AUTO-GENERATED (by generator):
  CERBER.md (sections: Gates, Protected, Rules)
  .github/workflows/cerber-*.yml
  .github/CODEOWNERS
  (all with "AUTO-GENERATED" header)
```

### SPEC: .cerber/contract.yml

```yaml
# Cerber Project Contract
# This is the single source of truth.
# All other files are generated from this contract.
# Run: npm run cerber:generate

version: 1.0
project:
  name: Cerber-Core
  description: CI Contract Guard for GitHub Actions

gates:
  fast:
    name: PR Checks (Fast)
    timeout_minutes: 5
    required_on_pr: true
    jobs:
      - lint_and_typecheck
      - build
      - test_fast
      - cerber_doctor

  heavy:
    name: Comprehensive (Main/Nightly)
    timeout_minutes: 20
    required_on_pr: false
    required_on_main: true
    jobs:
      - test_integration
      - test_e2e
      - test_signals
      - test_real_git_ops
      - cerber_drift

protected_files:
  - .cerber/contract.yml
  - package.json
  - src/cli/signals-test.ts
  - .github/workflows/*.yml

test_tags:
  fast:
    pattern: "@fast"
    timeout_seconds: 1
    description: Unit tests, deterministic
  
  integration:
    pattern: "@integration"
    timeout_seconds: 30
    description: Real git operations
  
  e2e:
    pattern: "@e2e"
    timeout_seconds: 300
    description: Pack + install from tarball
  
  signals:
    pattern: "@signals"
    timeout_seconds: 10
    description: Process signal handling

rules:
  - name: No untagged tests
    description: All tests must have @fast/@integration/@e2e/@signals tag
    
  - name: Auto-generated files immutable
    description: Files with "AUTO-GENERATED" header can't be edited manually
    
  - name: Contract is source of truth
    description: Never edit generated files. Update contract.yml instead.
```

### SPEC: src/cli/generator.ts (pseudo-code)

```typescript
// Generates CERBER.md + workflows from .cerber/contract.yml

export async function generateArtifacts(cwd: string): Promise<void> {
  const contract = await loadContract(cwd);
  
  // Generate CERBER.md
  const cerberMd = generateCerberMd(contract);
  await writeFile('CERBER.md', cerberMd);
  
  // Generate workflows
  const prFastWorkflow = generatePrFastWorkflow(contract);
  const mainHeavyWorkflow = generateMainHeavyWorkflow(contract);
  await writeFile('.github/workflows/cerber-pr-fast.yml', prFastWorkflow);
  await writeFile('.github/workflows/cerber-main-heavy.yml', mainHeavyWorkflow);
  
  // Generate CODEOWNERS (if team mode)
  if (contract.team?.enabled) {
    const codeowners = generateCodeowners(contract);
    await writeFile('.github/CODEOWNERS', codeowners);
  }
  
  // Add AUTO-GENERATED header to all
  for (const file of ['CERBER.md', '.github/workflows/...', '.github/CODEOWNERS']) {
    addHeader(file, 'AUTO-GENERATED BY CERBER — DO NOT EDIT');
  }
  
  console.log('✅ Generated artifacts from contract.yml');
}

function generateCerberMd(contract: Contract): string {
  return `
# Project Cerber

Auto-generated from \`.cerber/contract.yml\`

## Gates

${contract.gates.map(g => `### ${g.name}
- Jobs: ${g.jobs.join(', ')}
- Timeout: ${g.timeout_minutes}m
`).join('\n')}

## Protected Files

${contract.protected_files.map(f => `- \`${f}\``).join('\n')}

## Test Tags

${contract.test_tags.map(t => `### @${t.pattern}
- ${t.description}
`).join('\n')}

---
*Generated by Cerber. Do not edit manually. Run 'npm run cerber:generate' to update.*
`;
}

function generatePrFastWorkflow(contract: Contract): string {
  const fastGate = contract.gates.find(g => g.name.includes('Fast'));
  return `
name: Cerber PR (Fast - Required)

on:
  pull_request:
    branches: [main]

jobs:
${fastGate.jobs.map(job => `  ${job}:
    runs-on: ubuntu-latest
    # Job definition...
`).join('\n')}
`;
}

// Similar for generateMainHeavyWorkflow, generateCodeowners
```

### SPEC: src/cli/drift-checker.ts (pseudo-code)

```typescript
export async function checkDrift(cwd: string): Promise<DriftReport> {
  const contract = await loadContract(cwd);
  
  // Generate expected artifacts
  const expected = {
    cerber_md: generateCerberMd(contract),
    pr_fast_yml: generatePrFastWorkflow(contract),
    main_heavy_yml: generateMainHeavyWorkflow(contract),
  };
  
  // Read actual artifacts
  const actual = {
    cerber_md: await readFile('CERBER.md'),
    pr_fast_yml: await readFile('.github/workflows/cerber-pr-fast.yml'),
    main_heavy_yml: await readFile('.github/workflows/cerber-main-heavy.yml'),
  };
  
  // Compare
  const drifts: string[] = [];
  for (const [file, expectedContent] of Object.entries(expected)) {
    if (actualContent[file] !== expectedContent) {
      drifts.push(file);
    }
  }
  
  if (drifts.length > 0) {
    throw new Error(
      `Repo drifted from contract!\n\n` +
      `Changed files:\n${drifts.map(f => `  - ${f}`).join('\n')}\n\n` +
      `Fix with: npm run cerber:generate\n` +
      `Then commit changes.`
    );
  }
  
  return { success: true, message: 'No drift detected' };
}
```

### package.json scripts

```json
{
  "scripts": {
    "cerber:generate": "node bin/cerber-generate",
    "cerber:drift": "node bin/cerber-drift",
    "test:fast": "jest --testNamePattern '@fast' --passWithNoTests",
    "test:integration": "jest --testNamePattern '@integration' --passWithNoTests",
    "test:e2e": "jest --testNamePattern '@e2e' --passWithNoTests",
    "test:signals": "jest --testNamePattern '@signals' --passWithNoTests"
  }
}
```

---

## 🎯 CEL 3: TEST ORGANIZATION

### Problem (teraz)
```
test suite:
├─ 1630 tests
├─ No tagging
├─ All run together (some fast, some slow)
└─ Flaky tests block PRs
```

### Solution (target)
```
Each test file has tag:
  // @fast - unit tests, <1s each
  // @integration - real git ops, <30s
  // @e2e - pack/install, <300s
  // @signals - process signals, <10s

npm run test:fast → Only @fast (2 min)
npm run test:integration → Only @integration (3 min)
npm run test:e2e → Only @e2e (5 min)
npm run test:signals → Only @signals (2 min)

Jest config filters by tag pattern
```

### Implementation Steps

**Step 1**: Add tag comments to test files

```typescript
// test/unit/example.test.ts
/**
 * @fast - Unit test, deterministic
 */

describe('Example', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

**Step 2**: Update jest.config.cjs

```javascript
module.exports = {
  // ... existing config ...
  
  testNamePattern: process.env.TEST_PATTERN || '.*',
  // Usage: TEST_PATTERN='@fast' npm test
};
```

**Step 3**: Add npm scripts (package.json)

```json
{
  "test:fast": "TEST_PATTERN='@fast' npm test",
  "test:integration": "TEST_PATTERN='@integration' npm test",
  "test:e2e": "TEST_PATTERN='@e2e' npm test",
  "test:signals": "TEST_PATTERN='@signals' npm test"
}
```

**Step 4**: Tag all existing tests

Files to tag:
- `test/unit/*.test.ts` → `@fast`
- `test/integration/*.test.ts` → `@integration`
- `test/e2e/npm-pack*.test.ts` → `@e2e`
- `test/e2e/cli-signals.test.ts` → `@signals`

### Stabilization Rules

```typescript
// For flaky tests, add:

it('should do something', async () => {
  // Only in HEAVY (CI environment):
  const maxRetries = process.env.CI ? 1 : 0;
  const timeout = process.env.CI ? 10000 : 5000;
  
  jest.setTimeout(timeout);
  // test code
}, { timeout: 10000, retries: 1 });

// For spawn processes:
const proc = spawn(...);
// ALWAYS cleanup:
process.on('exit', () => {
  if (!proc.killed) proc.kill();
});
afterEach(() => {
  if (proc && !proc.killed) proc.kill('SIGTERM');
});
```

---

## 📊 DELIVERABLES SUMMARY

### Files to Create (NEW)
```
.github/workflows/cerber-pr-fast.yml
.cerber/contract.yml
src/cli/generator.ts
src/cli/drift-checker.ts
bin/cerber-generate (executable wrapper)
bin/cerber-drift (executable wrapper)
```

### Files to Modify
```
.github/workflows/cerber-verification.yml → rename to cerber-main-heavy.yml
src/cli/doctor.ts (add drift reporting)
src/cli/guardian.ts (protect generated files)
package.json (add scripts, update test config)
jest.config.cjs (add test tagging support)
All test files (add @tag comments)
```

### Files to Delete
```
cerber-verification.yml (if fully migrating to new structure)
```

---

## ✅ VALIDATION CHECKLIST

### Phase 1: CI Separation
- [ ] cerber-pr-fast.yml created and working
- [ ] cerber-main-heavy.yml created (renamed from verification)
- [ ] PR triggers fast workflow only (check Actions tab)
- [ ] Main push triggers heavy workflow (check Actions tab)
- [ ] PR has green checks (no heavy blocking)
- [ ] Heavy tests run only on main (or on workflow_dispatch)

### Phase 2: One Truth
- [ ] .cerber/contract.yml exists and valid YAML
- [ ] npm run cerber:generate works
- [ ] npm run cerber:drift works (should pass initially)
- [ ] Generated files have AUTO-GENERATED header
- [ ] Doctor reports drift correctly
- [ ] Guardian blocks manual edits to generated files
- [ ] After editing contract.yml + generate, drift check passes

### Phase 3: Test Organization
- [ ] All tests tagged with @fast/@integration/@e2e/@signals
- [ ] npm run test:fast runs (subset of tests)
- [ ] npm run test:integration runs (subset)
- [ ] npm run test:e2e runs (subset)
- [ ] npm run test:signals runs (subset)
- [ ] Full npm test still runs all
- [ ] Flaky tests have retry + timeout in HEAVY only

### Integration
- [ ] PR workflow runs test:fast (passes)
- [ ] Main workflow runs all test:* (passes)
- [ ] Nightly triggers all tests with extended timeout
- [ ] drift check is FAST gate (runs on main)
- [ ] No flaky test blocks PR

---

**Ready to implement?**

Option A: Do it yourself using this spec (I guide)  
Option B: I implement one piece at a time  

**Recommendation**: Start with CEL 1 (CI separation) - it's most impactful for immediate PR speedup.

