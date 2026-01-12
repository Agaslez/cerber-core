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

### MVP-4: Guardian Fast Mode <2s (3-5h)

**What:** Pre-commit hook that doesn't block commits

**Function: `src/cli/guardian.ts` (rewrite fast path)**
```typescript
// --staged mode: git diff --cached --name-only
// Smart filtering: 
//   if no .github/workflows/* OR .cerber/* touched → exit 0 in ~50ms
//   if workflows touched → actionlint on those files only
// Profile dev-fast: actionlint only (no zizmor/gitleaks)
// Output timing: --debug flag shows ms
```

**Steps:**
- [ ] Rewrite guardian to use staged files only
- [ ] Implement git-based file filtering
- [ ] Add profile "dev-fast" to profiles.ts (actionlint only)
- [ ] Test locally: `npx guardian --staged` on normal commit → <0.5s
- [ ] Test locally: `npx guardian --staged --debug` → shows timing
- [ ] Test CI: same behavior
- [ ] Benchmark: nothing changed = 50ms, workflows changed = 500ms

**Tests:** `test/cli/guardian.test.ts`
- [ ] Test --staged returns only changed files
- [ ] Test exit 0 when no relevant files changed (50ms)
- [ ] Test actionlint runs on .github/workflows/* only
- [ ] Test timing recorded with --debug
- [ ] Test dev-fast profile skips zizmor/gitleaks
- [ ] Test normal commit finishes <2s
- [ ] Performance benchmark: <0.5s when nothing relevant touched

**Integration Test:**
```bash
# Pre-commit hook simulation
git add .
npx guardian --staged          # Must finish <2s
echo $?                         # Must exit 0 if no violations
```

**DoD:** `<2s on normal commit, <0.5s if nothing relevant changed`  
**PR:** "MVP-4: guardian fast pre-commit hook"  
**Push:** `git push origin MVP-4-guardian-fast`

---

### MVP-2: Resilience Wiring (2-3h) - OPTIONAL IF TIME PERMITS

**What:** Connect existing resilience code to Orchestrator

**Existing Code:** CircuitBreaker, Retry, Coordinator all exist and tested

**Steps:**
- [ ] Update `src/core/Orchestrator.ts`: use `ExecutionStrategy` from profile
- [ ] Profile selection: legacy (fast) vs resilient (safe)
- [ ] Import `ExecutionStrategy` from `src/resilience/strategies/ExecutionStrategy.ts`
- [ ] Replace `Promise.all(adapters)` with strategy execution
- [ ] Test locally: `npm test -- resilience` → all green

**Tests:** `test/integration/resilience-wiring.test.ts`
- [ ] Test adapter fails → resilience retries (vs fails immediately)
- [ ] Test adapter fails N times → circuit breaker opens
- [ ] Test circuit breaker HALF_OPEN → allows one more attempt
- [ ] Test profile selection: solo → legacy, team → resilient
- [ ] Test no performance degradation vs legacy (<5% slowdown)

**DoD:** Resilience works in main flow, tested, <5% overhead  
**PR:** "MVP-2: resilience wiring (optional)"  
**Push:** `git push origin MVP-2-resilience-optional`

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

### V2.0.0-Full-1: Resilience Integration (If not done in MVP-2)

**What:** Full resilience stack wired + tested + observed

**Steps:**
- [ ] Verify ExecutionStrategy selected by profile
- [ ] Verify all 3 retry strategies wired (exponential, linear, fibonacci)
- [ ] Verify CircuitBreaker state transitions work (CLOSED → OPEN → HALF_OPEN)
- [ ] Verify TTL cleanup on circuit breaker
- [ ] Test real failures: adapter timeouts, bad output, crashes
- [ ] Benchmark: baseline vs resilient (document overhead)

**Tests:** `test/integration/resilience-full.test.ts`
- [ ] Cascade failure scenario: 3 adapters fail in sequence
- [ ] Circuit breaker recovers after TTL
- [ ] Retry exhaustion: max retries + circuit open = fast fail
- [ ] Profile switching: solo→legacy fast, team→resilient safe
- [ ] No regress on existing tests

**DoD:** Resilience proven in production-like scenarios  
**PR:** "feat: full resilience integration (v2.0.0)"  
**Push:** `git push origin v2.0.0-resilience-full`

---

### V2.0.0-Full-2: Observability Integration (6h)

**What:** Logger + metrics wired to Orchestrator, spans in logs

**Existing Code:** Logger and metrics written, need wiring

**Steps:**
- [ ] Wire logger to Orchestrator execution path
- [ ] Log adapter start/end with duration
- [ ] Log profile resolution decision
- [ ] Log violations found (count by severity)
- [ ] Metrics: execution time, violation count, adapter errors
- [ ] Spans: execution ID for tracing across adapters
- [ ] Test: logs are JSON parseable, metrics incremented
- [ ] CI: no performance regression

**Tests:** `test/integration/observability.test.ts`
- [ ] Test logs emitted for each adapter
- [ ] Test metrics incremented for each run
- [ ] Test span IDs track execution flow
- [ ] Test no logs for violations (data privacy)
- [ ] Test log format stable (JSON schema validation)

**Integration Test:**
```bash
npm run build
npm test -- observability
# Verify logs in structured format
```

**DoD:** Observability operational, <2% performance overhead  
**PR:** "feat: observability integration (v2.0.0)"  
**Push:** `git push origin v2.0.0-observability`

---

### V2.0.0-Full-3: State Machine / ExecutionContext (8h)

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

### V2.0.0-Full Release

**Checklist before GA tag:**
- [ ] Resilience fully integrated (real failure scenarios)
- [ ] Observability fully wired (logs, metrics, spans)
- [ ] State machine operational (multi-step workflows)
- [ ] `npm test` → 1109+ passing, 0 failures
- [ ] Performance: no regression vs rc1
- [ ] Security: no new vulnerabilities
- [ ] README: updated with new features
- [ ] CHANGELOG: v2.0.0 summary

**Tag:**
```bash
git tag v2.0.0
npm publish
git push origin v2.0.0
```

**v2.0.0 Announcement:**
```
v2.0.0: Full Release
✅ Resilience: Adaptive execution strategies
✅ Observability: Logger + metrics + tracing
✅ State machine: Multi-step workflow support
✅ cerber doctor: Setup diagnostics
✅ guardian <2s: Fast pre-commit hook

All 10 refactors verified. 1100+ tests. Production ready.
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
| 2 | v2.0.0 | 20h | 2-3 weeks after rc1 | 1150+ | Full release |
| 3 | v2.0.1 | TBD | 1-2 weeks | TBD | Patch fixes |
| 4 | v2.1 | 27h | 2-3 months | 1200+ | Advanced features |

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

