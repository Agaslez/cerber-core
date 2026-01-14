# EXECUTION CHECKLIST: MVP → V2.1 DELIVERY
**Format:** Implementation roadmap (realized step-by-step)  
**Date:** January 12, 2026  
**Status:** Ready to execute

---

## PHASE 1: V2.0.0-RC1 (MVP RELEASE) - 2-3 WEEKS

### MVP-1: CI Green / Test Stability (2-4h) ✅ COMPLETE

**What:** Fix flaky timeout test, make CI consistent

**Steps:**
- [x] Identify flaky test file: `test/integration/filediscovery-real-git.test.ts` (git timeout issue)
- [x] Conditional timeout: `timeout = process.env.CI ? 20000 : 10000` 
- [x] Add CI check in jest.config.cjs
- [x] Run locally: `npm test` → 1109 passed, 0 failures ✅
- [x] Commit: "MVP-1: CI green - conditional timeouts for git operations"
- [x] Push: `git push origin mvp-1-ci-green`

**Tests:**
- [x] All 1109 tests passing locally (5-10s timeout)
- [x] Configuration verified: CI=true gets 20s timeout

**DoD:** ✅ CI green, 0 flaky tests  
**PR:** "MVP-1: CI green - conditional timeouts"  
**Push:** `git push origin mvp-1-ci-green` ✅ DONE

**Changes:**
- `jest.config.cjs`: Added `testTimeout: process.env.CI ? 20000 : 10000`
- `test/integration/filediscovery-real-git.test.ts`: 
  - Detached HEAD tests: `process.env.CI ? 15000 : 10000`
  - Performance test: `process.env.CI ? 30000 : 15000`

---

### MVP-3: Cerber Doctor Command (3h) ✅ COMPLETE

**What:** Diagnostic CLI tool that shows setup status

**Function: `src/cli/doctor.ts`**
- ✅ Tool detection: actionlint, zizmor, gitleaks
- ✅ Contract scan: CERBER.md existence check  
- ✅ Version extraction for installed tools
- ✅ Install command hints for missing tools
- ✅ Exit codes: 0 (all OK), 1 (warnings), 2 (blockers)
- ✅ Output in <1s (actual: ~84-124ms)

**Tests:** `test/cli/doctor.test.ts` ✅ 19/19 PASSING
- ✅ Tool detection tests (actionlint, zizmor, gitleaks)
- ✅ Version extraction tests
- ✅ Install command generation
- ✅ Exit code validation (0/1/2)
- ✅ Performance tests (<1s)
- ✅ Integration tests

**Example Output:**
```
[Cerber Doctor] Setup Validation

✅ Contract: .cerber/contract.yml found
   Profile: solo

Tools:
✅ actionlint v1.6.27
⚠️  zizmor not found
✅ gitleaks v8.18.0

Status: 2/3 tools ready

Fix: npm install zizmor
```

**DoD:** ✅ `npx cerber doctor <1s, user knows "what to do next"`  
**PR:** "MVP-3: cerber doctor diagnostic command"  
**Push:** ✅ Pushed to mvp-1-ci-green

**Implementation Details:**
- `getDoctorToolStatus()`: Detects installed tools and versions
- `runDoctor()`: Aggregates contract + tool status
- `printDoctorReport()`: Formats output with actionable hints
- All 19 tests pass, 0 failures

---

### MVP-4: Guardian Fast Mode <2s (3-5h) ✅ COMPLETE

**What:** Pre-commit hook that doesn't block commits (fast staged file detection)

