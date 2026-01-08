# 🚀 Cerber Core v2.0 - Quick Start Guide

**Get started with Cerber Core in 60 seconds!**

---

## Option 1: New User (Recommended)

### Step 1: Install
```bash
npm install -D cerber-core
```

### Step 2: Choose Your Template
```bash
npx cerber init --template nodejs
```

Available templates:
- `nodejs` — Node.js applications
- `docker` — Docker projects
- `react` — React/Next.js apps
- `python` — Python projects
- `terraform` — Infrastructure as Code

### Step 3: Validate Your Workflow
```bash
npx cerber-validate .github/workflows/ci.yml
```

### Step 4: Auto-Fix Issues
```bash
# Preview fixes
npx cerber-validate .github/workflows/ci.yml --fix --dry-run

# Apply fixes
npx cerber-validate .github/workflows/ci.yml --fix
```

**Done!** 🎉

---

## Option 2: Existing v1.x User

### Everything Still Works!
```bash
# Your existing commands work exactly the same
cerber init
cerber-guardian
cerber-health
```

### Try New v2.0 Features
```bash
# 1. Update package
npm install cerber-core@latest

# 2. Validate workflows (NEW!)
npx cerber-validate .github/workflows/ci.yml

# 3. Auto-fix (NEW!)
npx cerber-validate .github/workflows/ci.yml --fix
```

**No breaking changes!** ✅

---

## Common Use Cases

### 1. Validate Before Commit
```bash
# Add to .husky/pre-commit
npx cerber-validate .github/workflows/*.yml || exit 1
```

### 2. CI/CD Integration
```yaml
# .github/workflows/validate.yml
name: Validate Workflows
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -D cerber-core
      - run: npx cerber-validate .github/workflows/ci.yml
```

### 3. Custom Rules
```yaml
# .cerber/config.yml
rules:
  security/no-hardcoded-secrets: error
  security/require-action-pinning: error
  best-practices/cache-dependencies: warn
  
  # Disable specific rules
  performance/use-composite-actions: off
```

### 4. Programmatic Usage
```typescript
import { SemanticComparator, RuleManager } from 'cerber-core';
import * as yaml from 'yaml';
import * as fs from 'fs';

// Load workflow
const workflowContent = fs.readFileSync('ci.yml', 'utf-8');
const workflow = yaml.parse(workflowContent);

// Validate
const comparator = new SemanticComparator();
const result = await comparator.compare(workflow);

// Check results
if (!result.valid) {
  console.error('Validation failed!');
  console.error(result.violations);
  process.exit(1);
}
```

---

## Troubleshooting

### Issue: "yaml module not found"
```bash
npm install yaml
```

### Issue: "Command not found: cerber-validate"
```bash
# Make sure you installed cerber-core
npm install -D cerber-core

# Use npx
npx cerber-validate --help
```

### Issue: "Too many violations"
```bash
# Start with dry-run
npx cerber-validate ci.yml --fix --dry-run

# Apply fixes incrementally
npx cerber-validate ci.yml --fix

# Review changes
git diff .github/workflows/
```

### Issue: "Need custom rules"
See [Custom Rules Guide](./docs/custom-rules.md)

---

## Next Steps

1. ⭐ **Star the repo** — https://github.com/Agaslez/cerber-core
2. 💬 **Join Discord** — https://discord.gg/V8G5qw5D
3. 📖 **Read full docs** — [README.v2.md](./README.v2.md)
4. 🗺️ **Check roadmap** — [cerber-core-roadmap.md](./cerber-core-roadmap.md)

---

## Help & Support

- **Questions:** Discord `#general`
- **Bugs:** GitHub Issues
- **Features:** Discord `#feedback`

---

**Happy validating!** 🛡️
