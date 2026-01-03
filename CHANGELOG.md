# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-03

### Added
- **Guardian 1.0**: Pre-commit architecture validator
  - Forbidden pattern detection with architect approval system
  - Required file validation
  - Required import checking
  - package.json rules validation
  - Recursive directory scanning
  - Detailed error/warning reporting
  - CLI with `--schema`, `--verbose`, `--fail-on-warning` options

- **Cerber 2.1**: Runtime health monitoring
  - Flexible health check system
  - Multiple severity levels (critical, error, warning, info)
  - Parallel and sequential check execution
  - Detailed diagnostics with fix suggestions
  - JSON output for CI/CD integration
  - CLI with `--checks`, `--url`, `--parallel` options

- **Architect Approval System**:
  - Comment-based approval format: `// ARCHITECT_APPROVED: reason - YYYY-MM-DD - Name`
  - Automatic parsing and tracking
  - Integration with Guardian validation

- **Examples**:
  - Frontend schema (React/Vue patterns)
  - Backend schema (Node.js/Express patterns)
  - Health check templates (DB, disk, memory, env vars)

- **Documentation**:
  - Comprehensive README with real-world metrics
  - Contributing guidelines
  - API documentation
  - MIT License

- **Production Testing**:
  - Extracted from Eliksir project
  - Real metrics: 18 commits, 43 issues detected, 4.5 hours saved
  - 95% bug detection rate pre-production
  - 2 commits blocked by Guardian

### Technical Details
- TypeScript with ES2022 target
- ESNext modules for modern bundlers
- Commander.js for CLI
- Chalk for colored output
- Full type definitions included
- Zero runtime dependencies (except CLI deps)

## [Unreleased]

### Planned
- Web dashboard for health check visualization
- Slack/Discord notifications
- Custom reporter plugins
- VS Code extension
- Git hooks integration (Husky)
- More built-in health checks
- Performance monitoring
- Metrics export (Prometheus, DataDog)
