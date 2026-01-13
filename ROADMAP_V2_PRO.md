# ⚠️ [ARCHIVED - SEE ONE_TRUTH_MVP.md]

**This document is outdated.** Refer to [ONE_TRUTH_MVP.md](../ONE_TRUTH_MVP.md) for current MVP roadmap.

---

# 🛡️ CERBER CORE V2.0 - ROADMAP (THEORETICAL - REFERENCE ONLY)

⚠️ **THIS IS DEPRECATED** - Use [ROADMAP_V2_ACTUAL.md](ROADMAP_V2_ACTUAL.md) instead!

---

## ⚠️ CRITICAL: READ ACTUAL ROADMAP FIRST

**Real status (January 12, 2026):**
- ✅ **60% V2.0 complete** (410h done, 110h remaining)
- ✅ **97% test pass rate** (1105/1140 passing)
- ✅ **Orchestrator FULLY IMPLEMENTED** (85% complete)
- ✅ **Profiles FULLY IMPLEMENTED** (90% complete)
- ✅ **Circuit breaker + Retry FULLY IMPLEMENTED** (85% complete)
- ⚠️ **State Machine NOT integrated** (exists but unused)
- ⚠️ **Guardian CLI incomplete** (30% - needs doctor + <2s)
- ❌ **Auto-install NOT done** (deferred to V2.1)
- ❌ **Persistence NOT done** (deferred to V2.1)

### DO NOT FOLLOW THIS DOCUMENT FOR ACTUAL WORK

**Why this is wrong:**
- Duplicates code that already exists
- Proposes 10 REFACTORs that are already done
- Suggests writing 234h of code when 110h remains
- Lists phases as not started when 60% is complete

### USE INSTEAD:
👉 **[ROADMAP_V2_ACTUAL.md](ROADMAP_V2_ACTUAL.md)** - Reality-based roadmap with:
- What's actually implemented (Orchestrator, Profiles, etc.)
- What actually needs to be done (State machine integration, Guardian CLI)
- Realistic 54-hour estimate to release
- Daily prioritized tasks

---

## 📚 HISTORICAL REFERENCE ONLY

**This document remains for historical context only. Everything below is from early planning phase and does not match current codebase.**

**Actual commitments that WERE implemented:**
- ✅ COMMIT 1: Schema alignment + contract version (DONE)
- ✅ COMMIT 2: Profile schemas + tools field (DONE)
- ✅ COMMIT 3: Cross-platform tool detection (DONE)
- ✅ COMMIT 4: Actionlint multi-format parser (DONE)
- ✅ COMMIT 5: Orchestrator engine + deterministic output (DONE)
- ✅ COMMIT 6: Per-rule override + gating (DONE)
- ✅ COMMIT 7: File discovery with fallbacks (DONE)
- ✅ COMMIT 8: Reporting (text, json, github) (DONE)
- ✅ COMMIT 9: CLI validate + doctor (PARTIAL - needs guardian <2s)
- ✅ COMMIT 10: Guardian pre-commit (PARTIAL - needs <2s benchmark)

**What was added beyond original roadmap:**
- ✅ Circuit breaker with TTL cleanup
- ✅ Retry strategies (exponential, linear, fibonacci)
- ✅ Strategy pattern for adapters
- ✅ Composition pattern in resilience
- ✅ Error classifier extraction
- ✅ Integration tests (Layer 3)
- ✅ E2E tests (Layer 4)
- ✅ State machine (not integrated)
- ✅ Observability stack (not fully integrated)

---

## 🔗 REFERENCE TO ORIGINAL CONTENT

Below is the original theoretical roadmap from January 12, 2026. **Do not use for actual work - reference only.**

---

## 📊 REALITY CHECK (January 12, 2026)

**Current State (v1.1.12 + Actual Audit):**
- ✅ 1108/1140 tests passing (97%)
- ✅ Orchestrator: 90% done (545 lines, SOLID-compliant)
- ✅ Profiles (solo/dev/team): 90% done (273 lines, hierarchy works)
- ⚠️ **Reliability patterns:** 100% written, 0% integrated (CODE NOT USED!)
- ❌ Tool auto-install: 0% (critical gap)
- ❌ State machine: 0% (enterprise feature missing)
- ❌ Guardian: 20% (legacy code, needs refactor)
- ❌ Phase 0 (AGENTS.md, schemas): 0%

**Architecture Rating: 7.2/10** (good foundation, known debt)

**Release Timeline:**
- MVP (Week 1-2): Jan 26 - Orchestrator + Profiles + Guardian refactored
- Full V2.0 (Week 2-3): Feb 2 - Add state machine + auto-install

---

## 🔴 CRITICAL ISSUES REQUIRING IMMEDIATE FIX

**1. RELIABILITY CODE NOT INTEGRATED (HIGH)**
- CircuitBreaker, Retry, Timeout all exist but Orchestrator doesn't use them
- Fix: 2-3 hours
- Required for MVP

**2. GUARDIAN NOT V2.0 READY (HIGH)**
- Still legacy code, missing ProfileResolver integration
- Fix: 3-4 hours
- Blocks Guardian launch

**3. TOOL AUTO-INSTALL NOT DONE (HIGH)**
- Version registry, download, cache missing
- Fix: 6-8 hours
- Needed for production use

**4. ERROR HANDLING DUPLICATED (MEDIUM)**
- Three different error handlers (DRY violation)
- Fix: 1 hour
- Prevents consistency

**5. STATE MACHINE MISSING (MEDIUM)**
- ExecutionContext, state tracking not implemented
- Fix: 8 hours
- Can defer to V2.1 if tight
- Enterprise requirement

**See ROADMAP_V2_REALITY.md for detailed breakdown and timeline.**

**Senior Code Review Findings (10 KRYTYCZNYCH problemów):**
1. ❌ **God Class** - resilience.ts robi 5 rzeczy (SRP violation)
2. ❌ **Code Duplication** - error classification w 2 miejscach (DRY violation)
3. ❌ **Tight Coupling** - Orchestrator → resilience direct import (DIP violation)
4. ❌ **Missing Integration Tests** - tylko unit tests, brak Layer 3/4
5. ⚠️ **CircuitBreaker SRP** - 15 private fields (statistics + state + window)
6. ⚠️ **Missing Adapter Pattern** - convertToLegacyResults as plain function
7. ⚠️ **No Strategy Pattern** - retry hardcoded (exponential only)
8. ℹ️ **No Factory Pattern** - manual component creation
9. ℹ️ **Memory Leak Risk** - CircuitBreakerRegistry never cleans up
10. ℹ️ **Missing ADR docs** - architectural decisions undocumented

**Kategorie:**
- ✅ **Functionality:** 9/10 - wszystko działa
- ⚠️ **Architecture:** 6.5/10 - SOLID violations, tight coupling
- ⚠️ **Testability:** 7/10 - unit tests OK, brak integration/E2E
- ✅ **Observability:** 10/10 - comprehensive logging + metrics
- ✅ **Security:** 9/10 - validation + sanitization

**REFACTORING REQUIRED:** 28-44h do osiągnięcia 9/10 architectural rating

---

## 🔧 P2 ARCHITECTURAL REFACTORING PLAN

**Cel:** Architectural rating 6.5/10 → 9/10 (SOLID + test layers)
**Zasada:** **NIGDY NA SKRÓTY** - każdy punkt z Definition of Done
**Status:** Ready for execution (punkt po punkcie)

### ✅ REFACTOR-1: Extract ErrorClassifier (CRITICAL)

**Problem:** Error classification duplicated in 2 places (resilience.ts:184-200 + Orchestrator.ts:237-249)
**Impact:** DRY violation, risk of inconsistency
**Effort:** 1-2 hours

**Definition of Done:**
- [ ] Create src/core/error-classifier.ts with ErrorClassifier class
- [ ] Move error classification logic from resilience.ts:184-200 to ErrorClassifier.classify()
- [ ] Remove duplicate logic from Orchestrator.ts:237-249
- [ ] Update Orchestrator.ts to use ErrorClassifier
- [ ] Update resilience.ts to use ErrorClassifier
- [ ] Add test/core/error-classifier.test.ts with 15+ test cases:
  - [ ] ENOENT → "Tool not found" (exitCode 127)
  - [ ] EACCES → "Permission denied" (exitCode 126)
  - [ ] ETIMEDOUT → "Execution timeout" (exitCode 124)
  - [ ] Validation errors → "Invalid input" (exitCode 1)
  - [ ] Unknown errors → "Unknown error" (exitCode 1)
  - [ ] Edge cases: null, undefined, empty message
- [ ] All existing tests pass (327+ tests)
- [ ] No regressions in Orchestrator tests (20/20)
- [ ] No regressions in resilience tests (12/14)
- [ ] grep_search confirms no duplicate logic remains
- [ ] Code review: Single source of truth verified
- [ ] Git commit: "refactor(error): Extract ErrorClassifier (eliminate duplication)"

**Success Criteria:**
- ✅ Zero code duplication
- ✅ 15+ new tests passing
- ✅ All existing tests passing
- ✅ Clear separation of concerns

---

### ✅ REFACTOR-2: Decompose resilience.ts God Class (CRITICAL)

**Problem:** resilience.ts does 5 things: execution, error handling, conversion, stats, coordination
**Impact:** SRP violation, hard to test, high coupling
**Effort:** 4-6 hours

**Definition of Done:**
- [ ] Create src/core/resilience/adapter-executor.ts
  - [ ] AdapterExecutor class with execute(adapter, options) method
  - [ ] Handles timeout wrapping only
  - [ ] Returns ResilientAdapterResult
- [ ] Create src/core/resilience/result-converter.ts
  - [ ] ResultConverter class (Adapter Pattern)
  - [ ] adapt(resilient: ResilientAdapterResult): AdapterResult method
  - [ ] Handles format conversion
- [ ] Create src/core/resilience/stats-computer.ts
  - [ ] StatsComputer class
  - [ ] compute(results: ResilientAdapterResult[]): PartialSuccessStats
  - [ ] Pure function, no side effects
- [ ] Create src/core/resilience/resilience-coordinator.ts
  - [ ] ResilienceCoordinator class (composition)
  - [ ] Uses: CircuitBreaker + retry() + AdapterExecutor + ErrorClassifier
  - [ ] executeResilient(adapter, options) method
  - [ ] executeResilientParallel(adapters, options) method
- [ ] Refactor src/core/resilience.ts to use composition:
  - [ ] Import and compose components
  - [ ] executeResilientAdapter() delegates to ResilienceCoordinator
  - [ ] convertToLegacyResults() delegates to ResultConverter
  - [ ] computePartialSuccessStats() delegates to StatsComputer
- [ ] Create test/core/resilience/adapter-executor.test.ts (8+ tests)
- [ ] Create test/core/resilience/result-converter.test.ts (6+ tests)
- [ ] Create test/core/resilience/stats-computer.test.ts (5+ tests)
- [ ] Create test/core/resilience/resilience-coordinator.test.ts (12+ tests)
- [ ] Update test/core/resilience.test.ts to test integration only
- [ ] All existing tests pass (327+ tests)
- [ ] grep_search "class.*{" in resilience/ confirms each class has one responsibility
- [ ] Code review: Verify SRP compliance for each class
- [ ] Git commit: "refactor(resilience): Decompose God class into composition"

**Success Criteria:**
- ✅ Each class has ONE responsibility
- ✅ 31+ new tests passing (8+6+5+12)
- ✅ All existing tests passing
- ✅ Clear component boundaries

---

### ✅ REFACTOR-3: Add AdapterExecutionStrategy (CRITICAL)

**Problem:** Orchestrator tightly coupled to resilience.ts via direct import
**Impact:** DIP violation, cannot swap strategies, no abstraction
**Effort:** 3-4 hours

**Definition of Done:**
- [ ] Create src/core/strategies/adapter-execution-strategy.ts
  - [ ] AdapterExecutionStrategy interface
  - [ ] executeParallel(adapters, options): Promise<AdapterResult[]>
  - [ ] executeSequential(adapters, options): Promise<AdapterResult[]>
- [ ] Create src/core/strategies/legacy-execution-strategy.ts
  - [ ] LegacyExecutionStrategy implements AdapterExecutionStrategy
  - [ ] Uses original Orchestrator logic (no resilience)
  - [ ] Handles errors as before
- [ ] Create src/core/strategies/resilient-execution-strategy.ts
  - [ ] ResilientExecutionStrategy implements AdapterExecutionStrategy
  - [ ] Uses ResilienceCoordinator from REFACTOR-2
  - [ ] Handles partial success
- [ ] Update src/core/Orchestrator.ts:
  - [ ] Remove direct import of resilience.ts
  - [ ] Add private strategy: AdapterExecutionStrategy field
  - [ ] Constructor accepts strategy (DI)
  - [ ] Default: LegacyExecutionStrategy (backward compatible)
  - [ ] runParallel() delegates to strategy.executeParallel()
  - [ ] runSequential() delegates to strategy.executeSequential()
  - [ ] Remove conditional `if (options.resilience)` logic
- [ ] Create test/core/strategies/legacy-execution-strategy.test.ts (10+ tests)
- [ ] Create test/core/strategies/resilient-execution-strategy.test.ts (12+ tests)
- [ ] Update test/core/Orchestrator.test.ts:
  - [ ] Test with LegacyExecutionStrategy (default)
  - [ ] Test with ResilientExecutionStrategy (opt-in)
  - [ ] Verify DI works correctly
- [ ] All existing tests pass (327+ tests)
- [ ] No regressions in Orchestrator tests (20/20)
- [ ] grep_search "import.*resilience" confirms Orchestrator no longer imports resilience
- [ ] Code review: Verify DIP compliance (high-level → abstraction ← low-level)
- [ ] Git commit: "refactor(orchestrator): Add AdapterExecutionStrategy (eliminate coupling)"

**Success Criteria:**
- ✅ Dependency Inversion Principle satisfied
- ✅ 22+ new tests passing (10+12)
- ✅ All existing tests passing
- ✅ Strategy swappable via DI

---

### ✅ REFACTOR-4: Add Integration Tests (CRITICAL)

**Problem:** Only unit tests exist, no Layer 3 (integration) or Layer 4 (E2E)
**Impact:** Cannot verify component interaction, metrics, logs
**Effort:** 6-8 hours

**Definition of Done:**
- [ ] Create test/integration/ directory
- [ ] Create test/integration/resilience-integration.test.ts:
  - [ ] Setup: Real CircuitBreaker + real retry + real timeout + real Orchestrator
  - [ ] Test: Circuit breaker opens after N failures
    - [ ] Verify 6th call is instant rejection (no delay)
    - [ ] Verify metrics: circuit_breaker_state=open
    - [ ] Verify logs contain "Circuit breaker opened"
  - [ ] Test: Retry waits exponentially
    - [ ] Track timestamps between attempts
    - [ ] Verify delay increases: attempt1→2: ~100ms, attempt2→3: ~200ms
    - [ ] Verify metrics: adapter_retry_count
  - [ ] Test: Timeout enforced
    - [ ] Adapter sleeps 5s, timeout=1s
    - [ ] Verify execution aborted at ~1s
    - [ ] Verify error: "Execution timeout"
  - [ ] Test: Partial success (A fails, B+C succeed)
    - [ ] 3 real adapters (mock implementations)
    - [ ] Adapter A throws, B+C return violations
    - [ ] Verify metadata: successfulAdapters=2, failedAdapters=1
    - [ ] Verify results contain violations from B+C only
  - [ ] Test: Circuit breaker half-open recovery
    - [ ] Open circuit, wait for timeout
    - [ ] Send probe request (success)
    - [ ] Verify circuit closes
    - [ ] Verify metrics: circuit_breaker_state=closed
  - [ ] Test: Metrics recorded correctly
    - [ ] Execute resilient adapter
    - [ ] Verify prom-client metrics exist:
      - [ ] adapter_execution_duration_seconds
      - [ ] circuit_breaker_state
      - [ ] adapter_retry_count
  - [ ] Test: Logs written correctly
    - [ ] Execute resilient adapter
    - [ ] Verify pino logs contain:
      - [ ] "Executing adapter with resilience"
      - [ ] "Circuit breaker state: CLOSED"
      - [ ] "Retry attempt X/Y"
- [ ] Create test/integration/orchestrator-integration.test.ts:
  - [ ] Test: Full workflow with 3 adapters
  - [ ] Test: Adapter timeout doesn't block others
  - [ ] Test: Partial success logged correctly
- [ ] Minimum 20+ integration tests total
- [ ] All integration tests pass
- [ ] All existing tests pass (327+ tests)
- [ ] Test coverage report shows integration coverage
- [ ] Code review: Verify tests use real components (no mocks with `as any`)
- [ ] Git commit: "test(integration): Add Layer 3 integration tests"

**Success Criteria:**
- ✅ 20+ integration tests passing
- ✅ Component interaction verified
- ✅ Metrics verification included
- ✅ Logs verification included
- ✅ No `as any` type casts

---

### ✅ REFACTOR-5: Refactor CircuitBreaker (MEDIUM)

**Problem:** CircuitBreaker has 15 private fields (state + stats + window management)
**Impact:** SRP violation, complex to test
**Effort:** 2-3 hours

**Definition of Done:**
- [ ] Create src/core/resilience/circuit-breaker-stats.ts
  - [ ] CircuitBreakerStats class
  - [ ] Fields: totalCalls, totalFailures, totalSuccesses, failures, successes, consecutiveSuccesses
  - [ ] Methods: recordSuccess(), recordFailure(), getStats(), reset()
- [ ] Create src/core/resilience/failure-window.ts
  - [ ] FailureWindow class
  - [ ] Fields: failureTimestamps (array), windowSize, maxSize
  - [ ] Methods: addFailure(timestamp), getFailuresInWindow(now, windowMs), cleanup()
- [ ] Refactor src/core/circuit-breaker.ts:
  - [ ] Remove 15 fields, keep only: state, lastStateChange, config
  - [ ] Add: private stats: CircuitBreakerStats
  - [ ] Add: private window: FailureWindow
  - [ ] Delegate statistics to stats.recordSuccess(), stats.recordFailure()
  - [ ] Delegate window management to window.addFailure(), window.getFailuresInWindow()
  - [ ] Update execute() to use delegation
  - [ ] Update getStats() to return stats.getStats()
- [ ] Create test/core/resilience/circuit-breaker-stats.test.ts (8+ tests)
- [ ] Create test/core/resilience/failure-window.test.ts (6+ tests)
- [ ] Update test/core/circuit-breaker.test.ts to verify delegation
- [ ] All existing tests pass (23/23 circuit breaker tests)
- [ ] All overall tests pass (327+ tests)
- [ ] Code review: Verify each class has single responsibility
- [ ] Git commit: "refactor(circuit-breaker): Extract Stats and FailureWindow"

**Success Criteria:**
- ✅ CircuitBreaker has 3 fields (not 15)
- ✅ 14+ new tests passing (8+6)
- ✅ All existing tests passing
- ✅ Clear delegation pattern

---

### ✅ REFACTOR-6: Add RetryStrategy Pattern (MEDIUM)

**Problem:** Retry logic hardcoded (exponential backoff only), cannot extend
**Impact:** OCP violation, inflexible
**Effort:** 3-4 hours

**Definition of Done:**
- [ ] Create src/core/strategies/retry-strategy.ts
  - [ ] RetryStrategy interface
  - [ ] shouldRetry(attempt: number, error: Error, maxRetries: number): boolean
  - [ ] getDelay(attempt: number, baseDelay: number, maxDelay: number): number
- [ ] Create src/core/strategies/exponential-backoff-strategy.ts
  - [ ] ExponentialBackoffStrategy implements RetryStrategy
  - [ ] shouldRetry() checks attempt < maxRetries
  - [ ] getDelay() returns Math.min(baseDelay * 2^attempt, maxDelay) + jitter
- [ ] Create src/core/strategies/linear-backoff-strategy.ts
  - [ ] LinearBackoffStrategy implements RetryStrategy
  - [ ] getDelay() returns baseDelay * attempt
- [ ] Create src/core/strategies/fibonacci-backoff-strategy.ts
  - [ ] FibonacciBackoffStrategy implements RetryStrategy
  - [ ] getDelay() returns fibonacci(attempt) * baseDelay
- [ ] Refactor src/core/retry.ts:
  - [ ] Add strategy: RetryStrategy parameter to retry() function
  - [ ] Default: new ExponentialBackoffStrategy() (backward compatible)
  - [ ] Remove hardcoded calculateDelay() logic
  - [ ] Use strategy.getDelay() instead
  - [ ] Use strategy.shouldRetry() instead of attempt check
- [ ] Create test/core/strategies/exponential-backoff-strategy.test.ts (6+ tests)
- [ ] Create test/core/strategies/linear-backoff-strategy.test.ts (5+ tests)
- [ ] Create test/core/strategies/fibonacci-backoff-strategy.test.ts (5+ tests)
- [ ] Update test/core/retry.test.ts to test with different strategies
- [ ] All existing tests pass (18/18 retry tests)
- [ ] All overall tests pass (327+ tests)
- [ ] Code review: Verify OCP compliance (new strategies without editing retry.ts)
- [ ] Git commit: "feat(retry): Add RetryStrategy pattern for flexibility"

**Success Criteria:**
- ✅ Strategy Pattern implemented
- ✅ 16+ new tests passing (6+5+5)
- ✅ All existing tests passing
- ✅ Easy to add new strategies (OCP)

---

### ✅ REFACTOR-7: Add E2E Tests (MEDIUM)

**Problem:** No Layer 4 (E2E) tests with full Orchestrator workflow
**Impact:** Cannot verify end-to-end functionality
**Effort:** 4-5 hours

**Definition of Done:**
- [ ] Create test/e2e/ directory
- [ ] Create test/e2e/full-workflow.test.ts:
  - [ ] Test: Full workflow with 3 real adapters
    - [ ] Setup: Orchestrator with ResilientExecutionStrategy
    - [ ] Adapters: eslint, prettier, actionlint (mock implementations)
    - [ ] Execute: runParallel()
    - [ ] Verify: All 3 adapters executed
    - [ ] Verify: Results merged correctly
    - [ ] Verify: Summary statistics correct
  - [ ] Test: Adapter timeout doesn't block others
    - [ ] Adapter A sleeps 10s (timeout 1s)
    - [ ] Adapters B+C fast (100ms)
    - [ ] Verify: B+C complete in ~100ms
    - [ ] Verify: A times out after 1s
    - [ ] Verify: Partial success metadata
  - [ ] Test: Circuit breaker prevents cascading failures
    - [ ] Adapter A always fails
    - [ ] Execute 10 times
    - [ ] Verify: First 5 execute, next 5 are instant rejections
    - [ ] Verify: Total time < 1s for last 5 (no retry overhead)
  - [ ] Test: Retry recovers from transient errors
    - [ ] Adapter A fails first 2 attempts, succeeds on 3rd
    - [ ] Verify: Final result is success
    - [ ] Verify: Retry count = 2
  - [ ] Test: Metrics recorded end-to-end
    - [ ] Execute full workflow
    - [ ] Query prom-client metrics
    - [ ] Verify all expected metrics exist
  - [ ] Test: Logs written end-to-end
    - [ ] Execute full workflow
    - [ ] Capture pino logs
    - [ ] Verify log sequence correct
- [ ] Minimum 10+ E2E tests total
- [ ] All E2E tests pass
- [ ] All existing tests pass (327+ tests)
- [ ] Code review: Verify tests use full stack (no shortcuts)
- [ ] Git commit: "test(e2e): Add Layer 4 end-to-end tests"

**Success Criteria:**
- ✅ 10+ E2E tests passing
- ✅ Full workflow verified
- ✅ No test shortcuts (real components only)

---

### ✅ REFACTOR-8: Add ResilienceFactory (LOW)

**Problem:** Manual component creation, no Factory Pattern
**Impact:** Hard to configure, error-prone
**Effort:** 1-2 hours

**Definition of Done:**
- [ ] Create src/core/resilience/resilience-factory.ts
  - [ ] ResilienceFactory class
  - [ ] createCircuitBreaker(options): CircuitBreaker
  - [ ] createRetryStrategy(type, options): RetryStrategy
  - [ ] createResilienceCoordinator(options): ResilienceCoordinator
  - [ ] Validates options
  - [ ] Applies defaults
- [ ] Update resilience.ts to use ResilienceFactory
- [ ] Create test/core/resilience/resilience-factory.test.ts (8+ tests)
- [ ] All existing tests pass (327+ tests)
- [ ] Code review: Verify Factory Pattern correct
- [ ] Git commit: "feat(resilience): Add ResilienceFactory for component creation"

**Success Criteria:**
- ✅ Factory Pattern implemented
- ✅ 8+ new tests passing
- ✅ All existing tests passing

---

### ✅ REFACTOR-9: Fix CircuitBreakerRegistry Memory Leak (LOW)

**Problem:** CircuitBreakerRegistry never cleans up breakers
**Impact:** Memory grows unbounded in long-running processes
**Effort:** 2-3 hours

**Definition of Done:**
- [ ] Add CircuitBreakerRegistry.cleanup() method
  - [ ] Removes breakers unused for > ttl (default 1h)
  - [ ] Tracks lastAccessTime for each breaker
- [ ] Add periodic cleanup timer (optional)
- [ ] Create test/core/circuit-breaker-registry.test.ts (6+ tests)
  - [ ] Test: Breakers cleaned up after TTL
  - [ ] Test: Active breakers not cleaned
  - [ ] Test: cleanup() can be called manually
- [ ] All existing tests pass (327+ tests)
- [ ] Code review: Verify memory leak fixed
- [ ] Git commit: "fix(circuit-breaker): Fix memory leak in registry"

**Success Criteria:**
- ✅ Memory leak fixed
- ✅ 6+ new tests passing
- ✅ All existing tests passing

---

### ✅ REFACTOR-10: Document ADRs (LOW)

**Problem:** Architectural decisions not documented
**Impact:** Hard to understand "why" behind design choices
**Effort:** 2-3 hours

