# 📋 V2.0 DEVELOPMENT CHECKLIST - NO SHORTCUTS

**Motto:** "Ma działać. Bez dorys na skróty."

---

## WEEK 1 - CRITICAL PATH (Jan 12-19)

### ✅ Day 1-2: FIX RELIABILITY INTEGRATION (2-3h)

**Commit 1: feat: integrate reliability patterns into Orchestrator**

**Task 1.1: Create ResilientExecutionStrategy** (1h)
- [ ] Create `src/core/strategies/ResilientExecutionStrategy.ts`
- [ ] Extends `AdapterExecutionStrategy` interface
- [ ] Wraps adapter execution with:
  - [ ] CircuitBreaker (prevent cascading failures)
  - [ ] Retry executor (exponential backoff)
  - [ ] Timeout manager (30s default)
- [ ] Unit tests (8+ cases):
  - [ ] Successful execution
  - [ ] Timeout scenario
  - [ ] Retry on failure
  - [ ] Circuit breaker open
  - [ ] Circuit breaker half-open
  - [ ] Circuit breaker recovery
  - [ ] Error classification
  - [ ] State transitions

**Task 1.2: Update Orchestrator to use ResilientExecutionStrategy** (0.5h)
- [ ] Import `ResilientExecutionStrategy`
- [ ] Default execution strategy = `ResilientExecutionStrategy`
- [ ] Keep `LegacyExecutionStrategy` as fallback
- [ ] Configuration option for strategy selection
- [ ] Tests pass (all 1108)

**Task 1.3: Verify no regressions** (0.5h)
- [ ] Run full test suite: `npm test`
- [ ] Check GitHub Actions 2/2 passing
- [ ] Verify snapshot tests
- [ ] Performance regression test (no >10% slowdown)

**Acceptance Criteria:**
- ✅ All 1108 tests passing
- ✅ CircuitBreaker properly integrated
- ✅ Retry logic working (no hanging tests)
- ✅ Timeout working (no infinite waits)
- ✅ Code coverage >80%
- ✅ No type errors

---

**Commit 2: fix: consolidate error handling (DRY principle)**

**Task 1.4: Consolidate ErrorClassifier** (1h)
- [ ] Identify error classification in 3 places:
  - [ ] `src/core/error-classifier.ts` (main)
  - [ ] `src/core/circuit-breaker.ts` (duplicate)
  - [ ] `src/core/Orchestrator.ts` (duplicate)
- [ ] Consolidate all logic to `ErrorClassifier` class
- [ ] Remove duplicate code from circuit-breaker.ts
- [ ] Remove duplicate code from Orchestrator.ts
- [ ] Both now import and use ErrorClassifier
- [ ] Tests (15+ cases):
  - [ ] ENOENT (tool not found)
  - [ ] EACCES (permission denied)
  - [ ] ETIMEDOUT (timeout)
  - [ ] Validation errors
  - [ ] Unknown errors
  - [ ] Null/undefined handling
  - [ ] Message formatting

**Acceptance Criteria:**
- ✅ Single source of truth for error classification
- ✅ No code duplication
- ✅ All 1108 tests passing
- ✅ Error codes consistent everywhere
- ✅ Code coverage >90% for ErrorClassifier

---

### ✅ Day 2-3: GUARDIAN REFACTOR FOR V2.0 (3-4h)

**Commit 3: refactor: guardian for v2.0 (profiles + performance)**

**Task 1.5: Refactor bin/cerber-guardian** (2h)
- [ ] Remove legacy code (pre-v2.0 logic)
- [ ] Integrate `ProfileResolver`:
  - [ ] Read profile from CLI flag `--profile solo|dev|team`
  - [ ] Fallback to env var `CERBER_PROFILE`
  - [ ] Default to `solo` (fastest)
- [ ] Add git mode selection:
  - [ ] `--changed` - only changed files (for pre-commit)
  - [ ] `--staged` - only staged files (default for pre-commit)
  - [ ] `--all` - all files (for CI)
- [ ] Optimize for <2s execution:
  - [ ] Profile-specific file filtering
  - [ ] Profile-specific tool selection
  - [ ] No full repo scanning by default
