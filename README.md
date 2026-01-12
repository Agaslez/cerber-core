# 🛡️ Cerber Core — CI Contract Guard for GitHub Actions

Detects workflow/config drift across repos and enforces a single source of truth via CERBER.md.

> **AI doesn't break your project. Lack of a contract does.**

[![npm version](https://img.shields.io/npm/v/cerber-core.svg)](https://www.npmjs.com/package/cerber-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/Agaslez/cerber-core/actions/workflows/test-comprehensive.yml/badge.svg)](https://github.com/Agaslez/cerber-core/actions)
[![GitHub](https://img.shields.io/badge/GitHub-cerber--core-blue.svg)](https://github.com/Agaslez/cerber-core)
[![Discord](https://img.shields.io/discord/1457747175017545928?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/V8G5qw5D)

---

## What is Cerber Core?

Cerber enforces your project roadmap as executable contract (`CERBER.md`). Write rules once, get automatic validation on every commit + CI run.

### What Cerber Is (and Isn't)

✅ **Contract guard** — Validates your CERBER.md rules are enforced  
✅ **Drift detector** — Catches when CI config/workflow changes break protection  
✅ **Works WITH existing tools** — Doesn't replace ESLint/Prettier/tests. Ensures they stay required.

❌ **Not a linter** — Use ESLint for code style  
❌ **Not a test runner** — Use Jest/Vitest for unit tests  
❌ **Not a deployment tool** — Use your existing CD pipeline

**Think of it as:** Policy-as-code layer that prevents your other tools from being bypassed.

## Why? (The CI Drift Problem)

- ✅ **AI agents follow your roadmap** → Agent pastes code matching `CERBER.md`
- ❌ **Human bypasses rules** → Commit sneaks through, CI green but wrong
- ❌ **CI config drifts** → Workflow changes, gates disappear, protection gone

**Solution:** Guardian blocks bad commits **before** they reach CI. CI re-validates and protects itself from tampering.

---

## 🏆 Proof: Used in Production

Cerber protects real SaaS applications. See it in action:

**Eliksir Platform CI Pipelines:**
- 🎨 **Frontend:** [Guardian Schema Check + tests](https://github.com/Agaslez/Eiksir-front-dashboard/actions/runs/20668597387) ✅
- ⚙️ **Backend:** [Quality Gate + deploy checks](https://github.com/Agaslez/Eliksir-Backend-front-dashboard/actions/runs/20664365046) ✅

These aren't demo projects - **live production systems** serving real users, protected by Cerber since day one.

📖 **Full case study:** [How Cerber prevented 47 production bugs](docs/case-studies/eliksir.md)

---

## 💬 Community (Discord)

Join the Cerber Core Discord for support, feedback, and CI/Doctor showcases:
👉 https://discord.gg/V8G5qw5D

- **Questions:** ask in `#general`
- **Feedback / bugs:** `#feedback` (bugs can also go to GitHub Issues)
- **Proofs:** post your CI runs / doctor output in `#showcase`

---

## 🚀 Quick Start (60 seconds)

```bash
# 1. Install
npm i -D cerber-core

# 2. Generate contract template
npx cerber init

# 3. Edit CERBER.md (use AI assistant or manual)
# → Define your roadmap, tech stack, protected assets

# 4. Generate hooks + CI workflow
npx cerber init

# 5. Verify setup
npx cerber doctor

# 6. Commit and push
git add .
git commit -m "feat: add Cerber protection"
git push
```

**That's it.** Guardian now blocks bad commits. CI re-validates and protects itself.

---

## What Cerber Checks

### Pre-commit (Guardian)
- ❌ Secrets in code (API keys, tokens)
- ❌ Forbidden patterns (eval, console.log in prod)
- ❌ Missing required imports
- ❌ Protected file deletions
- ✅ Schema validation (if enabled)

### CI (GitHub Actions)
- ❌ Workflow tampering (job ID changes)
- ❌ Missing required checks
- ❌ Contract violations
- ✅ Re-runs Guardian validation

**📍 TODAY:** CI contract guard + workflow drift detection  
**🚀 ROADMAP:** Post-deploy health gates (experimental in v1.1, production-ready in v2.0)

### Doctor Command
- ❌ Missing CERBER.md
- ❌ Missing schema (strict mode)
- ❌ Missing pre-commit hook
- ❌ Missing CI workflow
- ✅ Override state validation

---

## ⚖️ Stability Policy

Cerber is a devtool — we don't break pipelines:

- **CLI flags + exit codes:** Follow [SemVer](https://semver.org/). Breaking changes = major version bump.
- **JSON output:** Versioned schema (e.g., `{"version": "1.0", ...}`). New fields = minor, changed fields = major.
- **CI workflow templates:** Generated files are yours to customize. Updates = opt-in via `cerber init --force`.

**Current stability:** v1.1.11 is production-ready for CI contract guard use case. See [production proof](docs/case-studies/eliksir.md).

---

## Example: CI Drift Detected

```bash
$ npx cerber doctor

[Cerber Doctor] Setup Validation

[OK] All checks passed!

Configuration:
  Mode: dev
  Guardian: enabled
  Health: enabled
  CI: github
  Override: DISABLED

[READY] Ready to commit!

⭐ If Cerber helped you, star the repo: https://github.com/Agaslez/cerber-core
💬 Join Discord for feedback/support: https://discord.gg/V8G5qw5D
```

**When drift detected:**
```bash
$ npx cerber doctor

[Cerber Doctor] Setup Validation

[FAIL] Issues found:

[!] .github/workflows/cerber.yml
    GitHub workflow not found

Next Steps:

1. Re-run initialization to generate missing files:
   npx cerber init

Help: https://github.com/Agaslez/cerber-core/discussions
```

---

## How to Use Cerber (Full Workflow)

Cerber is simple: **write rules once in `CERBER.md`**, enforce on every commit + CI run.

**📍 TODAY:** Pre-commit Guardian + CI workflow drift detection  
**🚀 ROADMAP:** Post-deploy health gates (experimental)

**Roadmap → CERBER.md contract → enforced automatically on every commit/push.**

### 1) Install
```bash
npm i -D cerber-core
```

### 2) Generate CERBER.md
```bash
npx cerber init
```

If CERBER.md did not exist, Cerber creates a template and stops.  
Now **YOU fill the contract** (ideally with an AI assistant).

### 3) Teach Cerber using your roadmap (fastest way)

Take your project roadmap + repo structure and paste it into ChatGPT/Claude/Cursor with the **Cerber Contract Translator prompt** (see below).

Then:
- Paste the generated contract into `CERBER.md`
- Run init again to generate hooks/workflows/templates:
  ```bash
  npx cerber init
  ```

### 4) Verify everything (Doctor)
```bash
npx cerber doctor
```

**Exit codes:**
- `0` ✅ All checks pass
- `2` ❌ Missing CERBER.md
- `3` ❌ Missing schema (strict mode)
- `4` ❌ Missing hook/workflow

### 5) Commit and push (Guardian + CI)

- `git commit` → Guardian validates staged changes (blocks violations)
- `git push` → GitHub Actions validates again in CI

---

## 🧪 Testing Strategy

Cerber maintains **comprehensive test coverage** with emphasis on **production evidence in CI**.

### Test Suites

- **Unit Tests:** 950+ tests covering individual adapters, validators, and core logic
- **Integration Tests:** 138+ tests with real adapters, real git operations, no mocks
  - ✅ Orchestrator real adapter execution (13 tests)
  - ✅ FileDiscovery real git repository operations (15 tests)
  - ✅ Contract & profile error handling (24 tests)
  - ✅ Output JSON schema validation (39 tests)
  - ✅ Timeout enforcement & concurrency safety (37 tests)
- **E2E Tests:** 30+ end-to-end tests covering complete workflows

### Production Evidence

Tests are not just local — they run in **GitHub Actions on every commit/PR**:

[![Integration Tests Badge](https://github.com/Agaslez/cerber-core/actions/workflows/test-comprehensive.yml/badge.svg)](https://github.com/Agaslez/cerber-core/actions/workflows/test-comprehensive.yml?query=branch%3Amain)

What makes this "Production Evidence":

1. **Real Adapters** — Tests execute actual ActionlintAdapter, GitleaksAdapter, ZizmorAdapter
2. **Real Git** — FileDiscovery tests use actual git commands (execSync), including:
   - Detached HEAD scenarios (GitHub Actions default)
   - Shallow clone support (GitHub Actions default depth=1)
   - Staged vs. committed file detection
3. **Real Output** — Validates against actual `output.schema.json`
4. **Determinism Verified** — Same input → identical JSON (snapshot-testable)
5. **Concurrency Safe** — Tests for race conditions, parallel execution, factory cache thread-safety

### Running Tests

**Locally:**
```bash
npm test                           # All tests (unit + integration)
npm run test:integration          # Integration tests only (138 tests)
npm run test:watch               # Watch mode for development
```

**In CI (GitHub Actions):**
```yaml
test-integration:
  name: Integration - Real Adapters & Git Operations
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4.1.0
    - uses: actions/setup-node@v4.0.0
      with:
        node-version: '20'
    - run: npm ci
    - run: npm run build
    - run: npx jest test/integration/ --testTimeout=30000 --verbose
```

Every commit runs these 138 integration tests. Results are visible in Actions logs.

---

## 💬 Feedback & Support

**Having issues? Want to share your setup?**

- 💬 **Discord:** https://discord.gg/V8G5qw5D (fastest support)
- 🐛 **GitHub Issues:** [Report bugs](https://github.com/Agaslez/cerber-core/issues)
- 💡 **GitHub Discussions:** [Ask questions, share ideas](https://github.com/Agaslez/cerber-core/discussions)
- 📖 **Case Studies:** [See Cerber in production](docs/case-studies/)

**Show your CI runs in Discord `#showcase`!**

---

## Cerber Contract Translator (Copy/Paste Prompt)

> Use this to generate a production-ready `CERBER.md` from your roadmap.  
> Cerber does NOT design your architecture. It enforces what you write.

**PROMPT:**

```
You are a "Cerber Contract Translator". Convert my roadmap + repo structure into a `CERBER.md` contract.

RULES:
- Do NOT invent architecture or rules.
- Only translate what I explicitly provide.
- If something is missing, ask up to 10 questions in a `QUESTIONS` section and leave placeholders.
- Output must be a complete `CERBER.md` with:
  1) CERBER_CONTRACT (YAML)
  2) ROADMAP_AS_LAW (milestones)
  3) AI_AGENT_RULES (no guessing)
  4) PROTECTED_ASSETS
  5) CERBER_OVERRIDE (TTL safety fuse)
  6) QUESTIONS

INPUT I PROVIDE:
- Roadmap (what we are building, milestones, priorities)
- Repo structure (`tree -L 3` or folder list)
- Tech stack + commands for smoke/e2e/build
- Integrations (Stripe/Ghost/Cloudinary/etc.)
- What files/paths are "protected" from deletion

Now generate `CERBER.md`.
```

---

## For AI Agents (Copilot / Cursor / Windsurf / Claude / etc.)

**Single rule:** `CERBER.md` is the ONLY source of truth.

### Agent must follow this protocol

1) **If `CERBER.md` is missing:**
   - Run `npx cerber init` to generate template
   - STOP (user must provide contract content)

2) **If `CERBER.md` exists:**
   - Read it first
   - Execute exactly what it says
   - Do NOT invent rules, do NOT infer architecture

3) **Schema policy (important):**
   - If `schema.mode: strict` → DO NOT generate schema files
   - If `schema.mode: template_only` → you may generate only the minimal template (NOT decisions)

4) **Safety rules:**
   - Never disable or rename CI job id: `cerber-ci`
   - Never remove: `CERBER.md`, `.github/workflows/cerber.yml`, `scripts/cerber-guardian.mjs`, `.husky/pre-commit`, `.github/CODEOWNERS`
   - Never bypass checks using `continue-on-error`
   - Never use `cat <<EOF` for TS/JS (corrupts `${}` template literals)

**If a required rule is not present in `CERBER.md` → ASK USER or FAIL FAST.**

---

## 🔗 Links

- **Repository:** https://github.com/Agaslez/cerber-core
- **Releases:** https://github.com/Agaslez/cerber-core/releases
- **Security Policy:** https://github.com/Agaslez/cerber-core/blob/main/SECURITY.md
- **Discussions:** https://github.com/Agaslez/cerber-core/discussions
- **Full Documentation:** [docs/README_LONG.md](docs/README_LONG.md)

---

## 📋 Minimal CERBER.md Example

```yaml
## CERBER_CONTRACT
\```yaml
version: 1
mode: solo  # solo | dev | team

guardian:
  enabled: true
  schemaFile: BACKEND_SCHEMA.mjs

schema:
  enabled: true
  file: BACKEND_SCHEMA.mjs
  mode: strict  # Recommended: You create schema, Cerber never generates

health:
  enabled: true
  endpoint: /api/health

ci:
  provider: github
  branches: [main]
\```
```

**Schema modes:**
- `strict` (recommended) → You design architecture, Cerber guards it
- `template_only` → Helper scaffold for beginners (NOT design decisions)

---

## 📚 Documentation

**Quick Links:**
- [📖 Full Documentation (Long README)](docs/README_LONG.md)
- [🛡️ Guardian API](docs/GUARDIAN.md) - Pre-commit validation
- [🔍 Cerber API](docs/CERBER.md) - Runtime health checks
- [⚡ SOLO Layer](docs/SOLO.md) - Automation for solo developers (666 LOC)
- [👥 TEAM Layer](docs/TEAM.md) - Focus Mode + module system (1861 LOC)
- [🏗️ Architecture](docs/ARCHITECTURE.md) - System design philosophy
- [🔐 Security Policy](SECURITY.md) - Supply-chain security, vulnerability reporting
- [🤝 Contributing](CONTRIBUTING.md) - How to contribute

**Workflows by Team Size:**
- [Solo Developer](docs/workflows/solo-developer.md) - 1 person, 15min setup
- [Small Team (2-5)](docs/workflows/small-team.md) - Module system, 1-2h setup
- [Growing Team (5-20)](docs/workflows/growing-team.md) - Architecture governance

**Examples:**
- [Frontend Schema (React)](examples/frontend-schema.ts)
- [Backend Schema (Express)](examples/backend-schema.ts)
- [Health Checks](examples/health-checks.ts)
- [SOLO Integration](examples/solo-integration/)
- [TEAM Integration](examples/team-integration/)

---

## ✨ Key Features

### Guardian 1.0 (Pre-commit)
- Schema-as-Code (architecture rules in version control)
- Fast feedback (<1s validation vs 5min CI wait)
- Required imports + forbidden patterns
- Architect approvals (traceable exceptions)

### Cerber 2.1 (Runtime)
- Detailed diagnostics (diagnosis + rootCause + fix)
- Severity levels (critical/error/warning)
- Component-based health checks
- Performance tracking

### SOLO Layer
- Auto-repair (format, deps, changelog)
- Performance budget enforcement
- Daily dashboard
- Dependency health checks

### TEAM Layer
- **Focus Mode** (500 LOC context vs 10K LOC for AI) ⭐
- Module boundaries enforcement
- Connection contracts between modules
- CERBER.md project mapping

---

## 🚨 Emergency Override

For **P0 production hotfixes only**, controlled safety fuse with strict TTL:

```yaml
## CERBER_OVERRIDE
enabled: true
reason: "P0 - Payment API down, emergency rollback"
expires: "2026-01-04T18:00:00Z"  # 6-hour TTL
approvedBy: "CTO Name"
```

**What Override DOES:**
- ✅ Allows pre-commit to pass WITH WARNING (audit trail logged)
- ✅ Can skip postDeploy gate if configured

**What Override NEVER DOES:**
- ❌ Disable `cerber-integrity` job (self-protection always runs)
- ❌ Disable entire CI pipeline (build/test/lint must pass)
- ❌ Disable CODEOWNERS enforcement (team mode)

**Use sparingly.** After expiry, guardian proceeds with normal validation.

---

## � Testing Strategy

Cerber has **comprehensive test coverage** with real adapters verified in CI:

```bash
# Run all tests (1000+ tests)
npm test

# Run specific test suites
npm test -- test/unit          # Unit tests
npm test -- test/integration   # Integration tests (real adapters & git)
npm test -- test/e2e           # End-to-end tests

# Watch mode
npm test -- --watch
```

### Test Coverage by Type

| Type | Count | Purpose |
|------|-------|---------|
| **Unit** | 950+ | Schemas, adapters, utilities |
| **Integration** | 45+ | Real adapters, git operations, CI scenarios |
| **E2E** | 30+ | CLI commands, end-to-end workflows |

### 🎯 Production Evidence

Integration tests run on **every commit in CI/CD**:

✅ **Real Adapters** — Tests verify ActionlintAdapter, GitleaksAdapter, ZizmorAdapter work together  
✅ **Deterministic Output** — Same input → identical output across runs  
✅ **Parallel Execution** — Adapters run in parallel without race conditions  
✅ **Git Operations** — Tests with actual git repos (detached HEAD, shallow clones)  
✅ **Error Resilience** — Graceful handling of missing files, invalid YAML, timeouts  

**Evidence:** Test results are in [GitHub Actions](https://github.com/Agaslez/cerber-core/actions/workflows/test-comprehensive.yml) logs for every commit.

---

## �🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
git clone https://github.com/Agaslez/cerber-core.git
cd cerber-core
npm install
npm run build
npm test
```

---

## 📞 Support & Links

- 💬 **Discord:** [Join community](https://discord.gg/V8G5qw5D)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Agaslez/cerber-core/issues)
- 💡 **Discussions:** [GitHub Discussions](https://github.com/Agaslez/cerber-core/discussions)
- 📖 **Full Docs:** [docs/README_LONG.md](docs/README_LONG.md)
- 📚 **Case Study:** [How Cerber prevented 47 bugs](docs/case-studies/eliksir.md)
- 🎭 **Story:** [The team behind Cerber](docs/STORY.md)
- 🔐 **Security:** Report vulnerabilities to st.pitek@gmail.com
- ⭐ **Repository:** [github.com/Agaslez/cerber-core](https://github.com/Agaslez/cerber-core)

---

## 📄 License

MIT © 2026 Stefan Pitek

Free for commercial use. See [LICENSE](LICENSE) for details.

---

## 🌟 About

**Founded by Agata Ślęzak**, created and maintained by **Stefan Pitek**

- 📖 Read the full story: [docs/STORY.md](docs/STORY.md)

Read the full story: [docs/STORY.md](docs/STORY.md)

**Support development:** [docs/SPONSORING.md](docs/SPONSORING.md)

---

<div align="center">

⭐ **If Cerber saved you time, give it a star!** ⭐

Made with 🛡️ by developers, for developers

</div>