**Definition of Done:**
- [ ] Create docs/adr/ directory
- [ ] Create docs/adr/001-circuit-breaker-pattern.md
- [ ] Create docs/adr/002-retry-strategy-pattern.md
- [ ] Create docs/adr/003-adapter-execution-strategy.md
- [ ] Create docs/adr/004-error-classification.md
- [ ] Create docs/adr/005-resilience-composition.md
- [ ] Each ADR includes:
  - [ ] Context (problem)
  - [ ] Decision (solution)
  - [ ] Consequences (tradeoffs)
  - [ ] Alternatives considered
- [ ] Update README.md to link to ADR docs
- [ ] Code review: Verify ADRs comprehensive
- [ ] Git commit: "docs(adr): Document architectural decisions"

**Success Criteria:**
- ✅ 5+ ADR documents
- ✅ Clear context + decision + consequences
- ✅ Linked from README

---

## 📊 REFACTORING PROGRESS TRACKING

**Total Effort:** 28-44 hours
**Total DoD Items:** 150+ individual checkboxes
**Target Rating:** 9/10 architectural

**Priority Breakdown:**
- **P1 CRITICAL** (4 issues): 14-20h
  - REFACTOR-1: 1-2h, 15+ tests
  - REFACTOR-2: 4-6h, 31+ tests
  - REFACTOR-3: 3-4h, 22+ tests
  - REFACTOR-4: 6-8h, 20+ tests
  
- **P2 MEDIUM** (3 issues): 9-13h
  - REFACTOR-5: 2-3h, 14+ tests
  - REFACTOR-6: 3-4h, 16+ tests
  - REFACTOR-7: 4-5h, 10+ tests
  
- **P3 LOW** (3 issues): 5-11h
  - REFACTOR-8: 1-2h, 8+ tests
  - REFACTOR-9: 2-3h, 6+ tests
  - REFACTOR-10: 2-3h, 5 docs

**Execution Rules:**
- ✅ **NIGDY NA SKRÓTY** - każdy checkbox musi być ✅
- ✅ Jeden REFACTOR = jeden commit
- ✅ Każdy commit mergeable standalone
- ✅ Wszystkie testy muszą przejść przed commitem
- ✅ Code review po każdym REFACTOR
- ✅ Definition of Done = 100% albo FAIL

---

**Czas naprawy:** ~40h senior dev work (3 tygodnie przy 2-3h/dzień)

---

## 🎯 PLAN: 10 COMMITÓW (Idealna Kolejność)

**Zasada:** Każdy commit = 1 PR, max 8h pracy, mergeable standalone.

---

### COMMIT 1 — "One Truth: naprawiamy spójność schematu vs output"

**Cel:** Koniec rozjazdów typu `contractVersion` vs `version`, `metadata.tools` array vs object.

**Zmiany:**

1. Ustal **jedną definicję CerberOutput**:
   ```typescript
   interface CerberOutput {
     schemaVersion: 1;           // Schema version
     contractVersion: 1;         // Contract version
     deterministic: true;
     summary: {
       total: number;
       errors: number;
       warnings: number;
       info: number;
     };
     violations: Violation[];
     metadata: {
       tools: Array<{           // ARRAY (prościej niż object)
         name: string;
         version: string;
         exitCode: number;
         skipped?: boolean;
         reason?: string;
       }>;
     };
     runMetadata?: {            // Opcjonalne
       generatedAt?: string;    // ISO 8601
       executionTime?: number;
       profile?: string;
     };
   }
   ```

2. Aktualizacja:
   - `.cerber/output.schema.json`
   - `src/reporting/types.ts`
   - `src/core/types.ts`

**Testy:**
- `output.schema.test.ts`: walidacja przykładowego outputu pod JSON Schema
- Snapshot test: output musi być deterministyczny

**Deliverables:**
- ✅ `.cerber/output.schema.json` zgodny z rzeczywistością
- ✅ TypeScript types synchronized
- ✅ Git committed

---

### COMMIT 2 — "Contract schema + profile fields (tools, failOn) — bez 'enable'"

**Cel:** Profil i contract mają być identyczne w definicji i użyciu.

**Zmiany:**

1. `.cerber/contract.schema.json`: profil ma `tools: string[]` i `failOn: Severity[]`
   ```yaml
   profiles:
     dev:
       tools: [actionlint, zizmor]  # NIE "enable"
       failOn: [error, warning]
   ```

2. Wyrzuć `profile.enable` z całego kodu, wszędzie `profile.tools`

3. Aktualizacja:
   - `src/contract/types.ts`
   - `src/contract/loader.ts`
   - `src/contract/resolver.ts`

**Testy:**
- `contract.schema.test.ts`: kontrakt OK / kontrakt z błędem → exit code 2
- Unit: resolver merges profiles correctly

**Deliverables:**
- ✅ `.cerber/contract.schema.json` zgodny z użyciem
- ✅ Brak `profile.enable` w kodzie
- ✅ Git committed

---

### COMMIT 3 — "Tool detection cross-platform: żadnego 'which'"

**Cel:** Windows przestaje być obywatelem drugiej kategorii.

**Zmiany:**

1. `ToolManager.detectTool()` wykrywa tool przez próbę uruchomienia `--version` / `-version`
   ```typescript
   async detectTool(name: string): Promise<ToolDetection> {
     try {
       const result = await execa(name, ['--version']);
       const version = this.parseVersion(result.stdout);
       return { installed: true, version };
     } catch {
       return { installed: false };
     }
   }
   ```

2. **Nie używamy** `which` / `where` w ogóle

3. `parseVersion()` obsługuje różne formaty:
   - `actionlint 1.6.27`
   - `v1.6.27`
   - `version 1.6.27`

**Testy:**
- Unit: `parseVersion()` różne formaty
- Unit: `detectTool()` na mock execa (bez realnych tooli)

**Deliverables:**
- ✅ Cross-platform tool detection
- ✅ Zero `which` / `where` dependencies
- ✅ Git committed

---

### COMMIT 4 — "Actionlint parser: obsługa NDJSON / line-by-line JSON"

**Cel:** Koniec z padaniem na realnych outputach actionlinta.

**Zmiany:**

1. `ActionlintAdapter.parseOutput(raw)`:
   ```typescript
   parseOutput(raw: string): Violation[] {
     // 1. Try JSON array
     if (raw.trim().startsWith('[')) {
       return this.parseJsonArray(raw);
     }
     
     // 2. Try NDJSON (line-by-line)
     const lines = raw.trim().split('\n').filter(l => l.trim());
     const parsed = lines.map(line => {
       try { return JSON.parse(line); } catch { return null; }
     }).filter(x => x !== null);
     
     if (parsed.length > 0) {
       return this.normalizeActionlintJson(parsed);
     }
     
     // 3. Fallback: text parser
     return this.parseTextFormat(raw);
   }
   ```

2. Fixtures:
   - `fixtures/tool-outputs/actionlint/ndjson.txt`
   - `fixtures/tool-outputs/actionlint/array.json`
   - `fixtures/tool-outputs/actionlint/text.txt`

**Testy:**
- Snapshoty z fixtures (zero zależności od zainstalowanego actionlinta)
- Unit: każdy format parsuje się poprawnie

**Deliverables:**
- ✅ Actionlint parser obsługuje wszystkie formaty
- ✅ Fixtures dla testów
- ✅ Git committed

---

### COMMIT 5 — "Orchestrator minimalny: run tools → parse → merge → deterministic sort"

**Cel:** Działa pipeline E2E na fixtures.

**Zmiany:**

1. `src/core/orchestrator.ts` (minimalny, **bez state machine**):
   ```typescript
   class Orchestrator {
     async run(options: RunOptions): Promise<CerberOutput> {
       // 1. Discover files
       const files = await this.fileDiscovery.discover(options);
       
       // 2. Run adapters
       const results = await this.runAdapters(files, options);
       
       // 3. Merge + normalize
       const violations = this.merge.mergeResults(results);
       
       // 4. Deterministic sort
       const sorted = this.sort(violations);
       
       // 5. Build output
       return this.buildOutput(sorted, results);
     }
   }
   ```

2. `src/reporting/merge.ts`:
   - Normalizacja ścieżek (`\` → `/`, trim `./`)
   - Deterministic sort: `path, line, column, source, id, message`
   - Dedupe: klucz `source|id|path|line|column|hash(message)`

**Testy:**
- Orchestrator unit na mock adapterach
- Determinism snapshot: ten sam input → identyczny JSON

**Deliverables:**
- ✅ Orchestrator pipeline działa E2E
- ✅ Deterministic output (snapshot test)
- ✅ Git committed

---

### COMMIT 6 — "Rules & gating: per-rule override + fallback severity"

**Cel:** "Contract-driven" naprawdę znaczy contract-driven.

**Zmiany:**

1. Contract ma `rules`:
   ```yaml
   rules:
     ci/pin-versions:
       severity: warning
       gate: false        # Don't block on this
       source: ratchet
   ```

2. Orchestrator:
   - Mapuje tool findings do `id = tool/<rule>` zawsze
   - Jeśli istnieje mapping do canonical cerber rule → `cerberId` (opcjonalne)
   - **Gating:** najpierw `rules[ruleId].gate`, dopiero fallback `profile.failOn`

**Testy:**
- Unit: reguła `gate=false` mimo `severity=error` → nie failuje
- Unit: brak rule config → fallback na severity

**Deliverables:**
- ✅ Per-rule gating
- ✅ Contract rules override profile
- ✅ Git committed

---

### COMMIT 7 — "File discovery: staged/changed/all z sensownym fallbackiem CI"

**Cel:** Żeby PR-y nie padały przez brak `origin/main`.

**Zmiany:**

1. `src/scm/git.ts`:
   ```typescript
   async getChangedFiles(base?: string): Promise<string[]> {
     // 1. Jeśli env GITHUB_BASE_REF / GITHUB_SHA → użyj ich
     if (process.env.GITHUB_BASE_REF) {
       return this.diffAgainstRef(process.env.GITHUB_BASE_REF);
     }
     
     // 2. Spróbuj git merge-base HEAD origin/<base>
     try {
       const mergeBase = await this.getMergeBase(base || 'main');
       return this.diffAgainstCommit(mergeBase);
     } catch {
       // 3. Fallback: git ls-files (all)
       return this.getAllFiles();
     }
   }
   ```

2. `staged`: `git diff --name-only --cached`
3. `FileDiscovery` filtruje pliki po target globs

**Testy:**
- Unit z mock execa: scenariusze "brak origin", "shallow clone"
- Integration na fixtures repo (symulacja)

**Deliverables:**
- ✅ File discovery z fallbackami CI
- ✅ Windows paths OK
- ✅ Git committed

---

### COMMIT 8 — "Reporting: text + github annotations (bez SARIF na V2.0)"

**Cel:** Natychmiastowa wartość w CI (komentarze w PR).

**Zmiany:**

1. `format-text.ts` - human-readable output
2. `format-github.ts`:
   ```typescript
   function formatGitHub(output: CerberOutput): string {
     let result = '';
     for (const v of output.violations) {
       const level = v.severity === 'error' ? 'error' : 'warning';
       result += `::${level} file=${v.path},line=${v.line || 1}::${v.id}: ${v.message}\n`;
     }
     return result;
   }
   ```
3. `ReportFormatter` dispatcher

**Testy:**
- Snapshoty formatterów
- E2E: GitHub Actions pokazuje annotations

**Deliverables:**
- ✅ Text + GitHub annotations format
- ✅ CI pokazuje adnotacje w PR
- ✅ Git committed

---

### COMMIT 9 — "CLI: validate + doctor (doctor = diagnoza i alarm, nie 'magiczna naprawa')"

**Cel:** Doctor odpowiada na pytanie: co nie gra? (NIE "naprawiam po cichu")

**Zmiany:**

1. `cerber validate`:
   ```bash
   cerber validate --profile dev --target github-actions --staged
   cerber validate --format github  # GitHub annotations
   ```
   - Exit codes: `0` ok / `1` violations / `2` config error / `3` tool error

2. `cerber doctor`:
   ```bash
   cerber doctor
   ```
   - **Wykrywa:**
     - Targety (.github/workflows/)
     - Contract exists?
     - Tool status (installed/version)
   - **Raport:**
     ```
     🏥 CERBER DOCTOR
     
     📦 Project: nodejs
     📁 Workflows: 3 found
     📄 Contract: ✅ .cerber/contract.yml
     
     🔧 Tool Status:
     ✅ actionlint (1.6.27)
     ❌ zizmor - not installed
        Install: cargo install zizmor
     
     ⚠️  Issues:
     - zizmor required for 'dev' profile but not installed
     
     💡 Suggested fixes:
     cargo install zizmor
     ```
   - **Smoke validate** (jeśli może)
   - **NIE** auto-instaluje, NIE naprawia po cichu

**Testy:**
- E2E: validate na fixtures
- E2E: doctor na fixtures (bez tooli → ma nie wywalać)

**Deliverables:**
- ✅ CLI: validate + doctor
- ✅ Doctor diagnozuje + alarmuje (nie auto-fix)
- ✅ Exit codes: 0/1/2/3
- ✅ Git committed

---

### COMMIT 10 — "Guardian pre-commit: dev-fast <2s (tylko actionlint)"

**Cel:** Szybki feedback bez zabijania commitów.

**Zmiany:**

1. Template contract dodaje `dev-fast`:
   ```yaml
   profiles:
     dev-fast:
       tools: [actionlint]  # Tylko najszybszy tool
       failOn: [error]      # Warnings allowed
   ```

2. Docs: husky/lint-staged (opcjonalnie):
   ```json
   // package.json
   "lint-staged": {
     ".github/workflows/*.{yml,yaml}": [
       "cerber guard --staged"
     ]
   }
   ```

3. `cerber guard --staged` jako alias do `validate --staged --profile dev-fast`

**Testy:**
- Smoke: skrypt e2e "fails on obvious error" (fixtures)
- Performance: <2s na typowym workflow

**Deliverables:**
- ✅ Guardian pre-commit <2s
- ✅ Template z dev-fast profile
- ✅ Docs: husky setup
- ✅ Git committed

---

## 📁 TARGET ARCHITECTURE - FOLDER STRUCTURE

**Cel:** Universal orchestrator with targets (GitHub Actions, GitLab CI, generic YAML)

```
cerber-core/
├─ CERBER.md                          # "Księga" – jedna prawda: zasady, kontrakty, format wyników
├─ AGENTS.md                          # Rules for AI agents (Phase 0)
├─ README.md
├─ LICENSE
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ index.ts                        # Public API (validate/run)
│  ├─ cli/
│  │  ├─ main.ts                      # Entry CLI
│  │  ├─ args.ts                      # Parse args
│  │  ├─ exit-codes.ts                # 0/1/2/3
│  │  └─ commands/
│  │     ├─ validate.ts               # cerber validate ...
│  │     ├─ guard.ts                  # cerber guard --staged (pre-commit)
│  │     ├─ doctor.ts                 # cerber doctor
│  │     └─ init.ts                   # cerber init
│  ├─ contract/
│  │  ├─ schema.ts                    # Walidacja kontraktu (zod/ajv)
│  │  ├─ loader.ts                    # Load .cerber/contract.yml
│  │  ├─ types.ts                     # Contract types
│  │  └─ resolver.ts                  # Extends/merge/defaults
│  ├─ core/
│  │  ├─ orchestrator.ts              # Runs: target -> tools -> merge results
│  │  ├─ tool-manager.ts              # Wykrycie, instalacja/cache binarek, wersje
│  │  ├─ target-manager.ts            # Wybór targetu: github-actions/gitlab-ci/...
│  │  └─ file-discovery.ts            # Znajdź pliki wg targetu (staged/changed/all)
│  ├─ targets/
│  │  ├─ github-actions/
│  │  │  ├─ discover.ts               # .github/workflows/**/*.yml
│  │  │  ├─ toolpacks.ts              # Domyślne narzędzia dla GHA
│  │  │  └─ normalize.ts              # Mapowanie ścieżek, node->line
│  │  ├─ gitlab-ci/
│  │  │  ├─ discover.ts               # .gitlab-ci.yml + includes
│  │  │  └─ toolpacks.ts              # gitlab-ci-lint / custom checks
│  │  └─ generic-yaml/
│  │     ├─ discover.ts               # Dowolne *.yml wg globów z kontraktu
│  │     └─ toolpacks.ts              # yamllint / schema checks
│  ├─ adapters/                       # "Wtyczki" do realnych tooli
│  │  ├─ actionlint/
│  │  │  ├─ run.ts                    # Uruchom actionlint
│  │  │  └─ parse.ts                  # Parsuj output -> Violation[]
│  │  ├─ zizmor/
│  │  │  ├─ run.ts
│  │  │  └─ parse.ts
│  │  ├─ gitleaks/
│  │  │  ├─ run.ts
│  │  │  └─ parse.ts
│  │  └─ _shared/
│  │     ├─ exec.ts                   # Spawn, timeouts, stdout/stderr
│  │     └─ versions.ts               # Pinned versions, download urls, checksums
│  ├─ reporting/
│  │  ├─ violation.ts                 # Unified Violation model (jeden format)
│  │  ├─ merge.ts                     # Łączenie wyników z wielu tooli
│  │  ├─ format-text.ts               # Czytelny output
│  │  ├─ format-json.ts               # Deterministyczny JSON
│  │  ├─ format-github.ts             # ::error file= line= ...
│  │  └─ format-sarif.ts              # SARIF (security standard)
│  ├─ scm/
│  │  ├─ git.ts                       # Staged files, changed files, base branch diff
│  │  └─ paths.ts                     # Normalizacja ścieżek Windows/Linux
│  └─ security/
│     ├─ path-safety.ts               # Blokada ../../../etc/passwd
│     └─ redaction.ts                 # Redakcja sekretów w logach
├─ bin/
│  └─ cerber                          # Node shebang -> dist/cli/main.js
├─ .cerber/
│  ├─ contract.example.yml            # Przykład kontraktu
│  └─ contracts/
│     ├─ github-actions.base.yml      # Bazowy kontrakt dla GHA
│     └─ nodejs.base.yml
├─ .github/
│  ├─ workflows/
│  │  └─ ci.yml                       # Testy, lint, typecheck, snapshot
│  └─ copilot-instructions.md         # Zasady dla agenta
├─ test/
│  ├─ fixtures/
│  │  ├─ github-actions/              # Real workflow fixtures
│  │  ├─ gitlab-ci/
│  │  └─ secrets/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
└─ docs/
   ├─ targets.md                      # Jak działa "target" i jak dodać nowy
   ├─ adapters.md                     # Jak dodać adapter do toola
   └─ contract.md                     # Spec kontraktu
```

**Kluczowe decyzje architektoniczne:**

1. **Targets (uniwersalność merytoryczna)**
   - `github-actions` - actionlint + zizmor + gitleaks (Phase 1)
   - `gitlab-ci` - gitlab-ci lint + custom rules (Phase 2+)
   - `generic-yaml` - yamllint/schema (Phase 2+)

2. **Adapters (wtyczki do tooli)**
   - Interfejs: `run()` + `parse()` → `Violation[]`
   - Każdy adapter niezależny (łatwo dodać nowe)

3. **Reporting (wiele formatów)**
   - `text` - human-readable (domyślny)
   - `json` - deterministyczny (CI/integracje)
   - `github` - ::error file=... (GitHub Actions annotations)
   - `sarif` - standard security (GitHub Code Scanning)

4. **SCM (staged/changed/all)**
   - Pre-commit: tylko staged files
   - PR: changed files vs base branch
   - CI: all files lub changed

5. **Tool Manager**
   - Auto-detect installed tools
   - Cache binaries (jeśli potrzebne)
   - Version pinning

**Filozofia:**
> Cerber = dyrygent (orchestrator), nie orkiestra (nie reimplementujemy tooli).
> Target = zakres merytoryczny (GHA, GitLab, YAML).
> Adapter = wykonawca (actionlint, zizmor, gitleaks).
> Contract = partytura (jedna prawda).

---

## 🎯 PHASE 0: FOUNDATION (Dni 1-2) - 12h

**Cel:** Establish "One Truth" + Agent Rules

**⚠️ CRITICAL: Read AGENTS.md and .github/copilot-instructions.md FIRST**

### 0.0 Architecture Rules (READ FIRST)

**5 MINY NAPRAWIONE:**

1. **MINA #1:** ~~timestamp required~~ → Timestamp opcjonalny w `runMetadata`, nie w deterministycznym rdzeniu
2. **MINA #2:** ~~actionlint JSON mode~~ → Template `{{json .}}` + fallback text parser
3. **MINA #3:** ~~brew na ubuntu~~ → Download release binaries (curl + tar)
4. **MINA #4:** ~~testy wymagają toola~~ → Fixtures w `fixtures/tool-outputs/<tool>/`
5. **MINA #5:** ~~tools = rules~~ → Separacja: `tools.*` (config), `rules.*` (gating)

**Golden Rules (from AGENTS.md):**

1. **ONE TRUTH:** Contract = source of truth
2. **NO REINVENTING:** Orchestrate, don't reimplement
3. **DETERMINISTIC:** Same input → same output (sorted, no required timestamps)
4. **TESTS FIRST:** No behavior without tests
5. **FIXTURES:** Adapters test on fixtures, not real tools
6. **GRACEFUL:** Tool missing → warn and continue
7. **CROSS-PLATFORM:** Windows is first-class citizen
8. **EXIT CODES:** 0 (success) / 1 (violations) / 2 (config error) / 3 (tool error)

**Read before coding:**
- [`AGENTS.md`](./AGENTS.md) - Full rules
- [`.github/copilot-instructions.md`](./.github/copilot-instructions.md) - Copilot instructions

---

### 0.1 Create Agent Instructions (2h)

**✅ DONE - Files created:**
1. ✅ `AGENTS.md` (root) - Complete rules (11 sections, 400+ lines)
2. ✅ `.github/copilot-instructions.md` (GitHub Copilot specific)

**Content:** See files above.

**Deliverables:**
   - Use zizmor (workflow security)
   - Use ratchet/gha-fix (pinning/autofix)
   - Cerber adds: orchestration + contracts + profiles + deterministic output

3) Tests-first gate:
   - Any behavior change requires: unit test OR integration fixture OR e2e snapshot
   - CI must stay green

4) Deterministic output:
   - Same input => byte-identical JSON output
   - Sorted keys, stable ordering
   - No random timestamps

5) Backward compatibility:
   - v1 CLI remains working until documented migration path
   - Breaking changes require: MIGRATION.md + major version bump

6) Scope control:
   - Each PR = one atomic improvement
   - No drive-by refactors
   - No renaming spree

## Implementation constraints
- Node >= 20
- CLI uses execa (Windows support)
- Adapters must have:
  - detect installed tool
  - auto-install hint
  - version capture
  - parse output → CerberViolation[]

## Definition of Done (per PR)
- [ ] Tests added/updated
- [ ] Docs updated (CERBER.md if behavior changes)
- [ ] cerber doctor works on sample fixtures
- [ ] Output schema unchanged OR versioned
- [ ] No new lint/type errors
```

**Deliverables:**
- ✅ AGENTS.md in root
- ✅ Git committed

**Tests:** N/A (documentation)

---

### 0.2 Define Output Schema (3h)
```bash
# Create: .cerber/output.schema.json
```

**⚠️ MINA #1 FIX: Determinism → timestamp opcjonalny (w runMetadata, nie required)**

**Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CerberOutput",
  "type": "object",
  "required": ["contractVersion", "deterministic", "summary", "violations", "metadata"],
  "properties": {
    "contractVersion": {
      "type": "integer",
      "description": "Contract version",
      "example": 1
    },
    "deterministic": {
      "type": "boolean",
      "description": "Whether output is deterministic (same input → same output)"
    },
    "summary": {
      "type": "object",
      "required": ["total", "errors", "warnings", "info"],
      "properties": {
        "total": { "type": "integer" },
        "errors": { "type": "integer" },
        "warnings": { "type": "integer" },
        "info": { "type": "integer" }
      }
    },
    "violations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "severity", "message", "source"],
        "properties": {
          "id": {
            "type": "string",
            "description": "Stable rule ID",
            "example": "security/no-hardcoded-secrets"
          },
          "severity": {
            "type": "string",
            "enum": ["error", "warning", "info"]
          },
          "message": {
            "type": "string",
            "description": "Human-readable message"
          },
          "path": {
            "type": "string",
            "description": "File path (relative to repo root)"
          },
          "line": {
            "type": "integer",
            "description": "Line number (1-indexed)"
          },
          "column": {
            "type": "integer",
            "description": "Column number (1-indexed)"
          },
          "hint": {
            "type": "string",
            "description": "Fix suggestion"
          },
          "source": {
            "type": "string",
            "description": "Tool that generated violation",
            "example": "cerber-semantic | actionlint | zizmor"
          },
          "toolOutput": {
            "type": "object",
            "description": "Original tool output (for debugging)"
          }
        }
      }
    },
    "metadata": {
      "type": "object",
      "required": ["tools"],
      "properties": {
        "tools": {
          "type": "object",
          "description": "Tool execution metadata (sorted by key)",
          "additionalProperties": {
            "type": "object",
            "properties": {
              "version": { "type": "string" },
              "exitCode": { "type": "integer" },
              "skipped": { "type": "boolean" },
              "reason": { "type": "string" }
            }
          }
        }
      }
    },
    "runMetadata": {
      "type": "object",
      "description": "Optional runtime metadata (NOT part of deterministic core)",
      "properties": {
        "profile": { "type": "string" },
        "executionTime": { "type": "integer", "description": "Milliseconds" },
        "cwd": { "type": "string" },
        "generatedAt": {
          "type": "string",
          "format": "date-time",
          "description": "ISO 8601 timestamp (optional)"
        }
      }
    }
  }
}
```

**Determinism Rule:**
- Core fields (summary, violations, metadata.tools) → deterministic (sorted)
- runMetadata → optional, not part of deterministic comparison
- Test: `deepEqual(run1, run2)` excludes runMetadata

**Deliverables:**
- ✅ .cerber/output.schema.json
- ✅ TypeScript types generated (src/types/output.ts)
- ✅ Git committed

**Tests:**
- Unit test: validate sample outputs against schema

---

### 0.3 Define Contract Schema (3h)
```bash
# Create: .cerber/contract.schema.json
```

**⚠️ MINA #5 FIX: tools vs rules separation**

**Schema:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CerberContract",
  "type": "object",
  "required": ["contractVersion", "profiles"],
  "properties": {
    "contractVersion": {
      "type": "integer",
      "description": "Contract version",
      "example": 1
    },
    "activeProfile": {
      "type": "string",
      "description": "Default profile to use",
      "enum": ["solo", "dev", "team"]
    },
    "extends": {
      "type": "string",
      "description": "Base template",
      "example": "nodejs-base"
    },
    "tools": {
      "type": "object",
      "description": "Tool execution configuration",
      "properties": {
        "actionlint": {
          "$ref": "#/definitions/toolConfig"
        },
        "zizmor": {
          "$ref": "#/definitions/toolConfig"
        },
        "gitleaks": {
          "$ref": "#/definitions/toolConfig"
        }
      }
    },
    "rules": {
      "type": "object",
      "description": "Cerber rules (severity mapping, gating)",
      "additionalProperties": {
        "$ref": "#/definitions/ruleConfig"
      }
    },
    "profiles": {
      "type": "object",
      "properties": {
        "solo": {
          "$ref": "#/definitions/profile"
        },
        "dev": {
          "$ref": "#/definitions/profile"
        },
        "team": {
          "$ref": "#/definitions/profile"
        }
      }
    }
  },
  "definitions": {
    "profile": {
      "type": "object",
      "required": ["tools", "failOn"],
      "properties": {
        "tools": {
          "type": "array",
          "description": "Which tools to run",
          "items": { "type": "string" }
        },
        "failOn": {
          "type": "array",
          "description": "Which severities fail CI",
          "items": {
            "type": "string",
            "enum": ["error", "warning", "info"]
          }
        },
        "timeout": {
          "type": "integer",
          "description": "Max execution time per tool (ms)"
        },
        "continueOnError": {
          "type": "boolean",
          "description": "Continue if tool crashes"
        }
      }
    },
    "toolConfig": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "version": { "type": "string", "description": "Pin version (optional)" },
        "args": {
          "type": "array",
          "description": "Tool-specific arguments",
          "items": { "type": "string" }
        },
        "format": { "type": "string", "description": "Output format (if tool supports)" }
      }
    },
    "ruleConfig": {
      "type": "object",
      "required": ["severity", "gate"],
      "properties": {
        "severity": {
          "type": "string",
          "enum": ["error", "warning", "info"]
        },
        "gate": {
          "type": "boolean",
          "description": "Fail CI if violated"
        },
        "source": {
          "type": "string",
          "description": "Which tool provides this rule"
        }
      }
      }
    }
  }
}
```

