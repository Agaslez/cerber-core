# Node.js Template

This template provides a secure baseline for Node.js CI/CD workflows.

## Quick Start

```bash
npx cerber init --template nodejs
```

## What's Included

- ✅ Secure permissions (read-only by default)
- ✅ Pinned actions (actions/checkout@v4, actions/setup-node@v4)
- ✅ Required steps (npm ci, npm test)
- ✅ Node.js 18+ enforcement
- ✅ Dependency caching recommended

## Example Workflow

See `example-workflow.yml` for a complete example.

## Rules

### Security (must-pass)
- No hardcoded secrets
- Actions pinned to versions
- Limited permissions

### Best Practices (warnings)
- Cache dependencies for faster builds
- Use Node.js version matrix
- Parallelize jobs where possible

## Customization

Edit `.cerber/contract.yml` to:
- Add/remove rules
- Change severity levels (error/warning/info)
- Add project-specific requirements

## Learn More

- [Cerber Documentation](https://github.com/Agaslez/cerber-core)
- [Contract Schema](https://github.com/Agaslez/cerber-core/blob/main/src/contracts/contract.schema.json)
