# ⚠️ [ARCHIVED - SEE ONE_TRUTH_MVP.md]

**This document is outdated.** Refer to [ONE_TRUTH_MVP.md](../ONE_TRUTH_MVP.md) for current MVP roadmap.

---

# 🛡️ CERBER CORE V2.0 - ROADMAP (REALITY CHECK JANUARY 2026)

**"One Truth - Co naprawdę mamy, co brakuje, ile to zajmie"**

---

## 📊 EXECUTIVE SUMMARY - WHERE WE REALLY ARE

### Current State (v1.1.12 + Audit Data)
```
Progress toward V2.0: 41% (100 hours done / 244 hours total)
Test Quality: 97% (1108/1140 passing)
Architectural Rating: 7.2/10 (solid foundation, some debt)

Breakdown by Phase:
├─ PHASE 0 (Foundation):     0% ( 0h / 12h ) ❌
├─ PHASE 1 (Core):          70% (63h / 90h ) ⚠️
├─ PHASE 2 (Observability): 30% (15h / 50h ) ❌
├─ PHASE 3 (Operations):    10% ( 3h / 30h ) ❌
└─ PHASES 4-7 (Completion): 5%  ( 2h / 52h ) ❌
```

### Release Readiness
- **MVP (Week 1-2):** Orchestrator + Profiles + Guardian refactored
  - Skip: auto-install, persistence, plugins
  - Timeline: 10-12 days with 30h/week
  
- **Full V2.0 (Week 3):** Add state machine + auto-install
  - Timeline: 21 days from today (Jan 12 → Feb 2)
  
- **Confidence:** 7/10 (doable, tight, achievable)

---

## ✅ WHAT WE HAVE (Already Working)

### Phase 1.3: Orchestrator Engine - 90% DONE
```
✅ Orchestrator.ts (545 lines)
   - Strategy Pattern (AdapterExecutionStrategy)
   - Dependency Injection
   - Registry pattern for adapters
   - Adapter instance caching
   - Deterministic sorting
   
✅ Profile Resolution (273 lines)
   - Solo / Dev / Team profiles
   - Tool enable/disable per profile
   - failOn severity control
   - Priority: CLI > env > default
   - 15+ tests passing
   
✅ ONE TRUTH ACHIEVED
   - .cerber/contract.yml is single source
   - Schema synced with runtime types
   - Contract loader working
   - 20+ tests validating schema
```

### Phase 1.4: Adapters - 60-70% DONE
```
✅ ActionlintAdapter
   - Tool execution working
   - Output parsing (JSON → Violation[])
   - Version detection
   - 25+ tests with fixtures
   
✅ ZizmorAdapter
   - Security checks working
   - JSON parsing
   - Fixture-based testing
   - 20+ tests
   
✅ GitleaksAdapter
   - Secrets scanning working
   - JSON parsing
   - 15+ tests

❌ RatchetAdapter (NOT DONE - for unpinned actions)
   - Needs separate implementation
   - Low priority for MVP
```

### Phase 1.2: File Discovery - 80% DONE
```
✅ GitSCM
   - staged, changed, all modes working
   - Path normalization cross-platform
   - 35+ tests passing
   
⚠️ One failing test (detached HEAD timeout)
   - Not logic error, execution timeout
   - Needs investigation
```

### Phase 1.5: Reporting - 70% DONE
```
✅ format-text.ts - WORKS
✅ format-json.ts - WORKS
✅ format-github.ts - WORKS (::error annotations)
❌ format-sarif.ts - NOT DONE (low priority for MVP)
```

### Phase 2.1: Observability - 50% DONE
```
✅ Structured Logger (src/core/logger.ts)
✅ Metrics Collector (src/core/metrics.ts)
⚠️ Prom-client integration partial
❌ Distributed tracing NOT DONE
❌ Prometheus /metrics endpoint NOT DONE
```

### Test Infrastructure
```
✅ 1108/1140 tests passing (97%)
✅ 11/11 snapshots working (determinism verified)
✅ Fixture-based testing (no real tool dependency)
✅ Parallel execution (50+ tests per file)
✅ All adapters tested
```

---

## ❌ WHAT WE'RE MISSING (Critical Gaps)