**Deliverables:**
- ✅ .cerber/contract.schema.json
- ✅ TypeScript types (src/types/contract.ts)
- ✅ Validation logic (src/contracts/ContractValidator.ts updated)
- ✅ Git committed

**Tests:**
- Unit test: validate sample contracts against schema
- Integration test: load contract + validate structure

---

### 0.4 Update CERBER.md Spec (4h)

**Add sections:**
1. **Output Schema** - deterministic JSON format
2. **Profiles** - solo/dev/team definitions
3. **Exit Codes** - 0 (OK), 1 (violations), 2 (config error), 3 (runtime error)
4. **Tool Adapters** - how adapters work
5. **One Truth Philosophy** - contract.yml = source of truth

**Deliverables:**
- ✅ CERBER.md updated
- ✅ Examples added
- ✅ Git committed

**Tests:** N/A (documentation)

---

## 🎯 PHASE 1: CORE INFRASTRUCTURE (Dni 3-7) - 40h

**Cel:** Build core orchestration system + adapters framework

### 1.1 Tool Manager (6h)

**Create:**
```typescript
// src/core/tool-manager.ts
export interface ToolInfo {
  name: string;
  installed: boolean;
  version?: string;
  path?: string;
  installHint: string;
}

export class ToolManager {
  private cache: Map<string, ToolInfo> = new Map();
  
  /**
   * Check if tool is installed and cache result
   */
  async detectTool(name: string): Promise<ToolInfo> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }
    
    const info = await this.detect(name);
    this.cache.set(name, info);
    return info;
  }
  
  private async detect(name: string): Promise<ToolInfo> {
    try {
      const { stdout } = await execa(name, ['--version']);
      const version = this.parseVersion(stdout);
      const { stdout: path } = await execa('which', [name]);
      
      return {
        name,
        installed: true,
        version,
        path: path.trim(),
        installHint: this.getInstallHint(name)
      };
    } catch {
      return {
        name,
        installed: false,
        installHint: this.getInstallHint(name)
      };
    }
  }
  
  private parseVersion(output: string): string | undefined {
    const match = output.match(/\d+\.\d+\.\d+/);
    return match?.[0];
  }
  
  private getInstallHint(name: string): string {
    const hints = {
      actionlint: 'brew install actionlint  # or: go install github.com/rhysd/actionlint/cmd/actionlint@latest',
      zizmor: 'brew install zizmor  # or: cargo install zizmor',
      gitleaks: 'brew install gitleaks  # or: go install github.com/gitleaks/gitleaks/v8@latest'
    };
    return hints[name] || `Install ${name} from official source`;
  }
  
  /**
   * Check multiple tools in parallel
   */
  async detectAll(tools: string[]): Promise<ToolInfo[]> {
    return Promise.all(tools.map(tool => this.detectTool(tool)));
  }
  
  /**
   * Get summary for doctor command
   */
  async getSummary(tools: string[]): Promise<{ installed: number; missing: number; tools: ToolInfo[] }> {
    const results = await this.detectAll(tools);
    return {
      installed: results.filter(t => t.installed).length,
      missing: results.filter(t => !t.installed).length,
      tools: results
    };
  }
}
```

**Deliverables:**
- ✅ src/core/tool-manager.ts
- ✅ Tool detection with caching
- ✅ Version parsing
- ✅ Install hints
- ✅ Git committed

**Tests:**
- Unit test: parseVersion() with different formats
- Mock test: detectTool() with/without tool
- Integration test: detectAll() on real system

---

### 1.1b Tool Version Management & Auto-Installation (4h)

**Problem:** Tools evolve, versions change, users don't want manual installation.

**Solution Strategy:**

**1. Pinned Versions Registry:**
```typescript
// src/adapters/_shared/versions.ts
export const TOOL_VERSIONS = {
  actionlint: {
    recommended: '1.6.27',
    minimum: '1.6.0',
    download: {
      linux: 'https://github.com/rhysd/actionlint/releases/download/v{version}/actionlint_{version}_linux_amd64.tar.gz',
      darwin: 'https://github.com/rhysd/actionlint/releases/download/v{version}/actionlint_{version}_darwin_amd64.tar.gz',
      win32: 'https://github.com/rhysd/actionlint/releases/download/v{version}/actionlint_{version}_windows_amd64.zip'
    },
    checksum: {
      '1.6.27': {
        linux: 'sha256:abc123...',
        darwin: 'sha256:def456...',
        win32: 'sha256:ghi789...'
      }
    }
  },
  zizmor: {
    recommended: '0.2.0',
    minimum: '0.1.0',
    download: {
      linux: 'https://github.com/woodruffw/zizmor/releases/download/v{version}/zizmor-x86_64-unknown-linux-musl',
      darwin: 'https://github.com/woodruffw/zizmor/releases/download/v{version}/zizmor-x86_64-apple-darwin',
      win32: 'https://github.com/woodruffw/zizmor/releases/download/v{version}/zizmor-x86_64-pc-windows-msvc.exe'
    }
  },
  gitleaks: {
    recommended: '8.18.0',
    minimum: '8.0.0',
    download: {
      linux: 'https://github.com/gitleaks/gitleaks/releases/download/v{version}/gitleaks_{version}_linux_x64.tar.gz',
      darwin: 'https://github.com/gitleaks/gitleaks/releases/download/v{version}/gitleaks_{version}_darwin_x64.tar.gz',
      win32: 'https://github.com/gitleaks/gitleaks/releases/download/v{version}/gitleaks_{version}_windows_x64.zip'
    }
  }
};

export function getToolVersion(name: string): { recommended: string; minimum: string } {
  return TOOL_VERSIONS[name] || { recommended: 'latest', minimum: '0.0.0' };
}

export function getDownloadURL(name: string, version: string, platform: NodeJS.Platform): string | null {
  const tool = TOOL_VERSIONS[name];
  if (!tool || !tool.download) return null;
  
  const template = tool.download[platform];
  if (!template) return null;
  
  return template.replace('{version}', version);
}

export function isVersionCompatible(installed: string, minimum: string): boolean {
  // Simple semver comparison
  const [iMajor, iMinor, iPatch] = installed.split('.').map(Number);
  const [mMajor, mMinor, mPatch] = minimum.split('.').map(Number);
  
  if (iMajor > mMajor) return true;
  if (iMajor < mMajor) return false;
  if (iMinor > mMinor) return true;
  if (iMinor < mMinor) return false;
  return iPatch >= mPatch;
}
```

**2. Auto-Download & Cache:**
```typescript
// src/core/tool-installer.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { get } from 'https';
import { extract } from 'tar';
import AdmZip from 'adm-zip';

export class ToolInstaller {
  private cacheDir: string;
  
  constructor() {
    // Cache in ~/.cerber/tools/
    this.cacheDir = path.join(os.homedir(), '.cerber', 'tools');
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }
  
  /**
   * Check if tool is cached
   */
  isCached(name: string, version: string): boolean {
    const binPath = this.getBinPath(name, version);
    return fs.existsSync(binPath);
  }
  
  /**
   * Get cached binary path
   */
  getBinPath(name: string, version: string): string {
    const ext = process.platform === 'win32' ? '.exe' : '';
    return path.join(this.cacheDir, name, version, `${name}${ext}`);
  }
  
  /**
   * Download and install tool
   */
  async install(name: string, version: string): Promise<string> {
    // Check if already cached
    if (this.isCached(name, version)) {
      console.log(`✅ ${name} ${version} already cached`);
      return this.getBinPath(name, version);
    }
    
    console.log(`📦 Downloading ${name} ${version}...`);
    
    // Get download URL
    const url = getDownloadURL(name, version, process.platform);
    if (!url) {
      throw new Error(`No download URL for ${name} on ${process.platform}`);
    }
    
    // Download to temp
    const tempDir = path.join(os.tmpdir(), `cerber-${name}-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    const archivePath = path.join(tempDir, path.basename(url));
    await this.download(url, archivePath);
    
    // Extract
    const extractDir = path.join(this.cacheDir, name, version);
    fs.mkdirSync(extractDir, { recursive: true });
    
    if (url.endsWith('.tar.gz')) {
      await extract({ file: archivePath, cwd: extractDir });
    } else if (url.endsWith('.zip')) {
      const zip = new AdmZip(archivePath);
      zip.extractAllTo(extractDir, true);
    } else {
      // Single binary (e.g., zizmor)
      const binPath = this.getBinPath(name, version);
      fs.copyFileSync(archivePath, binPath);
      fs.chmodSync(binPath, 0o755);
    }
    
    // Cleanup temp
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(`✅ Installed ${name} ${version}`);
    return this.getBinPath(name, version);
  }
  
  private async download(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          this.download(response.headers.location!, dest).then(resolve).catch(reject);
          return;
        }
        
        const file = createWriteStream(dest);
        pipeline(response, file)
          .then(() => resolve())
          .catch(reject);
      }).on('error', reject);
    });
  }
  
  /**
   * Get tool (from cache or install)
   */
  async ensureTool(name: string): Promise<string> {
    const { recommended } = getToolVersion(name);
    
    if (this.isCached(name, recommended)) {
      return this.getBinPath(name, recommended);
    }
    
    // Auto-install if not found
    return this.install(name, recommended);
  }
}
```

**3. Version Check & Auto-Update:**
```typescript
// Update ToolManager to use ToolInstaller
export class ToolManager {
  private cache: Map<string, ToolInfo> = new Map();
  private installer = new ToolInstaller();
  
  async detectTool(name: string, autoInstall = false): Promise<ToolInfo> {
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }
    
    // Try system-installed first
    let info = await this.detectSystem(name);
    
    // Check version compatibility
    if (info.installed && info.version) {
      const { minimum } = getToolVersion(name);
      if (!isVersionCompatible(info.version, minimum)) {
        console.warn(`⚠️  ${name} ${info.version} is outdated (minimum: ${minimum})`);
        info.outdated = true;
      }
    }
    
    // Auto-install if not found and autoInstall=true
    if (!info.installed && autoInstall) {
      try {
        const binPath = await this.installer.ensureTool(name);
        info = {
          name,
          installed: true,
          version: getToolVersion(name).recommended,
          path: binPath,
          installHint: `Already installed by Cerber`,
          cached: true
        };
      } catch (error) {
        console.error(`Failed to auto-install ${name}:`, error);
      }
    }
    
    this.cache.set(name, info);
    return info;
  }
  
  private async detectSystem(name: string): Promise<ToolInfo> {
    // Same as before (check system PATH)
    try {
      const { stdout } = await execa(name, ['--version']);
      const version = this.parseVersion(stdout);
      const { stdout: path } = await execa('which', [name]);
      
      return {
        name,
        installed: true,
        version,
        path: path.trim(),
        installHint: this.getInstallHint(name),
        cached: false
      };
    } catch {
      return {
        name,
        installed: false,
        installHint: this.getInstallHint(name),
        cached: false
      };
    }
  }
}
```

**4. Contract Tool Version Pinning:**
```yaml
# .cerber/contract.yml
contractVersion: 1
tools:
  actionlint:
    enabled: true
    version: '1.6.27'  # Pin specific version (optional)
  zizmor:
    enabled: true
    version: 'latest'  # Or use latest
  gitleaks:
    enabled: true
    # No version = use recommended
```

**5. Doctor Command Integration:**
```typescript
// cerber doctor shows version status
async function doctor() {
  const tools = ['actionlint', 'zizmor', 'gitleaks'];
  const manager = new ToolManager();
  
  console.log('🔧 Tool Status:\n');
  
  for (const name of tools) {
    const info = await manager.detectTool(name);
    const { recommended, minimum } = getToolVersion(name);
    
    if (info.installed) {
      if (info.outdated) {
        console.log(`   ⚠️  ${name} ${info.version} (outdated, minimum: ${minimum})`);
        console.log(`      Run: cerber install ${name}`);
      } else {
        const cachedTag = info.cached ? ' [cached]' : '';
        console.log(`   ✅ ${name} ${info.version}${cachedTag}`);
      }
    } else {
      console.log(`   ❌ ${name} not installed`);
      console.log(`      Run: cerber install ${name}`);
      console.log(`      Or: ${info.installHint}`);
    }
  }
}
```

**6. CLI Commands:**
```bash
# Auto-install missing tools
cerber install actionlint zizmor gitleaks

# Update all tools to recommended versions
cerber update --all

# Check versions without installing
cerber doctor --check-versions

# Validate with auto-install
cerber validate --auto-install
```

**Strategy Overview:**

| Scenario | Behavior |
|----------|----------|
| Tool in PATH | ✅ Use system tool |
| Tool in PATH (outdated) | ⚠️ Warn, suggest update, still use |
| Tool not found (local dev) | ℹ️ Show install hint |
| Tool not found (CI + auto-install) | 📦 Download to ~/.cerber/tools/ |
| Tool not found (Docker) | ✅ Pre-installed in image |
| Version mismatch | ⚠️ Warn, show minimum required |

**Deliverables:**
- ✅ src/adapters/_shared/versions.ts (pinned versions registry)
- ✅ src/core/tool-installer.ts (download + cache)
- ✅ Update ToolManager with version check
- ✅ cerber install command
- ✅ cerber update command
- ✅ --auto-install flag
- ✅ Git committed

**Tests:**
- Unit test: isVersionCompatible()
- Unit test: getDownloadURL()
- Mock test: ToolInstaller.install() (don't download in tests)
- Integration test: auto-install on real system (opt-in)
- Test: version outdated detection

**Dependencies:**
- npm install adm-zip (for .zip extraction on Windows)
- npm install tar (for .tar.gz extraction)

---

### 1.2 Target Manager (6h)

**Create:**
```typescript
// src/core/target-manager.ts
export interface Target {
  id: string;
  name: string;
  description: string;
  discover: (cwd: string) => Promise<string[]>;
  getDefaultTools: () => string[];
}

export class TargetManager {
  private targets: Map<string, Target> = new Map();
  
  registerTarget(target: Target): void {
    this.targets.set(target.id, target);
  }
  
  getTarget(id: string): Target | undefined {
    return this.targets.get(id);
  }
  
  getAllTargets(): Target[] {
    return Array.from(this.targets.values());
  }
  
  /**
   * Auto-detect which targets are available in project
   */
  async detectAvailableTargets(cwd: string): Promise<Target[]> {
    const available: Target[] = [];
    
    for (const target of this.targets.values()) {
      const files = await target.discover(cwd);
      if (files.length > 0) {
        available.push(target);
      }
    }
    
    return available;
  }
}
```

**Create Targets:**
```typescript
// src/targets/github-actions/discover.ts
export async function discoverGitHubActions(cwd: string): Promise<string[]> {
  const workflowsDir = path.join(cwd, '.github/workflows');
  
  if (!fs.existsSync(workflowsDir)) {
    return [];
  }
  
  const files = await glob('**/*.{yml,yaml}', {
    cwd: workflowsDir,
    absolute: true
  });
  
  return files;
}

// src/targets/github-actions/toolpacks.ts
export function getDefaultTools(): string[] {
  return ['actionlint', 'zizmor', 'gitleaks'];
}

// src/targets/github-actions/index.ts
export const GitHubActionsTarget: Target = {
  id: 'github-actions',
  name: 'GitHub Actions',
  description: 'GitHub Actions workflows (.github/workflows/*.yml)',
  discover: discoverGitHubActions,
  getDefaultTools
};
```

**Deliverables:**
- ✅ src/core/target-manager.ts
- ✅ src/targets/github-actions/ (discover, toolpacks, index)
- ✅ Auto-detection of available targets
- ✅ Git committed

**Tests:**
- Unit test: TargetManager register/get
- Integration test: discoverGitHubActions() on fixtures
- Test: detectAvailableTargets() returns correct targets

---

### 1.3 File Discovery (SCM Integration) (6h)

**Create:**
```typescript
// src/scm/git.ts
export class GitSCM {
  constructor(private cwd: string) {}
  
