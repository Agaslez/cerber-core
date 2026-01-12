## 🔍 TEST COVERAGE GAP ANALYSIS - Co nie jest testowane na tym etapie

**Data:** 12 Stycznia 2026
**Status:** V2.0.0 Core Review - Identyfikacja ryzyk produkcyjnych

---

## KATEGORIA 1: ORCHESTRATOR EXECUTION PATHS ⚠️

### GAP 1.1: Orchestrator.executeAdapters() z PRAWDZIWYMI adapterami
**Ryzyk:** WYSOKIE  
**Czemu:** Orchestrator jest testowany z MockAdapter, nie z PRAWDZIWYMI (ActionlintAdapter, GitleaksAdapter, ZizmorAdapter)

**Co powinno być testowane:**
```typescript
// MISSING: Test real adapter execution
it('should execute ALL 3 adapters in parallel and merge results', async () => {
  const orchestrator = new Orchestrator();
  
  // Create real workflow files
  const workflowFile = '.github/workflows/test.yml';
  fs.writeFileSync(workflowFile, 'name: Test\n...');
  
  // Execute with REAL adapters
  const result = await orchestrator.run({
    files: [workflowFile],
    profile: 'team', // Uses all 3 adapters
    tools: ['actionlint', 'gitleaks', 'zizmor'],
  });
  
  // Must have results from ALL 3
  expect(result.adapters).toHaveLength(3);
  expect(result.adapters.map(a => a.tool)).toContain('actionlint');
  expect(result.adapters.map(a => a.tool)).toContain('gitleaks');
  expect(result.adapters.map(a => a.tool)).toContain('zizmor');
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Mogą być problemy z paralelizmem (race conditions, shared state)

---

### GAP 1.2: Orchestrator timeout behavior
**Ryzyk:** WYSOKIE  
**Czemu:** Timeouty są deklarowane ale nie testowane w praktyce

**Co powinno być testowane:**
```typescript
it('should respect adapter timeout and mark as 124', async () => {
  // Mock adapter że hanging...
  orchestrator.register({
    name: 'slow-tool',
    factory: () => ({
      run: async () => {
        // Hang for longer than timeout
        await new Promise(resolve => setTimeout(resolve, 10000));
        return { ...result };
      }
    })
  });
  
  const result = await orchestrator.run({
    files: ['test.yml'],
    tools: ['slow-tool'],
    timeout: 100, // 100ms - będzie timeout
  });
  
  expect(result.adapters[0].exitCode).toBe(124); // Timeout exit code
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Timeouty mogą nie działać w CI, wiszą procesy

---

### GAP 1.3: Adapter registration override
**Ryzyk:** ŚREDNIE  
**Czemu:** Test sprawdza czy można zarejestrować custom adapter, ale nie sprawdza czy override Default wyłącza się prawidłowo

**Co powinno być testowane:**
```typescript
it('should allow overriding default adapter', async () => {
  const orchestrator = new Orchestrator();
  
  // Register custom gitleaks (zamiast default)
  orchestrator.register({
    name: 'gitleaks',
    displayName: 'Custom Gitleaks',
    enabled: true,
    factory: () => new CustomGitleaksAdapter(),
  });
  
  const adapter = orchestrator.getAdapter('gitleaks');
  expect(adapter).toBeInstanceOf(CustomGitleaksAdapter);
  expect(adapter).not.toBeInstanceOf(GitleaksAdapter);
});
```

**Obecny stan:** ✅ Yay, ten test ISTNIEJE
**Status:** OK

---

## KATEGORIA 2: PROFILE RESOLUTION EDGE CASES ⚠️

### GAP 2.1: Profile selection z environment variables
**Ryzyk:** ŚREDNIE  
**Czemu:** Profile może być wybierany z CERBER_PROFILE env var, ale to nie jest testowane

**Co powinno być testowane:**
```typescript
it('should resolve profile from CERBER_PROFILE env var', async () => {
  process.env.CERBER_PROFILE = 'dev';
  
  const resolver = new ProfileResolver(contract);
  const profile = resolver.resolve(undefined); // No CLI arg
  
  expect(profile.name).toBe('dev');
  
  delete process.env.CERBER_PROFILE;
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** CI might not work if profile is set via env var

---

### GAP 2.2: Profile hierarchy merge completeness
**Ryzyk:** WYSOKIE  
**Czemu:** Team > Dev > Solo hierarchy jest testowana ale czy WSZYSTKIE fields mergują?

**Co powinno być testowane:**
```typescript
it('should merge ALL fields from parent profile', async () => {
  const solo = { tools: ['actionlint'], timeout: 300, failOn: ['error'] };
  const dev = { ...solo, tools: ['actionlint', 'gitleaks'], timeout: 600 };
  const team = { ...dev, tools: ['actionlint', 'gitleaks', 'zizmor'] };
  
  // What if solo has field że dev nie ma?
  solo.customField = 'value';
  
  const merged = profileResolver.mergeProfiles([solo, dev]);
  
  // Should inherit customField from solo?
  expect(merged.customField).toBe('value');
});
```

**Obecny stan:** ⚠️ Partial - testuje tools, nie testuje arbitrary fields
**Konsekwencja:** Custom profile fields mogą nie mergować

---

### GAP 2.3: Invalid profile handling
**Ryzyk:** ŚREDNIE  
**Czemu:** Co się stanie jeśli profile w contract.yml ma syntax error?

**Co powinno być testowane:**
```typescript
it('should gracefully handle malformed profile', async () => {
  const badContract = {
    profiles: {
      dev: {
        tools: ['actionlint', 'gitleaks'],
        timeout: 'not-a-number', // INVALID
      }
    }
  };
  
  const resolver = new ProfileResolver(badContract);
  const profile = resolver.resolve('dev');
  
  // Should it throw? Coerce? Default?
  // Currently: UNDEFINED BEHAVIOR
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Unknown behavior on bad contract

---

## KATEGORIA 3: FILE DISCOVERY INTEGRATION ⚠️

### GAP 3.1: FileDiscovery z PRAWDZIWYM git repo
**Ryzyk:** BARDZO WYSOKIE  
**Czemu:** FileDiscovery testowana tylko na mock git output, nie na PRAWDZIWYM repo

**Co powinno być testowane:**
```typescript
it('should discover staged files in REAL git repo', async () => {
  // Create actual git repo
  const tempDir = createTempDir();
  execSync('git init', { cwd: tempDir });
  
  // Create workflow file
  const workflow = path.join(tempDir, '.github/workflows/ci.yml');
  fs.mkdirSync(path.dirname(workflow), { recursive: true });
  fs.writeFileSync(workflow, 'name: CI\n');
  
  // Stage it
  execSync('git add .github/workflows/ci.yml', { cwd: tempDir });
  
  // Discover
  const discovery = new FileDiscovery(tempDir);
  const files = await discovery.discover({ mode: 'staged' });
  
  expect(files).toContain(expect.stringContaining('ci.yml'));
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** getStagedFiles() mogą mieć bugi które nie ujawnią się na mockach

---

### GAP 3.2: FileDiscovery z detached HEAD (CI)
**Ryzyk:** WYSOKIE  
**Czemu:** W CI mogą być detached HEAD, ale to nie jest testowane

**Co powinno być testowane:**
```typescript
it('should handle detached HEAD in CI', async () => {
  const tempDir = createTempDir();
  execSync('git init', { cwd: tempDir });
  
  // Create commit
  fs.writeFileSync(path.join(tempDir, 'file.txt'), 'content');
  execSync('git add .', { cwd: tempDir });
  execSync('git commit -m "initial"', { cwd: tempDir });
  
  // Checkout specific commit (detached HEAD)
  const commitSha = execSync('git rev-parse HEAD', { cwd: tempDir }).toString().trim();
  execSync(`git checkout ${commitSha}`, { cwd: tempDir });
  
  // Should still work
  const discovery = new FileDiscovery(tempDir);
  const files = await discovery.discover({ mode: 'all' });
  
  expect(files.length).toBeGreaterThan(0);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** FileDiscovery može crashnąć na detached HEAD w CI

---

### GAP 3.3: FileDiscovery ze shallow clone (GitHub Actions)
**Ryzyk:** ŚREDNIE  
**Czemu:** GitHub Actions domyślnie robi shallow clone (depth=1), ale to nie jest testowane

**Co powinno być testowane:**
```typescript
it('should handle shallow clone (GitHub Actions default)', async () => {
  const tempDir = createTempDir();
  execSync('git init --depth=1', { cwd: tempDir });
  
  // getChangedFiles() potrzebuje merge-base...
  const discovery = new FileDiscovery(tempDir);
  const files = await discovery.discover({ mode: 'changed', baseBranch: 'main' });
  
  // Should not crash, should return [] or all files
  expect(Array.isArray(files)).toBe(true);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** getChangedFiles() może crashnąć na shallow clone

---

## KATEGORIA 4: ADAPTER OUTPUT HANDLING ⚠️

### GAP 4.1: Adapter że zwraca DUŻY output (1MB violations)
**Ryzyk:** ŚREDNIE  
**Czemu:** Testy używają małych datasetów (3-10 violations), co się stanie z 1000+?

**Co powinno być testowane:**
```typescript
it('should handle 1000+ violations without memory issues', async () => {
  // Generate 1000 violations
  const violations = Array.from({ length: 1000 }, (_, i) => ({
    id: `rule-${i}`,
    severity: 'error',
    message: `Violation ${i}`,
    path: `.github/workflows/file-${i % 10}.yml`,
    line: i,
    column: 0,
  }));
  
  const result = {
    tool: 'test',
    violations,
    exitCode: 1,
  };
  
  // Should sort deterministically?
  const sorted = orchestrator.sortViolations(violations);
  
  expect(sorted).toHaveLength(1000);
  // Check if still sorted correctly
  for (let i = 0; i < sorted.length - 1; i++) {
    const cmp = compareViolations(sorted[i], sorted[i + 1]);
    expect(cmp).toBeLessThanOrEqual(0);
  }
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Sorting O(n²) mogą być slow na dużych datasetach

---

### GAP 4.2: Adapter że zwraca invalid violations
**Ryzyk:** WYSOKIE  
**Czemu:** Adapter może zwrócić violation bez 'id', bez 'path', etc. Czy orchestrator to filtruje?

**Co powinno być testowane:**
```typescript
it('should filter out invalid violations from adapter', async () => {
  // Mock adapter zwraca invalid data
  const result = {
    tool: 'bad-tool',
    violations: [
      { id: 'rule1', message: 'msg1' }, // Missing required fields!
      { severity: 'error' }, // Missing id
      { id: 'rule3', severity: 'error', message: 'msg3' }, // Valid
    ],
  };
  
  const merged = orchestrator.mergeAdapterResults([result]);
  
  // Should keep only valid?
  expect(merged.violations).toHaveLength(1);
  expect(merged.violations[0].id).toBe('rule3');
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Invalid data może przejść do output

---

### GAP 4.3: Adapter ze special characters w violation message
**Ryzyk:** ŚREDNIE  
**Czemu:** Adapter może zwrócić violation z JSON special chars, unicode, null bytes

**Co powinno być testowane:**
```typescript
it('should sanitize violation messages', async () => {
  const violations = [
    { id: 'r1', message: 'Contains "quotes"', severity: 'error' },
    { id: 'r2', message: 'Unicode: 你好世界', severity: 'error' },
    { id: 'r3', message: 'Newline:\nhere', severity: 'error' },
    { id: 'r4', message: 'Null\x00byte', severity: 'error' },
  ];
  
  const result = orchestrator.formatViolations(violations);
  
  // JSON output should be valid
  expect(() => JSON.parse(result)).not.toThrow();
  
  // GitHub annotations should be valid
  expect(() => formatGitHub(violations)).not.toThrow();
});
```

**Obecny stan:** ⚠️ Partial - GitleaksAdapter testuje unicode ale nie special chars
**Konsekwencja:** Output może być invalid JSON

---

## KATEGORIA 5: SORTING & DETERMINISM ⚠️

### GAP 5.1: Sorting stability na dużych dataseach
**Ryzyk:** ŚREDNIE  
**Czemu:** Sorting testowana na 3-4 violations, nie na 1000+

**Co powinno być testowane:**
```typescript
it('should maintain stable sorting on 1000 violations', async () => {
  // Generate violations z dużo same (path, line, column)
  const violations = Array.from({ length: 100 }, (_, i) => ({
    id: `rule-${i}`,
    path: '.github/workflows/ci.yml',
    line: 10,
    column: 5,
    severity: 'error' as const,
    message: 'msg',
  }));
  
  // Sort 10x
  let sorted = violations;
  for (let i = 0; i < 10; i++) {
    sorted = orchestrator.sortViolations(sorted);
  }
  
  // Order should be stable (same order after each sort)
  const final1 = orchestrator.sortViolations(sorted);
  const final2 = orchestrator.sortViolations(final1);
  
  expect(final1.map(v => v.id)).toEqual(final2.map(v => v.id));
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Sorting mogą mieć non-deterministic behavior

---

### GAP 5.2: Sorting determinism across JSON serialization
**Ryzyk:** ŚREDNIE  
**Czemu:** Violations sortowane, ale czy JSON output zawsze identyczny?

**Co powinno być testowane:**
```typescript
it('should produce identical JSON hash for same violations', async () => {
  const violations = [...];
  const output1 = orchestrator.run({ violations });
  const output2 = orchestrator.run({ violations });
  
  const hash1 = crypto.createHash('sha256').update(JSON.stringify(output1)).digest('hex');
  const hash2 = crypto.createHash('sha256').update(JSON.stringify(output2)).digest('hex');
  
  expect(hash1).toBe(hash2);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Output może się różnić między runs

---

## KATEGORIA 6: ERROR HANDLING & RECOVERY ⚠️

### GAP 6.1: Orchestrator recovery gdy adapter crashes
**Ryzyk:** WYSOKIE  
**Czemu:** Jeśli 1 z 3 adapterów crashnie, czy system kontynuuje?

**Co powinno być testowane:**
```typescript
it('should continue when one adapter throws', async () => {
  orchestrator.register({
    name: 'crash-tool',
    factory: () => ({
      run: async () => {
        throw new Error('BOOM!');
      }
    })
  });
  
  const result = await orchestrator.run({
    files: ['test.yml'],
    tools: ['actionlint', 'crash-tool', 'zizmor'],
  });
  
  // Should have results from other 2 adapters
  expect(result.adapters).toHaveLength(3);
  expect(result.adapters[1].skipped).toBe(true);
  expect(result.adapters[1].skipReason).toContain('BOOM');
});
```

**Obecny stan:** ⚠️ Partial - test istnieje ale `reject: false` mogą nie pracować prawidłowo
**Konsekwencja:** Crash w jednym adaptersie może zablokować resztę

---

### GAP 6.2: FileDiscovery error handling (git not installed)
**Ryzyk:** WYSOKIE  
**Czemu:** Jeśli git nie zainstalowany, FileDiscovery powinna dać jasny error

**Co powinno być testowane:**
```typescript
it('should fail gracefully when git is not installed', async () => {
  // Mock process.exec że git not found
  const discovery = new FileDiscovery('/tmp');
  
  // Should throw helpful error, nie random error
  await expect(discovery.discover({ mode: 'staged' }))
    .rejects
    .toThrow(/git|not found/i);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Obscure error jeśli git missing

---

### GAP 6.3: Contract loading error handling
**Ryzyk:** WYSOKIE  
**Czemu:** ContractParser nie testuje WSZYSTKIE error cases

**Co powinno być testowane:**
```typescript
it('should handle missing contract file', async () => {
  const parser = new ContractParser();
  
  await expect(parser.parse('/nonexistent/contract.yml'))
    .rejects
    .toThrow(/not found|ENOENT/);
});

it('should handle invalid YAML in contract', async () => {
  fs.writeFileSync('.cerber/contract.yml', 'invalid: [ unclosed');
  
  const parser = new ContractParser();
  
  await expect(parser.parse('.cerber/contract.yml'))
    .rejects
    .toThrow(/YAML|syntax/);
});

it('should handle contract with missing required fields', async () => {
  fs.writeFileSync('.cerber/contract.yml', 'profiles: {}'); // Missing target!
  
  const parser = new ContractParser();
  
  await expect(parser.parse('.cerber/contract.yml'))
    .rejects
    .toThrow(/target|required/);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Unknown behavior na bad contract

---

## KATEGORIA 7: CONCURRENCY & RACE CONDITIONS ⚠️

### GAP 7.1: Parallel adapter execution race conditions
**Ryzyk:** BARDZO WYSOKIE  
**Czemu:** Orchestrator.executeAdapters() wykonuje adaptery paralelnie, ale czy shared state?

**Co powinno być testowane:**
```typescript
it('should safely execute 3 adapters in parallel', async () => {
  const orchestrator = new Orchestrator();
  
  // Run same orchestrator 10x w parallel
  const promises = Array.from({ length: 10 }, async () => {
    return orchestrator.run({
      files: ['test.yml'],
      tools: ['actionlint', 'gitleaks', 'zizmor'],
    });
  });
  
  const results = await Promise.all(promises);
  
  // All should succeed
  expect(results).toHaveLength(10);
  expect(results.every(r => r.summary)).toBe(true);
  
  // No corruption
  expect(results.every(r => Array.isArray(r.violations))).toBe(true);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Race conditions w parallel execution, shared cache issues

---

### GAP 7.2: AdapterFactory cache thread safety
**Ryzyk:** WYSOKIE  
**Czemu:** AdapterFactory.getAdapter() cachuje instances, ale czy thread-safe?

**Co powinno być testowane:**
```typescript
it('should safely cache adapters with concurrent access', async () => {
  const factory = new AdapterFactory();
  factory.register({
    name: 'test-adapter',
    factory: () => new TestAdapter(),
  });
  
  // Get adapter 100x concurrently
  const promises = Array.from({ length: 100 }, () => 
    factory.getAdapter('test-adapter')
  );
  
  const adapters = await Promise.all(promises);
  
  // Should all get same instance (cached)
  expect(new Set(adapters.map(a => a.id)).size).toBe(1);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Multiple instances zamiast singleton cache

---

## KATEGORIA 8: PATH HANDLING EDGE CASES ⚠️

### GAP 8.1: Windows UNC paths (\\\\server\\share)
**Ryzyk:** ŚREDNIE  
**Czemu:** PathNormalizer testuje D:\\ ale nie \\\\server\\share

**Co powinno być testowane:**
```typescript
it('should normalize UNC paths', () => {
  const input = '\\\\server\\share\\.github\\workflows\\ci.yml';
  const normalized = PathNormalizer.normalize(input);
  
  expect(normalized).toBe('//server/share/.github/workflows/ci.yml');
  expect(normalized).not.toContain('\\\\');
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** UNC paths mogą się nie normalizować prawidłowo

---

### GAP 8.2: Relative paths ze ..
**Ryzyk:** ŚREDNIE  
**Czemu:** Paths mogą zawierać .. co może być security issue

**Co powinno być testowane:**
```typescript
it('should resolve relative paths safely', () => {
  const input = '.github/../secret.yml'; // Should not allow traversal
  const normalized = PathNormalizer.normalize(input);
  
  // Should resolve to actual path, not keep ..
  expect(normalized).not.toContain('..');
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Potential path traversal vulnerability

---

### GAP 8.3: Symlinks handling
**Ryzyk:** ŚREDNIE  
**Czemu:** Git może zwrócić symlink path, ale FileDiscovery nie testuje tego

**Co powinno być testowane:**
```typescript
it('should handle symlinks in git output', async () => {
  const tempDir = createTempDir();
  execSync('git init', { cwd: tempDir });
  
  // Create symlink
  const workflow = path.join(tempDir, '.github/workflows/ci.yml');
  fs.mkdirSync(path.dirname(workflow), { recursive: true });
  fs.writeFileSync(workflow, 'name: CI\n');
  
  const link = path.join(tempDir, '.github/workflows/link.yml');
  fs.symlinkSync(workflow, link);
  
  execSync('git add .', { cwd: tempDir });
  
  const discovery = new FileDiscovery(tempDir);
  const files = await discovery.discover({ mode: 'staged' });
  
  // Should handle symlinks (resolve or skip?)
  expect(files.length).toBeGreaterThan(0);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Symlinks mogą być problematyczne

---

## KATEGORIA 9: OUTPUT FORMAT CORRECTNESS ⚠️

### GAP 9.1: GitHub annotations format validation
**Ryzyk:** ŚREDNIE  
**Czemu:** formatGitHub() jest testowana ale czy rzeczywiście GitHub je parsuje?

**Co powinno być testowane:**
```typescript
it('should produce GitHub-parseable annotations', () => {
  const violations = [
    {
      id: 'rule1',
      severity: 'error',
      message: 'Test error',
      path: '.github/workflows/ci.yml',
      line: 10,
      column: 5,
    }
  ];
  
  const output = formatGitHub(violations);
  
  // GitHub annotation format: ::error file=path,line=10,col=5::message
  expect(output).toMatch(/::error\s+file=.+?workflows\/ci\.yml,line=10,col=5::/);
  
  // Test że GitHub Actions będzie parsować to
  // (This would require actual GitHub Actions runner)
});
```

**Obecny stan:** ⚠️ Partial - format testowany ale nie z prawdziwym GitHub
**Konsekwencja:** Format mogą być invalid dla GitHub Actions

---

### GAP 9.2: JSON schema validation
**Ryzyk:** WYSOKIE  
**Czemu:** Output powinien pasować do output.schema.json ale testy tego nie sprawdzają

**Co powinno być testowane:**
```typescript
it('should validate output against JSON schema', async () => {
  const result = await orchestrator.run({
    files: ['test.yml'],
    tools: ['actionlint'],
  });
  
  const schema = JSON.parse(fs.readFileSync('src/.cerber/output.schema.json', 'utf8'));
  const validator = new Ajv().compile(schema);
  
  const valid = validator(result);
  
  if (!valid) {
    console.log('Schema errors:', validator.errors);
  }
  
  expect(valid).toBe(true);
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Output może nie pasować do schema

---

## KATEGORIA 10: PRODUCTION EDGE CASES ⚠️

### GAP 10.1: Very large workflow files (1MB+)
**Ryzyk:** ŚREDNIE  
**Czemu:** Adapter parser może się zawiesić na dużych plikach

**Co powinno być testowane:**
```typescript
it('should handle 1MB workflow file', async () => {
  // Create 1MB file
  const largeContent = 'on:\n' + 'jobs:\n  job_0:\n'.repeat(10000);
  fs.writeFileSync('.github/workflows/huge.yml', largeContent);
  
  const result = await orchestrator.run({
    files: ['.github/workflows/huge.yml'],
    tools: ['actionlint'],
  });
  
  expect(result).toBeDefined();
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Parser może timeout na dużych plikach

---

### GAP 10.2: Many files (1000+)
**Ryzyk:** ŚREDNIE  
**Czemu:** FileDiscovery z 1000+ files mogą być slow

**Co powinno być testowane:**
```typescript
it('should discover 1000+ files efficiently', async () => {
  // Create 100 workflow files
  for (let i = 0; i < 100; i++) {
    const dir = `.github/workflows/dir-${i}`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/workflow.yml`, 'name: Test\n');
  }
  
  const start = Date.now();
  const discovery = new FileDiscovery('.');
  const files = await discovery.discover({
    mode: 'all',
    globs: ['**/*.yml']
  });
  const duration = Date.now() - start;
  
  expect(files.length).toBeGreaterThan(90);
  expect(duration).toBeLessThan(1000); // Should be < 1s
});
```

**Obecny stan:** ❌ Nie ma tego testu
**Konsekwencja:** Performance mogą być bad na large repos

---

## 📊 PODSUMOWANIE GAPS

```
CRITICAL (Must fix before production):
- ❌ Orchestrator execute z PRAWDZIWYMI adapterami (race conditions)
- ❌ FileDiscovery real git repo (detached HEAD, shallow clone)
- ❌ Timeout behavior (adapter hanging)
- ❌ JSON schema validation
- ❌ Contract loading errors
- ❌ Adapter crash recovery

HIGH (Should fix):
- ❌ Profile env var resolution
- ❌ Profile field merging
- ❌ 1000+ violations handling (sorting performance)
- ❌ Special chars sanitization
- ❌ Parallel adapter race conditions
- ❌ UNC paths handling
- ⚠️  GitHub annotations real validation

MEDIUM (Nice to have):
- ❌ Path traversal security (..)
- ❌ Symlinks handling
- ❌ 1MB file handling
- ❌ 1000+ files performance

TOTAL GAPS: 22 critical/high tests missing
RISK LEVEL: MEDIUM-HIGH before fixing top 6
```

---

## 🎯 REKOMENDACJA

**Najpierw napraw TOP 6:**

1. **Orchestrator real adapter execution** (2-3h) 
   - Catch race conditions
   - Verify parallelism works

2. **FileDiscovery real git tests** (2h)
   - detached HEAD
   - shallow clone
   - symlinks

3. **Contract error handling** (2h)
   - Missing file
   - Invalid YAML
   - Missing fields

4. **Output schema validation** (1h)
   - Every run validates against schema

5. **Timeout enforcement** (1h)
   - Actually test timeout behavior

6. **Parallel execution safety** (1.5h)
   - Concurrent runs don't corrupt state

**Razem: ~9.5 godzin** do full production readiness

---

**Verdict:** V2.0 core jest SOLID ale brakuje testów na:
- **PRAWDZIWYCH adapterach działających razem**
- **PRAWDZIWYM git repo**
- **ERROR paths i edge cases**
- **PRODUCTION scenarios (large data, concurrency)**

Testy które ISTNIEJĄ są dobre, ale pokrywają happy path. Production testy muszą testować co się psuje.