### Issue #1: RELIABILITY CODE NOT INTEGRATED (HIGH) ⚠️
```
Problem:
  src/core/circuit-breaker.ts      ← EXISTS (160 lines)
  src/core/retry.ts                 ← EXISTS (80 lines)
  src/core/timeout.ts               ← EXISTS (50 lines)
  But Orchestrator DOESN'T USE THEM! ← UNUSED CODE

Impact:
  - No resilience in production
  - Adapters can fail without retry
  - No circuit breaker for cascading failures
  - Wasted ~12 hours of development

Fix Required: 2-3 hours
  1. Create ResilientExecutionStrategy (wraps adapters with retry/circuit breaker)
  2. Update Orchestrator to use ResilientExecutionStrategy by default
  3. Update 5+ tests to verify integration
  4. Verify no regressions
```

### Issue #2: ERROR HANDLING DUPLICATED (MEDIUM)
```
Problem:
  src/core/error-classifier.ts:20-40   ← ErrorClassifier
  src/core/circuit-breaker.ts:100-120  ← CircuitBreaker has own logic
  src/core/Orchestrator.ts:300-320     ← Orchestrator has ANOTHER handler

Impact:
  - DRY violation
  - Risk of inconsistent error codes
  - Maintenance nightmare

Fix Required: 1 hour
  1. Consolidate to ErrorClassifier
  2. Remove duplicates
  3. Verify all 1108 tests pass
```

### Issue #3: TOOL AUTO-INSTALL NOT DONE (HIGH) ❌
```
Missing:
  ❌ src/adapters/_shared/versions.ts       (version registry)
  ❌ src/core/tool-installer.ts             (download mechanism)
  ❌ ~/.cerber/tools/                       (cache directory)
  ❌ Checksum verification

Roadmap says: "Phase 1.1b - Version registry + download + cache + checksum"
Actual: None of it exists

Impact:
  - CI/CD requires manual tool installation
  - No version pinning
  - No caching
  - Slower builds
  - Risk of version mismatch

Fix Required: 6-8 hours
  1. Implement VersionRegistry interface
  2. Create tool-installer with download logic
  3. Add checksum verification (SHA256)
  4. Implement cache management
  5. Add 20+ tests
  6. Update docs

Timeline: This week (critical for MVP to work without manual setup)
```

### Issue #4: GUARDIAN NOT V2.0 READY (HIGH) ⚠️
```
Current State:
  bin/cerber-guardian exists but still references legacy structure

Missing:
  ❌ Profile support (uses hardcoded profile)
  ❌ --changed flag (not for pre-commit hook)
  ❌ < 2s execution optimization
  ❌ ProfileResolver integration
  ❌ Modern adapter usage

Impact:
  - Cannot use as actual pre-commit hook
  - No value for teams
  - Blocks Guardian feature launch
  - V2.0 incomplete without this

Fix Required: 3-4 hours
  1. Refactor to use Orchestrator + ProfileResolver
  2. Add --changed / --staged flags
  3. Profile detection from git config
  4. Optimize for <2s execution
  5. Add 10+ tests
  6. Update documentation

Timeline: This week (required for V2.0 release)
```

### Issue #5: STATE MACHINE NOT IMPLEMENTED (MEDIUM) ❌
```
Missing:
  ❌ ExecutionContext class
  ❌ ExecutionState enum (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
  ❌ Checkpoint system (for debugging)
  ❌ Execution tracking
  ❌ Recovery mechanism

Roadmap says: "Phase 1.7 - State Machine"
Actual: Doesn't exist

Impact:
  - Cannot track execution progress
  - Cannot debug long-running validations
  - Cannot implement recovery
  - Enterprise requirement not addressed

Fix Required: 8 hours
  1. Design ExecutionState machine
  2. Implement ExecutionContext
  3. Implement ExecutionContextManager
  4. Integrate with Orchestrator
  5. Add checkpoint system
  6. Add 25+ tests
  7. Update documentation

Timeline: Week 2 (can defer to V2.1 if tight on time, but preferred for V2.0)
```

### Issue #6: CONTRACT VALIDATION INCOMPLETE (MEDIUM)
```
Problem:
  .cerber/contract.schema.json EXISTS
  But NOT enforced at runtime!

Current:
  - Manual TypeScript validation ⚠️
  - No Zod schema
  - No JSON Schema enforcement
  - No error messages

Missing:
  ❌ Zod schema for Contract
  ❌ Runtime validation
  ❌ Clear error messages
  ❌ Fail-fast behavior

Fix Required: 2-3 hours
  1. Create Zod schema matching contract.schema.json
  2. Add validation in contract loader
  3. Clear error messages for invalid contracts
  4. Add 15+ tests
  5. Update documentation
```

