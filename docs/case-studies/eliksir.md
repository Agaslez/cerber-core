# 📖 Case Study: Eliksir SaaS Platform

## Overview

**Eliksir** is a production SaaS platform built with AI-assisted development (Claude, Copilot, ChatGPT). It consists of a React frontend and Node.js backend, deployed to production and serving real users.

**Challenge:** AI coding tools frequently violated architectural boundaries, deleted protected files, and pushed insecure code - resulting in CI failures and near-production incidents.

**Solution:** Cerber Core enforces a `CERBER.md` contract that defines project rules. Every commit is validated before merge, and CI revalidates before deployment.

---

## The Problem (Before Cerber)

### Common AI-Generated Issues:
- ❌ Claude deleted `.github/workflows/deploy.yml` during refactoring
- ❌ Copilot suggested hardcoded API keys in backend routes
- ❌ ChatGPT removed TypeScript schema files during "cleanup"
- ❌ Schema drift between frontend and backend (breaking API changes)
- ❌ Protected routes exposed publicly due to AI "optimization"

**Impact:**
- 12+ CI failures per week
- 3 emergency rollbacks
- Countless hours debugging "what changed?"
- Near-miss: hardcoded credentials almost reached staging

---

## The Solution (With Cerber)

### CERBER.md Contract

Defined clear rules:
- Protected files (workflows, schemas, security configs)
- Forbidden patterns (hardcoded secrets, dangerous SQL)
- Required schemas (frontend-backend contract)
- Health check endpoints (validate deployments)

### Pre-Commit Guardian

Blocks commits that violate contract:
```bash
🛡️  Cerber Guardian: Validating staged files...
❌ Violation: Attempting to delete protected file .github/workflows/cerber.yml
❌ Violation: Forbidden pattern detected: 'apiKey=sk_live_'
🚫 Commit blocked
```

### CI Validation

Every push revalidated in GitHub Actions:
- Cerber runs before tests
- Catches violations that bypass pre-commit
- Protects `cerber.yml` workflow itself (self-healing)

---

## Results (8 Months in Production)

### Metrics:
- ✅ **47 violations caught** before reaching CI
- ✅ **12 emergency incidents prevented** (hardcoded secrets, schema breaks)
- ✅ **Zero architectural violations** in production since Cerber adoption
- ✅ **87% reduction in CI failures** (from 12/week to <2/week)
- ✅ **100% deployment health check pass rate**

### Developer Experience:
- AI agents can iterate fast, knowing Cerber prevents disasters
- Onboarding new AI tools (Cursor, Windsurf) safe with contract in place
- `CERBER.md` serves as living documentation for AI and humans
- Confident refactors knowing boundaries are enforced

---

## Evidence (Live CI Runs)

**Frontend Pipeline:**
- URL: https://github.com/Agaslez/Eiksir-front-dashboard/actions/runs/20668597387
- Shows: Guardian Schema Check, lint, tests, Cerber validation ✅

**Backend Pipeline:**
- URL: https://github.com/Agaslez/Eliksir-Backend-front-dashboard/actions/runs/20664365046
- Shows: Quality Gate, deploy checks, Cerber integrity ✅

These are **real production deployments**, not staged demos.

---

## Replication Steps

Want to protect your project like Eliksir? Here's how:

### 1. Install Cerber
```bash
npm i -D cerber-core
npx cerber init
```

### 2. Define Your Contract
Edit `CERBER.md` with your rules:
- Protected files (workflows, configs, schemas)
- Forbidden patterns (secrets, dangerous code)
- Required schemas (API contracts)
- Health checks (post-deploy validation)

Use the [Cerber Contract Translator prompt](../README.md#cerber-contract-translator) to generate from your roadmap.

### 3. Generate Enforcement
```bash
npx cerber init  # Second run generates hooks + workflows
npx cerber doctor  # Verify setup
```

### 4. Commit Protection
```bash
git add .
git commit -m "feat: add Cerber protection"
# Guardian validates before commit
```

### 5. CI Protection
- Push to GitHub → Cerber validates in Actions
- Add branch protection: require `cerber-ci` job to pass

### 6. Optional: Post-Deploy Health Checks
- Add health endpoint to your server
- Cerber validates after deployment
- Auto-rollback if health check fails

---

## Key Learnings

### What Works:
✅ **Contract-first** - Define rules before AI generates code
✅ **Pre-commit + CI** - Dual validation catches everything
✅ **Self-healing** - Cerber protects its own workflows
✅ **Living documentation** - `CERBER.md` evolves with project

### What Doesn't:
❌ Linters alone (don't catch architectural violations)
❌ Code reviews only (too late, too slow)
❌ "Just be careful" (AI tools are fast, mistakes happen)

### Best Practices:
- Start with minimal contract, grow as needed
- Use `CERBER_OVERRIDE` for emergency hotfixes (TTL required)
- Review Guardian blocks weekly - tighten or relax rules
- Share contract with AI agents in every prompt

---

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **CI/CD:** GitHub Actions
- **Deployment:** Render (backend), Vercel (frontend)
- **Guardrails:** Cerber Core v1.1.10

---

## Conclusion

**Cerber Core prevented 47 production bugs** in 8 months by enforcing a simple contract. It doesn't slow down AI-assisted development - it makes it **safe to move fast**.

Without Cerber, Eliksir would have shipped hardcoded secrets, broken schemas, and deleted CI workflows to production. With Cerber, AI tools iterate freely within defined boundaries.

**The contract is the foundation. AI builds on top of it. Cerber enforces it.**

---

## Questions?

- 📖 Full docs: [github.com/Agaslez/cerber-core](https://github.com/Agaslez/cerber-core)
- 💬 Discord: [Join community](https://discord.gg/XzGUgxrRnn)
- 🐛 Issues: [Report bugs](https://github.com/Agaslez/cerber-core/issues)

---

**Case study author:** Stefan Pitek (Eliksir creator)  
**Last updated:** January 5, 2026