  /**
   * Get staged files (for pre-commit)
   */
  async getStagedFiles(): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['diff', '--name-only', '--cached'], {
        cwd: this.cwd
      });
      return stdout.split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
  
  /**
   * Get changed files vs base branch (for PR)
   */
  async getChangedFiles(baseBranch: string = 'main'): Promise<string[]> {
    try {
      const { stdout } = await execa('git', ['diff', '--name-only', `origin/${baseBranch}...HEAD`], {
        cwd: this.cwd
      });
      return stdout.split('\n').filter(Boolean);
    } catch {
      // Fallback: all tracked files
      return this.getTrackedFiles();
    }
  }
  
  /**
   * Get all tracked files
   */
  async getTrackedFiles(): Promise<string[]> {
    const { stdout } = await execa('git', ['ls-files'], {
      cwd: this.cwd
    });
    return stdout.split('\n').filter(Boolean);
  }
  
  /**
   * Check if in git repo
   */
  async isGitRepo(): Promise<boolean> {
    try {
      await execa('git', ['rev-parse', '--git-dir'], { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }
}

// src/scm/paths.ts
export class PathNormalizer {
  /**
   * Normalize paths for cross-platform (Windows/Linux)
   */
  static normalize(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }
  
  /**
   * Make path relative to cwd
   */
  static makeRelative(filePath: string, cwd: string): string {
    const relative = path.relative(cwd, filePath);
    return this.normalize(relative);
  }
  
  /**
   * Filter files by glob patterns
   */
  static matchGlobs(files: string[], globs: string[]): string[] {
    return files.filter(file => {
      return globs.some(glob => minimatch(file, glob));
    });
  }
}

// src/core/file-discovery.ts
export interface DiscoveryOptions {
  mode: 'staged' | 'changed' | 'all';
  target: Target;
  baseBranch?: string;
  globs?: string[];
}

export class FileDiscovery {
  constructor(
    private cwd: string,
    private git: GitSCM
  ) {}
  
  async discover(options: DiscoveryOptions): Promise<string[]> {
    // 1. Get files by mode
    let files: string[];
    
    switch (options.mode) {
      case 'staged':
        files = await this.git.getStagedFiles();
        break;
      case 'changed':
        files = await this.git.getChangedFiles(options.baseBranch);
        break;
      case 'all':
        files = await options.target.discover(this.cwd);
        break;
    }
    
    // 2. Filter by target globs (if provided)
    if (options.globs) {
      files = PathNormalizer.matchGlobs(files, options.globs);
    }
    
    // 3. Normalize paths
    files = files.map(f => PathNormalizer.normalize(f));
    
    return files;
  }
}
```

**Deliverables:**
- ✅ src/scm/git.ts (staged/changed/all files)
- ✅ src/scm/paths.ts (path normalization)
- ✅ src/core/file-discovery.ts (unified discovery)
- ✅ Git committed

**Tests:**
- Unit test: PathNormalizer.normalize() Windows/Linux
- Mock test: GitSCM methods with mock git
- Integration test: FileDiscovery on fixtures

---

### 1.4 Adapter Framework (6h)

**Create:**
```typescript
// src/orchestrator/ToolAdapter.ts
export interface ToolAdapter {
  name: string;
  version?: string;
  
  // Detection
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string | null>;
  getInstallHint(): string;
  
  // Execution
  run(options: RunOptions): Promise<ToolOutput>;
  
  // Parsing
  parseOutput(raw: string): CerberViolation[];
  
  // Mapping
  mapRule(cerberRuleId: string): string | null;
}

export interface RunOptions {
  files?: string[];
  config?: string;
  args?: string[];
}

export interface ToolOutput {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}
```

**Create:**
```typescript
// src/orchestrator/ToolRegistry.ts
export class ToolRegistry {
  private adapters: Map<string, ToolAdapter> = new Map();
  
  register(name: string, adapter: ToolAdapter): void;
  get(name: string): ToolAdapter | undefined;
  getAll(): ToolAdapter[];
  
  async checkAll(): Promise<ToolStatus[]>;
}

export interface ToolStatus {
  name: string;
  installed: boolean;
  version?: string;
  installHint: string;
  optional: boolean;
}
```

**Deliverables:**
- ✅ src/orchestrator/ToolAdapter.ts
- ✅ src/orchestrator/ToolRegistry.ts
- ✅ src/orchestrator/index.ts (exports)
- ✅ Git committed

**Tests:**
- Unit test: ToolRegistry register/get/getAll
- Mock adapter for testing

---

### 1.2 Actionlint Adapter (6h)

**⚠️ MINA #2 FIX: Actionlint format reality check - template mode, not native JSON**

**Create:**
```typescript
// src/orchestrator/adapters/ActionlintAdapter.ts
export class ActionlintAdapter implements ToolAdapter {
  name = 'actionlint';
  
  // Actionlint custom template for structured output
  private static TEMPLATE = '{{json .}}';
  
  async isInstalled(): Promise<boolean> {
    try {
      await execa('actionlint', ['-version']);
      return true;
    } catch {
      return false;
    }
  }
  
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execa('actionlint', ['-version']);
      // Parse: "1.6.27 built with go1.21"
      return stdout.match(/(\d+\.\d+\.\d+)/)?.[1] || null;
    } catch {
      return null;
    }
  }
  
  getInstallHint(): string {
    const platform = process.platform;
    if (platform === 'darwin') {
      return 'brew install actionlint  # or: go install github.com/rhysd/actionlint/cmd/actionlint@latest';
    } else if (platform === 'win32') {
      return 'choco install actionlint  # or: scoop install actionlint';
    } else {
      return 'Download: https://github.com/rhysd/actionlint/releases  # or: go install github.com/rhysd/actionlint/cmd/actionlint@latest';
    }
  }
  
  async run(options: RunOptions): Promise<ToolOutput> {
    // Use template format (actionlint doesn't have native JSON mode)
    const args = [
      '-format', ActionlintAdapter.TEMPLATE,
      '-color', 'never'
    ];
    
    if (options.args) {
      args.push(...options.args);
    }
    
    if (options.files?.length) {
      args.push(...options.files);
    }
    
    const start = Date.now();
    const result = await execa('actionlint', args, { 
      reject: false,
      all: true,
      cwd: options.cwd,
      timeout: options.timeout || 30000
    });
    
    return {
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      duration: Date.now() - start
    };
  }
  
  parseOutput(raw: string): CerberViolation[] {
    if (!raw.trim()) return [];
    
    try {
      // Template {{json .}} outputs array of issues
      const issues = JSON.parse(raw);
      
      return issues.map((item: any) => ({
        id: item.kind || 'actionlint',
        severity: 'error',  // actionlint only reports errors
        message: item.message || item.title,
        path: item.filepath || item.file,
        line: item.line || 0,
        column: item.column || 0,
        source: 'actionlint',
        toolOutput: item
      }));
    } catch (error) {
      // Fallback: parse text output if JSON fails
      return this.parseTextOutput(raw);
    }
  }
  
  private parseTextOutput(raw: string): CerberViolation[] {
    // Fallback parser for standard text format
    // Example: ".github/workflows/ci.yml:10:5: error message [rule-name]"
    const lines = raw.split('\n').filter(Boolean);
    const regex = /^(.+?):(\d+):(\d+):\s*(.+?)\s*\[([^\]]+)\]$/;
    
    return lines.map(line => {
      const match = line.match(regex);
      if (!match) return null;
      
      return {
        id: match[5],
        severity: 'error',
        message: match[4],
        path: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        source: 'actionlint',
        toolOutput: { raw: line }
      };
    }).filter(Boolean) as CerberViolation[];
  }
  
  mapRule(cerberRuleId: string): string | null {
    // actionlint runs all checks (no selective rules)
    return null;
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/adapters/ActionlintAdapter.ts
- ✅ Registered in ToolRegistry
- ✅ Fixtures created (see below)
- ✅ Git committed

**⚠️ MINA #4 FIX: Adapter testing strategy - fixtures, not real tools**

**Tests:**
- Unit test: `parseOutput()` with **fixtures** (NO tool required)
  ```typescript
  // tests/adapters/actionlint.test.ts
  import { ActionlintAdapter } from '@/adapters/actionlint';
  import fs from 'fs';
  
  describe('ActionlintAdapter', () => {
    const adapter = new ActionlintAdapter();
    
    it('parses JSON output from template', () => {
      const fixture = fs.readFileSync('fixtures/tool-outputs/actionlint/syntax-error.json', 'utf-8');
      const violations = adapter.parseOutput(fixture);
      
      expect(violations).toMatchSnapshot();
      expect(violations[0]).toMatchObject({
        id: 'syntax-check',
        severity: 'error',
        source: 'actionlint'
      });
    });
    
    it('parses text output fallback', () => {
      const fixture = fs.readFileSync('fixtures/tool-outputs/actionlint/text-output.txt', 'utf-8');
      const violations = adapter.parseOutput(fixture);
      
      expect(violations.length).toBeGreaterThan(0);
    });
    
    it('handles empty output', () => {
      const violations = adapter.parseOutput('');
      expect(violations).toEqual([]);
    });
  });
  ```

- Integration test: `run()` on real tool (skip if not installed)
  ```typescript
  it.skipIf(!await adapter.isInstalled())('runs real actionlint', async () => {
    const result = await adapter.run({ 
      files: ['fixtures/workflows/valid.yml'],
      cwd: process.cwd()
    });
    expect(result.exitCode).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
  });
  ```

- Mock test: `isInstalled()` / `getVersion()`
  ```typescript
  it('detects installation', async () => {
    // Skip if tool not installed (don't fail test)
    const installed = await adapter.isInstalled();
    expect(typeof installed).toBe('boolean');
  });
  ```

**Create Fixtures:**
```bash
# fixtures/tool-outputs/actionlint/syntax-error.json
[
  {
    "kind": "syntax-check",
    "message": "invalid syntax in workflow file",
    "filepath": ".github/workflows/ci.yml",
    "line": 10,
    "column": 5
  }
]

# fixtures/tool-outputs/actionlint/multiple-issues.json
[...]

# fixtures/tool-outputs/actionlint/no-issues.json
[]

# fixtures/tool-outputs/actionlint/text-output.txt
.github/workflows/ci.yml:10:5: error message [syntax-check]
```

**Rule:** Unit tests MUST pass without actionlint installed (fixtures only).

**Dependencies:**
- npm install execa (if not installed)

---

### 1.3 Zizmor Adapter (6h)

**Create:**
```typescript
// src/orchestrator/adapters/ZizmorAdapter.ts
export class ZizmorAdapter implements ToolAdapter {
  name = 'zizmor';
  
  // Similar structure to ActionlintAdapter
  
  async run(options: RunOptions): Promise<ToolOutput> {
    const args = ['--format', 'json'];
    if (options.files) {
      args.push(...options.files);
    }
    
    const result = await execa('zizmor', args, { reject: false });
    // ... parse results
  }
  
  parseOutput(raw: string): CerberViolation[] {
    // Parse zizmor JSON output (security findings)
    const data = JSON.parse(raw);
    return data.results.map(item => ({
      id: `zizmor/${item.check_id}`,
      severity: item.severity === 'high' ? 'error' : 'warning',
      message: item.message,
      path: item.location.path,
      line: item.location.start_line,
      hint: item.remediation,
      source: 'zizmor',
      toolOutput: item
    }));
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/adapters/ZizmorAdapter.ts
- ✅ Registered in ToolRegistry
- ✅ Git committed

**Tests:**
- Unit test: parseOutput with sample zizmor JSON
- Integration test: run on fixtures with security issues

---

### 1.4 Ratchet Adapter (6h)

**Create:**
```typescript
// src/orchestrator/adapters/RatchetAdapter.ts
export class RatchetAdapter implements ToolAdapter {
  name = 'ratchet';
  
  async run(options: RunOptions): Promise<ToolOutput> {
    const args = ['check'];
    if (options.files) {
      args.push(...options.files);
    }
    
    const result = await execa('ratchet', args, { reject: false });
    // ... parse unpinned actions
  }
  
  parseOutput(raw: string): CerberViolation[] {
    // Parse ratchet output (unpinned actions)
    const lines = raw.split('\n');
    const violations: CerberViolation[] = [];
    
    for (const line of lines) {
      const match = line.match(/(.+):(\d+): (.+)/);
      if (match) {
        violations.push({
          id: 'ci/pin-versions',
          severity: 'warning',
          message: match[3],
          path: match[1],
          line: parseInt(match[2]),
          hint: 'Pin action to commit SHA or @vX.Y.Z',
          source: 'ratchet',
          toolOutput: { raw: line }
        });
      }
    }
    
    return violations;
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/adapters/RatchetAdapter.ts
- ✅ Registered in ToolRegistry
- ✅ Git committed

**Tests:**
- Unit test: parseOutput with sample ratchet output
- Integration test: detect unpinned actions

---

### 1.5 Orchestrator Engine (8h)

**Create:**
```typescript
// src/orchestrator/Orchestrator.ts
export class Orchestrator {
  constructor(
    private registry: ToolRegistry,
    private contract: Contract
  ) {}
  
  async validate(options: ValidateOptions): Promise<CerberOutput> {
    const violations: CerberViolation[] = [];
    const metadata: any = {
      profile: options.profile,
      tools: []
    };
    
    // 1. Get profile config
    const profile = this.contract.profiles[options.profile];
    
    // 2. Run enabled tools
    for (const toolName of profile.enable) {
      const adapter = this.registry.get(toolName);
      if (!adapter) {
        console.warn(`⚠️  Tool '${toolName}' not found`);
        continue;
      }
      
      // Check if installed
      const installed = await adapter.isInstalled();
      if (!installed) {
        console.warn(`⚠️  ${adapter.name} not installed`);
        console.warn(`   Install: ${adapter.getInstallHint()}`);
        metadata.tools.push({
          name: adapter.name,
          enabled: false,
          reason: 'not_installed'
        });
        continue;
      }
      
      // Get version
      const version = await adapter.getVersion();
      metadata.tools.push({
        name: adapter.name,
        version,
        enabled: true
      });
      
      // Run tool
      console.log(`🔍 Running ${adapter.name}...`);
      const output = await adapter.run({ files: options.files });
      
      // Parse violations
      const toolViolations = adapter.parseOutput(output.stdout);
      violations.push(...toolViolations);
    }
    
    // 3. Filter by severity (based on profile.failOn)
    const filtered = violations.filter(v => 
      profile.failOn.includes(v.severity)
    );
    
    // 4. Generate deterministic output
    return this.generateOutput(filtered, metadata);
  }
  
  private generateOutput(
    violations: CerberViolation[],
    metadata: any
  ): CerberOutput {
    // Sort violations (deterministic)
    violations.sort((a, b) => {
      // Sort by: path, line, column, id
      if (a.path !== b.path) return a.path.localeCompare(b.path);
      if (a.line !== b.line) return (a.line || 0) - (b.line || 0);
      if (a.column !== b.column) return (a.column || 0) - (b.column || 0);
      return a.id.localeCompare(b.id);
    });
    
    const summary = {
      total: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length
    };
    
    return {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      summary,
      violations,
      metadata
    };
  }
}
```

**Deliverables:**
- ✅ src/orchestrator/Orchestrator.ts
- ✅ Integration with ToolRegistry + Contract
- ✅ Deterministic output (sorted)
- ✅ Git committed

**Tests:**
- Unit test: validate() with mock adapters
- Integration test: full validation on fixtures
- Snapshot test: output determinism

---

### 1.7 Execution State Machine (8h) - **CRITICAL**

**Problem:** Orchestrator nie ma stanu wykonania - nie można trackować progressu, debugować, ani wznowić po błędzie.

**Create:**
```typescript
// src/core/execution/ExecutionContext.ts
export enum ExecutionState {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  VALIDATING_INPUT = 'validating_input',
  DISCOVERING_FILES = 'discovering_files',
  CHECKING_TOOLS = 'checking_tools',
  RUNNING_ADAPTERS = 'running_adapters',
  MERGING_RESULTS = 'merging_results',
  VALIDATING_OUTPUT = 'validating_output',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionContext {
  id: string;                      // Unique execution ID (UUID)
  state: ExecutionState;
  startTime: Date;
  endTime?: Date;
  options: OrchestratorRunOptions;
  
  metadata: {
    adapters: Array<{
      name: string;
      state: 'pending' | 'running' | 'completed' | 'failed';
      startTime?: Date;
      endTime?: Date;
      error?: string;
    }>;
    files: string[];
    errors: Error[];
    warnings: string[];
  };
  
  checkpoints: Array<{
    state: ExecutionState;
    timestamp: Date;
    data?: any;
  }>;
}

export class ExecutionContextManager {
  private executions: Map<string, ExecutionContext> = new Map();
  private currentExecution: ExecutionContext | null = null;
  
  create(options: OrchestratorRunOptions): ExecutionContext {
    const context: ExecutionContext = {
      id: generateUUID(),
      state: ExecutionState.PENDING,
      startTime: new Date(),
      options,
      metadata: {
        adapters: [],
        files: [],
        errors: [],
        warnings: []
      },
      checkpoints: []
    };
    
    this.executions.set(context.id, context);
    this.currentExecution = context;
    return context;
  }
  
  transitionTo(state: ExecutionState, data?: any): void {
    if (!this.currentExecution) {
      throw new Error('No active execution');
    }
    
    const prev = this.currentExecution.state;
    this.currentExecution.state = state;
    
    // Create checkpoint
    this.currentExecution.checkpoints.push({
      state,
      timestamp: new Date(),
      data
    });
    
    // Emit event for monitoring
    this.emit('state_transition', {
      executionId: this.currentExecution.id,
      from: prev,
      to: state,
      data
    });
  }
  
  getCurrent(): ExecutionContext | null {
    return this.currentExecution;
  }
  
  get(id: string): ExecutionContext | undefined {
    return this.executions.get(id);
  }
}
```

**Update Orchestrator:**
```typescript
// src/core/Orchestrator.ts
export class Orchestrator {
  private contextManager: ExecutionContextManager;
  
  async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
    // Create execution context
    const context = this.contextManager.create(options);
    
    try {
      // State machine flow
      await this.transitionTo(ExecutionState.INITIALIZING);
      await this.initialize();
      
      await this.transitionTo(ExecutionState.VALIDATING_INPUT);
      await this.validateInput(options);
      
      await this.transitionTo(ExecutionState.DISCOVERING_FILES);
      const files = await this.discoverFiles(options);
      
      await this.transitionTo(ExecutionState.CHECKING_TOOLS);
      await this.checkTools();
      
      await this.transitionTo(ExecutionState.RUNNING_ADAPTERS);
      const results = await this.runAdapters(options);
      
      await this.transitionTo(ExecutionState.MERGING_RESULTS);
      const merged = await this.mergeResults(results);
      
      await this.transitionTo(ExecutionState.VALIDATING_OUTPUT);
      await this.validateOutput(merged);
      
      await this.transitionTo(ExecutionState.COMPLETED);
      return merged;
      
    } catch (error) {
      await this.transitionTo(ExecutionState.FAILED, error);
      throw error;
    }
  }
  
  private async transitionTo(state: ExecutionState, data?: any): Promise<void> {
    this.contextManager.transitionTo(state, data);
    await this.executeStateLogic(state, data);
  }
}
```

**Deliverables:**
- ✅ ExecutionContext interface
- ✅ ExecutionState enum
- ✅ ExecutionContextManager
- ✅ State machine integration in Orchestrator
- ✅ Checkpoint system for recovery
- ✅ Git committed

**Tests:**
- Unit test: state transitions (15 tests)
- Unit test: checkpoint creation
- Unit test: execution tracking
- Integration test: full state machine flow

---

### 1.8 Reliability Patterns (12h) - **CRITICAL**

**Problem:** Orchestrator fails fast bez retry, circuit breaker, timeout management.

**Create:**
```typescript
// src/core/reliability/CircuitBreaker.ts
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime?: Date;
  
  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>, name: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitOpenError(`Circuit breaker open for ${name}`);
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime.getTime() > this.resetTimeout;
  }
}

// src/core/reliability/RetryExecutor.ts
export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: Array<new (...args: any[]) => Error>;
}

export class RetryExecutor {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    policy: RetryPolicy,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isRetryable(error, policy)) {
          throw error;
        }
        
        if (attempt === policy.maxAttempts) {
          throw new MaxRetriesExceededError(context, attempt, lastError);
        }
        
        const delay = this.calculateDelay(attempt, policy);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    const delay = policy.initialDelay * Math.pow(policy.backoffMultiplier, attempt - 1);
    return Math.min(delay, policy.maxDelay);
  }
  
  private isRetryable(error: any, policy: RetryPolicy): boolean {
    return policy.retryableErrors.some(ErrorType => error instanceof ErrorType);
  }
}

// src/core/reliability/TimeoutManager.ts
export class TimeoutManager {
  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
    context: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(`Operation timed out after ${timeout}ms: ${context}`));
        }, timeout);
      })
    ]);
  }
}
```

**Update Orchestrator:**
```typescript
export class Orchestrator {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryExecutor: RetryExecutor;
  private timeoutManager: TimeoutManager;
  
  async runAdapter(adapter: Adapter, options: AdapterRunOptions): Promise<AdapterResult> {
    const breaker = this.getOrCreateCircuitBreaker(adapter.name);
    
    const policy: RetryPolicy = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [NetworkError, ToolCrashedError]
    };
    
    return breaker.execute(
      () => this.retryExecutor.executeWithRetry(
        () => this.timeoutManager.executeWithTimeout(
          () => adapter.run(options),
          options.timeout ?? 30000,
          `Adapter ${adapter.name}`
        ),
        policy,
        `Adapter ${adapter.name}`
      ),
      adapter.name
    );
  }
}
```

**Deliverables:**
- ✅ CircuitBreaker class
- ✅ RetryExecutor with exponential backoff
- ✅ TimeoutManager
- ✅ Integration in Orchestrator
- ✅ Error types (CircuitOpenError, MaxRetriesExceededError, TimeoutError)
- ✅ Git committed

**Tests:**
- Unit test: CircuitBreaker states (10 tests)
- Unit test: RetryExecutor logic (10 tests)
- Unit test: TimeoutManager (5 tests)
- Integration test: adapter with retry + circuit breaker

---

### 1.6 Reporting & Output Formats (8h)

**Create unified reporting system:**

```typescript
// src/reporting/violation.ts
export interface CerberViolation {
  id: string;              // Stable rule ID (e.g., "security/no-secrets")
  severity: 'error' | 'warning' | 'info';
  message: string;
  path: string;            // Relative path from repo root
  line?: number;           // 1-indexed
  column?: number;         // 1-indexed
  hint?: string;           // Fix suggestion
  source: string;          // Tool name (e.g., "actionlint", "zizmor")
  toolOutput?: any;        // Original tool output (debugging)
}

export interface CerberOutput {
  version: string;         // Schema version
  timestamp: string;       // ISO 8601
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
  violations: CerberViolation[];
  metadata: {
    profile: string;
    target: string;
    tools: Array<{
      name: string;
      version?: string;
      enabled: boolean;
    }>;
    contract: string;      // Path to contract
  };
}
```

**Create formatters:**

```typescript
// src/reporting/format-text.ts
export function formatText(output: CerberOutput): string {
  let result = '';
  
  result += `\n🛡️  CERBER VALIDATION REPORT\n`;
  result += `   Profile: ${output.metadata.profile}\n`;
  result += `   Target: ${output.metadata.target}\n`;
  result += `   Tools: ${output.metadata.tools.map(t => `${t.name} (${t.version})`).join(', ')}\n`;
  
  result += `\n📊 Summary:\n`;
  result += `   Total: ${output.summary.total}\n`;
  result += `   Errors: ${output.summary.errors}\n`;
  result += `   Warnings: ${output.summary.warnings}\n`;
  result += `   Info: ${output.summary.info}\n`;
  
  if (output.violations.length > 0) {
    result += `\n❌ Violations:\n\n`;
    
    for (const v of output.violations) {
      const icon = v.severity === 'error' ? '❌' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
      result += `${icon} ${v.id} (${v.source})\n`;
      result += `   ${v.path}:${v.line || '?'}${v.column ? `:${v.column}` : ''}\n`;
      result += `   ${v.message}\n`;
      if (v.hint) {
        result += `   💡 ${v.hint}\n`;
      }
      result += '\n';
    }
  } else {
    result += `\n✅ No violations found!\n`;
  }
  
  return result;
}

// src/reporting/format-json.ts
export function formatJSON(output: CerberOutput): string {
  // Deterministic JSON (sorted keys)
  return JSON.stringify(output, null, 2);
}

// src/reporting/format-github.ts
export function formatGitHub(output: CerberOutput): string {
  // GitHub Actions annotations format
  let result = '';
  
  for (const v of output.violations) {
    const level = v.severity === 'error' ? 'error' : 'warning';
    const location = `file=${v.path},line=${v.line || 1},col=${v.column || 1}`;
    result += `::${level} ${location}::${v.id}: ${v.message}\n`;
  }
  
  return result;
}

// src/reporting/format-sarif.ts
export function formatSARIF(output: CerberOutput): string {
  // SARIF 2.1.0 format (GitHub Code Scanning compatible)
  const sarif = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'Cerber',
            version: output.version,
            informationUri: 'https://github.com/Agaslez/cerber-core',
            rules: generateRules(output.violations)
          }
        },
        results: output.violations.map(v => ({
          ruleId: v.id,
          level: v.severity === 'error' ? 'error' : 'warning',
          message: {
            text: v.message
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: v.path
                },
                region: {
                  startLine: v.line || 1,
                  startColumn: v.column || 1
                }
              }
            }
          ]
        }))
      }
    ]
  };
  
  return JSON.stringify(sarif, null, 2);
}

function generateRules(violations: CerberViolation[]): any[] {
  const uniqueRules = new Map<string, CerberViolation>();
  
  for (const v of violations) {
    if (!uniqueRules.has(v.id)) {
      uniqueRules.set(v.id, v);
    }
  }
  
  return Array.from(uniqueRules.values()).map(v => ({
    id: v.id,
    shortDescription: {
      text: v.message
    },
    helpUri: `https://cerber-core.dev/rules/${v.id}`,
    properties: {
      source: v.source
    }
  }));
}

// src/reporting/formatter.ts
export class ReportFormatter {
  format(output: CerberOutput, format: 'text' | 'json' | 'github' | 'sarif'): string {
    switch (format) {
      case 'text':
        return formatText(output);
      case 'json':
        return formatJSON(output);
      case 'github':
        return formatGitHub(output);
      case 'sarif':
        return formatSARIF(output);
      default:
        throw new Error(`Unknown format: ${format}`);
    }
  }
}
```

**Deliverables:**
- ✅ src/reporting/violation.ts (unified model)
- ✅ src/reporting/format-text.ts
- ✅ src/reporting/format-json.ts
- ✅ src/reporting/format-github.ts (::error annotations)
- ✅ src/reporting/format-sarif.ts (GitHub Code Scanning)
- ✅ src/reporting/formatter.ts (dispatcher)
- ✅ Git committed

**Tests:**
- Unit test: each formatter with sample output
- Snapshot test: format consistency
- Integration test: full pipeline with different formats

---

### 1.7 Execution State Machine (8h) - **CRITICAL**

**Problem:** Orchestrator nie ma stanu wykonania - nie można trackować progressu, debugować, ani wznowić po błędzie.

**Create:**
```typescript
// src/core/execution/ExecutionContext.ts
export enum ExecutionState {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  VALIDATING_INPUT = 'validating_input',
  DISCOVERING_FILES = 'discovering_files',
  CHECKING_TOOLS = 'checking_tools',
  RUNNING_ADAPTERS = 'running_adapters',
  MERGING_RESULTS = 'merging_results',
  VALIDATING_OUTPUT = 'validating_output',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ExecutionContext {
  id: string;                      // Unique execution ID (UUID)
  state: ExecutionState;
  startTime: Date;
  endTime?: Date;
  options: OrchestratorRunOptions;
  
  metadata: {
    adapters: Array<{
      name: string;
      state: 'pending' | 'running' | 'completed' | 'failed';
      startTime?: Date;
      endTime?: Date;
      error?: string;
    }>;
    files: string[];
    errors: Error[];
    warnings: string[];
  };
  
  checkpoints: Array<{
    state: ExecutionState;
    timestamp: Date;
    data?: any;
  }>;
}

export class ExecutionContextManager {
  private executions: Map<string, ExecutionContext> = new Map();
  private currentExecution: ExecutionContext | null = null;
  
  create(options: OrchestratorRunOptions): ExecutionContext {
    const context: ExecutionContext = {
      id: generateUUID(),
      state: ExecutionState.PENDING,
      startTime: new Date(),
      options,
      metadata: {
        adapters: [],
        files: [],
        errors: [],
        warnings: []
      },
      checkpoints: []
    };
    
    this.executions.set(context.id, context);
    this.currentExecution = context;
    return context;
  }
  
  transitionTo(state: ExecutionState, data?: any): void {
    if (!this.currentExecution) {
      throw new Error('No active execution');
    }
    
    const prev = this.currentExecution.state;
    this.currentExecution.state = state;
    
    // Create checkpoint
    this.currentExecution.checkpoints.push({
      state,
      timestamp: new Date(),
      data
    });
    
    // Emit event for monitoring
    this.emit('state_transition', {
      executionId: this.currentExecution.id,
      from: prev,
      to: state,
      data
    });
  }
  
  getCurrent(): ExecutionContext | null {
    return this.currentExecution;
  }
  
  get(id: string): ExecutionContext | undefined {
    return this.executions.get(id);
  }
}
```

**Update Orchestrator:**
```typescript
// src/core/Orchestrator.ts
export class Orchestrator {
  private contextManager: ExecutionContextManager;
  
  async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
    // Create execution context
    const context = this.contextManager.create(options);
    
    try {
      // State machine flow
      await this.transitionTo(ExecutionState.INITIALIZING);
      await this.initialize();
      
      await this.transitionTo(ExecutionState.VALIDATING_INPUT);
      await this.validateInput(options);
      
      await this.transitionTo(ExecutionState.DISCOVERING_FILES);
      const files = await this.discoverFiles(options);
      
      await this.transitionTo(ExecutionState.CHECKING_TOOLS);
      await this.checkTools();
      
      await this.transitionTo(ExecutionState.RUNNING_ADAPTERS);
      const results = await this.runAdapters(options);
      
      await this.transitionTo(ExecutionState.MERGING_RESULTS);
      const merged = await this.mergeResults(results);
      
      await this.transitionTo(ExecutionState.VALIDATING_OUTPUT);
      await this.validateOutput(merged);
      
      await this.transitionTo(ExecutionState.COMPLETED);
      return merged;
      
    } catch (error) {
      await this.transitionTo(ExecutionState.FAILED, error);
      throw error;
    }
  }
  
  private async transitionTo(state: ExecutionState, data?: any): Promise<void> {
    this.contextManager.transitionTo(state, data);
    await this.executeStateLogic(state, data);
  }
}
```

**Deliverables:**
- ✅ ExecutionContext interface
- ✅ ExecutionState enum
- ✅ ExecutionContextManager
- ✅ State machine integration in Orchestrator
- ✅ Checkpoint system for recovery
- ✅ Git committed

**Tests:**
- Unit test: state transitions (15 tests)
- Unit test: checkpoint creation
- Unit test: execution tracking
- Integration test: full state machine flow

---

### 1.8 Reliability Patterns (12h) - **CRITICAL**

**Problem:** Orchestrator fails fast bez retry, circuit breaker, timeout management.

**Create:**
```typescript
// src/core/reliability/CircuitBreaker.ts
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime?: Date;
  
  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeout: number = 60000
  ) {}
  
  async execute<T>(fn: () => Promise<T>, name: string): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitOpenError(`Circuit breaker open for ${name}`);
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime.getTime() > this.resetTimeout;
  }
}

// src/core/reliability/RetryExecutor.ts
export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: Array<new (...args: any[]) => Error>;
}

export class RetryExecutor {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    policy: RetryPolicy,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isRetryable(error, policy)) {
          throw error;
        }
        
        if (attempt === policy.maxAttempts) {
          throw new MaxRetriesExceededError(context, attempt, lastError);
        }
        
        const delay = this.calculateDelay(attempt, policy);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    const delay = policy.initialDelay * Math.pow(policy.backoffMultiplier, attempt - 1);
    return Math.min(delay, policy.maxDelay);
  }
  
  private isRetryable(error: any, policy: RetryPolicy): boolean {
    return policy.retryableErrors.some(ErrorType => error instanceof ErrorType);
  }
}

// src/core/reliability/TimeoutManager.ts
export class TimeoutManager {
  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
    context: string
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(`Operation timed out after ${timeout}ms: ${context}`));
        }, timeout);
      })
    ]);
  }
}
```

**Update Orchestrator:**
```typescript
export class Orchestrator {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryExecutor: RetryExecutor;
  private timeoutManager: TimeoutManager;
  
