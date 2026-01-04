# 🛡️ Cerber Core

> **AI doesn't break your project. Lack of a contract does.**

Contract-first project guardian for AI-assisted development.  
Enforces `CERBER.md` across pre-commit, CI, and optional post-deploy gates.

[![npm version](https://img.shields.io/npm/v/cerber-core.svg)](https://www.npmjs.com/package/cerber-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-cerber--core-blue.svg)](https://github.com/Agaslez/cerber-core)

---

## 🚀 Quick Start

```bash
npm i -D cerber-core
npx cerber init
# fill CERBER.md contract
npx cerber init
```

## 🩺 Verify

```bash
npx cerber doctor
```

**Exit codes:**
- `0` ✅ All checks pass
- `2` ❌ Missing CERBER.md
- `3` ❌ Missing schema (strict mode)
- `4` ❌ Missing hook/workflow

---

## 🤖 For AI Agents (Copilot/Cursor/Windsurf/Claude)

- **CERBER.md is the ONLY source of truth**
- If CERBER.md is missing → generate template and **STOP**
- Never guess architecture. Never invent rules.
- **schema.mode:**
  - `strict` → require schema file (never generate)
  - `template_only` → generate minimal helper template
- **NO HEREDOC:** Never use `cat <<EOF` for TS/JS (corrupts `${}`template literals)

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
