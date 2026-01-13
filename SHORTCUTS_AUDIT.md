# MVP SHORTCUTS AUDIT & PHASE 2 FIXES

**Date:** January 13, 2026  
**Status:** Identified 10 shortcuts, planning Phase 2 remediation  

---

## SHORTCUTS IDENTIFIED (10 TOTAL)

### 1. Missing Error Boundary & Logging ⚠️

**Location:** `src/cli/doctor.ts` line 79  
**Current Code:**
```typescript
try {
  const parseResult = await parseCerberContract(cwd);
  // ...
} catch (e) {
  // Ignore parse errors
}
```

**Issue:** Silently ignoring parsing errors loses diagnostic information  
**Professional Approach:** Log error, retry if transient, provide user feedback  
**Phase 2 Fix:** 
- Add structured logging integration
- Implement retry logic for transient errors
- Report detailed parse errors to user
- Track error metrics

**Effort:** 1h  
**Priority:** HIGH

---

### 2. Hardcoded Tool Configuration ⚠️

**Location:** `src/cli/doctor.ts` lines 50-58  
**Current Code:**
```typescript
const tools: Record<string, { command: string; versionFlag: string; installCmd: string }> = {
  actionlint: { /* ... */ },
  zizmor: { /* ... */ },
  gitleaks: { /* ... */ }
};
```

**Issue:** Tools hardcoded, not extensible for future tools or custom plugins  
**Professional Approach:** Config-driven, plugin system for custom tools  
**Phase 2 Fix:**
- Create `src/config/tools-config.yml` with tool definitions
- Implement tool loader with schema validation
- Support plugin registration mechanism
- Allow user overrides via `.cerber/tools-config.yml`

**Effort:** 2h  
**Priority:** HIGH

---

### 3. Missing Retry & Resilience in Guardian ⚠️

**Location:** `src/cli/guardian.ts` lines 66-77  
**Current Code:**
```typescript
try {
  execSync(`actionlint ${workflowFiles.join(' ')}`, {
    cwd,
    stdio: 'pipe'
  });
  // ...
} catch (e: any) {
  exitCode = 1;
}
```

**Issue:** No retry logic when tool fails temporarily, no resilience coordination  
**Professional Approach:** Use ResilientExecutionStrategy from MVP-2  
**Phase 2 Fix:**
- Integrate with Orchestrator's execution strategy
- Add exponential backoff for transient failures
- Implement circuit breaker for cascading failures
- Support fallback strategies

**Effort:** 2.5h  
**Priority:** HIGH

---

### 4. Unstructured Stderr Handling ⚠️

**Location:** `src/cli/guardian.ts` line 71  
**Current Code:**
```typescript
execSync(`actionlint ${workflowFiles.join(' ')}`, {
  cwd,
  stdio: 'pipe'  // Loses stderr
});
```

**Issue:** stderr captured but not parsed, no structured error reporting  
**Professional Approach:** Capture + parse + log structured + report  
**Phase 2 Fix:**
- Implement tool output parsers
- Capture stderr separately
- Validate output against schema
- Provide structured error details to user

**Effort:** 1.5h  
**Priority:** MEDIUM

---

### 5. No Timeout Configuration ⚠️

**Location:** `src/cli/doctor.ts` line 66, `src/cli/guardian.ts` line 70  
**Current Code:**
```typescript
execSync(`${toolConfig.command} ${toolConfig.versionFlag}`, {
  stdio: 'pipe',
  timeout: 5000  // Hardcoded
});
```

**Issue:** Hardcoded timeout, no graceful degradation, no user configuration  
**Professional Approach:** Config-driven timeouts, graceful fallback  
**Phase 2 Fix:**
- Load timeouts from contract/config
- Add per-tool timeout settings
- Implement graceful timeout handling
- Report timeout separately from other errors
- Support skip-on-timeout mode

**Effort:** 1h  
**Priority:** MEDIUM

---

### 6. Unrealistic Test Mocks ⚠️

**Location:** `test/cli/doctor.test.ts`, `test/cli/guardian.test.ts`  
**Current Issue:** Tests assume all tools are installed, don't mock tool failures  
**Professional Approach:** Comprehensive mocking, test both success and failure paths  
**Phase 2 Fix:**
- Create tool mock factory with configurable states
- Test scenarios:
  - Tool not installed
  - Tool timeout
  - Tool returns invalid output
  - Tool returns permission error
  - Tool crashes
- Mock execSync behavior per scenario
- Validate test coverage for failure paths

**Effort:** 2.5h  
**Priority:** HIGH

---

### 7. Zero Observability Integration ⚠️

**Location:** Both `doctor.ts` and `guardian.ts`  
**Current Issue:** No logging, metrics, or tracing - black box execution  
**Professional Approach:** Structured logging + metrics collection + distributed tracing  
**Phase 2 Fix:**
- Integrate with Logger from MVP-2 infrastructure
- Add metrics collection:
  - Execution duration (P50/P95/P99)
  - Tool detection success rate
  - Error counts by type
  - Cache hit rates
