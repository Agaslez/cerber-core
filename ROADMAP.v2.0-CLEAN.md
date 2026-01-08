# CERBER-CORE v2.0 ROADMAP (Professional, Minimal)

**Status:** In Development  
**Target:** Production-ready CI/CD contract validator  
**Timeline:** 2 weeks (realistic)

---

## ✅ COMPLETED (Week 1)

### Core Engine
- ✅ Semantic diff engine (3-level validation)
- ✅ TypeScript AST parser (WorkflowAST, ContractAST)
- ✅ Violation tracking with location
- ✅ Confidence-based suggestions

### Rules System
- ✅ 10 production rules:
  - 5 security (pinning, permissions, secrets, checkout, triggers)
  - 3 best-practices (caching, node-version, matrix)
  - 2 performance (checkout duplicates, composite actions)
- ✅ Rule Manager with enable/disable

### CLI Tools
- ✅ `cerber-validate` with auto-fix
- ✅ Exit codes (0=ok, 1=error, 2=config, 3=runtime)
- ✅ Verbose mode + JSON output

### Templates
- ✅ 5 contract templates (nodejs, docker, react, python, terraform)
- ✅ `cerber init --template` support

### Tests
- ✅ 26 tests passing (semantic, rules, integration)

---

## 🚧 IN PROGRESS (Week 2)

### Core Stability
- [ ] Fix edge cases in YAML parsing (anchors, aliases)
- [ ] Add location tracking to all violation types
- [ ] Improve error messages (include file + line)

### Documentation
- [ ] README: Quick start (60 seconds)
- [ ] CHANGELOG with v2.0 features
- [ ] Migration guide (v1.x → v2.0)
- [ ] Contract examples with comments

### Dogfooding
- [ ] Validate cerber-core's own workflows
- [ ] Screenshot: failure → fix → green
- [ ] Real-world example (public repo)

---

## 📋 BACKLOG (v2.1+)

### GitHub API Integration (Optional)
- [ ] Fetch latest action versions
- [ ] Check security advisories
- [ ] Validate branch protection (with token)
- [ ] Rate limiting + caching

### Developer Experience
- [ ] `cerber doctor` (scan without contract)
- [ ] Better diff output (colored, grouped)
- [ ] Pre-commit hook integration guide

### Community
- [ ] CONTRIBUTING.md with dev setup
- [ ] Issue templates
- [ ] Good first issues

---

## 🎯 PRINCIPLES

1. **Core First** - Make validation reliable before adding features
2. **No False Promises** - Only claim what's implemented and tested
3. **Clear Scope** - Workflow YAML only (repo settings require API)
4. **Backward Compatible** - v1.x features continue to work

---

## ⚠️ OUT OF SCOPE (For Now)

- ❌ VS Code extension (v3.0+)
- ❌ Marketplace integration (v3.0+)
- ❌ Monetization (v3.0+)
- ❌ Telemetry/analytics (v3.0+)
- ❌ Verifying repo settings without GitHub API

---

## 📊 SUCCESS METRICS (Realistic)

- ✅ Build passes with no TypeScript errors
- ✅ All tests green (26/26)
- ✅ Can validate real workflow in <150ms
- ✅ Setup time <60 seconds (`npx cerber init`)
- ✅ Dogfooded on cerber-core itself

**Target:** Ship v2.0.0-beta.1 when above metrics are met.
