# Python Template

This template provides a secure baseline for Python CI/CD workflows.

## Quick Start

```bash
npx cerber init --template python
```

## What's Included

- ✅ Secure permissions (read-only by default)
- ✅ Pinned actions (actions/checkout@v4, actions/setup-python@v5)
- ✅ Required steps (pip install, pytest)
- ✅ Python 3.9+ enforcement
- ✅ Dependency caching recommended
- ✅ Multi-version testing support

## Example Workflow

See `example-workflow.yml` for a complete example.

## Rules

### Security (must-pass)
- No hardcoded secrets
- Actions pinned to versions
- Limited permissions

### Best Practices (warnings)
- Cache dependencies for faster builds
- Use Python version matrix
- Use requirements.txt for dependencies
- Run pytest with coverage
- Include linting (flake8/pylint/ruff)

## Testing

The template includes:
- **pytest** - Testing framework
- **coverage** - Code coverage reporting
- **linting** - Code quality checks (flake8, pylint, or ruff)

## Customization

Edit `.cerber/contract.yml` to:
- Add/remove rules
- Change severity levels (error/warning/info)
- Add project-specific requirements
- Configure additional Python versions

## Common Use Cases

### Basic CI
```yaml
- pip install -r requirements.txt
- pytest
```

### With Coverage
```yaml
- pip install -r requirements.txt
- pytest --cov=src --cov-report=xml
```

### With Linting
```yaml
- pip install flake8
- flake8 src/
- pytest
```

## Learn More

- [Cerber Documentation](https://github.com/Agaslez/cerber-core)
- [Contract Schema](https://github.com/Agaslez/cerber-core/blob/main/src/contracts/contract.schema.json)
- [Python Testing Best Practices](https://docs.pytest.org/)