### Issue #7: OUTPUT SCHEMA NOT FINALIZED (MEDIUM)
```
Missing:
  ❌ .cerber/output.schema.json
  ❌ Output interface definition
  ❌ Schema validation for outputs

Roadmap says: "Phase 0 - Schema finalization"
Actual: Partially done

Impact:
  - Unclear output contract
  - Risk of API changes
  - Hard to document for users

Fix Required: 2-3 hours
  1. Define output interface
  2. Create output.schema.json
  3. Validate in formatter
  4. Update documentation
```

### Issue #8: AGENTS.md SPECIFICATION NOT DONE (MEDIUM) ❌
```
Missing:
  ❌ AGENTS.md file with agent rules
  ❌ Adaptation rules documented
  ❌ Integration patterns

Impact:
  - Code references AGENTS.md but file doesn't exist
  - Unclear governance
  - Hard to maintain consistency

Fix Required: 2-3 hours
  1. Create AGENTS.md
  2. Define adaptation rules
  3. Document patterns
  4. Reference from code
```

---

## 📅 REALISTIC ROADMAP TO V2.0

### WEEK 1 (Jan 12-19) - FIX WHAT WE HAVE

**Days 1-2: Critical Path (8h)**
```
MUST-DO (Blocking):
[ ] Fix detached HEAD test timeout (0.5h)
[ ] Integrate reliability code - ResilientExecutionStrategy (2-3h)
[ ] Fix error handling duplication (1h)
[ ] Verify no regressions - run full test suite (0.5h)
[ ] GitHub Actions CI passing (wait for automated)

Commits:
  1. "fix: integrate reliability patterns (circuit breaker + retry)"
  2. "fix: consolidate error classification"
  3. "test: verify reliability integration"
```

**Days 3-4: Guardian Ready for V2.0 (8h)**
```
MUST-DO (Blocking for V2.0):
[ ] Refactor bin/cerber-guardian for V2.0 (3-4h)
  - Remove legacy code
  - Integrate ProfileResolver
  - Add --changed / --staged flags
  - Optimize for <2s
[ ] Add 10+ tests for Guardian (2h)
[ ] Update documentation (1-2h)

Commits:
  4. "refactor: guardian for v2.0 (profiles + fast execution)"
  5. "test: guardian profile support"
  6. "docs: guardian usage"
```

**Days 5: Foundation Setup (4h)**
```
NICE-TO-HAVE (But recommended):
[ ] Create AGENTS.md specification (2-3h)
[ ] Finalize output schema (.cerber/output.schema.json) (1-2h)

Commits:
  7. "docs: agents specification"
  8. "spec: output schema"
```

**End of Week 1: Validation**
```
Checkpoints:
  ✓ All 1108 tests passing
  ✓ GitHub Actions: 2/2 checks passing
  ✓ Guardian working with profiles
  ✓ Reliability code integrated
  ✓ PR #56 merged to main
  ✓ Ready for user testing

Effort: 20h / 30h week = 67% capacity used
Status: **MVP READY FOR TESTING**
```

---

### WEEK 2 (Jan 20-26) - BUILD MISSING PIECES

**Days 6-7: Tool Auto-Install Framework (8h)**
```
HIGH-PRIORITY (Required for real-world use):
[ ] Implement VersionRegistry interface (2h)
[ ] Create tool-installer with download (3h)
[ ] Add checksum verification (SHA256) (2h)
[ ] Implement cache management (1h)
[ ] Add 20+ tests (2h)
[ ] Update documentation (1h)

Commits:
  9. "feat: tool auto-install (version registry + download)"
  10. "test: tool installer with checksums"
  11. "docs: tool auto-install"
```

**Days 8-9: State Machine Implementation (8h)**
```
MEDIUM-PRIORITY (Enterprise feature, can defer to V2.1 if tight):
[ ] Design ExecutionState machine (1h)
[ ] Implement ExecutionContext (2h)
[ ] Integrate with Orchestrator (2h)
[ ] Add checkpoint system (1h)
[ ] Add 25+ tests (2h)

Commits:
  12. "feat: execution state machine"
  13. "test: state transitions and recovery"
  14. "docs: state machine"
```