- Add execution context/span IDs
- Log at appropriate levels (info/warn/error/debug)
- Support JSON output for log aggregation

**Effort:** 3h  
**Priority:** HIGH

---

### 8. Loose Performance Benchmarking ⚠️

**Location:** `doctor.test.ts` line 181  
**Current Code:**
```typescript
it('should complete doctor check in less than 1 second', async () => {
  const start = Date.now();
  await runDoctor(tempDir);
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(1000);  // Very loose
});
```

**Issue:** Benchmark doesn't measure P99, no breakdown, too permissive  
**Professional Approach:** Detailed P50/P95/P99 metrics, per-component profiling  
**Phase 2 Fix:**
- Add performance profiler
- Measure and report:
  - P50/P95/P99 latency
  - Per-tool execution time
  - File I/O overhead
  - Contract parsing time
- Store baseline metrics
- Alert on regression (>5% slower)
- Document performance characteristics

**Effort:** 2h  
**Priority:** MEDIUM

---

### 9. Unsafe Process Output Parsing ⚠️

**Location:** `src/cli/doctor.ts` lines 72-75  
**Current Code:**
```typescript
const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+|\d+\.\d+)/);
const version = versionMatch ? versionMatch[1] : versionOutput.split('\n')[0];
```

**Issue:** Regex-based parsing unreliable, no validation, version format not verified  
**Professional Approach:** Tool-specific parsers with schema validation  
**Phase 2 Fix:**
- Create tool-specific output parsers
- Define version schema (SemVer validation)
- Implement parser tests for each tool
- Support version range queries
- Validate parsed output against schema
- Report parse errors clearly

**Effort:** 2h  
**Priority:** MEDIUM

---

### 10. Contract Format Ambiguity ⚠️

**Location:** `src/cli/doctor.ts` line 47 (CERBER.md) vs guardian logic  
**Current Issue:** Both `CERBER.md` and `.cerber/contract.yml` supported, confusing  
**Professional Approach:** Single source of truth, proper deprecation path  
**Phase 2 Fix:**
- Deprecate `CERBER.md`
- Migrate all logic to `.cerber/contract.yml`
- Add migration script for existing projects
- Add warning when old format detected
- Update all documentation
- Remove CERBER.md support in v2.1.0

**Effort:** 1.5h  
**Priority:** LOW (Phase 2)

---

## PHASE 2 IMPLEMENTATION PLAN

### Priority 1: Critical Path (Must fix before PR)
1. Add error boundary + logging (#1) - 1h
2. Implement tool config system (#2) - 2h
3. Integrate resilience (#3) - 2.5h
4. Structure error reporting (#4) - 1.5h
5. Improve test mocks (#6) - 2.5h
6. Add observability (#7) - 3h

**Subtotal:** 12.5h

### Priority 2: Quality (Nice to have before PR)
7. Performance profiling (#8) - 2h
8. Safe output parsing (#9) - 2h
9. Timeout configuration (#5) - 1h

**Subtotal:** 5h

### Priority 3: Deprecation (Phase 2 follow-up)
10. Contract format standardization (#10) - 1.5h

---

## EXECUTION CHECKLIST FOR PHASE 2

- [ ] Fix: Add structured logging to doctor + guardian
- [ ] Fix: Implement tool config loader with schema
- [ ] Fix: Integrate ResilientExecutionStrategy
- [ ] Fix: Parse + structure stderr output
- [ ] Fix: Comprehensive tool failure test scenarios
- [ ] Fix: Add Logger + metrics integration
- [ ] Fix: Implement performance profiling
- [ ] Fix: Add output parser with validation
- [ ] Fix: Make timeouts configurable
- [ ] Deprecate: Add CERBER.md deprecation warning
- [ ] Test: Run full suite with all fixes
- [ ] Performance: Verify <500ms for no-relevant-files case
- [ ] Performance: Verify doctor <1s with all checks

---

## METRICS BEFORE → AFTER

| Metric | Before (MVP) | After (Phase 2) | Target |
|--------|-------------|-----------------|--------|
| Error handling | Basic try-catch | Structured errors + recovery | 100% paths |
| Logging | None | Structured + traceable | P99 visible |
| Resilience | No retry | Exponential backoff | <5% flaky |
| Test coverage | Basic paths | All failure modes | >95% |
| Performance clarity | Single number | P50/P95/P99 breakdown | Per-tool |
| Configurability | Hardcoded | Config-driven | User override |

---

## NOTES

- MVP was "make it work fast" → Phase 2 is "make it robust"
- All shortcuts are recoverable, no architectural debt
- Tests will catch issues during Phase 2 implementation
- Performance targets remain unchanged
- No user-facing API changes needed
