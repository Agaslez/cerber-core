# React Template

This template provides a secure baseline for React CI/CD workflows with build optimization, testing, and deployment support.

## Quick Start

```bash
npx cerber init --template react
```

## What's Included

- ✅ Secure permissions (read-only by default)
- ✅ Pinned actions (actions/checkout@v4, actions/setup-node@v4)
- ✅ Required steps (npm ci, npm run build, npm test)
- ✅ Node.js 18+ enforcement
- ✅ Build artifact uploads
- ✅ Test coverage support
- ✅ Dependency caching for faster builds

## Compatibility

This template works with:
- **Vite** - Modern React build tool
- **Create React App (CRA)** - Traditional React setup
- **Next.js** - React framework (use with adjustments)
- Custom React configurations

## Example Workflow

See `example-workflow.yml` for a complete example with:
- Multi-version Node.js testing (18.x, 20.x)
- Build optimization
- Artifact uploads for deployment
- Test execution

## Rules

### Security (must-pass)
- No hardcoded secrets
- Actions pinned to versions
- Limited permissions
- Secure checkout (no persisted credentials)

### Best Practices (warnings)
- Cache dependencies for faster builds
- Use Node.js version matrix
- Optimize build output
- Parallelize jobs where possible

### Performance (info)
- Avoid unnecessary checkouts
- Use composite actions for reusability

## Customization

Edit `.cerber/contract.yml` to:
- Add/remove rules
- Change severity levels (error/warning/info)
- Add project-specific requirements
- Configure deployment steps

## Deployment

After successful build, artifacts can be deployed to:
- Vercel, Netlify, GitHub Pages
- AWS S3, Azure Static Web Apps
- Custom hosting solutions

## Learn More

- [Cerber Documentation](https://github.com/Agaslez/cerber-core)
- [Contract Schema](https://github.com/Agaslez/cerber-core/blob/main/src/contracts/contract.schema.json)
- [React Best Practices](https://react.dev/)