**Days 10: Contract + Output Validation (4h)**
```
MEDIUM-PRIORITY (Polish):
[ ] Zod schema for Contract (1h)
[ ] Runtime validation (1h)
[ ] Output schema finalization (1h)
[ ] Documentation (1h)

Commits:
  15. "feat: contract validation with zod"
  16. "feat: output schema validation"
```

**End of Week 2: Validation**
```
Checkpoints:
  ✓ All 1108 tests passing
  ✓ Tool auto-install working
  ✓ State machine implemented
  ✓ Guardian <2s pre-commit ready
  ✓ Full V2.0 feature set complete

Status: **V2.0 RELEASE READY**
Effort: 20h / 30h week = 67% capacity used
Timeline: Jan 12 + 14 days = **Jan 26 2026**
```

---

### WEEK 3 (Jan 27-Feb 2) - POLISH & RELEASE

**Days 11-12: Testing & Bug Fixes (6h)**
```
[ ] Run full E2E tests (2h)
[ ] Fix any regressions (2h)
[ ] Update CHANGELOG (1h)
[ ] Tag v2.0.0 (0.5h)
```

**Days 13-14: Release Preparation (4h)**
```
[ ] Update README for V2.0 (1.5h)
[ ] Create release notes (1.5h)
[ ] Verify all documentation (1h)
```

**End of Week 3: Release**
```
Status: **V2.0 RELEASED**
Timeline: Jan 12 + 21 days = **Feb 2 2026**
```

---

## 🎯 MVP vs FULL V2.0

### Minimum Viable Product (Week 1-2)
```
✅ Orchestrator engine with profiles
✅ Three adapters (actionlint, zizmor, gitleaks)
✅ Guardian pre-commit hook (<2s)
✅ File discovery (git-based)
✅ Reporting (text, json, github)
✅ Reliability patterns (circuit breaker, retry)
✅ 1108+ tests passing
✅ Cross-platform support (Windows/Linux/Mac)

❌ Tool auto-install (manual setup for MVP)
❌ State machine (deferred to V2.1 if needed)
❌ Execution persistence (V2.1)
❌ Plugin system (V2.1)
❌ Universal targets (V2.1)

Release: Jan 26, 2026
Users: Teams ready to configure Guardian
```

### Full V2.0 (Week 2-3)
```
✅ Everything in MVP
✅ Tool auto-install with version registry
✅ State machine for execution tracking
✅ Contract inheritance (extends)
✅ Doctor diagnose command
✅ SARIF reporting format
✅ Full E2E test suite

Release: Feb 2, 2026
Users: Full production-ready Guardian
```

---

## 📋 DEFINITION OF DONE (NO SHORTCUTS)

For every task:

```
Each commit MUST have:
[ ] Code changes (feature or fix)
[ ] Tests (15+ for features, edge cases covered)
[ ] Documentation (README, code comments, examples)
[ ] Backward compatibility check
[ ] Type safety verification (no `any`)
[ ] Cross-platform testing (Windows + Linux)
[ ] Performance verification (no regressions)
[ ] Snapshot tests (if applicable)

Every PR MUST:
[ ] Have at least 2 reviewers
[ ] Pass GitHub Actions (all 2/2 checks)
[ ] Have code coverage >80%
[ ] Include CHANGELOG entry
[ ] Have clear commit messages
[ ] Reference issues (if applicable)
```

---

## 🚀 CRITICAL SUCCESS FACTORS

### 1. NO SHORTCUTS
- ❌ Don't skip tests
- ❌ Don't merge without CI passing
- ❌ Don't leave technical debt
- ❌ Don't deploy without documentation

### 2. DETERMINISM VERIFIED
- ✅ Same input = same output (snapshot tests)
- ✅ No race conditions (parallel test runs)
- ✅ No time-dependent logic
- ✅ All Violations deterministically sorted

### 3. CROSS-PLATFORM TESTED
- ✅ Windows (native)
- ✅ Linux (CI)
- ✅ macOS (if users require)
- ✅ Path normalization works everywhere