- [ ] Use Orchestrator + ProfileResolver + FileDiscovery
- [ ] Clear error messages (not generic "failed")
- [ ] Exit codes:
  - [ ] 0: No violations
  - [ ] 1: Violations found but not critical
  - [ ] 2: Critical violations (from failOn)

**Task 1.6: Add Guardian Tests** (1h)
- [ ] Integration tests (10+ cases):
  - [ ] Profile detection (CLI, env, default)
  - [ ] File mode selection (--changed, --staged, --all)
  - [ ] Solo profile execution (<1s expected)
  - [ ] Dev profile execution (<2s expected)
  - [ ] Team profile execution (<5s expected)
  - [ ] Violation detection and reporting
  - [ ] Exit codes correct
  - [ ] Error messages clear
  - [ ] Cross-platform (Windows + Linux)

**Task 1.7: Update Guardian Documentation** (1h)
- [ ] Update README with V2.0 Guardian features
- [ ] Example: pre-commit hook configuration
- [ ] Example: CI/CD configuration
- [ ] Profile recommendations per use case
- [ ] Performance expectations per profile

**Acceptance Criteria:**
- ✅ Guardian <2s for solo profile
- ✅ Guardian <5s for team profile
- ✅ ProfileResolver integration working
- ✅ File mode selection working
- ✅ 10+ tests passing
- ✅ Exit codes correct
- ✅ Windows + Linux verified

---

**Commit 4: docs: agents specification (foundation)**

**Task 1.8: Create AGENTS.md Specification** (2-3h)
- [ ] Define agent adaptation rules:
  - [ ] What agents can read (user code, git state)
  - [ ] What agents can modify (contract, profiles)
  - [ ] What agents CANNOT do (auto-fix violations)
- [ ] Integration patterns:
  - [ ] How to extend Orchestrator
  - [ ] How to write custom adapters
  - [ ] How to add new profiles
- [ ] Safety guarantees:
  - [ ] No code modification (read-only for violations)
  - [ ] Deterministic output (snapshot tests)
  - [ ] No side effects (idempotent runs)
- [ ] Examples:
  - [ ] Custom adapter implementation
  - [ ] Profile configuration
  - [ ] Contract inheritance
- [ ] Rules referenced from code:
  - [ ] @see AGENTS.md in error classifier
  - [ ] @see AGENTS.md in profile resolver
  - [ ] @see AGENTS.md in adapter factory

**Acceptance Criteria:**
- ✅ AGENTS.md complete and referenced from code
- ✅ Examples working and tested
- ✅ Rules clear and enforceable

---

### ✅ Day 4: FULL TEST SUITE & VALIDATION (2h)

**Task 1.9: Run Full Test Suite & Verify**
- [ ] `npm test` - all 1108 tests passing
- [ ] `npm run lint` - no linting errors
- [ ] `npm run typecheck` - no TypeScript errors
- [ ] GitHub Actions - 2/2 checks passing
- [ ] Cross-platform - tests pass on Windows + Linux
- [ ] Performance - no regressions (test suite still <45s)

**Task 1.10: Update CHANGELOG**
- [ ] Document all 4 commits
- [ ] Link to issues (if applicable)
- [ ] Mark as v2.0-pre-release-1

---

## WEEK 2 - BUILD MISSING PIECES (Jan 20-26)

### ✅ Day 5-6: TOOL AUTO-INSTALL FRAMEWORK (8h)

**Commit 5: feat: tool auto-install (version registry)**

**Task 2.1: Create VersionRegistry** (2h)
- [ ] Create `src/adapters/_shared/VersionRegistry.ts`
- [ ] Interface:
  - [ ] `getLatestVersion(toolName): Version`
  - [ ] `getAvailableVersions(toolName): Version[]`
  - [ ] `getToolMetadata(toolName, version): ToolMetadata`
- [ ] Metadata includes:
  - [ ] URL (GitHub releases, npm registry)
  - [ ] Checksum (SHA256)
  - [ ] Size (for progress)
  - [ ] Release date
  - [ ] Changelog URL