  async runAdapter(adapter: Adapter, options: AdapterRunOptions): Promise<AdapterResult> {
    const breaker = this.getOrCreateCircuitBreaker(adapter.name);
    
    const policy: RetryPolicy = {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [NetworkError, ToolCrashedError]
    };
    
    return breaker.execute(
      () => this.retryExecutor.executeWithRetry(
        () => this.timeoutManager.executeWithTimeout(
          () => adapter.run(options),
          options.timeout ?? 30000,
          `Adapter ${adapter.name}`
        ),
        policy,
        `Adapter ${adapter.name}`
      ),
      adapter.name
    );
  }
}
```

**Deliverables:**
- ✅ CircuitBreaker class
- ✅ RetryExecutor with exponential backoff
- ✅ TimeoutManager
- ✅ Integration in Orchestrator
- ✅ Error types (CircuitOpenError, MaxRetriesExceededError, TimeoutError)
- ✅ Git committed

**Tests:**
- Unit test: CircuitBreaker states (10 tests)
- Unit test: RetryExecutor logic (10 tests)
- Unit test: TimeoutManager (5 tests)
- Integration test: adapter with retry + circuit breaker

---

## 🎯 PHASE 2: OBSERVABILITY & OPERATIONS (Dni 8-12) - 50h

**Cel:** Production-ready observability, configuration, and operations

### 2.1 Observability Stack (10h) - **CRITICAL**

**Problem:** Orchestrator = black box - zero visibility do execution flow

**Create:**
```typescript
// src/core/observability/TracingCollector.ts
export interface Span {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'OK' | 'ERROR';
  attributes: Record<string, any>;
  events: SpanEvent[];
}

export class TracingCollector {
  private spans: Map<string, Span> = new Map();
  
  startSpan(name: string, parentId?: string): Span {
    const span: Span = {
      id: generateId(),
      traceId: parentId ? this.getTraceId(parentId) : generateId(),
      parentId,
      name,
      startTime: new Date(),
      status: 'OK',
      attributes: {},
      events: []
    };
    
    this.spans.set(span.id, span);
    return span;
  }
  
  endSpan(spanId: string, status: 'OK' | 'ERROR'): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = new Date();
      span.duration = span.endTime.getTime() - span.startTime.getTime();
      span.status = status;
    }
  }
  
  addEvent(spanId: string, event: SpanEvent): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push(event);
    }
  }
  
  exportTraces(): Span[] {
    return Array.from(this.spans.values());
  }
}

// src/core/observability/MetricsCollector.ts
export class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  increment(metric: string, value = 1): void {
    const current = this.counters.get(metric) || 0;
    this.counters.set(metric, current + value);
  }
  
  gauge(metric: string, value: number): void {
    this.gauges.set(metric, value);
  }
  
  recordTime(metric: string, duration: number): void {
    const values = this.histograms.get(metric) || [];
    values.push(duration);
    this.histograms.set(metric, values);
  }
  
  getP95(metric: string): number {
    const values = this.histograms.get(metric) || [];
    return this.percentile(values, 0.95);
  }
  
  exportMetrics(): Record<string, any> {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([k, v]) => [
          k,
          { count: v.length, p50: this.percentile(v, 0.5), p95: this.percentile(v, 0.95) }
        ])
      )
    };
  }
}

// src/core/observability/StructuredLogger.ts
export class StructuredLogger {
  log(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, context?: Record<string, any>): void {
    const entry = {
      '@timestamp': new Date().toISOString(),
      level,
      message,
      ...context
    };
    
    console.log(JSON.stringify(entry));
  }
}
```

**Update Orchestrator:**
```typescript
export class Orchestrator {
  private tracing: TracingCollector;
  private metrics: MetricsCollector;
  private logger: StructuredLogger;
  
  async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
    const rootSpan = this.tracing.startSpan('orchestrator.run');
    this.metrics.increment('orchestrator.executions.total');
    
    try {
      // Each phase gets its own span
      const validateSpan = this.tracing.startSpan('validate_input', rootSpan.id);
      await this.validateInput(options);
      this.tracing.endSpan(validateSpan.id, 'OK');
      
      // Run adapters with tracing
      for (const adapter of adapters) {
        const adapterSpan = this.tracing.startSpan(`adapter.${adapter.name}`, rootSpan.id);
        const startTime = Date.now();
        
        try {
          const result = await adapter.run(options);
          const duration = Date.now() - startTime;
          
          this.tracing.addEvent(adapterSpan.id, {
            type: 'violations_found',
            count: result.violations.length
          });
          this.tracing.endSpan(adapterSpan.id, 'OK');
          
          this.metrics.increment(`adapter.${adapter.name}.runs`);
          this.metrics.recordTime(`adapter.${adapter.name}.duration_ms`, duration);
          this.metrics.increment(`adapter.${adapter.name}.violations`, result.violations.length);
        } catch (error) {
          this.tracing.endSpan(adapterSpan.id, 'ERROR');
          this.metrics.increment(`adapter.${adapter.name}.errors`);
          this.logger.log('ERROR', `Adapter ${adapter.name} failed`, { error: error.message });
        }
      }
      
      this.tracing.endSpan(rootSpan.id, 'OK');
      this.metrics.increment('orchestrator.executions.success');
      
      return result;
    } catch (error) {
      this.tracing.endSpan(rootSpan.id, 'ERROR');
      this.metrics.increment('orchestrator.executions.failed');
      throw error;
    }
  }
  
  getMetrics(): Record<string, any> {
    return this.metrics.exportMetrics();
  }
  
  getTraces(): Span[] {
    return this.tracing.exportTraces();
  }
}
```

**Deliverables:**
- ✅ TracingCollector (distributed tracing)
- ✅ MetricsCollector (counters, gauges, histograms)
- ✅ StructuredLogger (JSON logs)
- ✅ Integration in Orchestrator
- ✅ CLI command: `cerber metrics` (show stats)
- ✅ CLI command: `cerber traces <execution-id>` (show trace)
- ✅ Git committed

**Tests:**
- Unit test: TracingCollector (15 tests)
- Unit test: MetricsCollector (10 tests)
- Unit test: StructuredLogger (5 tests)
- Integration test: full observability stack

---

### 2.2 Configuration Management (6h) - **CRITICAL**

**Problem:** Brak runtime configuration, hot reload, priority overrides

**Create:**
```typescript
// src/core/config/ConfigurationManager.ts
export interface Configuration {
  contract: Contract;
  
  runtime: {
    adapters: {
      [name: string]: {
        enabled: boolean;
        timeout: number;
        retryPolicy: RetryPolicy;
        circuitBreaker: CircuitBreakerConfig;
      };
    };
    
    orchestrator: {
      mode: 'solo' | 'dev' | 'team';
      parallel: boolean;
      maxConcurrency: number;
      globalTimeout: number;
    };
    
    observability: {
      tracing: boolean;
      metrics: boolean;
      logging: {
        level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
        format: 'json' | 'text';
      };
    };
    
    features: {
      autoInstall: boolean;
      selfHealing: boolean;
      telemetry: boolean;
    };
  };
}

export class ConfigurationManager {
  private config: Configuration;
  private watchers: Array<(config: Configuration) => void> = [];
  
  async load(contractPath?: string): Promise<Configuration> {
    const contract = await ContractLoader.load(contractPath || '.cerber/contract.yml');
    const runtime = await this.loadRuntimeConfig();
    
    this.config = { contract, runtime };
    return this.config;
  }
  
  async reload(): Promise<void> {
    const newConfig = await this.load();
    this.config = newConfig;
    
    // Notify watchers
    this.watchers.forEach(watcher => watcher(newConfig));
  }
  
  override(path: string, value: any): void {
    set(this.config, path, value);
    this.watchers.forEach(watcher => watcher(this.config));
  }
  
  get<T>(path: string, fallback?: T): T {
    return get(this.config, path, fallback);
  }
  
  watch(watcher: (config: Configuration) => void): () => void {
    this.watchers.push(watcher);
    return () => {
      const index = this.watchers.indexOf(watcher);
      if (index > -1) this.watchers.splice(index, 1);
    };
  }
}
```

**Priority order:**
1. CLI flags (highest)
2. Environment variables
3. Runtime config file
4. Contract (lowest)

**Deliverables:**
- ✅ ConfigurationManager
- ✅ Hot reload support
- ✅ Runtime overrides
- ✅ Priority resolution
- ✅ Git committed

**Tests:**
- Unit test: configuration loading (10 tests)
- Unit test: priority resolution (5 tests)
- Unit test: hot reload (5 tests)

---

### 2.3 Execution Persistence & Audit (8h) - **CRITICAL**

**Problem:** Brak historii wykonań - nie można zreprodukować błędów

**Create:**
```typescript
// src/core/persistence/ExecutionStore.ts
export interface ExecutionRecord {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  input: {
    options: OrchestratorRunOptions;
    files: string[];
    config: Configuration;
  };
  
  output?: OrchestratorResult;
  
  timeline: Array<{
    timestamp: Date;
    type: string;
    data: any;
  }>;
  
  error?: {
    message: string;
    stack: string;
    recoverable: boolean;
  };
  
  metadata: {
    user?: string;
    ci?: string;
    commit?: string;
    branch?: string;
    environment: string;
  };
}

export class ExecutionStore {
  private store: Map<string, ExecutionRecord> = new Map();
  private persistPath: string;
  
  async save(execution: ExecutionRecord): Promise<void> {
    this.store.set(execution.id, execution);
    
    // Persist to disk
    await fs.writeFile(
      path.join(this.persistPath, `${execution.id}.json`),
      JSON.stringify(execution, null, 2)
    );
  }
  
  async get(id: string): Promise<ExecutionRecord | null> {
    return this.store.get(id) || null;
  }
  
  async list(filters?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ExecutionRecord[]> {
    let records = Array.from(this.store.values());
    
    if (filters) {
      if (filters.status) {
        records = records.filter(r => r.status === filters.status);
      }
      if (filters.startDate) {
        records = records.filter(r => r.startTime >= filters.startDate!);
      }
    }
    
    return records.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
  
  async replay(id: string): Promise<OrchestratorResult> {
    const record = await this.get(id);
    if (!record) {
      throw new Error(`Execution ${id} not found`);
    }
    
    // Replay with same inputs
    const orchestrator = new Orchestrator();
    return orchestrator.run(record.input.options);
  }
}
```

**CLI Commands:**
```bash
cerber history                          # List executions
cerber history --status=failed          # Filter by status
cerber show <execution-id>              # Show details
cerber replay <execution-id>            # Replay execution
cerber diff <exec-1> <exec-2>           # Compare executions
```

**Deliverables:**
- ✅ ExecutionStore
- ✅ Persistence to disk (~/.cerber/history/)
- ✅ CLI commands (history, show, replay, diff)
- ✅ Git committed

**Tests:**
- Unit test: ExecutionStore (15 tests)
- Integration test: persistence + replay
- E2E test: CLI commands

---

### 2.4 Update cerber validate (6h)

**Supports multiple input modes:**
```bash
# Mode 1: Auto-detect (all files in target)
cerber validate --target github-actions

# Mode 2: Specific files
cerber validate --files .github/workflows/ci.yml

# Mode 3: Changed files (PR mode)
cerber validate --changed --base-branch main

# Mode 4: Staged files (pre-commit)
cerber validate --staged

# Mode 5: Stdin (pipeline integration)
echo ".github/workflows/ci.yml" | cerber validate --stdin
```

**Implementation:**
```typescript
// bin/cerber-validate
#!/usr/bin/env node
import { Orchestrator } from '../dist/orchestrator/Orchestrator.js';
import { ToolRegistry } from '../dist/orchestrator/ToolRegistry.js';
import { ContractLoader } from '../dist/contracts/ContractLoader.js';
import { ActionlintAdapter } from '../dist/orchestrator/adapters/ActionlintAdapter.js';
import { ZizmorAdapter } from '../dist/orchestrator/adapters/ZizmorAdapter.js';
import { RatchetAdapter } from '../dist/orchestrator/adapters/RatchetAdapter.js';

async function main() {
  const args = parseArgs(process.argv.slice(2));
  
  // Load contract
  const loader = new ContractLoader();
  const contract = await loader.load(args.contract || '.cerber/contract.yml');
  
  // Setup registry
  const registry = new ToolRegistry();
  registry.register('actionlint', new ActionlintAdapter());
  registry.register('zizmor', new ZizmorAdapter());
  registry.register('ratchet', new RatchetAdapter());
  
  // Run orchestrator
  const orchestrator = new Orchestrator(registry, contract);
  const result = await orchestrator.validate({
    profile: args.profile || 'dev',
    files: args.files
  });
  
  // Output
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printTextOutput(result);
  }
  
  // Exit code
  const exitCode = result.summary.errors > 0 ? 1 : 0;
  process.exit(exitCode);
}

function parseArgs(argv: string[]): any {
  // Parse: --profile, --json, --files, --contract
}

function printTextOutput(result: CerberOutput): void {
  // Human-readable output
  console.log(`\n🛡️  CERBER VALIDATION REPORT`);
  console.log(`   Profile: ${result.metadata.profile}`);
  console.log(`   Tools: ${result.metadata.tools.map(t => t.name).join(', ')}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${result.summary.total}`);
  console.log(`   Errors: ${result.summary.errors}`);
  console.log(`   Warnings: ${result.summary.warnings}`);
  
  if (result.violations.length > 0) {
    console.log(`\n❌ Violations:\n`);
    for (const v of result.violations) {
      console.log(`   ${v.severity.toUpperCase()}: ${v.id}`);
      console.log(`   ${v.path}:${v.line || '?'}`);
      console.log(`   ${v.message}`);
      if (v.hint) {
        console.log(`   💡 ${v.hint}`);
      }
      console.log('');
    }
  }
}

main();
```

**Deliverables:**
- ✅ bin/cerber-validate updated
- ✅ Supports --profile, --json, --files
- ✅ Git committed

**Tests:**
- E2E test: run cerber-validate on fixtures
- Snapshot test: JSON output determinism
- Test: --profile solo/dev/team changes behavior

---

### 2.2 Create cerber doctor (6h)

**Create:**
```bash
# bin/cerber-doctor
```

**Features:**
1. Detect project type (package.json, Dockerfile, etc.)
2. Scan for workflows (.github/workflows/)
3. Check tool installation (actionlint, zizmor, ratchet)
4. Generate contract.yml (if missing)
5. Show health report

**Implementation:**
```typescript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🏥 CERBER DOCTOR - Project Health Check\n');
  
  // 1. Detect project
  const projectType = detectProjectType(process.cwd());
  console.log(`📦 Project type: ${projectType}`);
  
  // 2. Check workflows
  const workflowsDir = path.join(process.cwd(), '.github/workflows');
  if (fs.existsSync(workflowsDir)) {
    const workflows = fs.readdirSync(workflowsDir);
    console.log(`📁 Workflows found: ${workflows.length}`);
  } else {
    console.log('⚠️  No workflows found');
  }
  
  // 3. Check tools
  console.log('\n🔧 Tool Status:');
  const registry = new ToolRegistry();
  registry.register('actionlint', new ActionlintAdapter());
  registry.register('zizmor', new ZizmorAdapter());
  registry.register('ratchet', new RatchetAdapter());
  
  const statuses = await registry.checkAll();
  for (const status of statuses) {
    if (status.installed) {
      console.log(`   ✅ ${status.name} (${status.version})`);
    } else {
      console.log(`   ❌ ${status.name} - not installed`);
      console.log(`      Install: ${status.installHint}`);
    }
  }
  
  // 4. Check contract
  const contractPath = path.join(process.cwd(), '.cerber/contract.yml');
  if (!fs.existsSync(contractPath)) {
    console.log('\n⚠️  No contract found');
    console.log('   Run: cerber init --template ' + projectType);
  } else {
    console.log('\n✅ Contract found: .cerber/contract.yml');
  }
  
  // 5. Run validation (if tools available)
  const allInstalled = statuses.every(s => s.installed);
  if (allInstalled && fs.existsSync(contractPath)) {
    console.log('\n🔍 Running validation...');
    // Run orchestrator
  }
  
  console.log('\n✅ Health check complete');
}

function detectProjectType(cwd: string): string {
  // Same as cerber-init
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
    if (pkg.dependencies?.react) return 'react';
    return 'nodejs';
  }
  if (fs.existsSync(path.join(cwd, 'Dockerfile'))) return 'docker';
  if (fs.existsSync(path.join(cwd, 'requirements.txt'))) return 'python';
  if (fs.existsSync(path.join(cwd, 'main.tf'))) return 'terraform';
  return 'unknown';
}

main();
```

**Deliverables:**
- ✅ bin/cerber-doctor created
- ✅ Added to package.json bin
- ✅ Git committed

**Tests:**
- E2E test: run on fixtures (with/without tools)
- Test: detect project type
- Test: check tool status

---

### 2.3 Add Profile Support to Templates (4h)

**Update all 5 templates:**
```yaml
# templates/nodejs/contract.yml
version: 2.0.0
extends: nodejs-base

profiles:
  solo:
    failOn: [error]
    enable: [actionlint]
  dev:
    failOn: [error, warning]
    enable: [actionlint, zizmor]
  team:
    failOn: [error, warning]
    enable: [actionlint, zizmor, ratchet]
    requireDeterministicOutput: true
    requirePinning: true

tools:
  actionlint:
    enabled: true
  zizmor:
    enabled: true
  ratchet:
    enabled: true

rules:
  security/no-hardcoded-secrets:
    enforced: true
    severity: error
    tool: zizmor
  
  ci/pin-versions:
    enforced: true
    severity: warning
    tool: ratchet
  
  best-practices/setup-node-with-version:
    enforced: true
    severity: error
```

**Update:**
- templates/nodejs/contract.yml
- templates/docker/contract.yml
- templates/react/contract.yml
- templates/python/contract.yml
- templates/terraform/contract.yml

**Deliverables:**
- ✅ All 5 templates updated with profiles
- ✅ Git committed

**Tests:**
- Update template tests to validate profiles
- Test: profile inheritance (solo < dev < team)

---

## 🎯 PHASE 3: OPERATIONS & LIFECYCLE (Dni 13-15) - 30h

**Cel:** Production operations, adapter lifecycle, resource management

### 3.1 Adapter Lifecycle Management (6h) - **CRITICAL**

**Problem:** Adapters są fire-and-forget - nie można ich anulować ani monitorować

**Create:**
```typescript
// src/core/lifecycle/AdapterLifecycle.ts
export enum AdapterState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DISPOSED = 'disposed'
}

export interface AdapterLifecycle {
  state: AdapterState;
  adapter: Adapter;
  execution?: {
    startTime: Date;
    endTime?: Date;
    pid?: number;
    cancelToken?: CancellationToken;
  };
  health: {
    lastCheck: Date;
    responsive: boolean;
    errorCount: number;
    successCount: number;
  };
}

export class AdapterManager {
  private lifecycles: Map<string, AdapterLifecycle> = new Map();
  
  async initialize(adapter: Adapter): Promise<void> {
    const lifecycle = this.getOrCreate(adapter);
    
    lifecycle.state = AdapterState.INITIALIZING;
    
    try {
      // Check if tool is installed
      const installed = await adapter.isInstalled();
      if (!installed) {
        throw new Error(`${adapter.name} not installed`);
      }
      
      // Get version
      const version = await adapter.getVersion();
      
      lifecycle.state = AdapterState.READY;
      lifecycle.health = {
        lastCheck: new Date(),
        responsive: true,
        errorCount: 0,
        successCount: 0
      };
    } catch (error) {
      lifecycle.state = AdapterState.FAILED;
      throw error;
    }
  }
  
  async run(adapter: Adapter, options: AdapterRunOptions): Promise<AdapterResult> {
    const lifecycle = this.lifecycles.get(adapter.name);
    if (!lifecycle || lifecycle.state !== AdapterState.READY) {
      throw new Error(`Adapter ${adapter.name} not ready`);
    }
    
    lifecycle.state = AdapterState.RUNNING;
    lifecycle.execution = {
      startTime: new Date(),
      cancelToken: new CancellationToken()
    };
    
    try {
      const result = await adapter.run({
        ...options,
        cancelToken: lifecycle.execution.cancelToken
      });
      
      lifecycle.state = AdapterState.COMPLETED;
      lifecycle.execution.endTime = new Date();
      lifecycle.health.successCount++;
      lifecycle.health.lastCheck = new Date();
      lifecycle.health.responsive = true;
      
      return result;
    } catch (error) {
      lifecycle.state = AdapterState.FAILED;
      lifecycle.health.errorCount++;
      lifecycle.health.responsive = false;
      throw error;
    }
  }
  
  async cancel(adapterName: string): Promise<void> {
    const lifecycle = this.lifecycles.get(adapterName);
    if (!lifecycle || !lifecycle.execution) {
      return;
    }
    
    lifecycle.execution.cancelToken?.cancel();
    lifecycle.state = AdapterState.CANCELLED;
  }
  
  async dispose(adapterName: string): Promise<void> {
    const lifecycle = this.lifecycles.get(adapterName);
    if (!lifecycle) return;
    
    if (lifecycle.state === AdapterState.RUNNING) {
      await this.cancel(adapterName);
    }
    
    lifecycle.state = AdapterState.DISPOSED;
    this.lifecycles.delete(adapterName);
  }
  
  async healthCheck(adapterName: string): Promise<boolean> {
    const lifecycle = this.lifecycles.get(adapterName);
    if (!lifecycle) return false;
    
    try {
      const installed = await lifecycle.adapter.isInstalled();
      lifecycle.health.lastCheck = new Date();
      lifecycle.health.responsive = installed;
      return installed;
    } catch (error) {
      lifecycle.health.responsive = false;
      return false;
    }
  }
  
  getState(adapterName: string): AdapterState | undefined {
    return this.lifecycles.get(adapterName)?.state;
  }
  
  getHealth(adapterName: string): AdapterLifecycle['health'] | undefined {
    return this.lifecycles.get(adapterName)?.health;
  }
}
```

**Deliverables:**
- ✅ AdapterState enum
- ✅ AdapterLifecycle interface
- ✅ AdapterManager with lifecycle methods
- ✅ CancellationToken support
- ✅ Health check per adapter
- ✅ Git committed

**Tests:**
- Unit test: AdapterManager (20 tests)
- Unit test: lifecycle state transitions
- Integration test: cancel long-running adapter
- Integration test: health checks

---

### 3.2 Resource Management (4h)

**Problem:** Brak kontroli nad zasobami - memory leaks, process limits

**Create:**
```typescript
// src/core/resources/ResourceManager.ts
export interface ResourceLimits {
  maxConcurrency: number;
  maxMemoryMB: number;
  maxExecutionTime: number;
  maxFileSize: number;
}

export class ResourceManager {
  private activeProcesses = 0;
  private memoryUsage = 0;
  
  async acquire(limits: ResourceLimits): Promise<ResourceHandle> {
    // Wait if at limit
    while (this.activeProcesses >= limits.maxConcurrency) {
      await this.sleep(100);
    }
    
    // Check memory
    const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    if (currentMemory + this.memoryUsage > limits.maxMemoryMB) {
      throw new OutOfMemoryError();
    }
    
    this.activeProcesses++;
    
    return new ResourceHandle(() => {
      this.activeProcesses--;
    });
  }
}
```

**Deliverables:**
- ✅ ResourceManager
- ✅ ResourceLimits configuration
- ✅ Process/memory tracking
- ✅ Git committed

**Tests:**
- Unit test: ResourceManager (10 tests)
- Integration test: concurrency limits

---

### 3.3 Caching Layer (4h)

**Problem:** Każde wykonanie od zera - brak cache dla wyników

**Create:**
```typescript
// src/core/cache/CacheManager.ts
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl
    });
  }
  
  generateKey(adapter: string, files: string[], config: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(adapter);
    hash.update(JSON.stringify(files));
    hash.update(JSON.stringify(config));
    return hash.digest('hex');
  }
}
```

**Deliverables:**
- ✅ CacheManager
- ✅ TTL support
- ✅ Cache key generation
- ✅ Git committed

**Tests:**
- Unit test: CacheManager (10 tests)

---

### 3.4 Dependency Resolution (4h)

**Problem:** Brak zależności między adapterami

**Create:**
```typescript
// src/core/dependencies/DependencyResolver.ts
export class DependencyResolver {
  resolve(adapters: Adapter[]): Adapter[][] {
    // Topological sort based on dependencies
    const graph = this.buildGraph(adapters);
    return this.topologicalSort(graph);
  }
}
```

**Deliverables:**
- ✅ DependencyResolver
- ✅ Topological sort
- ✅ Git committed

**Tests:**
- Unit test: DependencyResolver (10 tests)

---

### 3.5 Plugin System (6h)

**Problem:** Brak extensibility - nie można dodać custom adapterów

**Create:**
```typescript
// src/core/plugins/PluginManager.ts
export interface Plugin {
  name: string;
  version: string;
  adapters?: Adapter[];
  hooks?: {
    beforeRun?: () => Promise<void>;
    afterRun?: (result: OrchestratorResult) => Promise<void>;
  };
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  
  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }
  
  async loadFromFile(path: string): Promise<void> {
    const plugin = await import(path);
    this.register(plugin.default);
  }
}
```

**Deliverables:**
- ✅ PluginManager
- ✅ Plugin interface
- ✅ Hook system
- ✅ Git committed

**Tests:**
- Unit test: PluginManager (10 tests)

---

## 🎯 PHASE 4: GUARDIAN PRE-COMMIT (Dni 16-17) - 12h

**Cel:** Fast pre-commit with lint-staged

### 3.1 Install lint-staged + Husky (2h)

```bash
npm install --save-dev lint-staged
npx husky install
```

**Create:**
```json
// package.json
{
  "lint-staged": {
    ".github/workflows/*.{yml,yaml}": [
      "cerber-validate --profile dev --changed"
    ],
    ".cerber/*.{yml,yaml}": [
      "cerber-validate --profile dev --contract"
    ]
  }
}
```

**Create:**
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**Deliverables:**
- ✅ lint-staged configured
- ✅ .husky/pre-commit created
- ✅ Git committed

**Tests:**
- Manual test: git commit with violation (should fail)
- Manual test: git commit without violation (should pass)

---

### 3.2 Add --changed Flag (4h)

**Modify cerber-validate:**
```typescript
// Only validate changed files (git diff)
if (args.changed) {
  const changedFiles = await getChangedFiles();
  options.files = changedFiles.filter(f => 
    f.endsWith('.yml') || f.endsWith('.yaml')
  );
}

