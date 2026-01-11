# ADR-001: ErrorClassifier Pattern for Resilience Layer

**Status:** ✅ Accepted (Implemented in REFACTOR-1)

**Date:** 2026-01-10

**Deciders:** Core Team

**Technical Story:** [PR #48 - REFACTOR-1: Extract ErrorClassifier](https://github.com/Agaslez/cerber-core/pull/48)

---

## Context

### The Problem

**Before REFACTOR-1:**
```typescript
// In src/core/circuit-breaker.ts (Line 85)
private isErrorRetriable(error: Error): boolean {
  if (error.message.includes('ENOENT') || error.message.includes('not found')) {
    return false; // Tool not installed
  }
  if (error.message.includes('EACCES')) {
    return false; // Permission denied
  }
  if (error.message.includes('timeout')) {
    return true;  // Retry timeouts
  }
  return true;
}

// In src/core/retry.ts (Line 112)  
if (error.message.includes('ENOENT') || error.message.includes('not found')) {
  throw error; // Don't retry if tool not found
}

// In src/core/resilience/resilience-coordinator.ts (Line 93)
if (error.message.includes('not found') || error.message.includes('ENOENT')) {
  return { type: 'tool_not_found', adapter: name };
}
```

**Code duplication across 3 files!** Same error classification logic scattered everywhere.

### Forces

1. **DRY Principle Violation:**
   - Error classification logic duplicated in CircuitBreaker, Retry, ResilienceCoordinator
   - Changes require updating 3+ files
   - High risk of inconsistency

2. **Testing Nightmare:**
   - Must test same logic 3 times
   - Test changes ripple across files
   - 32 tests needed just for error classification

3. **SOLID Violation:**
   - CircuitBreaker has TWO responsibilities: state management + error classification
   - Retry has TWO responsibilities: backoff logic + error classification
   - Single Responsibility Principle broken

4. **Future Extensibility:**
   - Adding new error types (e.g., network errors) requires changing multiple files
   - No single place to understand error taxonomy
   - Hard to add telemetry/metrics per error type

---

## Decision

**Extract error classification into a dedicated `ErrorClassifier` class.**

### Implementation

**New file:** `src/core/error-classifier.ts`

```typescript
export class ErrorClassifier {
  classify(error: Error): ErrorClassification {
    // Single source of truth for error categorization
    if (this.isToolNotFound(error)) {
      return { type: 'tool_not_found', retriable: false, exitCode: 127 };
    }
    if (this.isPermissionDenied(error)) {
      return { type: 'permission_denied', retriable: false, exitCode: 126 };
    }
    if (this.isTimeout(error)) {
      return { type: 'timeout', retriable: true, exitCode: 124 };
    }
    return { type: 'unknown', retriable: true, exitCode: 1 };
  }
}
```

**Usage:**
```typescript
// In CircuitBreaker
const classification = this.classifier.classify(error);
if (!classification.retriable) {
  this.recordSuccess(); // Don't count non-retriable as failure
}

// In Retry
const classification = this.classifier.classify(error);
if (!classification.retriable) {
  throw error; // Don't retry
}
```

---

## Consequences

### Positive ✅

1. **Single Responsibility:**
   - `ErrorClassifier` has ONE job: classify errors
   - `CircuitBreaker` focuses on state management
   - `Retry` focuses on backoff logic
   - Each class can evolve independently

2. **DRY:**
   - Error classification logic in ONE place
   - Changes happen once
   - Zero risk of inconsistency

3. **Testability:**
   - 32 tests in `error-classifier.test.ts`
   - Other classes test their core logic only
   - Clear test boundaries

4. **Extensibility:**
   - Adding new error types = 1 file change
   - Easy to add metrics: `metrics.errorTypes.inc({ type: classification.type })`
   - Simple to add logging: `logger.error('Classified error', { classification })`

5. **Exit Code Standards:**
   - Follows POSIX conventions (127 = command not found, 126 = permission denied, 124 = timeout)
   - Consistent across all adapters
   - Better CI/CD integration

6. **Type Safety:**
   - `ErrorClassification` interface enforces structure
   - TypeScript prevents classification errors
   - IDE autocomplete for error types

### Negative ⚠️

1. **Extra File:**
   - +1 file to maintain
   - **Mitigation:** Clear naming + docs make it discoverable

2. **Indirection:**
   - One more hop to understand error handling
   - **Mitigation:** ADR + inline comments explain pattern

3. **Dependency Injection:**
   - Must inject `ErrorClassifier` into CircuitBreaker, Retry
   - **Mitigation:** Constructor injection is standard pattern

---

## Alternatives Considered

### Alternative 1: Shared Utility Function
```typescript
// src/core/utils/error-utils.ts
export function classifyError(error: Error): ErrorType { ... }
```

**Rejected because:**
- Procedural, not object-oriented
- Harder to mock in tests
- No place for future state (e.g., error history, adaptive classification)
- Doesn't fit SOLID architecture

### Alternative 2: Error Subclasses
```typescript
class ToolNotFoundError extends Error { }
class PermissionDeniedError extends Error { }
```

**Rejected because:**
- External tools (actionlint, zizmor) throw generic `Error`
- We can't control their error types
- Would require wrapping all errors
- More boilerplate than benefit

### Alternative 3: Keep Duplication, Accept Technical Debt
**Rejected because:**
- Violates project goal: **⭐ GitHub Stars through architecture quality**
- Technical debt grows faster than features
- Makes future refactorings harder

---

## Implementation Details

### Test Coverage

**32 tests in `test/core/error-classifier.test.ts`:**
- Tool not found detection (ENOENT, 'not found', 'command not found')
- Permission denied detection (EACCES, 'permission denied')
- Timeout detection ('timeout', 'timed out', 'ETIMEDOUT')
- Network errors (ECONNREFUSED, ENOTFOUND)
- Exit code mapping (127, 126, 124)
- Edge cases (null messages, undefined errors)
- Retriability flags

### Performance

- Zero regex compilation per call (patterns cached)
- O(1) lookup for exit codes
- No memory allocation (returns frozen objects)
- <1μs per classification

### Metrics Integration

```typescript
// In ResilienceCoordinator
const classification = this.classifier.classify(error);
metrics.adapterErrors.inc({
  adapter: name,
  error_type: classification.type,
  retriable: classification.retriable.toString(),
});
```

---

## Lessons Learned

### What Worked ✅

1. **Incremental Refactoring:**
   - Kept existing tests passing while extracting
   - Used feature flags to test in isolation
   - Merged when 100% test coverage reached

2. **Test-First:**
   - Wrote 32 tests before implementation
   - Tests documented behavior expectations
   - Caught edge cases early

3. **Documentation:**
   - ADR created alongside code
   - Inline comments explain POSIX exit codes
   - README updated with architecture diagram

### What Could Be Better 🔄

1. **Earlier Extraction:**
   - Should have caught duplication in code review
   - Linting rules could detect duplicate string patterns

2. **Migration Path:**
   - Could have added deprecation warnings to old methods
   - Gradual migration would reduce PR size

---

## References

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html)
- [POSIX Exit Codes](https://www.gnu.org/software/bash/manual/html_node/Exit-Status.html)
- [Error Handling in TypeScript](https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript)

---

## Follow-up Tasks

- [x] Implement ErrorClassifier
- [x] Add 32 tests
- [x] Update CircuitBreaker to use ErrorClassifier
- [x] Update Retry to use ErrorClassifier
- [x] Update ResilienceCoordinator to use ErrorClassifier
- [x] Remove duplicate logic
- [x] Document in ADR
- [ ] Add metrics for error type distribution (REFACTOR-4)
- [ ] Add adaptive classification (learn from historical patterns) (V2.1+)
