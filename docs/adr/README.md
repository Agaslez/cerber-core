# Architecture Decision Records (ADR)

**Philosophy:** Document WHY, not just WHAT. Show architectural thinking that makes Cerber a ⭐-worthy project.

## What is an ADR?

An Architecture Decision Record (ADR) captures a single architectural decision: the context, the decision itself, and the consequences. ADRs help new contributors understand the reasoning behind the codebase structure.

## Format

Each ADR follows this structure:
- **Status:** Proposed | Accepted | Deprecated | Superseded
- **Context:** What forces are at play? What problem are we solving?
- **Decision:** What did we decide? Be specific and actionable.
- **Consequences:** What trade-offs did we make? What are the benefits and costs?
- **Alternatives Considered:** What other options did we evaluate?

## Index

### Core Architecture
- [ADR-001: ErrorClassifier Pattern](001-error-classifier-pattern.md) - Single responsibility for error categorization
- [ADR-002: Decompose Resilience God Class](002-decompose-resilience-god-class.md) - Breaking down monolithic resilience logic
- [ADR-003: Strategy Pattern for Adapter Execution](003-strategy-pattern-adapter-execution.md) - Decoupling execution strategies
- [ADR-004: Observable Resilience Layer](004-observable-resilience-layer.md) - Prometheus metrics + structured logging
- [ADR-005: Security-First Validation](005-security-first-validation.md) - Zod schemas + path sanitization

## Creating a New ADR

```bash
# Use sequential numbering
touch docs/adr/006-your-decision-title.md

# Follow the template
cp docs/adr/000-template.md docs/adr/006-your-decision.md
```

## References

- [Michael Nygard's ADR template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [When to write an ADR](https://github.com/joelparkerhenderson/architecture-decision-record/blob/main/templates/decision-record-template-by-michael-nygard/index.md)
- [ADR GitHub repository](https://adr.github.io/)

## Why ADRs for Cerber Core?

**⭐ GitHub Stars Goal:** Professional projects document their architectural thinking. ADRs show:
- We make deliberate decisions (not accidental complexity)
- We understand trade-offs (not cargo culting)
- We learn from experience (not repeating mistakes)
- We welcome contributors (not gatekeeping knowledge)

**Target audience:**
- Senior engineers evaluating architecture quality
- Contributors understanding design philosophy
- Users deciding if Cerber fits their needs
- Future maintainers (including our future selves)
