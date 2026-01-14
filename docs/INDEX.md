# Documentation Index — All Key Docs

**Purpose**: Single entry point linking all important documentation. Prevents duplication, keeps docs organized.

**Last Updated**: January 14, 2026  
**Status**: ACTIVE (Use this to find what you need)

---

## 🎯 Getting Started

- [README.md](../README.md) — Project overview, quick start
- [QUICKSTART.md](../QUICKSTART.md) — Installation and basic usage

---

## 🔒 One Truth & Enforcement (ZAD 3)

**Core Concept**: CERBER.md is the sole source of truth. No agent can disable Cerber without explicit approval.

- [ONE_TRUTH_ENFORCEMENT.md](./ONE_TRUTH_ENFORCEMENT.md) — How One Truth is enforced (3 layers)
- [CERBER.md](../CERBER.md) — Auto-generated source of truth (gates, tests, protected files)
- [.github/CODEOWNERS](../.github/CODEOWNERS) — Code owner approval requirements
- [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) — GitHub branch protection setup

---

## ✅ CI Stability & Proofs (ZAD 2)

**Evidence**: All CI runs deterministic, no flakiness, 1633/1633 tests passing.

- [CI_DIAGNOSTICS_GUIDE.md](../CI_DIAGNOSTICS_GUIDE.md) — Troubleshooting + **3 consecutive run proof**
  - Proof: Run 1, 2, 3 all identical (1633 tests)
  - cli-signals: No timeouts
  - npm-pack-smoke: Validates tarball contents
- [PROOF.md](../PROOF.md) — Evidence-only (commands + results, no essays)
  - npm ci (deterministic)
  - npm lint (0 errors)
  - npm build (clean)
  - npm test x3 (identical runs)
  - npm pack (tarball validation)

---

## 📋 Task Documentation (ZADANIE_*.md → docs/tasks/)

- [tasks/ZADANIE_1_ZIELONO.md](./tasks/ZADANIE_1_ZIELONO.md) — All checks green (PR validation)
- [tasks/ZADANIE_2_STABILITY.md](./tasks/ZADANIE_2_STABILITY.md) — CI stability (3 runs identical)
- [tasks/ZADANIE_3_ONE_TRUTH.md](./tasks/ZADANIE_3_ONE_TRUTH.md) — One Truth + anti-sabotage

---

## 🏗️ Architecture & Design

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System design (if exists)
- [DEVELOPMENT.md](../DEVELOPMENT.md) — Development guide
- [GUARDIAN_PROTECTION.md](../GUARDIAN_PROTECTION.md) — Guardian hook system

---

## 🧪 Testing Reference

- [test/contract-tamper-gate.test.ts](../test/contract-tamper-gate.test.ts) — Tamper-gate test (3 layers)
- [test/e2e/npm-pack-smoke.test.ts](../test/e2e/npm-pack-smoke.test.ts) — Tarball validation test
- [test/e2e/cli-signals.test.ts](../test/e2e/cli-signals.test.ts) — Signal handling test

---

## 🛠️ Configuration Files

- [.cerber/contract.yml](../.cerber/contract.yml) — Contract source (edited directly)
- [.github/workflows/cerber-pr-fast.yml](../.github/workflows/cerber-pr-fast.yml) — PR gate workflow
- [.github/workflows/cerber-main-heavy.yml](../.github/workflows/cerber-main-heavy.yml) — Main branch workflow
- [jest.config.cjs](../jest.config.cjs) — Test configuration
- [tsconfig.json](../tsconfig.json) — TypeScript configuration

---

## 📊 Reports & Summaries

- [SENIOR_DEV_REVIEW.md](../SENIOR_DEV_REVIEW.md) — Code review findings
- [PROOF_OF_COMPLETION.md](../PROOF_OF_COMPLETION.md) — Full task completion evidence

---

## 🚀 Workflows & Processes

- [scripts/set-branch-protection.sh](../scripts/set-branch-protection.sh) — Branch protection setup (ready to run)
- [GITHUB_SETUP_CHECKLIST.md](../GITHUB_SETUP_CHECKLIST.md) — Manual GitHub configuration steps

---

## ℹ️ Additional References

- [CHANGELOG.md](../CHANGELOG.md) — Version history
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Contribution guidelines
- [LICENSE](../LICENSE) — Project license

---

## 📝 No Duplicates Rule

**Principle**: If information appears in multiple docs → Keep only one, link from others.

**Examples of Single Source of Truth**:
- CERBER.md = Gates & test organization (linked from CI_DIAGNOSTICS_GUIDE)
- ONE_TRUTH_ENFORCEMENT.md = Protection mechanism (linked from BRANCH_PROTECTION)
- PROOF.md = Evidence only (referenced from CI_DIAGNOSTICS_GUIDE)
- ZADANIE_*.md = Task definitions (all in docs/tasks/)

**If you find duplication**:
1. Identify the primary source
2. Delete copy from secondary location
3. Add link to primary source
4. Update this INDEX.md if needed

---

## 🗂️ Organization Rules

- **All docs** have clear purpose (heading shows purpose)
- **All docs** link to related docs (prevents "where is X?")
- **Index.md** links to all key docs (this file)
- **One Truth** = CERBER.md (never duplicate its contents)
- **Evidence** = PROOF.md (commands + results only, no essays)
- **Tasks** = docs/tasks/ (ZADANIE_*.md with consistent names)

---

## Quick Reference: What Goes Where?

| Content Type | Location | Rule |
|--------------|----------|------|
| Gates, test org | CERBER.md | Auto-generated, don't edit manually |
| One Truth policy | docs/ONE_TRUTH_ENFORCEMENT.md | Define enforcement rule once |
| CI problems | docs/CI_DIAGNOSTICS_GUIDE.md | Troubleshooting + proof |
| Proof (commands) | PROOF.md | Evidence only, no essays |
| Task definition | docs/tasks/ZADANIE_*.md | One file per task, consistent name |
| Code review | SENIOR_DEV_REVIEW.md | Single source of review findings |
| Branch protection | docs/BRANCH_PROTECTION.md | GitHub setup instructions |

---

**Last Updated**: January 14, 2026  
**Maintained By**: Cerber automation system  
**Sync Check**: Run `npm run cerber:drift` to verify docs alignment with contract
