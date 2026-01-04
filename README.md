# 🛡️ Cerber Core

> **AI doesn't break your project. Lack of a contract does.**

Contract-driven project guardian for AI-assisted development. Enforces a single source of truth (`CERBER.md`) across pre-commit, CI, and post-deploy health gates.

[![npm version](https://img.shields.io/npm/v/cerber-core.svg)](https://www.npmjs.com/package/cerber-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-cerber--core-blue.svg)](https://github.com/Agaslez/cerber-core)

---

## 🚀 Quick Start

```bash
npm install cerber-core --save-dev
npx cerber init --mode=solo
npx cerber init          # Generate files
npx cerber doctor        # Validate setup
```

**Three enforcement layers:**
1. **Pre-commit (Guardian)** - Blocks violating commits before they reach CI
2. **CI (cerber-integrity)** - Validates contract + workflow self-protection
3. **Post-deploy (Health)** - Runtime checks in production

---

## 🤖 For AI Agents (MUST Rules)

**Rule 1: CERBER.md is the only source of truth**
- If missing → generate template and **STOP** (user must fill contract)
- If exists → execute contract exactly as specified
- **Never guess architecture.** Never invent rules.

**Rule 2: Schema = Translation Only**
- If `schema.mode: strict` → **NEVER** generate schema file (user creates it)
- If `schema.mode: template_only` → generate minimal scaffold with "NOT SOURCE OF TRUTH" header
- Schema rules MUST match explicit statements in CERBER.md

**Rule 3: NO HEREDOC for TS/JS**
- Never create TypeScript/JavaScript files with bash `cat <<EOF`
- Reason: Corrupts `${}` template literals and UTF-8 encoding
- Use proper file generation tools instead

**Recommended: `schema.mode: strict`** (mature teams) for zero assumptions.

---

## 🩺 npx cerber doctor

Validates setup before commits/deploys:

```bash
npx cerber doctor
```

**Exit codes:**
- `0` ✅ All checks pass
- `2` ❌ Missing CERBER.md contract
- `3` ❌ Missing schema file (strict mode only)
- `4` ❌ Missing pre-commit hook or CI workflow
- `5` ❌ Schema validation failed

**Checks:**
- CERBER.md present + valid YAML
- Schema file exists (if `schema.mode: strict`)
- `.husky/pre-commit` hook installed
- GitHub Actions workflow present
- Emergency override state

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

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
git clone https://github.com/Agaslez/cerber-core.git
cd cerber-core
npm install
npm run build
npm test
```

---

## 📞 Support

- 🐛 **Issues:** [GitHub Issues](https://github.com/Agaslez/cerber-core/issues)
- 💡 **Discussions:** [GitHub Discussions](https://github.com/Agaslez/cerber-core/discussions)
- 📖 **Docs:** [Full Documentation](docs/README_LONG.md)
- 🔐 **Security:** Report vulnerabilities to st.pitek@gmail.com
- ⭐ **Repository:** [cerber-core](https://github.com/Agaslez/cerber-core)

---

## 📄 License

MIT © 2026 Stefan Pitek

Free for commercial use. See [LICENSE](LICENSE) for details.

---

## 🌟 About

Founded by **Agata Ślęzak**, created by **Stefan Pitek**

Read the full story: [docs/STORY.md](docs/STORY.md)

**Support development:** [docs/SPONSORING.md](docs/SPONSORING.md)

---

<div align="center">

⭐ **If Cerber saved you time, give it a star!** ⭐

Made with 🛡️ by developers, for developers

</div>