- [ ] Initial tools supported:
  - [ ] actionlint
  - [ ] zizmor
  - [ ] gitleaks
- [ ] Tests (10+ cases):
  - [ ] Fetch latest version
  - [ ] Fetch specific version
  - [ ] Version sorting (semantic versioning)
  - [ ] Metadata availability
  - [ ] Tool not found error
  - [ ] Network timeout handling

**Task 2.2: Create ToolInstaller** (3h)
- [ ] Create `src/core/tool-installer.ts`
- [ ] ToolInstaller class:
  - [ ] `installTool(toolName, version): Promise<string>` (returns path)
  - [ ] Downloads from URL
  - [ ] Verifies checksum (SHA256)
  - [ ] Extracts to `~/.cerber/tools/{toolName}/{version}/`
  - [ ] Sets executable permissions (chmod +x)
  - [ ] Returns path to binary
- [ ] Error handling:
  - [ ] Network failures → retry 3x with backoff
  - [ ] Checksum mismatch → clear cache, retry
  - [ ] Disk space check → error message
  - [ ] Permission denied → clear error message
- [ ] Tests (15+ cases):
  - [ ] Successful download + install
  - [ ] Checksum verification passes
  - [ ] Checksum verification fails
  - [ ] Retry on network timeout
  - [ ] Cache hit (skip download if already present)
  - [ ] Disk space error
  - [ ] Permission error
  - [ ] Concurrent installs (race condition)
  - [ ] Cross-platform (Windows + Linux)

**Task 2.3: Integrate with Orchestrator** (2h)
- [ ] Orchestrator.execute():
  - [ ] Check if tool binary exists
  - [ ] If not, call ToolInstaller.installTool()
  - [ ] Then execute with cached binary
- [ ] Cache management:
  - [ ] Keep only last 3 versions of each tool
  - [ ] Clear old versions on install
  - [ ] Command: `cerber cache clean`
- [ ] Tests (10+ cases):
  - [ ] Auto-install on first use
  - [ ] Cache hit on second use
  - [ ] Cache invalidation
  - [ ] Old version cleanup

**Task 2.4: Update Guardian for Auto-Install**
- [ ] Guardian automatically installs tools if missing
- [ ] Progress messages: "Installing actionlint v3.2.1..."
- [ ] Skip in CI if tools already installed

**Acceptance Criteria:**
- ✅ Tools auto-install on first use
- ✅ Checksum verification working
- ✅ Cache working (no re-download)
- ✅ 35+ tests passing
- ✅ Cross-platform verified
- ✅ Network resilience tested

---

**Commit 6: feat: tool caching & management**

**Task 2.5: Cache Management** (1h)
- [ ] Command: `cerber cache status`
  - [ ] Shows installed tools + versions
  - [ ] Cache directory size
  - [ ] Storage breakdown
- [ ] Command: `cerber cache clean`
  - [ ] Removes old versions
  - [ ] Keeps last 3 versions
  - [ ] Shows freed space
- [ ] Command: `cerber cache clear`
  - [ ] Wipes entire cache
  - [ ] Tools will be re-downloaded on next run
- [ ] Tests (8+ cases):
  - [ ] Cache status reporting
  - [ ] Cleanup removes old versions
  - [ ] Keeps recent versions
  - [ ] Clear wipes everything

**Task 2.6: Documentation**
- [ ] Update README with tool auto-install
- [ ] Explain cache directory
- [ ] Cache size expectations
- [ ] How to manage versions

**Acceptance Criteria:**
- ✅ Cache commands working
- ✅ Status shows correct info
- ✅ Clean removes old versions
- ✅ Clear wipes cache

---

### ✅ Day 7: STATE MACHINE IMPLEMENTATION (8h)

**Commit 7: feat: execution state machine**

**Task 2.7: Design & Implement ExecutionContext** (3h)
- [ ] Create `src/core/ExecutionContext.ts`
- [ ] ExecutionState enum:
  - [ ] `PENDING` - waiting to start
  - [ ] `RUNNING` - currently executing
  - [ ] `COMPLETED` - finished successfully
  - [ ] `FAILED` - finished with errors
  - [ ] `CANCELLED` - manually stopped
  - [ ] `PAUSED` - temporarily stopped