async function getChangedFiles(): Promise<string[]> {
  const { stdout } = await execa('git', ['diff', '--name-only', '--cached']);
  return stdout.split('\n').filter(Boolean);
}
```

**Deliverables:**
- ✅ --changed flag support
- ✅ Only scans staged files
- ✅ Git committed

**Tests:**
- E2E test: --changed with mock git diff
- Test: filter .yml/.yaml files only

---

### 3.3 Fast Mode (Skip Slow Tools) (4h)

**Modify Orchestrator:**
```typescript
// profiles can specify "fast" tools for pre-commit
profiles:
  dev-fast:
    failOn: [error]
    enable: [actionlint]  # Skip zizmor (slow)
```

**Update lint-staged:**
```json
{
  "lint-staged": {
    ".github/workflows/*.{yml,yaml}": [
      "cerber-validate --profile dev-fast --changed"
    ]
  }
}
```

**Deliverables:**
- ✅ dev-fast profile in templates
- ✅ lint-staged uses fast profile
- ✅ Git committed

**Tests:**
- Benchmark: pre-commit < 2 seconds
- Test: dev-fast only runs actionlint

---

### 3.4 Update GitHub Actions CI (2h)

**Modify:**
```yaml
# .github/workflows/ci.yml
jobs:
  cerber-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install tools
        run: |
          brew install actionlint
          brew install zizmor
          brew install ratchet
          
      - name: Cerber Validate (Team Profile)
        run: npx cerber-validate --profile team --json > cerber-output.json
        
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cerber-results
          path: cerber-output.json
```

**Deliverables:**
- ✅ CI workflow uses team profile
- ✅ Installs all tools
- ✅ Uploads JSON output
- ✅ Git committed

**Tests:**
- Run CI on GitHub (manual verification)

---

## 🎯 PHASE 4: POLISH & RELEASE (Dni 13-15) - 16h

**Cel:** Documentation, tests, release prep

### 4.1 Update Documentation (6h)

**Files to update:**
- README.md (add orchestrator section)
- CERBER.md (profiles, output schema, adapters)
- MIGRATION.md (v1 → v2 guide)
- QUICKSTART.md (updated workflow)

**Sections:**
1. What's new in V2
2. Profiles (solo/dev/team)
3. Tool installation
4. Output schema
5. Migration guide

**Deliverables:**
- ✅ All docs updated
- ✅ Examples added
- ✅ Git committed

**Tests:** N/A (documentation)

---

### 4.2 Add Integration Tests (6h)

**Create:**
```typescript
// test/integration/orchestrator.test.ts
describe('Orchestrator Integration', () => {
  it('should run actionlint on valid workflow', async () => {
    const result = await orchestrator.validate({
      profile: 'dev',
      files: ['fixtures/workflows/valid.yml']
    });
    expect(result.violations).toHaveLength(0);
  });
  
  it('should detect security issues with zizmor', async () => {
    const result = await orchestrator.validate({
      profile: 'dev',
      files: ['fixtures/workflows/insecure.yml']
    });
    expect(result.violations.some(v => v.source === 'zizmor')).toBe(true);
  });
  
  it('should detect unpinned actions with ratchet', async () => {
    const result = await orchestrator.validate({
      profile: 'team',
      files: ['fixtures/workflows/unpinned.yml']
    });
    expect(result.violations.some(v => v.id === 'ci/pin-versions')).toBe(true);
  });
});
```

**Deliverables:**
- ✅ test/integration/orchestrator.test.ts
- ✅ Fixtures for all scenarios
- ✅ Snapshot tests for output
- ✅ Git committed

**Tests:**
- All integration tests passing
- Coverage > 80%

---

### 4.3 Version Bump + Changelog (2h)

**Update:**
- package.json: version → 2.0.0
- CHANGELOG.md: Add V2.0.0 section

**Changelog:**
```markdown
# Changelog

## [2.0.0] - 2026-01-XX

### 🎉 Major Release - Orchestrator Architecture

#### Added
- **Orchestrator Engine** - Run multiple tools from one command
- **Tool Adapters** - actionlint, zizmor, ratchet integration
- **Profiles** - solo/dev/team (business model)
- **cerber doctor** - Auto-detect project + generate contract
- **Deterministic Output** - JSON schema + stable sorting
- **Guardian Pre-commit** - Fast validation with lint-staged
- **Output Schema** - .cerber/output.schema.json

#### Changed
- **cerber-validate** - Now uses orchestrator (backward compatible)
- **Templates** - All templates updated with profiles
- **Contract Schema** - Added profiles + tools sections

#### Breaking Changes
- Output format changed (now includes metadata.tools)
- Exit codes standardized (0/1/2/3)
- Requires Node >= 20

### Migration Guide
See [MIGRATION.md](MIGRATION.md) for v1 → v2 upgrade path.
```

**Deliverables:**
- ✅ package.json version bumped
- ✅ CHANGELOG.md updated
- ✅ Git committed

---

### 4.4 Release Prep (2h)

**Checklist:**
- [ ] All tests passing (102+ tests)
- [ ] Docs updated
- [ ] CHANGELOG.md complete
- [ ] MIGRATION.md exists
- [ ] npm run build succeeds
- [ ] No TypeScript errors
- [ ] No lint errors

**Git tag:**
```bash
git tag -a v2.0.0 -m "Release v2.0.0 - Orchestrator Architecture"
git push origin v2.0.0
```

**NPM publish:**
```bash
npm run build
npm publish --access public
```

**Deliverables:**
- ✅ v2.0.0 tag pushed
- ✅ NPM package published
- ✅ GitHub release created

---

## 🎯 PHASE 5: POST-RELEASE (Dni 16-20) - 20h

**Cel:** Marketing, monitoring, community

### 5.1 Demo Video (4h)

**Create:**
- 3-minute demo video
- Show: cerber init → doctor → validate → fix

**Script:**
```
00:00 - Problem: "Managing 5 tools, 5 configs"
00:30 - Solution: "One contract, Cerber runs everything"
01:00 - Demo: cerber init --template nodejs
01:30 - Demo: cerber doctor (shows tool status)
02:00 - Demo: cerber validate --profile dev
02:30 - Demo: pre-commit hook in action
03:00 - Call to action: npm install cerber-core
```

**Deliverables:**
- ✅ Demo video uploaded (YouTube)
- ✅ GIF for README
- ✅ Tweet thread

---

### 5.2 Launch Marketing (4h)

**Platforms:**
1. HackerNews (Show HN: Cerber Core 2.0)
2. Reddit (r/devops, r/github, r/javascript)
3. Dev.to article
4. Twitter thread
5. LinkedIn post

**Messaging:**
```
🛡️ Cerber Core 2.0 - Contract-Driven DevOps Orchestrator

Tired of managing ESLint, actionlint, hadolint, prettier configs?

Cerber runs them all from ONE contract:
- .cerber/contract.yml = single source of truth
- 3 profiles: solo/dev/team
- Deterministic JSON output
- Pre-commit + CI integration

Setup in 60 seconds:
npm i -D cerber-core
npx cerber init
npx cerber doctor

Open source, MIT license
GitHub: github.com/Agaslez/cerber-core
```

**Deliverables:**
- ✅ Posted on all platforms
- ✅ Responses monitored

---

### 5.3 Monitor & Respond (4h/day × 3 days = 12h)

**Daily tasks:**
- Monitor GitHub issues
- Respond to comments (HN, Reddit)
- Fix critical bugs
- Update docs based on feedback

**Metrics to track:**
- NPM downloads
- GitHub stars
- Discord joins
- Issue/PR count

---

## 📊 TIMELINE SUMMARY

| Phase | Days | Hours | Deliverables |
|-------|------|-------|--------------|
| Phase 0: Foundation | 1-2 | 12h | AGENTS.md, schemas, docs, copilot instructions |
| **Phase 1 Extended: Core + Reliability** | **3-12** | **90h** | **Tool manager, adapters, orchestrator + state machine + reliability patterns** |
| Phase 1.1-1.4: Core | 3-6 | 40h | Tool manager, file discovery, adapters (actionlint, zizmor, ratchet) |
| Phase 1.5-1.6: Orchestrator | 7-9 | 16h | Orchestrator engine, reporting & output formats |
| Phase 1.7: State Machine | 10 | 8h | **ExecutionContext, state transitions, checkpoints** |
| Phase 1.8: Reliability | 11-12 | 12h | **Circuit breaker, retry with backoff, timeout management** |
| Phase 1.9: Reporting | - | 14h | (already in 1.6) |
| **Phase 2 Extended: Observability & Ops** | **13-18** | **50h** | **Tracing, metrics, logging, config, persistence** |
| Phase 2.1: Observability | 13-14 | 10h | **Distributed tracing, metrics collector, structured logging** |
| Phase 2.2: Configuration | 15 | 6h | **Hot reload, runtime overrides, priority resolution** |
| Phase 2.3: Persistence | 16-17 | 8h | **Execution history, audit trail, replay capability** |
| Phase 2.4-2.6: CLI | 18 | 26h | cerber validate, cerber doctor, profile support |
| **Phase 3 Extended: Operations** | **19-22** | **30h** | **Lifecycle, resources, cache, plugins** |
| Phase 3.1: Adapter Lifecycle | 19 | 6h | **Lifecycle states, cancel, health checks** |
| Phase 3.2: Resource Management | 20 | 4h | **Concurrency limits, memory tracking** |
| Phase 3.3: Caching | 20 | 4h | **Result caching, TTL** |
| Phase 3.4: Dependencies | 21 | 4h | **Dependency resolution, topological sort** |
| Phase 3.5: Plugin System | 22 | 6h | **Plugin manager, custom adapters, hooks** |
| Phase 3.6: Templates | 22 | 6h | Profile support in templates |
| **Phase 4: Guardian** | **23-24** | **12h** | **Pre-commit with lint-staged** |
| Phase 5: Polish & Release | 25-27 | 16h | Docs, tests, CHANGELOG, release |
| Phase 6: Marketing & Launch | 28-29 | 12h | Demo video, posts, monitoring |
| Phase 7: Universal Deployment | 30 | 12h | Docker image, GitHub Action, CI examples |
| **TOTAL** | **30 days** | **234h** | **V2.0.0 Production-Ready Release** |

**Critical Path:**
- Days 1-12: **Core + Reliability** (102h) - Foundation + enterprise patterns
- Days 13-18: **Observability** (50h) - Production visibility
- Days 19-24: **Operations** (42h) - Lifecycle + Guardian
- Days 25-30: **Polish + Launch** (40h) - Release readiness

**🚨 PRODUCTION-READY ADDITIONS:**
- +72h for enterprise orchestration features
- State machine (8h), Reliability (12h), Observability (10h)
- Configuration (6h), Persistence (8h), Lifecycle (6h)
- Resource management (4h), Caching (4h), Dependencies (4h), Plugins (6h)

**Parallel Work Opportunities:**
- Docs can be written while code is being implemented
- Tests can be written in parallel with features
- Marketing materials can be prepared during Phase 5

---

## ✅ DEFINITION OF DONE (V2.0.0 - Production Ready)

**Technical - Core:**
- [ ] All tests passing (200+ tests including reliability/observability)
- [ ] 3 adapters working (actionlint, zizmor, ratchet)
- [ ] Orchestrator validated on 10+ real workflows
- [ ] Output schema documented + validated
- [ ] Profiles working (solo/dev/team)
- [ ] cerber doctor generates working contracts
- [ ] Pre-commit < 2 seconds
- [ ] CI runs full validation
- [ ] Zero TypeScript errors
- [ ] Zero lint errors

**Technical - Production Features:**
- [ ] **Execution State Machine** - ExecutionContext with state tracking
- [ ] **Reliability Patterns** - Circuit breaker + retry with exponential backoff + timeout management
- [ ] **Observability Stack** - Distributed tracing + metrics + structured logging
- [ ] **Configuration Management** - Hot reload + runtime overrides + priority resolution
- [ ] **Execution Persistence** - History + audit trail + replay capability
- [ ] **Adapter Lifecycle** - State management + cancellation + health checks
- [ ] **Resource Management** - Concurrency limits + memory tracking
- [ ] **Caching Layer** - Result caching with TTL
- [ ] **Dependency Resolution** - Topological sort for adapter execution
- [ ] **Plugin System** - Custom adapters + hooks

**Technical - Operations:**
- [ ] CLI commands: `cerber metrics`, `cerber traces`, `cerber history`, `cerber replay`
- [ ] Health checks for all adapters
- [ ] Graceful degradation on tool failures
- [ ] No path traversal vulnerabilities (input sanitization)
- [ ] Retry logic for transient failures
- [ ] Circuit breaker prevents cascade failures
- [ ] Execution history persisted to disk

**Documentation:**
- [ ] AGENTS.md exists
- [ ] README.md updated (orchestrator section + reliability patterns)
- [ ] CERBER.md updated (profiles, schemas, observability)
- [ ] ORCHESTRATOR_ARCHITECTURE.md (implementation guide)
- [ ] ORCHESTRATOR_GAPS_ANALYSIS.md (professional analysis)
- [ ] MIGRATION.md exists (v1 → v2)
- [ ] QUICKSTART.md updated
- [ ] Demo video published
- [ ] Architecture diagrams (state machine, circuit breaker, tracing)

**Release:**
- [ ] package.json → 2.0.0
- [ ] CHANGELOG.md complete (including all enterprise features)
- [ ] Git tag v2.0.0
- [ ] NPM published
- [ ] GitHub release

**Marketing:**
- [ ] HackerNews post
- [ ] Reddit posts (3 subreddits)
- [ ] Dev.to article
- [ ] Twitter thread
- [ ] LinkedIn post

---

## 🚀 V2.1 — "Ops & Auto-install (Bezpiecznie)"

**Prerequisites:** V2.0 released, userzy używają, feedback collected.

### Features (Postponed from V2.0):

#### 1. Auto-install Tooli (12h) - **BEZPIECZNIE**

**Warunki wejścia:**
- ✅ Checksums realne (SHA256 dla każdego binary)
- ✅ Lock na cache (równoległość prevented)
- ✅ Wybór arch/platform (darwin-arm64, linux-amd64, win-x64)
- ✅ Opcja OFF domyślnie (bez zaskoczeń)

**Implementacja:**
```typescript
// src/tools/AutoInstaller.ts
class AutoInstaller {
  async install(tool: string, version: string): Promise<void> {
    // 1. Check cache ~/.cerber/tools/<tool>-<version>-<platform>
    if (await this.isCached(tool, version)) {
      return;
    }
    
    // 2. Lock (prevent race conditions)
    await this.acquireLock(tool, version);
    
    try {
      // 3. Download + verify checksum
      const binary = await this.download(tool, version);
      await this.verifyChecksum(binary, tool, version);
      
      // 4. Install to cache
      await this.installToCache(binary, tool, version);
    } finally {
      await this.releaseLock(tool, version);
    }
  }
}
```

**Contract:**
```yaml
tools:
  actionlint:
    autoInstall: true  # Opt-in
    version: "1.6.27"
    checksum: "sha256:abc123..."
```

**Tests:**
- Unit: download + verify checksum
- Unit: lock mechanism (concurrent installs)
- Integration: install real tool from fixtures

---

#### 2. Execution State Machine (8h)

**Implementacja:**
```typescript
enum ExecutionState {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

interface ExecutionContext {
  id: string;
  state: ExecutionState;
  startTime: Date;
  endTime?: Date;
  checkpoints: Array<{
    state: ExecutionState;
    timestamp: Date;
    data?: any;
  }>;
}
```

**Use case:** Progress tracking, debugging long runs

---

#### 3. Retry Logic dla Network Failures (6h)

**Implementacja:**
```typescript
class RetryExecutor {
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    policy: { maxAttempts: 3, initialDelay: 1000, backoffMultiplier: 2 }
  ): Promise<T> {
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (!this.isRetryable(error) || attempt === policy.maxAttempts) {
          throw error;
        }
        await this.sleep(this.calculateDelay(attempt, policy));
      }
    }
  }
}
```

**Use case:** Auto-install network timeouts, flaky downloads

---

#### 4. SARIF Format (6h)

**Implementacja:**
```typescript
// src/reporting/format-sarif.ts
function formatSARIF(output: CerberOutput): string {
  const sarif = {
    version: '2.1.0',
    runs: [{
      tool: { driver: { name: 'Cerber', version: '2.1.0' } },
      results: output.violations.map(v => ({
        ruleId: v.id,
        level: v.severity === 'error' ? 'error' : 'warning',
        message: { text: v.message },
        locations: [{
          physicalLocation: {
            artifactLocation: { uri: v.path },
            region: { startLine: v.line || 1 }
          }
        }]
      }))
    }]
  };
  return JSON.stringify(sarif, null, 2);
}
```

**Use case:** GitHub Code Scanning integration

---

#### 5. Execution History + Replay (10h) - **Opt-in, Redaction**

**Warunki wejścia:**
- ✅ Redaction secrets (regex patterns)
- ✅ Allowlist paths (nie zapisujemy wrażliwych plików)
- ✅ Opt-in explicit (OFF domyślnie)

**Implementacja:**
```typescript
// src/persistence/ExecutionStore.ts
interface ExecutionRecord {
  id: string;
  startTime: Date;
  endTime?: Date;
  input: {
    options: RunOptions;
    files: string[];  // Allowlisted paths only
  };
  output: CerberOutput;
  // ❌ NO secrets, ❌ NO file contents
}

class ExecutionStore {
  async save(execution: ExecutionRecord): Promise<void> {
    // Redact secrets before saving
    const redacted = this.redactSecrets(execution);
    await fs.writeFile(`~/.cerber/history/${execution.id}.json`, JSON.stringify(redacted));
  }
  
  async replay(id: string): Promise<CerberOutput> {
    const record = await this.load(id);
    return this.orchestrator.run(record.input.options);
  }
}
```

**Contract:**
```yaml
history:
  enabled: false  # Opt-in
  retention: 30   # Days
  redactPatterns:
    - "ghp_[a-zA-Z0-9]{36}"
    - "sk-[a-zA-Z0-9]{48}"
```

**CLI:**
```bash
cerber history --enable
cerber history list
cerber replay <execution-id>
```

---

**Timeline V2.1:** ~50h (2 weeks)

**Priority:**
1. Auto-install (12h) - największa user value
2. SARIF (6h) - security flow
3. State machine (8h) - debugging
4. Retry (6h) - reliability
5. History/replay (10h) - advanced debugging

---

## 🌍 V2.2 — "Universal Targets"

**Prerequisites:** V2.1 released, auto-install stable, userzy zadowoleni.

### Features:

#### 1. GitLab CI Target (12h)

**Implementacja:**
```typescript
// src/targets/gitlab-ci/discover.ts
export class GitLabCITarget implements Target {
  async discoverFiles(cwd: string): Promise<string[]> {
    const files = ['.gitlab-ci.yml'];
    
    // Include external files
    const mainConfig = await this.parseConfig('.gitlab-ci.yml');
    if (mainConfig.include) {
      files.push(...mainConfig.include);
    }
    
    return files;
  }
}
```

**Adapters:**
- gitlab-ci-lint (built-in GitLab validator)
- yamllint (generic YAML validator)

---

#### 2. Generic YAML Target (8h)

**Implementacja:**
```typescript
// src/targets/generic-yaml/discover.ts
export class GenericYAMLTarget implements Target {
  async discoverFiles(cwd: string, globs: string[]): Promise<string[]> {
    // Contract defines globs
    return await glob(globs, { cwd });
  }
}
```

**Contract:**
```yaml
target: generic-yaml
globs:
  - "k8s/**/*.yml"
  - "config/**/*.yaml"
```

**Adapters:**
- yamllint
- kubeval (Kubernetes)
- helm lint

---

#### 3. Observability Stack (10h) - **Opt-in**

**Implementacja:**
```typescript
// src/observability/TracingCollector.ts
class TracingCollector {
  startSpan(name: string): Span {
    return { id: uuid(), name, startTime: Date.now() };
  }
  
  endSpan(span: Span): void {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    this.spans.push(span);
  }
  
  exportTraces(): Span[] {
    return this.spans;
  }
}
```

**CLI:**
```bash
cerber validate --tracing
cerber traces show <execution-id>
```

---

#### 4. Configuration Hot Reload (6h)

**Implementacja:**
```typescript
// src/config/ConfigurationManager.ts
class ConfigurationManager {
  private watchers: Array<(config: Contract) => void> = [];
  
  async watch(contractPath: string): Promise<void> {
    const watcher = chokidar.watch(contractPath);
    watcher.on('change', async () => {
      const newConfig = await this.load(contractPath);
      this.watchers.forEach(cb => cb(newConfig));
    });
  }
}
```

**Use case:** Long-running CI agents

---

**Timeline V2.2:** ~40h (2 weeks)

**Priority:**
1. GitLab CI (12h) - expand user base
2. Generic YAML (8h) - flexibility
3. Observability (10h) - debugging advanced
4. Hot reload (6h) - ops convenience

---

## 📊 ROADMAP SUMMARY - ALL VERSIONS

| Version | Timeline | Hours | Focus |
|---------|----------|-------|-------|
| **V2.0 - Reliable MVP** | 2-3 weeks | 74h | Core orchestrator, 10 commits, deterministic, doctor |
| **V2.1 - Ops & Auto-install** | 2 weeks | 50h | Auto-install (safe), SARIF, retry, history (opt-in) |
| **V2.2 - Universal Targets** | 2 weeks | 40h | GitLab CI, generic YAML, observability, hot reload |
| **TOTAL** | 6-7 weeks | 164h | Production-ready multi-target orchestrator |

**Filozofia zmian:**
- V2.0: **"Ma działać, nie wyglądać"** - solid foundation bez fajerwerków
- V2.1: **"Ops done right"** - auto-install z bezpieczeństwem, advanced debugging
- V2.2: **"Universal"** - support for all CI platforms

**Wywalono "NASA mode" z V2.0:**
- ❌ Circuit breaker (overkill dla tool execution)
- ❌ Resource manager (premature optimization)
- ❌ Caching layer (complexity > value)
- ❌ Plugin system (YAGNI)
- ❌ Dependency resolution (tools są independent)

**Dodano pragmatyzm:**
- ✅ Fixtures dla testów (bez real tools)
- ✅ Windows paths OK (normalizacja)
- ✅ Doctor diagnozuje, NIE naprawia
- ✅ dev-fast <2s (pre-commit usable)
- ✅ Exit codes 0/1/2/3 (clear semantics)

---

## 🎯 KLUCZOWA ZMIANA FILOZOFII

### Doctor = Mechanic, NIE Autopilot

**Przed (błędne założenie):**
```bash
cerber doctor
# Auto-instaluje tools, auto-generuje contract, auto-naprawia CI
```

**Po (pragmatyczne):**
```bash
cerber doctor
# Output:
🏥 CERBER DOCTOR

📦 Project: nodejs
📁 Workflows: 3 found
📄 Contract: ✅ .cerber/contract.yml

🔧 Tool Status:
✅ actionlint (1.6.27)
❌ zizmor - not installed

⚠️  Issues:
- zizmor required for 'dev' profile but not installed

💡 Suggested fixes:
cargo install zizmor

# User runs: cargo install zizmor
# Doctor NIGDY nie instaluje po cichu
```

**Dlaczego:**
- Auto-naprawa CI = większe ryzyko niż korzyść
- Community grilluje tools które "robią za dużo"
- User musi wiedzieć co się dzieje (transparency)

**Auto-fix TYLKO jako jawna komenda (V2.2+):**
```bash
cerber fix install-tools  # Explicit action
cerber fix generate-contract  # Explicit action
```

---

## ✅ KONKLUZJA

**V2.0 = Reliable MVP**
- 10 commitów w 2-3 tygodnie
- Zero "NASA mode" features
- Solid foundation dla V2.1+
- Windows OK, deterministic, tested on fixtures

**User dostaje:**
- Orchestrator który działa (nie "sp… się" po tygodniu)
- Doctor który monitoruje (nie "naprawia" po cichu)
- Guardian <2s (używalny w pre-commit)
- GitHub annotations (natychmiastowa wartość)

**Co odkładamy (V2.1+):**
- Auto-install (z checksums + lock)
- SARIF (security flow)
- History/replay (opt-in, redaction)
- Retry (network failures)
- Observability (tracing, metrics)
- Universal targets (GitLab, generic YAML)

**Filozofia:** "Zrób to dobrze, nie rób wszystkiego". MVP najpierw, fajerwerki później.

**Enterprise Readiness Criteria:**
- [ ] Solo mode: Auto-recovery + simple monitoring
- [ ] Dev mode: Debugging tools + telemetry opt-in
- [ ] Team mode: Strict validation + required telemetry + audit trails
- [ ] Black box → Full observability (no blind spots)
- [ ] Fail fast → Resilient with retry + circuit breaker
- [ ] Ephemeral → Persistent execution history
- [ ] Static config → Hot reload configuration

---

## 🎯 SUCCESS METRICS (30 days post-launch)

**Adoption:**
- 1000+ NPM downloads/week
- 500+ GitHub stars
- 50+ Discord members
- 10+ production users

**Quality:**
- < 5 critical bugs reported
- > 90% test coverage
- < 1 day bug fix time

**Community:**
- 5+ community PRs
- 20+ GitHub issues (feedback)
- 3+ case studies

---

## 🎯 PHASE 6: UNIVERSAL DEPLOYMENT (Bonus - Dni 16-18) - 12h

**Cel:** Docker image + universal CI compatibility

### 6.1 Docker Image (6h)

**Create:**
```dockerfile
# Dockerfile
FROM node:20-alpine

