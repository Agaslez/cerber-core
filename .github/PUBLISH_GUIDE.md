# Publishing Guide for cerber-core

## Current Setup: Manual Publishing

GitHub Actions auto-publish is **disabled** because:
- Requires NPM_TOKEN secret configuration
- Requires write permissions for GitHub releases
- Manual publishing is simpler for maintainers

## How to Publish a New Version

### 1. Update Version & Code

```bash
# Make your changes
git add .
git commit -m "feat: your feature"

# Update version in package.json
npm version patch  # or minor/major
```

### 2. Build & Test Locally

```bash
npm run build
npm test
```

### 3. Publish to npm

```bash
npm publish
```

### 4. Create GitHub Tag & Release

```bash
# Push code
git push

# Create and push tag
git tag v1.x.x
git push origin v1.x.x

# Create GitHub release
gh release create v1.x.x \
  --title "v1.x.x - Your Title" \
  --notes "Release notes here"
```

## Enable Auto-Publishing (Optional)

If you want GitHub Actions to auto-publish:

### 1. Set npm Token Secret

```bash
# Get token from https://www.npmjs.com/settings/YOUR_USERNAME/tokens
gh secret set NPM_TOKEN --body "your-npm-token"
```

### 2. Enable Workflows

Edit `.github/workflows/release.yml` and `.github/workflows/publish.yml`:

```yaml
# Change from:
on:
  workflow_dispatch:

# To:
on:
  push:
    tags:
      - 'v*.*.*'
```

### 3. Grant Workflow Permissions

Repository Settings → Actions → General → Workflow permissions:
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

## Troubleshooting

**Error: 403 on release creation**
- Check workflow permissions in repo settings

**Error: ENEEDAUTH on npm publish**
- Run `npm login` locally, or
- Set NPM_TOKEN secret for GitHub Actions

**Error: Version mismatch**
- Ensure package.json version matches git tag (without 'v' prefix)