- [ ] ExecutionContext class:
  - [ ] `id` - unique execution ID
  - [ ] `state` - current state
  - [ ] `startTime`, `endTime` - timestamps
  - [ ] `duration` - calculated execution time
  - [ ] `violations` - collected violations
  - [ ] `errors` - collected errors
  - [ ] `progress` - % complete
  - [ ] `checkpoints` - debugging info
- [ ] State transition rules:
  - [ ] PENDING → RUNNING (start)
  - [ ] RUNNING → COMPLETED (no errors)
  - [ ] RUNNING → FAILED (errors found)
  - [ ] RUNNING → CANCELLED (user interrupt)
  - [ ] FAILED/COMPLETED → PAUSED (for debugging)
- [ ] Tests (15+ cases):
  - [ ] State transitions valid
  - [ ] Invalid transitions rejected
  - [ ] Duration calculated correctly
  - [ ] Checkpoints recorded
  - [ ] Serialization/deserialization

**Task 2.8: Integrate with Orchestrator** (2h)
- [ ] Orchestrator.execute():
  - [ ] Create ExecutionContext at start
  - [ ] Update state as execution progresses
  - [ ] Record checkpoints (tool started, completed, etc.)
  - [ ] Finalize state on completion
- [ ] Return ExecutionContext to caller
- [ ] Tests (10+ cases):
  - [ ] Full execution tracked
  - [ ] States transition correctly
  - [ ] Checkpoints recorded at right times
  - [ ] Errors captured in context

**Task 2.9: Add Debugging Features** (2h)
- [ ] Command: `cerber history` - list past executions
  - [ ] Shows execution ID, duration, result
  - [ ] Sortable by time/status
- [ ] Command: `cerber history {id}` - show details
  - [ ] Full execution context
  - [ ] All checkpoints
  - [ ] All violations + errors
  - [ ] Timeline visualization
- [ ] Command: `cerber replay {id}` - re-run same files
  - [ ] Uses same files from history
  - [ ] Compares with original execution
- [ ] Tests (8+ cases):
  - [ ] History listing
  - [ ] History detail retrieval
  - [ ] Replay functionality

**Task 2.10: Documentation**
- [ ] Update README with state machine
- [ ] Explain execution IDs
- [ ] Explain history/replay commands

**Acceptance Criteria:**
- ✅ ExecutionContext tracks all state
- ✅ State transitions working
- ✅ Checkpoints recorded
- ✅ History command working
- ✅ 25+ tests passing
- ✅ Serialization working

---

**Commit 8: feat: contract validation (zod)**

**Task 2.11: Create Zod Schema for Contract** (2h)
- [ ] Create `src/contract/contract.schema.zod.ts`
- [ ] Define Zod schema matching `.cerber/contract.schema.json`
- [ ] Validation rules:
  - [ ] Contract name (required, string)
  - [ ] Profiles (required, array of profiles)
  - [ ] Each profile has: name, tools[], failOn
  - [ ] Tools enabled/disabled per profile
  - [ ] failOn severity level (error, warning, info)
- [ ] Error messages (clear for users)
- [ ] Tests (15+ cases):
  - [ ] Valid contract passes
  - [ ] Invalid contract fails
  - [ ] Missing required field fails
  - [ ] Invalid type fails
  - [ ] Error messages clear

**Task 2.12: Integrate Validation** (1h)
- [ ] ContractLoader.load():
  - [ ] Parse YAML
  - [ ] Validate with Zod schema
  - [ ] Return typed Contract
  - [ ] Throw clear error on invalid
- [ ] Tests pass (validation working)

**Task 2.13: Finalize Output Schema** (1h)
- [ ] Create `.cerber/output.schema.json`
- [ ] Define output interface:
  - [ ] Success/failure status
  - [ ] Violations array
  - [ ] Errors array
  - [ ] Statistics (count, severity breakdown)
  - [ ] Execution metadata
- [ ] Validate output in formatters

**Acceptance Criteria:**
- ✅ Zod schema defined
- ✅ Validation integrated
- ✅ Error messages clear
- ✅ Output schema finalized
- ✅ 15+ tests passing