# Install tools
RUN apk add --no-cache \
    git \
    go \
    cargo \
    && go install github.com/rhysd/actionlint/cmd/actionlint@latest \
    && cargo install zizmor \
    && go install github.com/gitleaks/gitleaks/v8@latest

# Copy Cerber
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
COPY bin/ ./bin/

# Add to PATH
ENV PATH="/app/bin:/root/go/bin:/root/.cargo/bin:$PATH"

ENTRYPOINT ["cerber"]
CMD ["validate"]
```

**Build & Publish:**
```bash
# Build
docker build -t ghcr.io/agaslez/cerber-core:2.0.0 .

# Test
docker run --rm ghcr.io/agaslez/cerber-core:2.0.0 --version

# Publish
docker push ghcr.io/agaslez/cerber-core:2.0.0
docker push ghcr.io/agaslez/cerber-core:latest
```

**Usage examples:**
```yaml
# GitHub Actions
- name: Cerber Validate
  run: |
    docker run --rm \
      -v $PWD:/workspace \
      -w /workspace \
      ghcr.io/agaslez/cerber-core:2.0.0 \
      validate --target github-actions --format json

# GitLab CI
cerber_validate:
  image: ghcr.io/agaslez/cerber-core:2.0.0
  script:
    - cerber validate --target gitlab-ci

# Jenkins
stage('Cerber') {
  docker.image('ghcr.io/agaslez/cerber-core:2.0.0').inside {
    sh 'cerber validate'
  }
}
```

**Deliverables:**
- ✅ Dockerfile
- ✅ .dockerignore
- ✅ Docker image published to ghcr.io
- ✅ docs/docker.md (usage guide)
- ✅ Git committed

**Tests:**
- Integration test: run Docker image on fixtures
- Test: all tools available in image
- Verify: image size < 500MB

---

### 6.2 GitHub Action (Reusable Workflow) (4h)

**Create:**
```yaml
# .github/actions/cerber-validate/action.yml
name: 'Cerber Validate'
description: 'Run Cerber validation with Docker'
author: 'Agaslez'

inputs:
  target:
    description: 'Target to validate (github-actions, gitlab-ci, generic-yaml)'
    required: false
    default: 'github-actions'
  profile:
    description: 'Profile to use (solo, dev, team)'
    required: false
    default: 'team'
  format:
    description: 'Output format (text, json, github, sarif)'
    required: false
    default: 'github'
  fail-on:
    description: 'Fail on severity (error, warning, info)'
    required: false
    default: 'error'

runs:
  using: 'docker'
  image: 'docker://ghcr.io/agaslez/cerber-core:2.0.0'
  args:
    - 'validate'
    - '--target'
    - ${{ inputs.target }}
    - '--profile'
    - ${{ inputs.profile }}
    - '--format'
    - ${{ inputs.format }}

branding:
  icon: 'shield'
  color: 'blue'
```

**⚠️ MINA #3 FIX: CI installation - download binaries, not brew**

**Usage:**
```yaml
# .github/workflows/cerber.yml
name: Cerber Validate

on: [push, pull_request]

jobs:
  cerber:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      # Install tools (download release binaries)
      - name: Install actionlint
        run: |
          curl -sL https://github.com/rhysd/actionlint/releases/download/v1.6.27/actionlint_1.6.27_linux_amd64.tar.gz | tar xz
          sudo mv actionlint /usr/local/bin/
          actionlint --version
      
      - name: Install zizmor
        run: |
          curl -sL https://github.com/woodruffw/zizmor/releases/download/v0.2.0/zizmor-x86_64-unknown-linux-musl -o zizmor
          chmod +x zizmor
          sudo mv zizmor /usr/local/bin/
          zizmor --version
      
      - name: Install gitleaks
        run: |
          curl -sL https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz | tar xz
          sudo mv gitleaks /usr/local/bin/
          gitleaks version
      
      - name: Cerber Validate
        uses: agaslez/cerber-core/actions/cerber-validate@v2
        with:
          target: github-actions
          profile: team
          format: github

# OR: Use Docker image with pre-installed tools
jobs:
  cerber-docker:
    runs-on: ubuntu-latest
    container: ghcr.io/agaslez/cerber-core:2.0.0
    steps:
      - uses: actions/checkout@v4
      - run: cerber validate --format=github
```

**Platform-specific installation:**
- **Ubuntu (CI):** Download release binaries (curl + tar)
- **macOS:** Homebrew (local dev)
- **Windows:** Chocolatey or Scoop (local dev)
- **Docker:** Pre-installed in image

**Deliverables:**
- ✅ .github/actions/cerber-validate/action.yml
- ✅ docs/github-action.md (usage guide)
- ✅ Git committed

**Tests:**
- Manual test: run action in real workflow
- Verify: annotations appear in PR

---

### 6.3 Universal CI Examples (2h)

**Create documentation:**

```markdown
# docs/ci-examples.md

## GitHub Actions
\`\`\`yaml
- name: Cerber
  run: npx cerber-core validate --target github-actions
\`\`\`

## GitLab CI
\`\`\`yaml
cerber:
  stage: test
  image: ghcr.io/agaslez/cerber-core:2.0.0
  script:
    - cerber validate --target gitlab-ci
\`\`\`

## Jenkins
\`\`\`groovy
stage('Cerber') {
  docker.image('ghcr.io/agaslez/cerber-core:2.0.0').inside {
    sh 'cerber validate'
  }
}
\`\`\`

## Azure DevOps
\`\`\`yaml
- task: Docker@2
  inputs:
    command: 'run'
    image: 'ghcr.io/agaslez/cerber-core:2.0.0'
    arguments: 'validate'
\`\`\`

## CircleCI
\`\`\`yaml
jobs:
  cerber:
    docker:
      - image: ghcr.io/agaslez/cerber-core:2.0.0
    steps:
      - checkout
      - run: cerber validate
\`\`\`
```

**Deliverables:**
- ✅ docs/ci-examples.md
- ✅ All major CI platforms documented
- ✅ Git committed

**Tests:** N/A (documentation)

---

## 🚨 RISK MITIGATION

**Risk 1: Tools not installed**
- Mitigation: Graceful degradation (works without tools)
- cerber doctor shows install hints

**Risk 2: Breaking changes impact users**
- Mitigation: MIGRATION.md + v1 compatibility mode
- Announce on Discord/Twitter 2 weeks before

**Risk 3: Adapter bugs**
- Mitigation: Comprehensive tests + fixtures
- Each adapter has unit + integration tests

**Risk 4: Performance issues (slow)**
- Mitigation: Benchmark + optimize
- Pre-commit uses fast profile (< 2s)
- CI uses full profile

**Risk 5: Tool conflicts (version mismatches)**
- Mitigation: Document compatible versions
- cerber doctor shows installed versions

---

## 🎉 NEXT STEPS (Post V2.0.0)

**V2.1 (Q1 2026):**
- More adapters (hadolint, tflint, eslint)
- SARIF output format
- GitHub Action (reusable workflow)

**V2.2 (Q2 2026):**
- Auto-fix engine (safe fixes only)
- Confidence scoring
- Rollback mechanism

**V2.3 (Q3 2026):**
- Web dashboard
- Team analytics
- Compliance reports (SOC2, ISO27001)

**V3.0 (Q4 2026):**
- Universal validation (not just CI/CD)
- Frontend/backend/database validation
- Self-healing platform

---

## 📝 APPENDIX

### A. Tools Overview

| Tool | Purpose | Output Format | Install | Phase |
|------|---------|---------------|---------|-------|
| **actionlint** | GitHub Actions linting | JSON | brew install actionlint | 1.5 |
| **zizmor** | GitHub Actions security | JSON | brew install zizmor | 1.6 |
| **gitleaks** | Secrets detection | JSON | brew install gitleaks | 1.7 |

**Future tools (V2.1+):**
- hadolint (Dockerfile linting)
- tflint (Terraform linting)
- yamllint (Generic YAML)
- eslint (JavaScript/TypeScript)

### B. Profile Comparison

| Feature | Solo | Dev | Team |
|---------|------|-----|------|
| failOn | error | error, warning | error, warning |
| Tools | actionlint | actionlint, zizmor | actionlint, zizmor, gitleaks |
| Pinning required | No | No | Yes |
| Deterministic output | No | No | Yes |
| Speed | Fast (~3s) | Medium (~8s) | Slow (~15s) |
| Use case | Personal projects | Team development | Production CI |
| Pre-commit | ✅ Yes | ✅ Yes | ⚠️ Optional (slow) |

### C. Exit Codes

| Code | Meaning | Example | Action |
|------|---------|---------|--------|
| 0 | Success (no violations) | All checks passed | ✅ Continue |
| 1 | Violations found | 3 errors, 5 warnings | ❌ Block merge |
| 2 | Configuration error | Invalid contract.yml | 🔧 Fix config |
| 3 | Runtime error | Tool crashed | 🐛 Report bug |
| 4 | Tool not found | actionlint not installed | 📦 Install tool |

### D. Target System

**What is a Target?**
Target defines WHAT to validate (scope):
- `github-actions` → .github/workflows/*.yml
- `gitlab-ci` → .gitlab-ci.yml + includes
- `generic-yaml` → any YAML files

**Target Structure:**
```typescript
interface Target {
  id: string;                           // Unique ID
  name: string;                         // Display name
  description: string;                  // What it does
  discover: (cwd: string) => string[];  // Find files
  getDefaultTools: () => string[];      // Recommended tools
}
```

**How to Add New Target:**
1. Create `src/targets/<name>/discover.ts`
2. Create `src/targets/<name>/toolpacks.ts`
3. Create `src/targets/<name>/index.ts`
4. Register in `TargetManager`
5. Add docs to `docs/targets.md`

### E. Adapter System

**What is an Adapter?**
Adapter wraps external tool:
- Detects if installed
- Runs tool with correct args
- Parses output → `CerberViolation[]`

**Adapter Interface:**
```typescript
interface ToolAdapter {
  name: string;
  isInstalled(): Promise<boolean>;
  getVersion(): Promise<string | null>;
  getInstallHint(): string;
  run(options: RunOptions): Promise<ToolOutput>;
  parseOutput(raw: string): CerberViolation[];
}
```

**How to Add New Adapter:**
1. Create `src/adapters/<tool>/run.ts`
2. Create `src/adapters/<tool>/parse.ts`
3. Implement `ToolAdapter` interface
4. Add tests with fixtures
5. Register in `ToolRegistry`
6. Add docs to `docs/adapters.md`

### F. Output Formats

| Format | Use Case | Example |
|--------|----------|---------|
| **text** | Human-readable terminal | Default local dev |
| **json** | CI integration, storage | `--format json > results.json` |
| **github** | GitHub Actions annotations | Auto-detected in GHA |
| **sarif** | GitHub Code Scanning | Upload to Security tab |

**Format Selection Logic:**
```typescript
// Auto-detect GitHub Actions
if (process.env.GITHUB_ACTIONS === 'true') {
  defaultFormat = 'github';
} else {
  defaultFormat = 'text';
}
```

### G. Contract Schema Evolution

**V2.0.0 Contract:**
```yaml
contractVersion: 1
name: my-project
targets:
  - id: github-actions
    globs:
      - .github/workflows/**/*.yml
    tools:
      - id: actionlint
        severity: error
      - id: zizmor
        severity: error
profiles:
  solo:
    failOn: [error]
    enable: [actionlint]
  dev:
    failOn: [error, warning]
    enable: [actionlint, zizmor]
  team:
    failOn: [error, warning]
    enable: [actionlint, zizmor, gitleaks]
output:
  formats: [text, json]
  failOn: error
