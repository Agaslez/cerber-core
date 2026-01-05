# 🛡️ Cerber Core

> **AI doesn't break your project. Lack of a contract does.**

Contract-first project guardian for AI-assisted development.  
Enforces `CERBER.md` across pre-commit, CI, and optional post-deploy gates.

[![npm version](https://img.shields.io/npm/v/cerber-core.svg)](https://www.npmjs.com/package/cerber-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-cerber--core-blue.svg)](https://github.com/Agaslez/cerber-core)
[![Discord](https://img.shields.io/discord/1457747175017545928?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/XzGUgxrRnn)

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

## How to use Cerber (the intended workflow)

Cerber is simple: **you write the rules once in `CERBER.md`**, Cerber enforces them forever (pre-commit + CI + optional post-deploy).

**Roadmap → translated into CERBER.md contract → enforced automatically on every commit/push.**

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

## What Cerber enforces (in practice)

- **Pre-commit (Guardian):** Blocks committing obvious violations (secrets, forbidden patterns, missing required imports, etc.)
- **CI (GitHub Actions):** Re-validates on push/PR and protects the workflow itself (`cerber-integrity` job)
- **Optional post-deploy:** Can validate production health if enabled in contract

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

## 📞 Support & Links

- 💬 **Discord:** [Join community](https://discord.gg/XzGUgxrRnn)
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