---

### ✅ Day 8: FINAL INTEGRATION & TESTING (2h)

**Task 2.14: Full Integration Test**
- [ ] `npm test` - all tests passing
- [ ] Guardian with auto-install
- [ ] Tool cache working
- [ ] State machine working
- [ ] Contract validation working
- [ ] Full E2E scenario

**Task 2.15: Documentation Update**
- [ ] README complete for V2.0 features
- [ ] All commands documented
- [ ] Examples working
- [ ] CHANGELOG updated

---

## WEEK 3 - POLISH & RELEASE (Jan 27-Feb 2)

### ✅ Day 9-10: E2E TESTING & BUG FIXES (6h)

**Task 3.1: Full E2E Testing**
- [ ] Real-world scenarios:
  - [ ] Developer using Guardian pre-commit
  - [ ] CI/CD running full validation
  - [ ] Team using team profile
  - [ ] Solo developer using solo profile
- [ ] Bug fixes as found
- [ ] Cross-platform verification

**Task 3.2: Performance Validation**
- [ ] Guardian solo <2s ✅
- [ ] Guardian dev <5s ✅
- [ ] Guardian team <10s ✅
- [ ] Full test suite <50s ✅

---

### ✅ Day 11-12: RELEASE PREPARATION (4h)

**Task 3.3: Final Documentation**
- [ ] README.md - complete
- [ ] CHANGELOG.md - detailed
- [ ] Migration guide (v1 → v2)
- [ ] FAQs
- [ ] Troubleshooting guide

**Task 3.4: Release Package**
- [ ] Tag v2.0.0
- [ ] GitHub release notes
- [ ] npm publish (if applicable)

**Task 3.5: Stakeholder Sign-Off**
- [ ] All success criteria met
- [ ] Test coverage >90%
- [ ] All 1108 tests passing
- [ ] GitHub Actions 2/2 passing

---

## 🎯 DEFINITION OF DONE (STRICT)

### For Every Commit
- [ ] Feature/fix implemented
- [ ] 15+ unit/integration tests
- [ ] Code coverage >80%
- [ ] No TypeScript errors
- [ ] No ESLint violations
- [ ] Snapshot tests pass
- [ ] Documentation updated
- [ ] Examples working
- [ ] Cross-platform tested
- [ ] Performance acceptable
- [ ] Backward compatible (if applicable)

### For Every PR
- [ ] All tests passing
- [ ] GitHub Actions 2/2 passing
- [ ] Code review + 2 approvals
- [ ] CHANGELOG updated
- [ ] No breaking changes (v2.0 allowed)
- [ ] Commit messages clear

### Before Release
- [ ] All 1108+ tests passing
- [ ] All platforms verified
- [ ] Documentation complete
- [ ] CHANGELOG.md written
- [ ] Release notes prepared
- [ ] Security review done

---

## ⚠️ NO SHORTCUTS ALLOWED

- ❌ Skip tests to save time
- ❌ Use `any` types instead of proper types
- ❌ Leave TODOs in code for "later"
- ❌ Merge without CI passing
- ❌ Add features without tests
- ❌ Deploy without validation
- ❌ Promise documentation "in the next release"
- ❌ Leave breaking changes undocumented

---

## 📊 Progress Tracking

Track completion in GitHub Issues / Pull Requests:

```
Week 1:
  [ ] Commit 1: Reliability integration
  [ ] Commit 2: Error consolidation
  [ ] Commit 3: Guardian refactor
  [ ] Commit 4: AGENTS.md
  
Week 2:
  [ ] Commit 5: Version registry
  [ ] Commit 6: Tool caching
  [ ] Commit 7: State machine
  [ ] Commit 8: Contract validation
  
Week 3:
  [ ] E2E testing & fixes
  [ ] Release preparation
  [ ] Tag v2.0.0
```

---

**Total Commits:** 8 (+ polish/release)
**Total Tests:** 1108+ (required to stay passing)
**Timeline:** 21 days (Jan 12 - Feb 2)
**Confidence:** 7/10

**NO SHORTCUTS. ONE TRUTH. SHIP IT.**