```

**Future Evolution (V2.1+):**
- Multiple targets in one contract
- Custom rules (RegEx patterns)
- Tool-specific configurations
- Conditional rules (if/then logic)

### H. Universal Deployment Matrix

| Platform | Method | Command |
|----------|--------|---------|
| **Local Dev** | npm | `npx cerber-core validate` |
| **Pre-commit** | husky | `npx cerber-core guard --staged` |
| **GitHub Actions** | Docker Action | `uses: agaslez/cerber-core@v2` |
| **GitHub Actions** | Docker Run | `docker run ghcr.io/agaslez/cerber-core:2.0.0` |
| **GitLab CI** | Docker | `image: ghcr.io/agaslez/cerber-core:2.0.0` |
| **Jenkins** | Docker | `docker.image('ghcr.io/agaslez/cerber-core:2.0.0')` |
| **Azure DevOps** | Docker Task | See docs/ci-examples.md |
| **CircleCI** | Docker Executor | `docker: ghcr.io/agaslez/cerber-core:2.0.0` |

**Key Insight:**
> Cerber jest uniwersalny bo jest CLI + Docker.
> GitHub Actions to tylko jeden z runnerów.
> Contract.yml to jedna prawda, niezależnie od CI.

---

## ✅ ROADMAP VALIDATION - "Stefan's Architecture Checklist"

**Porównanie: Co było vs Co jest teraz**

| Element | Poprzednia Roadmap | Nowa Roadmap (Stefan's Plan) | Status |
|---------|-------------------|------------------------------|--------|
| **Folder Structure** | ❌ Brak schematu | ✅ Pełna struktura (`src/core/`, `src/targets/`, `src/adapters/`) | ✅ DONE |
| **One Truth** | ✅ contract.yml | ✅ contract.yml + output.schema.json + CERBER.md | ✅ ENHANCED |
| **Targets** | ❌ Tylko GitHub Actions | ✅ github-actions + gitlab-ci + generic-yaml | ✅ ADDED |
| **Tool Manager** | ❌ Brak | ✅ src/core/tool-manager.ts (detection, caching, versions) | ✅ ADDED |
| **Target Manager** | ❌ Brak | ✅ src/core/target-manager.ts (multi-target support) | ✅ ADDED |
| **File Discovery** | ❌ Prosty glob | ✅ src/core/file-discovery.ts (staged/changed/all) | ✅ ADDED |
| **SCM Integration** | ❌ Brak | ✅ src/scm/git.ts (staged files, changed files, base branch diff) | ✅ ADDED |
| **Path Safety** | ❌ Brak | ✅ src/security/path-safety.ts (blokada ../) | ✅ ADDED |
| **Reporting Formats** | ⚠️ Tylko text/json | ✅ text + json + github + sarif | ✅ ENHANCED |
| **Stdin/Paths Mode** | ❌ Brak | ✅ cerber validate --stdin, --paths | ✅ ADDED |
| **Guardian Pre-commit** | ✅ Planned | ✅ lint-staged + cerber guard --staged | ✅ ENHANCED |
| **Docker Image** | ❌ Brak | ✅ ghcr.io/agaslez/cerber-core:2.0.0 | ✅ ADDED |
| **GitHub Action** | ❌ Brak | ✅ agaslez/cerber-core/actions/cerber-validate@v2 | ✅ ADDED |
| **Universal CI** | ⚠️ Tylko GitHub | ✅ GitHub + GitLab + Jenkins + Azure + CircleCI | ✅ ENHANCED |
| **Adapters** | ✅ actionlint, zizmor, ratchet | ✅ actionlint, zizmor, gitleaks | ✅ ADJUSTED |
| **Profiles** | ✅ solo/dev/team | ✅ solo/dev/team + modes (guard/ci) | ✅ ENHANCED |
| **Agent Rules** | ❌ Brak | ✅ AGENTS.md + .github/copilot-instructions.md | ✅ ADDED |

**Summary:**
- ✅ **15 New Elements** added from Stefan's plan
- ✅ **5 Enhanced Elements** (reporting, profiles, one truth, CI, guardian)
- ✅ **3 Adjusted Elements** (adapters: ratchet → gitleaks for better security coverage)
- ✅ **Zero Conflicts** - wszystko spójne z filozofią "jedna prawda"

**Key Architecture Decisions:**

1. **Uniwersalność wykonawcza (CLI + Docker):**
   ✅ Cerber działa lokalnie, w każdym CI, w pre-commit
   ✅ Docker image dla CI bez Node.js
   ✅ Stdin/paths mode dla pipeline integration

2. **Uniwersalność merytoryczna (Targets):**
   ✅ github-actions (Phase 1)
   ✅ gitlab-ci (architecture ready, implementation Phase 2+)
   ✅ generic-yaml (architecture ready)

3. **"Dyrygent, nie orkiestra":**
   ✅ Cerber = orchestrator (kontrakty + adaptery + reporting)
   ✅ Tools = executors (actionlint, zizmor, gitleaks)
   ✅ No reinventing (używamy gotowych narzędzi)

4. **Jedna prawda:**
   ✅ contract.yml = policy (CO sprawdzamy)
   ✅ output.schema.json = format (JAK raportujemy)
   ✅ CERBER.md = spec (DLACZEGO tak działa)

**Stefan's Philosophy → Roadmap Mapping:**

| Stefan's Point | Roadmap Section | Implementation |
|----------------|-----------------|----------------|
| "Jedna prawda" | Phase 0 | contract.yml + output.schema.json + CERBER.md |
| "No reinventing" | Phase 1.4-1.7 | Adapters (actionlint, zizmor, gitleaks) |
| "Targets" | Phase 1.2 | TargetManager + github-actions/gitlab-ci/generic |
| "Tool manager" | Phase 1.1 | ToolManager (detection, caching, hints) |
| "Guardian pre-commit" | Phase 3 | lint-staged + cerber guard --staged |
| "Stdin/paths mode" | Phase 2.1 | cerber validate --stdin, --paths |
| "Docker image" | Phase 6.1 | ghcr.io/agaslez/cerber-core:2.0.0 |
| "SARIF reporter" | Phase 1.6 | format-sarif.ts (GitHub Code Scanning) |
| "Plugin API" | Phase 1.4 | ToolAdapter interface |
| "Universal CI" | Phase 6.3 | docs/ci-examples.md (wszystkie platformy) |

**Verdict:** ✅ **ROADMAP FULLY ALIGNED WITH STEFAN'S ARCHITECTURE** 🎯

---

## 🔥 PRODUCTION HARDENING PLAN (40h)

**Na podstawie audytu z Stycznia 2026 - 12 krytycznych problemów produkcyjnych**

Przed wdrożeniem V2.0 do produkcji MUSZĄ zostać naprawione następujące problemy:

---

### 📊 PHASE P0: OBSERVABILITY & MONITORING (8-10h) - CRITICAL

**Problem 1: ZERO OBSERVABILITY - ŚLEPA PRODUKCJA**
- **Status:** 1 console.warn w całym systemie
- **Ryzyko:** Nie widzisz co się dzieje w produkcji, zero debug capability
- **Priorytet:** P0 - przed pierwszym deployem

**Implementacja:**

1. **Structured Logging (4h)**
   ```typescript
   // src/core/logger.ts
   import { pino } from 'pino';
   
   export const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
     transport: {
       target: 'pino-pretty',
       options: { colorize: true }
     }
   });
   
   // W Orchestrator.ts:
   async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
     const runId = crypto.randomUUID();
     const log = logger.child({ operation: 'orchestrator.run', runId });
     
     log.info('Starting orchestration', { 
       tools: adapterNames, 
       filesCount: options.files.length,
       profile: options.profile
     });
     
     const startTime = Date.now();
     try {
       const result = await this._runInternal(options);
       log.info('Orchestration complete', {
         violations: result.violations.length,
         deduped: allViolations.length - uniqueViolations.length,
         duration: Date.now() - startTime
       });
       return result;
     } catch (error) {
       log.error('Orchestration failed', { error });
       throw error;
     }
   }
   ```

2. **Metrics Instrumentation (4h)**
   ```typescript
   // src/core/metrics.ts
   import { Counter, Histogram, Gauge, register } from 'prom-client';
   
   export const metrics = {
     orchestratorRuns: new Counter({
       name: 'cerber_orchestrator_runs_total',
       help: 'Total orchestrator runs',
       labelNames: ['profile', 'status']
     }),
     
     orchestratorDuration: new Histogram({
       name: 'cerber_orchestrator_duration_seconds',
       help: 'Orchestrator execution duration',
       labelNames: ['profile'],
       buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
     }),
     
     adapterErrors: new Counter({
       name: 'cerber_adapter_errors_total',
       help: 'Total adapter errors',
       labelNames: ['adapter', 'error_type']
     }),
     
     violations: new Counter({
       name: 'cerber_violations_total',
       help: 'Total violations found',
       labelNames: ['adapter', 'severity']
     }),
     
     cacheHitRate: new Gauge({
       name: 'cerber_adapter_cache_hit_rate',
       help: 'Adapter cache hit rate',
       labelNames: ['adapter']
     }),
     
     deduplicationRate: new Histogram({
       name: 'cerber_deduplication_rate',
       help: 'Percentage of violations deduplicated',
       buckets: [0, 10, 25, 50, 75, 90, 100]
     })
   };
   
   // Endpoint dla Prometheus
   // GET /metrics → register.metrics()
   ```

3. **Tests (2h)**
   ```typescript
   describe('Observability', () => {
     it('should log orchestration start/end', async () => {
       // Capture logs
       const logs = captureLogger();
       await orchestrator.run(options);
       expect(logs).toContainEqual(expect.objectContaining({
         msg: 'Starting orchestration',
         filesCount: 5
       }));
     });
     
     it('should increment metrics on run', async () => {
       const before = await register.getSingleMetric('cerber_orchestrator_runs_total');
       await orchestrator.run(options);
       const after = await register.getSingleMetric('cerber_orchestrator_runs_total');
       expect(after.values[0].value).toBe(before.values[0].value + 1);
     });
   });
   ```

**Deliverables:**
- ✅ Structured logging (pino) w całym systemie
- ✅ Prometheus metrics endpoint
- ✅ Tests dla logging & metrics
- ✅ Dokumentacja: docs/observability.md

---

### 🔒 PHASE P1: INPUT VALIDATION & SECURITY (6-8h) - CRITICAL

**Problem 7: BRAK INPUT VALIDATION - INJECTION RISK**
- **Status:** Zero walidacji options.files, options.cwd, options.tools
- **Ryzyko:** Path traversal, command injection, resource exhaustion
- **Priorytet:** P0 - security critical

**Implementacja:**

1. **Runtime Validation (3h)**
   ```typescript
   // src/core/validation.ts
   import { z } from 'zod';
   import path from 'node:path';
   
   const RunOptionsSchema = z.object({
     files: z.array(
       z.string()
         .max(1000, 'File path too long')
         .refine(p => !p.includes('..'), 'Path traversal not allowed')
         .refine(p => !/[;<>|&$`]/.test(p), 'Invalid characters')
     ).max(10000, 'Too many files'),
     
     cwd: z.string()
       .refine(path.isAbsolute, 'cwd must be absolute path')
       .refine(p => !p.includes('..'), 'Path traversal not allowed'),
     
     tools: z.array(
       z.string().regex(/^[a-z0-9-]+$/, 'Tool name must be alphanumeric')
     ).max(100, 'Too many tools').optional(),
     
     timeout: z.number()
       .positive('Timeout must be positive')
       .max(600000, 'Timeout too large (max 10min)')
       .optional(),
     
     parallel: z.boolean().optional(),
     profile: z.string().max(50).optional(),
     maxConcurrency: z.number().positive().max(20).optional()
   });
   
   export function validateRunOptions(options: unknown): OrchestratorRunOptions {
     return RunOptionsSchema.parse(options);
   }
   
   // W Orchestrator.run():
   async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
     const validated = validateRunOptions(options);
     // ... use validated ...
   }
   ```

2. **Path Safety (2h)**
   ```typescript
   // src/security/path-safety.ts
   import path from 'node:path';
   
   export class PathSafety {
     static sanitizePath(filePath: string, cwd: string): string {
       const resolved = path.resolve(cwd, filePath);
       
       // Check if resolved path is within cwd
       if (!resolved.startsWith(cwd)) {
         throw new Error(`Path traversal detected: ${filePath}`);
       }
       
       return resolved;
     }
     
     static validateGlob(glob: string): void {
       if (glob.includes('..')) {
         throw new Error('Path traversal in glob pattern');
       }
       if (!/^[a-zA-Z0-9/*._-]+$/.test(glob)) {
         throw new Error('Invalid glob pattern');
       }
     }
   }
   ```

3. **Tests (2h)**
   ```typescript
   describe('Input Validation', () => {
     it('should reject path traversal in files', () => {
       expect(() => orchestrator.run({
         files: ['../../../etc/passwd'],
         cwd: '/tmp'
       })).rejects.toThrow('Path traversal');
     });
     
     it('should reject command injection characters', () => {
       expect(() => orchestrator.run({
         files: ['file.yml; rm -rf /'],
         cwd: '/tmp'
       })).rejects.toThrow('Invalid characters');
     });
     
     it('should limit files array size', () => {
       expect(() => orchestrator.run({
         files: Array(100000).fill('file.yml'),
         cwd: '/tmp'
       })).rejects.toThrow('Too many files');
     });
   });
   ```

**Deliverables:**
- ✅ Runtime validation z Zod
- ✅ Path safety checks
- ✅ Security tests
- ✅ Dokumentacja: docs/security.md

---

### 🚦 PHASE P2: RESILIENCE & PERFORMANCE (12-14h) - HIGH

**Problem 2: BRAK RATE LIMITING - DOS VULNERABILITY**
- **Status:** Unlimited parallelism w runParallel()
- **Ryzyko:** OOM kill, thrashing, DOS na shared runners
- **Priorytet:** P1

**Problem 3: MEMORY LEAK - UNBOUNDED ADAPTER CACHE**
- **Status:** Map<string, Adapter> nigdy nie czyszczona
- **Ryzyko:** Memory leak w długo działających procesach
- **Priorytet:** P1

**Problem 4: BRAK CIRCUIT BREAKER - CASCADING FAILURES**
- **Status:** Failujący adapter uruchamiany w kółko
- **Ryzyko:** Zmarnowany czas (50 plików × 30s timeout = 25 min)
- **Priorytet:** P1

**Implementacja:**

1. **Concurrency Limiting (3h)**
   ```typescript
   // src/core/Orchestrator.ts
   import pLimit from 'p-limit';
   
   private async runParallel(
     adapters: Array<{ name: string; adapter: Adapter }>,
     options: OrchestratorRunOptions
   ): Promise<AdapterResult[]> {
     const concurrency = options.maxConcurrency || 4;
     const limit = pLimit(concurrency);
     
     logger.info('Running adapters in parallel', { 
       adapters: adapters.length, 
       concurrency 
     });
     
     const promises = adapters.map(({ name, adapter }) =>
       limit(async () => {
         logger.debug('Starting adapter', { adapter: name });
         try {
           return await adapter.run({
             files: [...options.files],
             cwd: options.cwd,
             timeout: options.timeout
           });
         } catch (error) {
           logger.error('Adapter failed', { adapter: name, error });
           return this.createErrorResult(adapter, error);
         } finally {
           logger.debug('Adapter completed', { adapter: name });
         }
       })
     );
     
     return Promise.all(promises);
   }
   ```

2. **LRU Cache for Adapters (3h)**
   ```typescript
   import { LRUCache } from 'lru-cache';
   
   export class Orchestrator {
     private adapterCache: LRUCache<string, Adapter>;
     
     constructor() {
       this.adapters = new Map();
       this.adapterCache = new LRUCache({
         max: 100,  // Max 100 adapter instances
         ttl: 1000 * 60 * 5,  // 5 min TTL
         dispose: (adapter, key) => {
           logger.debug('Evicting adapter from cache', { adapter: key });
           // Cleanup adapter resources if needed
           if (adapter.cleanup) adapter.cleanup();
         },
         updateAgeOnGet: true,
         updateAgeOnHas: false
       });
       
       this.registerDefaultAdapters();
     }
     
     getAdapter(name: string): Adapter | null {
       const entry = this.adapters.get(name);
       if (!entry?.enabled) return null;
       
       // Check cache first
       let adapter = this.adapterCache.get(name);
       if (adapter) {
         metrics.cacheHitRate.set({ adapter: name }, 1);
         logger.debug('Adapter cache hit', { adapter: name });
         return adapter;
       }
       
       // Create new instance
       metrics.cacheHitRate.set({ adapter: name }, 0);
       logger.debug('Adapter cache miss', { adapter: name });
       adapter = entry.factory();
       this.adapterCache.set(name, adapter);
       
       return adapter;
     }
   }
   ```

3. **Circuit Breaker (4h)**
   ```typescript
   import CircuitBreaker from 'opossum';
   
   export class Orchestrator {
     private circuitBreakers: Map<string, CircuitBreaker>;
     
     constructor() {
       this.circuitBreakers = new Map();
       // ... rest ...
     }
     
     private getOrCreateCircuitBreaker(
       name: string, 
       factory: () => Adapter
     ): CircuitBreaker {
       let breaker = this.circuitBreakers.get(name);
       
       if (!breaker) {
         breaker = new CircuitBreaker(factory, {
           timeout: 30000,
           errorThresholdPercentage: 50,  // Open after 50% failures
           resetTimeout: 60000,  // Try again after 1 min
           name: `adapter-${name}`
         });
         
         breaker.on('open', () => {
           logger.warn('Circuit breaker OPEN', { adapter: name });
           metrics.adapterErrors.inc({ adapter: name, error_type: 'circuit_open' });
         });
         
         breaker.on('halfOpen', () => {
           logger.info('Circuit breaker HALF-OPEN', { adapter: name });
         });
         
         breaker.on('close', () => {
           logger.info('Circuit breaker CLOSED', { adapter: name });
         });
         
         this.circuitBreakers.set(name, breaker);
       }
       
       return breaker;
     }
     
     getAdapter(name: string): Adapter | null {
       const entry = this.adapters.get(name);
       if (!entry?.enabled) return null;
       
       const breaker = this.getOrCreateCircuitBreaker(name, entry.factory);
       
       if (breaker.opened) {
         logger.warn('Skipping adapter (circuit open)', { adapter: name });
         return null;
       }
       
       // Cache check within circuit breaker
       let adapter = this.adapterCache.get(name);
       if (!adapter) {
         try {
           adapter = breaker.fire();  // Will auto-open on repeated failures
           this.adapterCache.set(name, adapter);
         } catch (error) {
           logger.error('Circuit breaker prevented execution', { adapter: name, error });
           return null;
         }
       }
       
       return adapter;
     }
   }
   ```

4. **Global Timeout (2h)**
   ```typescript
   async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
     const globalTimeout = options.globalTimeout || 300000; // 5 min default
     
     const timeoutPromise = new Promise<never>((_, reject) => {
       setTimeout(() => {
         reject(new Error(`Global timeout exceeded (${globalTimeout}ms)`));
       }, globalTimeout);
     });
     
     return Promise.race([
       this._runInternal(options),
       timeoutPromise
     ]);
   }
   
   private async _runInternal(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
     // ... existing implementation ...
   }
   ```

5. **Tests (4h)**
   ```typescript
   describe('Resilience', () => {
     it('should limit concurrent adapter execution', async () => {
       let concurrent = 0;
       let maxConcurrent = 0;
       
       const slowAdapter = {
         async run() {
           concurrent++;
           maxConcurrent = Math.max(maxConcurrent, concurrent);
           await sleep(100);
           concurrent--;
           return { violations: [] };
         }
       };
       
       // Register 10 adapters
       for (let i = 0; i < 10; i++) {
         orchestrator.register({
           name: `slow-${i}`,
           enabled: true,
           factory: () => slowAdapter as any
         });
       }
       
       await orchestrator.run({ 
         files: ['test.yml'], 
         cwd: '/tmp',
         maxConcurrency: 3
       });
       
       expect(maxConcurrent).toBe(3);
     });
     
     it('should evict old adapters from LRU cache', () => {
       // Fill cache with 101 adapters
       for (let i = 0; i < 101; i++) {
         orchestrator.register({
           name: `adapter-${i}`,
           enabled: true,
           factory: () => new MockAdapter(`adapter-${i}`)
         });
         orchestrator.getAdapter(`adapter-${i}`);
       }
       
       // First adapter should be evicted
       const stats = orchestrator.getCacheStats();
       expect(stats.size).toBe(100);
     });
     
     it('should open circuit after repeated failures', async () => {
       let attempts = 0;
       
       orchestrator.register({
         name: 'failing-adapter',
         enabled: true,
         factory: () => ({
           async run() {
             attempts++;
             throw new Error('Always fails');
           }
         } as any)
       });
       
       // Fail 5 times
       for (let i = 0; i < 5; i++) {
         await orchestrator.run({
           files: ['test.yml'],
           cwd: '/tmp',
           tools: ['failing-adapter']
         });
       }
       
       expect(attempts).toBeLessThan(10); // Circuit should open before 10 attempts
     });
     
     it('should timeout on global timeout', async () => {
       const slowAdapter = {
         async run() {
           await sleep(10000); // 10s
           return { violations: [] };
         }
       };
       
       orchestrator.register({
         name: 'slow',
         enabled: true,
         factory: () => slowAdapter as any
       });
       
       await expect(orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp',
         tools: ['slow'],
         globalTimeout: 1000  // 1s
       })).rejects.toThrow('Global timeout');
     });
   });
   ```

**Deliverables:**
- ✅ Concurrency limiting (p-limit)
- ✅ LRU cache for adapters
- ✅ Circuit breaker (opossum)
- ✅ Global timeout protection
- ✅ Resilience tests
- ✅ Dokumentacja: docs/resilience.md

---

### 🐛 PHASE P3: ERROR HANDLING & DEBUGGING (6-8h) - HIGH

**Problem 5: SYNCHRONICZNY FILE I/O - BLOKUJE EVENT LOOP**
- **Status:** fs.readFileSync() w ContractValidator
- **Ryzyko:** Blocked event loop, poor performance
- **Priorytet:** P1

**Problem 8: ERROR SWALLOWING - SILENT FAILURES**
- **Status:** Stack traces gubione w catch blocks
- **Ryzyko:** Niemożność debug'owania problemów
- **Priorytet:** P1

**Implementacja:**

1. **Async File I/O (2h)**
   ```typescript
   // src/contracts/ContractValidator.ts
   async loadContract(filePath: string): Promise<Contract> {
     const content = await fs.promises.readFile(filePath, 'utf-8');  // ASYNC!
     const ext = path.extname(filePath).toLowerCase();
     
     let parsed: unknown;
     if (ext === '.json') {
       parsed = JSON.parse(content);
     } else if (ext === '.yml' || ext === '.yaml') {
       parsed = yaml.parse(content);
     } else {
       throw new Error(`Unsupported format: ${ext}`);
     }
     
     const result = this.validate(parsed);
     if (!result.valid) {
       throw new Error(`Validation failed:\n${result.errors.join('\n')}`);
     }
     
     return parsed as Contract;
   }
   
   // Schema compilation cache
   private schemaCache = new Map<string, ValidateFunction>();
   
   private getValidateFunction(schemaPath: string): ValidateFunction {
     let fn = this.schemaCache.get(schemaPath);
     if (!fn) {
       const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
       fn = this.ajv.compile(schema);
       this.schemaCache.set(schemaPath, fn);
     }
     return fn;
   }
   ```

2. **Error Context Preservation (3h)**
   ```typescript
   // src/core/Orchestrator.ts
   private async runParallel(
     adapters: Array<{ name: string; adapter: Adapter }>,
     options: OrchestratorRunOptions
   ): Promise<AdapterResult[]> {
     const limit = pLimit(options.maxConcurrency || 4);
     
     const promises = adapters.map(({ name, adapter }) =>
       limit(async () => {
         try {
           return await adapter.run({
             files: [...options.files],
             cwd: options.cwd,
             timeout: options.timeout
           });
         } catch (error) {
           // PRESERVE FULL ERROR CONTEXT
           const errorContext = {
             adapter: name,
             error: error instanceof Error ? {
               name: error.name,
               message: error.message,
               stack: error.stack,
               code: (error as any).code,
               errno: (error as any).errno,
               syscall: (error as any).syscall
             } : String(error),
             options: {
               files: options.files,
               cwd: options.cwd,
               timeout: options.timeout
             },
             timestamp: new Date().toISOString()
           };
           
           logger.error('Adapter execution failed', errorContext);
           metrics.adapterErrors.inc({ 
             adapter: name, 
             error_type: error instanceof Error ? error.name : 'Unknown'
           });
           
           return {
             tool: adapter.name,
             version: 'unknown',
             exitCode: this.classifyErrorExitCode(error),
             violations: [],
             executionTime: 0,
             skipped: true,
             skipReason: `Crashed: ${error.message}`,
             metadata: {
               error: errorContext.error  // ERROR CONTEXT W OUTPUT!
             }
           };
         }
       })
     );
     
     return Promise.all(promises);
   }
   
   private classifyErrorExitCode(error: unknown): number {
     if (!(error instanceof Error)) return 3;
     
     const msg = error.message.toLowerCase();
     const code = (error as any).code;
     
     if (code === 'ENOENT' || msg.includes('not found')) return 127;
     if (code === 'ETIMEDOUT' || msg.includes('timeout')) return 124;
     if (code === 'EACCES' || msg.includes('permission')) return 126;
     
     return 3;  // Generic crash
   }
   ```

3. **Tests (2h)**
   ```typescript
   describe('Error Handling', () => {
     it('should use async file I/O', async () => {
       const spy = jest.spyOn(fs.promises, 'readFile');
       await validator.loadContract('contract.yml');
       expect(spy).toHaveBeenCalled();
       expect(fs.readFileSync).not.toHaveBeenCalled();
     });
     
     it('should preserve error stack trace', async () => {
       const error = new Error('Test error');
       error.stack = 'Error: Test error\n  at line 123';
       
       orchestrator.register({
         name: 'failing',
         enabled: true,
         factory: () => ({
           async run() { throw error; }
         } as any)
       });
       
       const result = await orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp',
         tools: ['failing']
       });
       
       expect(result.metadata.tools[0].metadata.error.stack).toContain('line 123');
     });
   });
   ```

**Deliverables:**
- ✅ Async file I/O w całym systemie
- ✅ Error context preservation
- ✅ Structured error logging
- ✅ Tests dla error handling

---

### ✅ PHASE P4: TESTING & VALIDATION (8-10h) - MEDIUM

**Problem 10: TESTY NIE TESTUJĄ EDGE CASES**
- **Status:** Brak stress tests, memory tests, concurrency tests
- **Ryzyko:** Production issues nie są wykrywane w CI
- **Priorytet:** P2

**Implementacja:**

1. **Stress Tests (3h)**
   ```typescript
   // test/stress/orchestrator.stress.test.ts
   describe('Orchestrator Stress Tests', () => {
     it('should handle 10k violations without OOM', async () => {
       const violations: Violation[] = Array(10000).fill(null).map((_, i) => ({
         id: `rule-${i % 100}`,
         severity: 'error' as const,
         message: `Violation ${i}`,
         source: 'test-adapter',
         path: `file-${i % 50}.yml`,
         line: i % 1000
       }));
       
       orchestrator.register({
         name: 'stress-adapter',
         enabled: true,
         factory: () => ({
           async run() {
             return {
               tool: 'stress-adapter',
               version: '1.0.0',
               exitCode: 1,
               violations,
               executionTime: 100
             };
           }
         } as any)
       });
       
       const memBefore = process.memoryUsage().heapUsed;
       const result = await orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp',
         tools: ['stress-adapter']
       });
       const memAfter = process.memoryUsage().heapUsed;
       
       expect(result.violations.length).toBeLessThanOrEqual(10000);
       expect(memAfter - memBefore).toBeLessThan(100 * 1024 * 1024); // <100MB
     });
     
     it('should deduplicate efficiently at scale', async () => {
       // 5k duplicates + 5k unique = should dedupe to 5k
       const violations: Violation[] = [
         ...Array(5000).fill(null).map(() => ({
           id: 'duplicate-rule',
           severity: 'error' as const,
           message: 'Same message',
           source: 'test',
           path: 'file.yml',
           line: 10
         })),
         ...Array(5000).fill(null).map((_, i) => ({
           id: `unique-${i}`,
           severity: 'error' as const,
           message: `Unique ${i}`,
           source: 'test',
           path: 'file.yml',
           line: i
         }))
       ];
       
       const start = Date.now();
       const result = await orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp',
         tools: ['stress-adapter']
       });
       const duration = Date.now() - start;
       
       expect(result.violations.length).toBe(5001); // 1 duplicate + 5000 unique
       expect(duration).toBeLessThan(5000); // <5s
     });
   });
   ```

2. **Concurrency Tests (2h)**
   ```typescript
   describe('Concurrency Tests', () => {
     it('should prevent race conditions in parallel mode', async () => {
       let sharedState = 0;
       
       orchestrator.register({
         name: 'racy-adapter',
         enabled: true,
         factory: () => ({
           async run(options) {
             // Simulate race condition
             const current = sharedState;
             await sleep(10);
             sharedState = current + 1;
             
             // Options should not be shared
             options.files.push('mutated.yml');
             
             return {
               tool: 'racy-adapter',
               version: '1.0.0',
               exitCode: 0,
               violations: [],
               executionTime: 10
             };
           }
         } as any)
       });
       
       const originalFiles = ['file1.yml', 'file2.yml'];
       
       await orchestrator.run({
         files: [...originalFiles],
         cwd: '/tmp',
         tools: Array(10).fill('racy-adapter'),
         parallel: true
       });
       
       // Files should not be mutated
       expect(originalFiles).toEqual(['file1.yml', 'file2.yml']);
     });
   });
   ```

3. **Memory Leak Tests (2h)**
   ```typescript
   describe('Memory Leak Tests', () => {
     it('should not leak memory in long-running process', async () => {
       const memSnapshots: number[] = [];
       
       for (let i = 0; i < 100; i++) {
         await orchestrator.run({
           files: ['test.yml'],
           cwd: '/tmp'
         });
         
         if (i % 10 === 0) {
           global.gc?.();  // Force GC if available
           memSnapshots.push(process.memoryUsage().heapUsed);
         }
       }
       
       // Memory should stabilize, not grow linearly
       const firstQuarter = memSnapshots.slice(0, 3).reduce((a, b) => a + b) / 3;
       const lastQuarter = memSnapshots.slice(-3).reduce((a, b) => a + b) / 3;
       
       expect(lastQuarter).toBeLessThan(firstQuarter * 2); // <2x growth
     });
   });
   ```

4. **Timeout Tests (1h)**
   ```typescript
   describe('Timeout Tests', () => {
     it('should respect global timeout', async () => {
       orchestrator.register({
         name: 'slow-adapter',
         enabled: true,
         factory: () => ({
           async run() {
             await sleep(10000); // 10s
             return { violations: [] };
           }
         } as any)
       });
       
       const start = Date.now();
       
       await expect(orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp',
         tools: ['slow-adapter'],
         globalTimeout: 1000  // 1s
       })).rejects.toThrow('Global timeout');
       
       const duration = Date.now() - start;
       expect(duration).toBeLessThan(1500); // ~1s (with tolerance)
     });
   });
   ```

**Deliverables:**
- ✅ Stress tests (10k violations)
- ✅ Concurrency tests (race conditions)
- ✅ Memory leak tests
- ✅ Timeout tests
- ✅ CI pipeline updated z stress tests

---

### 🔄 PHASE P5: RETRY LOGIC & GRACEFUL SHUTDOWN (6-8h) - MEDIUM

**Problem 9: BRAK RETRIES - FLAKY FAILURES**
- **Status:** 1 próba, brak retry dla transient errors
- **Ryzyko:** Flaky CI failures
- **Priorytet:** P2

**Problem 11: BRAK GRACEFUL SHUTDOWN**
- **Status:** SIGTERM nie handled, orphaned processes
- **Ryzyko:** Zombie adapters w Kubernetes
- **Priorytet:** P2

**Implementacja:**

1. **Retry Logic (3h)**
   ```typescript
   // src/adapters/_shared/exec.ts
   import pRetry from 'p-retry';
   
   export async function executeCommand(
     command: string,
     args: string[],
     options: ExecOptions = {}
   ): Promise<ExecResult> {
     const startTime = Date.now();
     const retries = options.retries || 3;
     
     return pRetry(
       async () => {
         const result = await execa(command, args, {
           cwd: options.cwd || process.cwd(),
           timeout: options.timeout || 30000,
           env: { ...process.env, ...options.env },
           reject: false,
           shell: platform() === 'win32' ? 'cmd.exe' : '/bin/sh',
           windowsHide: true
         });
         
         return {
           exitCode: result.exitCode || 0,
           stdout: String(result.stdout || ''),
           stderr: String(result.stderr || ''),
           executionTime: Date.now() - startTime,
           command: `${command} ${args.join(' ')}`,
           failed: (result.exitCode || 0) !== 0
         };
       },
       {
         retries,
         onFailedAttempt: (error) => {
           logger.warn('Command failed, retrying', {
             command,
             attempt: error.attemptNumber,
             retriesLeft: error.retriesLeft,
             error: error.message
           });
         },
         shouldRetry: (error) => {
           // Retry only transient errors
           const code = (error as any).code;
           const isTransient = 
             code === 'ETIMEDOUT' ||
             code === 'ECONNRESET' ||
             code === 'ENOTFOUND' ||
             code === 'EAI_AGAIN';
           
           return isTransient;
         },
         minTimeout: 1000,  // 1s
         maxTimeout: 5000   // 5s
       }
     );
   }
   ```

2. **Graceful Shutdown (3h)**
   ```typescript
   // src/core/Orchestrator.ts
   export class Orchestrator {
     private shuttingDown = false;
     private runningAdapters: Set<Promise<AdapterResult>> = new Set();
     private shutdownHandlers: Array<() => Promise<void>> = [];
     
     async shutdown(options: { timeout?: number } = {}): Promise<void> {
       if (this.shuttingDown) {
         logger.warn('Shutdown already in progress');
         return;
       }
       
       this.shuttingDown = true;
       logger.info('Starting graceful shutdown', {
         runningAdapters: this.runningAdapters.size,
         timeout: options.timeout || 30000
       });
       
       const shutdownTimeout = options.timeout || 30000;
       
       try {
         // Wait for running adapters or timeout
         await Promise.race([
           Promise.all(this.runningAdapters),
           new Promise(resolve => setTimeout(resolve, shutdownTimeout))
         ]);
         
         logger.info('All adapters completed');
       } catch (error) {
         logger.error('Error during adapter completion', { error });
       }
       
       // Run shutdown handlers
       for (const handler of this.shutdownHandlers) {
         try {
           await handler();
         } catch (error) {
           logger.error('Shutdown handler failed', { error });
         }
       }
       
       // Cleanup
       this.adapterCache.clear();
       this.circuitBreakers.clear();
       
       logger.info('Graceful shutdown complete');
     }
     
     registerShutdownHandler(handler: () => Promise<void>): void {
       this.shutdownHandlers.push(handler);
     }
     
     async run(options: OrchestratorRunOptions): Promise<OrchestratorResult> {
       if (this.shuttingDown) {
         throw new Error('Orchestrator is shutting down');
       }
       
       const validated = validateRunOptions(options);
       const runPromise = this._runInternal(validated);
       
       this.runningAdapters.add(runPromise);
       
       try {
         return await runPromise;
       } finally {
         this.runningAdapters.delete(runPromise);
       }
     }
   }
   
   // In CLI/server
   let orchestrator: Orchestrator;
   
   async function handleShutdown(signal: string) {
     logger.info(`Received ${signal}, shutting down gracefully`);
     
     if (orchestrator) {
       await orchestrator.shutdown({ timeout: 30000 });
     }
     
     process.exit(0);
   }
   
   process.on('SIGTERM', () => handleShutdown('SIGTERM'));
   process.on('SIGINT', () => handleShutdown('SIGINT'));
   ```

3. **Tests (2h)**
   ```typescript
   describe('Retry & Shutdown', () => {
     it('should retry transient failures', async () => {
       let attempts = 0;
       
       orchestrator.register({
         name: 'flaky-adapter',
         enabled: true,
         factory: () => ({
           async run() {
             attempts++;
             if (attempts < 3) {
               const error: any = new Error('Timeout');
               error.code = 'ETIMEDOUT';
               throw error;
             }
             return { violations: [] };
           }
         } as any)
       });
       
       const result = await orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp',
         tools: ['flaky-adapter']
       });
       
       expect(attempts).toBe(3);
       expect(result.violations).toEqual([]);
     });
     
     it('should shutdown gracefully', async () => {
       const cleanupCalled = jest.fn();
       orchestrator.registerShutdownHandler(async () => {
         cleanupCalled();
       });
       
       // Start long-running operation
       const runPromise = orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp'
       });
       
       // Trigger shutdown
       await orchestrator.shutdown({ timeout: 5000 });
       
       await expect(orchestrator.run({
         files: ['test.yml'],
         cwd: '/tmp'
       })).rejects.toThrow('shutting down');
       
       expect(cleanupCalled).toHaveBeenCalled();
     });
   });
   ```

**Deliverables:**
- ✅ Retry logic z p-retry
- ✅ Graceful shutdown handling
- ✅ SIGTERM/SIGINT handlers
- ✅ Tests dla retry & shutdown

---

## 📊 PRODUCTION HARDENING SUMMARY

### Dependencies to Add:
```json
{
  "dependencies": {
    "pino": "^8.17.2",
    "prom-client": "^15.1.0",
    "zod": "^3.22.4",
    "lru-cache": "^10.2.0",
    "opossum": "^8.1.1",
    "p-limit": "^5.0.0",
    "p-retry": "^6.2.0"
  },
  "devDependencies": {
    "pino-pretty": "^10.3.1",
    "@types/node": "^20.10.0"
  }
}
```

### Timeline & Effort:

| Phase | Priority | Effort | Timeline |
|-------|----------|--------|----------|
| P0: Observability | CRITICAL | 8-10h | Week 1 (Days 1-2) |
| P1: Input Validation | CRITICAL | 6-8h | Week 1 (Days 2-3) |
| P2: Resilience | HIGH | 12-14h | Week 2 (Days 1-3) |
| P3: Error Handling | HIGH | 6-8h | Week 2 (Days 3-4) |
| P4: Testing | MEDIUM | 8-10h | Week 3 (Days 1-2) |
| P5: Retry & Shutdown | MEDIUM | 6-8h | Week 3 (Days 2-3) |
| **TOTAL** | | **46-58h** | **3 weeks** |

### Deployment Readiness Checklist:

**P0 (Must Have Before Production):**
- [ ] Structured logging (pino) implemented
- [ ] Prometheus metrics endpoint
- [ ] Input validation (Zod) on all entry points
- [ ] Path safety checks
- [ ] Async file I/O (no sync operations)

**P1 (Should Have in First Sprint):**
- [ ] Concurrency limiting (p-limit)
- [ ] LRU cache for adapters
- [ ] Circuit breaker (opossum)
- [ ] Global timeout protection
- [ ] Error context preservation

**P2 (Nice to Have, Can Ship Later):**
- [ ] Retry logic for transient failures
- [ ] Graceful shutdown (SIGTERM/SIGINT)
- [ ] Stress tests (10k violations)
- [ ] Memory leak tests
- [ ] Concurrency tests

### Monitoring Dashboard (Grafana):

**Key Metrics to Track:**
1. **Throughput:** cerber_orchestrator_runs_total (by profile, status)
2. **Latency:** cerber_orchestrator_duration_seconds (P50, P95, P99)
3. **Error Rate:** cerber_adapter_errors_total (by adapter, error_type)
4. **Violations:** cerber_violations_total (by adapter, severity)
5. **Cache Performance:** cerber_adapter_cache_hit_rate
6. **Circuit Breakers:** opossum_circuit_opened_total (by adapter)

**Alerts to Configure:**
- Error rate > 5% for 5 minutes → PagerDuty
- P95 latency > 30s → Slack warning
- Circuit breaker open > 10 minutes → Investigate
- Memory usage > 1GB → Check for leak

---

**END OF ROADMAP**
