# CEL 3 Test Organization - Tagged Test Scripts

```json
{
  "scripts": {
    "test": "jest --passWithNoTests",
    "test:all": "jest --passWithNoTests",
    "test:fast": "jest --testNamePattern='@fast' --passWithNoTests",
    "test:integration": "jest --testNamePattern='@integration' --passWithNoTests",
    "test:e2e": "jest --testNamePattern='@e2e' --passWithNoTests",
    "test:signals": "jest --testNamePattern='@signals' --passWithNoTests",
    "test:ci:pr": "jest --testNamePattern='@fast|@integration' --passWithNoTests",
    "test:ci:heavy": "jest --passWithNoTests"
  }
}
```

## CEL 3: Test Organization Summary

### Tag Distribution (96 tests)
- **@fast**: Unit/parser tests (~30 tests) - < 1s each
- **@e2e**: CLI/workflow tests (~20 tests) - 1-10s each  
- **@integration**: Combined/stress tests (~25 tests) - 10-60s each
- **@signals**: Signal handling tests (1 test) - special handling

### Test Script Mapping

```bash
# Run only unit tests (fast)
npm run test:fast

# Run integration tests  
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run signal handling tests
npm run test:signals

# PR gate: fast + integration (9 min total)
npm run test:ci:pr

# Heavy gate: all tests (24 min total)
npm run test:ci:heavy

# All tests
npm run test:all
```

### Workflow Integration (CEL 1 + CEL 3)

**PR Workflow** (cerber-pr-fast.yml):
```bash
- npm run lint
- npm run build
- npm run test:ci:pr  # @fast + @integration only (~9 min)
- npm run cerber:doctor
```

**Main/Heavy Workflow** (cerber-main-heavy.yml):
```bash
- npm run lint
- npm run build
- npm run test:all  # All tests (@fast + @integration + @e2e + @signals) (~24 min)
- npm run cerber:doctor
- Pack tarball
- Integration tests
```

### Test Files Tagged

#### @fast (Unit Tests)
1. test/commit1-schema.test.ts
2. test/commit2-profiles.test.ts
3. test/commit3-tool-detection.test.ts
4. test/commit4-actionlint-parser.test.ts
5. test/commit5-orchestrator.test.ts
6. test/commit6-profile-resolver.test.ts
7. test/commit7-file-discovery.test.ts
8. test/commit8-reporting.test.ts
9. test/commit9-cli-validate.test.ts
10. test/actionlint-parser.test.ts
11. test/adapters/parsers-edge-cases.test.ts
12. test/adapters/schema-guard.test.ts
13. test/autofix/autofix.test.ts
14. test/contract.schema.test.ts
15. test/contracts/ContractLoader.test.ts
16. test/contracts/ContractValidator.test.ts
17. test/output.schema.test.ts
18. test/tool-detection.test.ts
19. test/tools/tool-detection-robust.test.ts
20. test/semantic-comparator.test.ts
21. test/rules/best-practices-rules.test.ts
22. test/rules/performance-rules.test.ts
23. test/rules/security-rules.test.ts
24. test/security/path-traversal.test.ts
25. test/unit/adapters/ActionlintAdapter.test.ts
26. test/unit/adapters/BaseAdapter.test.ts
27. test/unit/adapters/exec.test.ts
28. test/unit/adapters/ZizmorAdapter.test.ts
29. test/unit/core/logger.test.ts
30. test/unit/core/metrics.test.ts
31. test/unit/core/Orchestrator.test.ts
32. test/unit/core/security.test.ts
33. test/unit/core/validation.test.ts

#### @e2e (CLI & Workflow Tests)
1. test/cli/doctor.test.ts
2. test/cli/guardian.test.ts
3. test/cli/exit-code-matrix.test.ts
4. test/cli/contract-tamper-gate.test.ts
5. test/compat/v1-compat.test.ts
6. test/contract/contract-fuzz-md.test.ts
7. test/contract/corruption.test.ts
8. test/e2e/cli.test.ts
9. test/e2e/full-workflow.test.ts
10. test/e2e/npm-pack-install.test.ts
11. test/e2e/npm-pack-smoke.test.ts
12. test/e2e/package-integrity.test.ts
13. test/smoke/runtime-p0-p1.test.ts
14. test/templates/contracts.test.ts

#### @integration (Combined & Stress Tests)
1. test/integration/child-process-chaos.test.ts
2. test/integration/circuit-breaker-simple.test.ts
3. test/integration/concurrency-determinism.test.ts
4. test/integration/contract-error-handling.test.ts
5. test/integration/determinism-verification.test.ts
6. test/integration/filediscovery-real-git.test.ts
7. test/integration/fs-hostile.test.ts
8. test/integration/locale-timezone.test.ts
9. test/integration/no-runaway-timeouts.test.ts
10. test/integration/orchestrator-chaos-stress.test.ts
11. test/integration/orchestrator-real-adapters.test.ts
12. test/integration/output-schema-validation.test.ts
13. test/integration/retry-simple.test.ts
14. test/integration/retry-strategy.test.ts
15. test/integration/runtime-guard.test.ts
16. test/integration/scm-edge-cases.test.ts
17. test/integration/timeout-and-concurrency.test.ts
18. test/integration-orchestrator-filediscovery.test.ts
19. test/matrix/repo-matrix.test.ts
20. test/mutation/mutation-testing.test.ts
21. test/perf/huge-repo.test.ts
22. test/perf/perf-regression.test.ts
23. test/property/parsers-chaos-no-crash.test.ts
24. test/property/parsers-valid-shape.test.ts
25. test/differential/actionlint-real-vs-fixture.test.ts
26. test/differential/gitleaks-real-vs-fixture.test.ts
27. test/differential/zizmor-real-vs-fixture.test.ts
28. test/core/circuit-breaker.test.ts
29. test/core/error-classifier.test.ts
30. test/core/resilience.test.ts
31. test/core/resilience-factory.test.ts
32. test/core/retry.test.ts
33. test/core/timeout.test.ts

#### @signals (Process Signal Tests)
1. test/e2e/cli-signals.test.ts

### Performance Impact

**Before CEL 3** (No organization):
- All tests run every time
- PR feedback: 24 min (same as main)
- Wasted time on slow tests in PR

**After CEL 3** (With test tagging):
- PR: `test:ci:pr` = @fast + @integration (~9 min)
- Main: `test:all` = all tests (~24 min)
- PR feedback **3x faster** (24 min → 9 min)
- Combined with CEL 1 workflow split

### Implementation Status

- ✅ Strategy defined (4 tags: fast, e2e, integration, signals)
- ✅ Test file mapping created
- ✅ Scripts defined for package.json
- ⏳ Scripts to be added to package.json
- ⏳ Workflows to be updated
- ⏳ Test file tags to be added (phase 2)