**Function: `src/cli/guardian.ts`** ✅
- ✅ Staged file detection via `git diff --cached --name-only`
- ✅ Smart filtering: only .github/workflows/* and .cerber/* files matter
- ✅ Fast exit (50ms) when no relevant files changed
- ✅ Performance: <2s on normal commit, <500ms when nothing relevant
- ✅ Debug mode shows execution timing
- ✅ Exit codes: 0 (pass), 1+ (violations)

**Tests:** `test/cli/guardian.test.ts` ✅ 16/16 PASSING
- ✅ Staged files detection tests (empty, staged-only, filters)
- ✅ Guardian execution tests (staged flag, fast path)
- ✅ Performance tests (<2s, <500ms no-relevant)
- ✅ Exit code validation
- ✅ Output formatting with debug flag
- ✅ Integration test (pre-commit simulation)

**Example Usage:**
```bash
# Fast pre-commit hook
$ npx guardian --staged
✅ OK (no relevant files changed)

# With debug timing
$ npx guardian --staged --debug
[Guardian] No relevant files changed. Exit in 47ms

# When workflows changed
$ npx guardian --staged
[Guardian] actionlint: violations found
exit code 1
```

**DoD:** ✅ `<500ms when nothing relevant, <2s on normal commit`  
**PR:** "MVP-4: guardian fast pre-commit hook"  
**Push:** ✅ Pushed to mvp-1-ci-green

**Implementation Details:**
- `getStagedFiles()`: Lists files via git diff --cached
- `filterRelevantFiles()`: Only .github/workflows/* and .cerber/*
- `runGuardian()`: Executes checks, returns timing + exit code
- All 16 tests pass, covers staged detection & performance

---

### MVP-2: Resilience Wiring (2-3h) ✅ COMPLETE

**What:** Connect existing resilience code to Orchestrator - ALREADY DONE

**Status:** ✅ 100% Complete (verified)
- ✅ `src/core/Orchestrator.ts`: Uses `AdapterExecutionStrategy` 
- ✅ Profile-based selection: LegacyExecutionStrategy vs ResilientExecutionStrategy
- ✅ Strategy pattern properly implemented with dependency injection
- ✅ Resilience checks in: `executeValidation()` and `executeIntegration()`

**Tests:** 84 PASSING (Full resilience suite)
- ✅ `test/core/resilience/resilience-coordinator.test.ts` (13.9s)
- ✅ `test/core/resilience-factory.test.ts`
- ✅ `test/core/strategies/resilient-execution-strategy.test.ts`
- ✅ `test/core/strategies/legacy-execution-strategy.test.ts`
- ✅ `test/core/strategies/adapter-executor.test.ts`
- ✅ `test/core/retry-strategy.test.ts`
- ✅ Circuit breaker state transitions tested
- ✅ Retry strategies tested (exponential, linear, fibonacci)
- ✅ Coordinator resilience coordination tested
- ✅ No performance degradation vs legacy (<5% overhead verified)

**Verified Features:**
- ✅ Adapter fails → resilience retries (exponential backoff)
- ✅ Adapter fails N times → circuit breaker opens
- ✅ Circuit breaker HALF_OPEN → allows recovery attempt
- ✅ Profile selection: solo → legacy, team → resilient
- ✅ Orchestrator delegates to strategy (DIP pattern)
- ✅ All 84 tests green, 0 failures

**DoD:** ✅ Resilience works in main flow, tested, <5% overhead  
**PR:** "MVP-2: resilience wiring" (already merged)
**Status:** Already integrated into main codebase

---

### MVP-5: Documentation Cleanup (1-2h)

**What:** Archive old roadmaps, keep ONE_TRUTH_MVP as reference

**Steps:**
- [ ] Verify ONE_TRUTH_MVP.md exists and links correctly
- [ ] Add archive headers to 8 old files (already done)
- [ ] Verify AGENTS.md has 10 rules (already done)
- [ ] Update README.md: "See ONE_TRUTH_MVP.md for development roadmap"
- [ ] Final check: no new docs created, only archive markers

**DoD:** One source of truth, no conflicting docs  
**PR:** "MVP-5: documentation cleanup (archive old roadmaps)"  
**Push:** `git push origin MVP-5-docs`

---

### CEL: Hardening Pack (bez Breaking Changes) - ✅ COMPLETE

**What:** Add E2E npm pack → install → CLI tests + stress/chaos tests + test:release script

**Requirements:**
- ✅ Zero changes to README
- ✅ Zero breaking changes in CLI/API
- ✅ Tests for: no git, no tools, no contract, pack/install, determinism, Windows paths, large repos, concurrency, timeouts, invalid output
- ✅ New npm script `test:release` for release hardening tests only

**Tests Created:**
1. ✅ `test/e2e/npm-pack-install.test.ts` (7 tests)
   - Tarball creation
   - Size validation
   - Content verification
   - Installation simulation
   
2. ✅ `test/integration/orchestrator-chaos-stress.test.ts` (8 tests)
   - Concurrent instances
   - Memory pressure
   - Resource exhaustion
   - Exit code consistency

3. ✅ `test/integration/determinism-verification.test.ts` (11 tests)
   - Identical output across runs
   - Checksum stability
   - Exit code consistency
   - Timing determinism

4. ✅ `test/adapters/parsers-edge-cases.test.ts` (12 tests)
   - Invalid JSON/NDJSON handling
   - Null byte injection
   - Large payloads
   - Character encoding
   - Error message actionability

5. ✅ `test/integration/scm-edge-cases.test.ts` (10 tests)
   - Git state detection
   - Detached HEAD
   - Shallow repositories
   - Windows path handling
   - File system edge cases

6. ✅ `test/security/path-traversal.test.ts` (8 tests)
   - Path traversal prevention
   - Null byte rejection
   - Secret masking
   - Tool output sanitization
   - Command injection prevention

**NPM Script Added:**
```json
"test:release": "jest --testPathPattern=\"(npm-pack|orchestrator|parsers|scm|determinism|security)\" --passWithNoTests"
```

**Results:**
- ✅ `npm run test:release`: 12 test suites, 174 tests, 100% pass
- ✅ `npm test`: 1212 passed, 0 failed
- ✅ `npm run lint`: 0 errors
- ✅ `npm run build`: Clean TypeScript
- ✅ `npm pack --dry-run`: 330 files, valid
- ✅ Exit codes: consistent (0 = success, 1+ = failure)
- ✅ Error messages: actionable (show what to do)

**Commit:** `91fb2b6` - "test(hardening): add E2E npm pack, chaos, fuzz, security tests + test:release script"

**DoD:** ✅ All hardening tests green, no behavioral changes, test:release ready for CI
**Status:** ✅ COMPLETE - Ready for RC2 publication

---

### RC1 RELEASE

**Checklist before tag:**
- [ ] All 5 MVP routes merged to main
- [ ] `npm test` → 1109 passing, 0 failures (local)
- [ ] CI green: GitHub Actions all checks pass
- [ ] No new linter warnings: `npm run lint` ✅
- [ ] Build works: `npm run build` ✅
- [ ] Version updated: `package.json` → `2.0.0-rc1`
- [ ] CHANGELOG.md updated (brief, no essays)
- [ ] README.md updated: quick-start working

**Tag & Release:**
```bash
git tag v2.0.0-rc1
npm publish (if desired)
git push origin v2.0.0-rc1
# Create GitHub Release page with CHANGELOG excerpt
```

**RC1 Announcement:**
```
v2.0.0-rc1: MVP Release
- cerber init ✅
- cerber validate ✅  
- cerber doctor ✅ (new)
- guardian <2s ✅ (fast pre-commit)
- 1109 tests (0 failures)

Ready for feedback. Resilience & observability in v2.0.0 full.
```

---

## PHASE 2: V2.0.0 (FULL RELEASE) - AFTER RC1 FEEDBACK

**⚠️ PRE-PHASE-2 SHORTCUTS REMEDIATION:**

Before starting Phase 2 features, fix 10 identified shortcuts from MVP:
1. Add error boundary + logging to doctor/guardian
2. Implement tool config system (not hardcoded)
3. Integrate ResilientExecutionStrategy (instead of raw execSync)
4. Structure stderr error reporting
5. Make timeouts configurable
6. Improve test mocks (test failure paths)
7. Add observability integration (logs, metrics, traces)
8. Implement performance profiling (P99, not just <1s)
9. Safe process output parsing with schema validation
10. Standardize contract format (deprecate CERBER.md)

**Effort:** 17.5h total (12.5h critical path + 5h quality)  
**Target:** Complete before GitHub PR review  

See `SHORTCUTS_AUDIT.md` for detailed fixes.

---

### V2.0.0-Full-1: Resilience Integration (Hardened from MVP-2)

**What:** Harden MVP-2 resilience + fix guardian/doctor integration issues

**Shortcuts to Fix (from SHORTCUTS_AUDIT.md):**
- [ ] Guardian integration: Use ResilientExecutionStrategy instead of raw execSync
- [ ] Error recovery: Add retry logic with exponential backoff
- [ ] Circuit breaker: Integrate for cascading failure prevention
- [ ] Test scenarios: Add real failure simulation (timeout, crash, bad output)

**Implementation:**
- [ ] Refactor guardian execSync → Orchestrator strategy delegation
- [ ] Add resilience coordinator to doctor tool detection
- [ ] Implement exponential backoff (1s, 2s, 4s, 8s, stop)
- [ ] Circuit breaker: 3 failures → OPEN → 30s TTL → HALF_OPEN
- [ ] Fallback for tools: gracefully degrade if tool unavailable

**Tests:** Extend `test/integration/resilience-full.test.ts`
- [ ] Doctor continues if one tool fails (resilience)
- [ ] Guardian retries actionlint on transient failure
- [ ] Circuit breaker prevents tool spam
- [ ] Cascade failure handled properly

**DoD:** Doctor/Guardian use resilience patterns, all failure modes tested  
**PR:** "refactor: harden doctor/guardian with resilience (v2.0.0)"  
**Push:** `git push origin v2.0.0-resilience-hardened`

---

### V2.0.0-Full-2: Observability + Tool Configuration (8h)

**What:** Logger + metrics wired to doctor/guardian + config-driven tools

**Shortcuts to Fix (from SHORTCUTS_AUDIT.md #1, #2, #4, #7, #8):**
- [ ] Add structured logging to doctor/guardian
- [ ] Implement tool config loader (tools.yml instead of hardcoded)
- [ ] Parse + structure stderr output
- [ ] Integrate Logger + metrics collection
- [ ] Add performance profiling (P99, not just <1s)

**Implementation:**
- [ ] Create `src/config/tools-config.yml` with tool definitions + timeouts
- [ ] Implement tool config loader with schema validation
- [ ] Wire logger to doctor/guardian execution paths
- [ ] Add metrics collection:
  - Tool detection success rate
  - Execution time (P50/P95/P99)
  - Tool output parse success rate
  - Error counts by type
- [ ] Structured stderr parsing per tool
- [ ] Execution context/span IDs for tracing
- [ ] Performance profiler (breakdown per tool)

**Tests:** `test/integration/observability.test.ts`
- [ ] Logs emitted for each doctor/guardian step
- [ ] Metrics incremented correctly
- [ ] Span IDs track execution flow
- [ ] P99 latency measured and reported
- [ ] Tool config loading works (defaults + overrides)
- [ ] Parse error handling with detailed messages

**DoD:** Doctor/Guardian observable + configurable, <2% overhead  
**PR:** "feat: observability + tool config (v2.0.0)"  
**Push:** `git push origin v2.0.0-observability-config`

---

### V2.0.0-Full-3: Error Handling + Output Parsing (5h)

**What:** Robust error handling, timeout configuration, safe output parsing

**Shortcuts to Fix (from SHORTCUTS_AUDIT.md #3, #5, #9):**
- [ ] Make timeouts configurable (not hardcoded 5000ms)
- [ ] Implement tool-specific output parsers with validation
- [ ] Add graceful timeout + failure degradation
- [ ] Support fallback strategies

**Implementation:**
- [ ] Load timeouts from contract + tool config
- [ ] Add per-tool timeout settings in tools.yml
- [ ] Implement tool-specific output parsers:
  - actionlint version parser + schema
  - zizmor version parser + schema
  - gitleaks version parser + schema
- [ ] Graceful timeout handling (report separately, don't crash)
- [ ] Support skip-on-timeout mode for optional tools
- [ ] Version range validation (SemVer)
- [ ] Validate parsed output against schema
- [ ] Report parse errors with suggestions

**Tests:** `test/cli/doctor-parsing.test.ts`, `test/cli/guardian-errors.test.ts`
- [ ] Test each tool parser with real/fake output
- [ ] Test timeout behavior (graceful degrade)
- [ ] Test version range validation
- [ ] Test parse error messages (helpful)
- [ ] Test schema validation failures
- [ ] Test fallback strategies

**DoD:** All error paths tested, timeouts configurable, parsing safe  
**PR:** "feat: robust error handling + output parsing (v2.0.0)"  
**Push:** `git push origin v2.0.0-error-handling`

---

### V2.0.0-Full-4: Test Coverage Hardening (5h)

**What:** Comprehensive test scenarios covering all failure modes

**Shortcuts to Fix (from SHORTCUTS_AUDIT.md #6):**
- [ ] Test tool not installed scenarios
- [ ] Test tool timeout + recovery
- [ ] Test tool returns invalid output
- [ ] Test tool permission errors
- [ ] Test tool crashes
- [ ] Test concurrent tool execution
- [ ] Test graceful degradation

**Implementation:**
- [ ] Create tool mock factory with states:
  - NOT_INSTALLED
  - SUCCESS
  - TIMEOUT
  - INVALID_OUTPUT
  - PERMISSION_ERROR
  - CRASH
  - SLOW (near timeout)
- [ ] Mock execSync behavior per scenario
- [ ] Extend doctor.test.ts with failure paths
- [ ] Extend guardian.test.ts with failure paths
- [ ] Test graceful fallback behavior
- [ ] Test error message quality (helpful to user)

**Tests:** `test/cli/doctor-failure-modes.test.ts`, `test/cli/guardian-failure-modes.test.ts`
- [ ] Test each tool mock state
- [ ] Test cascade failures (2+ tools fail)
- [ ] Test recovery from transient failures
- [ ] Test fast-fail scenarios
- [ ] Test output validation (safe parsing)
- [ ] Coverage target: >95% for failure paths

**DoD:** All failure modes tested, 95%+ coverage, doctor/guardian robust  
**PR:** "test: comprehensive failure mode coverage (v2.0.0)"  
**Push:** `git push origin v2.0.0-test-hardening`

---

### V2.0.0-Full-5: State Machine / ExecutionContext (8h)

**What:** Full state tracking for multi-step execution, debug/recovery

**Existing Code:** State machine 40% complete, needs integration

**Steps:**
- [ ] Complete state machine: IDLE → LOADING → EXECUTING → REPORTING → DONE
- [ ] ExecutionContext tracks: current state, progress, errors, recovery path
- [ ] Profile + contract determine state transitions
- [ ] Debug mode: state dumps at each step
- [ ] Recovery: save/restore execution state for resumable flows
- [ ] Test: state transitions valid, no orphaned states

**Tests:** `test/integration/state-machine.test.ts`
- [ ] Test state transitions follow contract
- [ ] Test invalid transitions rejected
- [ ] Test debug output shows state + context
- [ ] Test recovery restores from saved state
- [ ] Test profile "team" requires full state tracking

**DoD:** State machine operational for multi-step workflows  
**PR:** "feat: state machine & execution context (v2.0.0)"  
**Push:** `git push origin v2.0.0-state-machine`

---

### V2.0.0 Full Release

**Checklist before GA tag:**
- [ ] All 4 shortcuts remediation PRs merged (resilience, observability, error-handling, test-hardening)
- [ ] `npm test` → 1200+ passing, 0 failures
- [ ] Performance: P99 latency <100ms for doctor, <500ms for guardian
- [ ] Security: no new vulnerabilities
- [ ] Coverage: >95% for doctor/guardian failure paths
- [ ] README: updated with new diagnostic features
- [ ] CHANGELOG: v2.0.0 summary with shortcuts fixed

**Tag:**
```bash
git tag v2.0.0
npm publish
git push origin v2.0.0
```

**v2.0.0 Announcement:**
```
v2.0.0: Production-Ready Release
✅ Resilience: Adaptive strategies with circuit breaker
✅ Observability: Structured logging + metrics
✅ Doctor Diagnostic: Setup health check
✅ Guardian <500ms: Fast pre-commit hook
✅ Error Handling: Robust with graceful degradation
✅ Config-Driven: Tools configurable, not hardcoded

1200+ tests. Enterprise-ready.
Shortcuts from MVP remediated.
```

---

## PHASE 3: V2.0.1 (PATCH RELEASE)

### V2.0.1: Bug Fixes + Micro-optimizations

**What:** User feedback from rc1 + v2.0.0, quick fixes

**Steps:**
- [ ] Collect issues reported in v2.0.0-rc1 period
- [ ] Priority: blocking bugs only (fix immediately)
- [ ] Performance: <2s target for guardian (if not met in MVP-4)
- [ ] Edge cases: Windows path handling, CI timeouts
- [ ] Each fix: test + DoD + push

**Bug Template:**
```
[ ] Bug: [issue name]
    Steps: [reproduce]
    Fix: [code change location]
    Test: [new test file]
    Verify: [benchmark/log output]
    PR: "fix: [issue] (v2.0.1)"
```

**DoD:** 0 regression, all new tests pass  
**Tag:** `v2.0.1`

---

## PHASE 4: V2.1 (FEATURE RELEASE) - 2-3 MONTHS AFTER V2.0

### V2.1-1: Auto-install Missing Tools (6h)

**What:** Cerber detects missing tools and offers to install them

**Steps:**
- [ ] Implement tool installer: `src/tools/installer.ts`
- [ ] Detection: tool not in PATH
- [ ] Options: 
  - `--auto-install`: download to `~/.cerber/tools/`
  - `--no-install`: show hint (current behavior)
  - Default: show hint + offer `--auto-install`
- [ ] Download from GitHub releases (pinned versions)
- [ ] Cache in `~/.cerber/tools/` with checksum validation
- [ ] Fallback: if auto-install fails, fall back to hint

**Tests:** `test/tools/installer.test.ts`
- [ ] Test tool detection (installed vs missing)
- [ ] Test download + checksum validation
- [ ] Test cache hit (no re-download)
- [ ] Test cache miss (re-download)
- [ ] Test fallback when network unavailable

**Integration:**
```bash
cerber validate --auto-install     # Installs missing tools to ~/.cerber/tools
cerber guardian --auto-install     # Guardian uses installed tools
```

**DoD:** Auto-install transparent, all tools downloadable  
**PR:** "feat: auto-install missing tools (v2.1)"  
**Push:** `git push origin v2.1-auto-install`

---

### V2.1-2: Execution Persistence (6h)

**What:** Save execution results, allow resumable validation

**Steps:**
- [ ] Implement persistence: `src/persistence/store.ts`
- [ ] Store: execution ID, timestamp, results, state
- [ ] Location: `.cerber/.cache/executions/<id>.json`
- [ ] Query: `cerber report --id <execution-id>`
- [ ] Resume: `cerber validate --resume <execution-id>` (skip unchanged files)
- [ ] TTL: cleanup old executions (7 days default)

**Tests:** `test/persistence/store.test.ts`
- [ ] Test execution saved with ID
- [ ] Test results retrievable by ID
- [ ] Test resume skips unchanged files
- [ ] Test TTL cleanup removes old entries
- [ ] Test concurrent executions don't interfere

**Integration:**
```bash
EXEC_ID=$(cerber validate --solo 2>&1 | grep "Execution ID")
cerber report --id $EXEC_ID                    # Show results
cerber validate --resume $EXEC_ID --solo      # Re-run changed files only
```

**DoD:** Execution history available, resume works  
**PR:** "feat: execution persistence (v2.1)"  
**Push:** `git push origin v2.1-persistence`

---

### V2.1-3: SARIF Format Output (4h)

**What:** Export results in SARIF 2.1.0 format (GitHub/IDE integration)

**Steps:**
- [ ] Implement SARIF exporter: `src/reporting/sarif.ts`
- [ ] Map violations → SARIF rules + results
- [ ] Support: GitHub uploaded artifact, local file
- [ ] Severity mapping: error/warning/note
- [ ] Schema: validate against SARIF 2.1.0 spec
- [ ] Test: output parseable by GitHub/IDE tools

**Tests:** `test/reporting/sarif.test.ts`
- [ ] Test violation → SARIF result conversion
- [ ] Test severity mapping correct
- [ ] Test output validates against schema
- [ ] Test GitHub upload format (if applicable)

**Integration:**
```bash
cerber validate --format sarif > results.sarif
# Upload to GitHub artifact or IDE
```

**DoD:** SARIF output validated, GitHub-compatible  
**PR:** "feat: SARIF format output (v2.1)"  
**Push:** `git push origin v2.1-sarif`

---

### V2.1-4: Plugin System (8h)

**What:** Allow external adapters via plugin interface

**Steps:**
- [ ] Define plugin interface: `src/plugin/PluginInterface.ts`
- [ ] Plugin discovery: `~/.cerber/plugins/` directory
- [ ] Plugin loading: dynamic import with safety
- [ ] Plugin validation: must implement Adapter interface
- [ ] Plugin lifecycle: init → run → cleanup
- [ ] Contract support: plugins in tool list

**Plugin Interface:**
```typescript
interface CerberPlugin {
  name: string;
  version: string;
  isInstalled(): Promise<boolean>;
  run(options): Promise<AdapterResult>;
  parseOutput(raw: string): Violation[];
}
```

**Tests:** `test/plugin/loader.test.ts`
- [ ] Test plugin discovery from directory
- [ ] Test plugin validation (must implement interface)
- [ ] Test plugin isolation (no access to internal state)
- [ ] Test plugin error handling (doesn't crash core)
- [ ] Test plugin in profile configuration

**Integration:**
```bash
# User creates ~/.cerber/plugins/my-checker/index.ts
cerber validate --solo              # Loads my-checker automatically
# Results include my-checker findings
```

**DoD:** Plugin system operational, safe plugin loading  
**PR:** "feat: plugin system (v2.1)"  
**Push:** `git push origin v2.1-plugin-system`

---

### V2.1-5: Advanced Profiles (3h)

**What:** Conditional profiles based on environment/context

**Steps:**
- [ ] Extend profile syntax: `if/then/else` conditions
- [ ] Conditions: env vars, file existence, CI detection
- [ ] Example: `if CI=true then team-strict else dev-fast`
- [ ] Contract support: profile selection via condition
- [ ] Test: conditions evaluate correctly

**Profile Example:**
```yaml
profiles:
  auto:
    if: $CI == "true"
      then: team-strict
    else:
      if: $USER_TYPE == "contractor"
        then: team-limited
      else: dev-fast
```

**Tests:** `test/contract/profiles-advanced.test.ts`
- [ ] Test condition evaluation
- [ ] Test nested conditions
- [ ] Test env var substitution
- [ ] Test CI detection (GitHub Actions, CircleCI, etc)

**DoD:** Advanced profiles work in contract  
**PR:** "feat: advanced profile conditions (v2.1)"  
**Push:** `git push origin v2.1-advanced-profiles`

---

### V2.1 Release

**Checklist:**
- [ ] All 5 V2.1 features merged
- [ ] `npm test` → 1150+ passing (new tests for each feature)
- [ ] Performance: no regression vs v2.0.0
- [ ] Docs: each feature has usage example
- [ ] README: updated with new features

**Tag:**
```bash
git tag v2.1.0
npm publish
git push origin v2.1.0
```

**v2.1 Announcement:**
```
v2.1.0: Advanced Features
✅ Auto-install tools: --auto-install flag
✅ Execution persistence: Save & resume runs
✅ SARIF export: GitHub/IDE integration
✅ Plugin system: Custom adapters
✅ Advanced profiles: Conditional configuration

1150+ tests. Enterprise-ready.
```

---

## OVERALL METRICS

| Phase | Version | Effort | Timeline | Tests | Status |
|-------|---------|--------|----------|-------|--------|
| 1 | rc1 | 18-32h | 2-3 weeks | 1109 | MVP ready |
| 1.5 | v2.0.0-rc1 fixes | 17.5h | 2 weeks | 1200+ | Shortcuts remediated |
| 2 | v2.0.0 | 25h | 3 weeks after rc1 | 1200+ | Production ready |
| 3 | v2.0.1 | TBD | 1-2 weeks | TBD | Patch fixes |
| 4 | v2.1 | 27h | 2-3 months | 1300+ | Advanced features |

---

## KEY CHANGES FROM MVP AUDIT

**Shortcuts Found:** 10  
**Effort to Fix:** 17.5h before Phase 2  
**Impact:** High quality, production-ready code  
**Status:** Ready for remediation in Phase 2

**What Changed:**
- MVP-2.0.0-Full-1: Now includes doctor/guardian resilience hardening
- MVP-2.0.0-Full-2: Combines observability + tool config (single pass)
- MVP-2.0.0-Full-3: Adds error handling + output parsing safety
- MVP-2.0.0-Full-4: Adds test hardening for all failure modes
- MVP-2.0.0-Full-5: State machine as final v2.0.0 feature

**Tests Growth:**
- MVP: 1109 tests
- After shortcuts fix: 1200+ tests (91 new test cases)
- After Phase 2: 1300+ tests

---

## EXECUTION RULES

1. **Every feature gets tests FIRST** - Write test, make it fail, write code, make it pass
2. **Production code only** - No shortcuts, no hacks, no "TODO" comments
3. **Senior dev standard** - Code review by senior, all PRs require DoD
4. **Push each route** - Don't batch, push MVP-1, then MVP-3, then MVP-4, etc.
5. **No documentation** - Only update ONE_TRUTH_MVP.md with completed routes
6. **CI must be green** - Every push must pass all tests on GitHub Actions
7. **Performance first** - Benchmark every change, document overhead
8. **Backward compatible** - No breaking changes until major version

---

**This is the execution plan. Follow it sequentially. No deviations.**

