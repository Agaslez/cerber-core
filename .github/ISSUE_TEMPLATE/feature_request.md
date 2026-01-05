---
name: Feature Request
about: Suggest a new feature or enhancement
title: '[FEATURE] '
labels: enhancement
assignees: ''

---

## 💡 Feature Description
<!-- A clear and concise description of the feature you'd like to see. -->

## 🎯 Problem / Use Case
<!-- What problem does this solve? What's your use case? -->

Example:
- **Problem:** AI agents often delete package.json when refactoring
- **Current workaround:** Manual review every commit
- **Desired solution:** Add `protected_files` list to CERBER.md

## 📖 Proposed Solution
<!-- How do you envision this working? -->

Example CERBER.md syntax:
```yaml
protected_files:
  - package.json
  - .github/workflows/**
  - src/schema/**
```

## 🔄 Alternatives Considered
<!-- Have you tried other approaches? -->

## 📊 Impact
<!-- Who benefits from this feature? -->
- [ ] Solo developers
- [ ] Small teams (2-5 devs)
- [ ] Large teams (5+ devs)
- [ ] Enterprise users
- [ ] All users

## 🚀 Urgency
- [ ] Critical (blocking my work)
- [ ] High (would significantly improve workflow)
- [ ] Medium (nice to have)
- [ ] Low (future consideration)

## 💬 Additional Context
<!-- Any other relevant information, examples, or screenshots -->

## ✅ Checklist
- [ ] I have searched existing issues and discussions
- [ ] This feature aligns with Cerber's contract-first philosophy
- [ ] I have described a clear use case
- [ ] I would be willing to test this feature when implemented