### 4. OBSERVABILITY FIRST
- ✅ Structured logging
- ✅ Error classification
- ✅ Metrics collection
- ✅ Debugging capability

### 5. ONE TRUTH
- ✅ .cerber/contract.yml is the source
- ✅ Profiles: solo < dev < team (hierarchy)
- ✅ Tools: defined once, used everywhere
- ✅ Schema matches runtime types

---

## 📊 RISK ASSESSMENT

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Reliability code doesn't integrate properly | MEDIUM | HIGH | Unit tests + integration tests before commit |
| Tool auto-install download fails in CI | MEDIUM | HIGH | Fallback to manual install, clear error messages |
| State machine too complex for V2.0 | LOW | MEDIUM | Defer to V2.1 if time runs out |
| Guardian <2s not achievable | LOW | MEDIUM | Profile-specific caching, partial runs |
| Cross-platform issues appear post-release | MEDIUM | HIGH | Run tests on multiple platforms before release |
| Test suite flakiness increases | LOW | HIGH | Determinism checks, seed-based randomness |

---

## 💰 EFFORT ESTIMATE (REALISTIC)

```
WEEK 1 (Critical Path):
  - Integrate reliability code:     3h
  - Fix error duplication:          1h
  - Guardian refactor:              4h
  - Testing & validation:           2h
  - Foundation docs (AGENTS.md):    3h
  ─────────────────────────────────────
  TOTAL WEEK 1:                     13h (target 30h/week)

WEEK 2 (Build Missing):
  - Tool auto-install:              8h
  - State machine:                  8h
  - Contract + Output validation:   4h
  ─────────────────────────────────────
  TOTAL WEEK 2:                     20h (target 30h/week)

WEEK 3 (Polish & Release):
  - E2E testing & fixes:            6h
  - Release preparation:            4h
  ─────────────────────────────────────
  TOTAL WEEK 3:                     10h (target 30h/week)

GRAND TOTAL:                        43h
TIMELINE:                           3 weeks (Jan 12 - Feb 2)
CONFIDENCE:                         7/10 (tight but doable)
```

---

## ✅ STAKEHOLDER SIGN-OFF

### What We're Delivering

**V2.0 MVP (Jan 26)**
- ✅ Orchestrator with profiles (solo/dev/team)
- ✅ Three adapters (actionlint, zizmor, gitleaks)
- ✅ Guardian pre-commit hook
- ✅ File discovery & reporting
- ✅ 1108+ tests passing
- ✅ Cross-platform ready

**V2.0 Full (Feb 2)**
- ✅ Tool auto-install
- ✅ State machine
- ✅ Contract validation
- ✅ Doctor diagnose
- ✅ Production hardened

### What We're NOT Delivering in V2.0

- ❌ Plugin system (V2.1)
- ❌ Execution persistence (V2.1)
- ❌ Universal targets (V2.1)
- ❌ SARIF format (V2.1, if needed)

### Quality Metrics

```
Test Coverage:        97%+ (1108/1140 tests)
Architecture Rating:  8.5/10 (up from 7.2)
Code Duplication:     < 5% (no copy-paste)
Technical Debt:       LOW (all known items documented)
Cross-platform:       Windows + Linux verified
Determinism:          PROVEN (snapshot tests)
```

---

## 📝 NEXT STEPS (IMMEDIATE)

### TODAY (Jan 12)
- [ ] Review and approve ROADMAP_V2_REALITY.md
- [ ] Create task list from Week 1 items
- [ ] Assign team members

### TOMORROW (Jan 13)
- [ ] Start Week 1, Day 1: Fix reliability integration (2-3h)
- [ ] Run full test suite
- [ ] Verify GitHub Actions passing

### This Week
- [ ] Guardian refactor (complete)
- [ ] All 1108 tests passing
- [ ] MVP ready for testing

---

## 🎯 SUMMARY

**Where We Were:** Crisis mode (PR #56 failing, schema misalignment)
**Where We Are:** 70% Phase 1 complete, solid foundation, clear gaps
**Where We're Going:** V2.0 release in 3 weeks, MVP in 2 weeks

**Confidence Level:** 7/10 - Code is good, effort is realistic, timeline is tight

**No shortcuts. One truth. Ready to build.**

---

**Approved by:** [Pending Stakeholder Review]
**Date:** January 12, 2026
**Next Review:** January 19, 2026
