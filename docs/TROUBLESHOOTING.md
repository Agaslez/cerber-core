# Troubleshooting Guide

Common issues and solutions for Cerber Core users.

---

## 📖 Real-World Examples First

Before diving into specific issues, check out these resources showing Cerber in action:

- [**Real Workflows from Eliksir Project**](./REAL_WORKFLOWS.md) - See how to use each feature correctly
- [**Solo Developer Workflow**](./workflows/solo-developer.md) - Complete setup walkthrough
- [**Small Team Workflow**](./workflows/small-team.md) - Team setup examples
- [**Growing Team Workflow**](./workflows/growing-team.md) - Enterprise patterns

Many questions are answered by seeing real usage examples!

---

## Installation Issues

### "Cannot find module 'cerber-core'"

**Problem:** Import fails after installation.

```javascript
import { Guardian } from 'cerber-core/guardian';
// Error: Cannot find module 'cerber-core'
```

**Solutions:**

1. **Check installation:**
   ```bash
   npm list cerber-core
   # Should show: cerber-core@1.0.0
   ```

2. **Verify package.json has the dependency:**
   ```json
   {
     "dependencies": {
       "cerber-core": "^1.0.0"
     }
   }
   ```

3. **Reinstall:**
   ```bash
   npm install cerber-core --save-dev
   ```

4. **For ESM projects, ensure package.json has:**
   ```json
   {
     "type": "module"
   }
   ```

### "cerber-guardian: command not found"

**Problem:** CLI commands don't work after global install.

**Solutions:**

1. **Verify global installation:**
   ```bash
   npm list -g cerber-core
   ```

2. **Reinstall globally:**
   ```bash
   npm install -g cerber-core
   ```

3. **Check npm global bin path:**
   ```bash
   npm config get prefix
   # Should be in your PATH
   ```

4. **Use npx instead:**
   ```bash
   npx cerber-guardian --help
   ```

---

## Guardian Issues

### Guardian doesn't block commits

**Problem:** `git commit` succeeds even with forbidden patterns.

**Symptoms:**
```bash
git commit -m "test"
# Commit succeeds despite console.log in code
```

**Solutions:**

1. **Verify pre-commit hook exists:**
   ```bash
   cat .husky/pre-commit
   # Should contain: node scripts/validate-schema.mjs
   ```

2. **Check hook is executable:**
   ```bash
   chmod +x .husky/pre-commit
   ```

3. **Test validator manually:**
   ```bash
   node scripts/validate-schema.mjs
   # Should show validation results
   ```

4. **Verify husky is initialized:**
   ```bash
   npx husky install
   ```

5. **Check SCHEMA file exists:**
   ```bash
   ls FRONTEND_SCHEMA.ts BACKEND_SCHEMA.ts
   # At least one should exist
   ```

### "No schema file found" error

**Problem:** Guardian can't find architecture schema.

**Symptoms:**
```
❌ No schema file found!
Expected one of: FRONTEND_SCHEMA.ts, BACKEND_SCHEMA.ts...
```

**Solutions:**

1. **Copy example schema:**
   ```bash
   # For frontend projects:
   cp node_modules/cerber-core/examples/frontend-schema.ts ./FRONTEND_SCHEMA.ts
   
   # For backend projects:
   cp node_modules/cerber-core/examples/backend-schema.ts ./BACKEND_SCHEMA.ts
   ```

2. **Verify schema location:**
   - Root directory: `FRONTEND_SCHEMA.ts` or `BACKEND_SCHEMA.ts`
   - Or: `src/FRONTEND_SCHEMA.ts`
   - Or: `SCHEMA.ts`

3. **Check schema exports:**
   ```typescript
   // FRONTEND_SCHEMA.ts must export default
   export default {
     name: 'Frontend Architecture',
     // ...
   };
   ```

### "Failed to load schema file" error

**Problem:** Schema file has syntax errors.

**Solutions:**

1. **Check TypeScript syntax:**
   ```bash
   npx tsc --noEmit FRONTEND_SCHEMA.ts
   ```

2. **Verify exports:**
   ```typescript
   // ✅ Correct
   export default { name: '...' };
   
   // ❌ Wrong
   module.exports = { name: '...' };
   ```

3. **Check for import errors:**
   ```typescript
   // Ensure all imports exist
   import type { GuardianSchema } from 'cerber-core/types';
   ```

### Architect Approval not working

**Problem:** Exception comments don't bypass Guardian.

**Symptoms:**
```typescript
// ARCHITECT_APPROVED: Debug logging - 2026-01-03 - Lead Dev
console.log('test');
// Still blocked by Guardian!
```

**Solutions:**

1. **Use exact format:**
   ```typescript
   // ARCHITECT_APPROVED: [reason] - YYYY-MM-DD - [name]
   console.log('test');
   ```

2. **Place comment immediately before:**
   ```typescript
   // ✅ Correct placement
   // ARCHITECT_APPROVED: Debug logging - 2026-01-03 - Lead
   console.log('test');
   
   // ❌ Wrong (too far away)
   // ARCHITECT_APPROVED: Debug logging - 2026-01-03 - Lead
   
   console.log('test');
   ```

3. **Check approval is enabled in schema:**
   ```typescript
   export default {
     features: {
       architectApprovals: true  // Must be true
     }
   };
   ```

---

## Cerber Issues

### Health endpoint returns 500

**Problem:** `/api/health` fails with error.

**Symptoms:**
```json
{
  "error": "this.checks is not iterable"
}
```

**Solutions:**

1. **Verify Cerber constructor receives array:**
   ```javascript
   // ✅ Correct
   const cerber = new Cerber([
     databaseCheck,
     apiCheck
   ]);
   
   // ❌ Wrong (object instead of array)
   const cerber = new Cerber({
     database: databaseCheck,
     api: apiCheck
   });
   ```

2. **Check check functions return arrays:**
   ```javascript
   const databaseCheck = async (context) => {
     // Must return array of issues
     return []; // Empty = healthy
   };
   ```

3. **Verify import path:**
   ```javascript
   // ✅ Correct
   import { Cerber } from 'cerber-core/cerber';
   
   // ❌ Wrong
   import { Cerber } from 'cerber-core';
   ```

### Health checks time out

**Problem:** `/api/health` takes too long or hangs.

**Solutions:**

1. **Use parallel execution:**
   ```javascript
   const result = await cerber.runChecks({ parallel: true });
   ```

2. **Add timeouts to checks:**
   ```javascript
   const databaseCheck = async (context) => {
     const timeout = new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Timeout')), 5000)
     );
     
     const check = db.query('SELECT 1');
     
     try {
       await Promise.race([check, timeout]);
       return [];
     } catch (err) {
       return [{
         code: 'DB_TIMEOUT',
         severity: 'critical',
         message: 'Database check timed out'
       }];
     }
   };
   ```

3. **Test checks individually:**
   ```bash
   node -e "import('./cerber/health-checks.js').then(m => m.databaseCheck())"
   ```

### Issues not formatted correctly

**Problem:** Cerber doesn't recognize issues.

**Symptoms:**
```
Health Status: healthy
(but you expected unhealthy)
```

**Solutions:**

1. **Verify issue format:**
   ```javascript
   // ✅ Correct format
   return [{
     code: 'DB_DOWN',           // Required
     severity: 'critical',       // Required: 'info'|'warning'|'error'|'critical'
     message: 'Database is down' // Required
   }];
   ```

2. **Check severity levels:**
   - `info`: Status = healthy
   - `warning`: Status = degraded
   - `error` or `critical`: Status = unhealthy

3. **Ensure array return:**
   ```javascript
   // ✅ Correct
   return [issue1, issue2];
   
   // ❌ Wrong
   return issue1; // Not an array
   ```

---

## SOLO Issues

### "scripts/cerber-morning.js not found"

**Problem:** SOLO scripts don't exist in package.

**Solutions:**

1. **Use from node_modules:**
   ```bash
   node node_modules/cerber-core/solo/scripts/cerber-morning.js
   ```

2. **Add to package.json:**
   ```json
   {
     "scripts": {
       "cerber:morning": "node node_modules/cerber-core/solo/scripts/cerber-morning.js",
       "cerber:repair": "node node_modules/cerber-core/solo/scripts/cerber-auto-repair.js"
     }
   }
   ```

3. **Use global install:**
   ```bash
   npm install -g cerber-core
   cerber-morning
   ```

### Auto-repair makes unwanted changes

**Problem:** `cerber-repair` modifies code incorrectly.

**Solutions:**

1. **Use dry-run first:**
   ```bash
   cerber-repair --dry-run
   # Review changes before applying
   ```

2. **Backup before repair:**
   ```bash
   git add .
   git commit -m "Before auto-repair"
   cerber-repair
   ```

3. **Configure repair rules:**
   ```javascript
   // .cerberrc.json
   {
     "autoRepair": {
       "enabled": true,
       "rules": {
         "removeConsole": false,  // Disable specific rules
         "fixImports": true
       }
     }
   }
   ```

---

## TEAM Issues

### "cerber-focus: command not found"

**Problem:** Focus mode CLI doesn't work.

**Solutions:**

1. **Use bash directly:**
   ```bash
   bash node_modules/cerber-core/team/scripts/cerber-focus.sh pricing-engine
   ```

2. **Make executable:**
   ```bash
   chmod +x node_modules/cerber-core/team/scripts/*.sh
   ```

3. **Windows users - use Git Bash:**
   ```bash
   # Install Git Bash first
   "C:\Program Files\Git\bin\bash.exe" node_modules/cerber-core/team/scripts/cerber-focus.sh pricing-engine
   ```

### ".cerber/modules/ not found"

**Problem:** Focus mode can't find module structure.

**Symptoms:**
```
Error: .cerber/modules/pricing-engine not found
```

**Solutions:**

1. **Create .cerber structure:**
   ```bash
   mkdir -p .cerber/modules
   cp -r node_modules/cerber-core/.cerber-example/* .cerber/
   ```

2. **Copy templates:**
   ```bash
   cp node_modules/cerber-core/.cerber-example/BIBLE.md .cerber/
   cp node_modules/cerber-core/.cerber-example/CERBER_LAW.md .cerber/
   ```

3. **Create module manually:**
   ```bash
   mkdir -p .cerber/modules/pricing-engine
   cat > .cerber/modules/pricing-engine/MODULE.md << EOF
   # Pricing Engine Module
   
   ## Purpose
   Calculate product prices
   
   ## Files
   - src/pricing/engine.ts
   - src/pricing/calculator.ts
   EOF
   ```

### FOCUS_CONTEXT.md has 10,000+ lines

**Problem:** Focus context is too large for AI.

**Symptoms:**
```bash
wc -l .cerber/FOCUS_CONTEXT.md
# 15000 lines! 
```

**Solutions:**

1. **Break down module:**
   ```bash
   # Split large module into sub-modules
   cerber-add-module pricing-engine/calculator
   cerber-add-module pricing-engine/discounts
   
   # Focus on sub-module
   cerber-focus pricing-engine/calculator
   ```

2. **Exclude unnecessary files:**
   ```bash
   # Edit .cerber/modules/pricing-engine/MODULE.md
   # Remove test files, mocks, etc.
   ```

3. **Use file patterns:**
   ```markdown
   ## Files
   src/pricing/engine.ts  ✅
   src/pricing/*.test.ts  ❌ (exclude)
   ```

---

## Build & Package Issues

### "dist/ directory not found"

**Problem:** Package missing compiled JavaScript.

**Solutions:**

1. **Build before publish:**
   ```bash
   npm run build
   # Creates dist/ directory
   ```

2. **Verify tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "outDir": "./dist"
     }
   }
   ```

3. **Check .npmignore:**
   ```
   # Should NOT ignore dist/
   src/
   *.ts
   !dist/
   ```

### TypeScript errors on import

**Problem:** Type errors when importing Cerber.

**Symptoms:**
```typescript
import { Guardian } from 'cerber-core/guardian';
// Error: Cannot find type definitions
```

**Solutions:**

1. **Install @types packages:**
   ```bash
   npm install --save-dev @types/node
   ```

2. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true
     }
   }
   ```

3. **Use type imports:**
   ```typescript
   import type { GuardianSchema } from 'cerber-core/types';
   ```

---

## Performance Issues

### Guardian slows down commits

**Problem:** Pre-commit hook takes > 5 seconds.

**Solutions:**

1. **Exclude node_modules:**
   ```typescript
   // FRONTEND_SCHEMA.ts
   export default {
     excludePatterns: [
       'node_modules/**',
       'dist/**',
       'build/**',
       '*.min.js'
     ]
   };
   ```

2. **Limit file scanning:**
   ```typescript
   features: {
     recursiveScan: false,  // Only check staged files
     maxFileSize: 100000    // Skip large files
   }
   ```

3. **Cache results:**
   ```bash
   # Add to pre-commit hook
   node scripts/validate-schema.mjs --cache
   ```

### Health checks use too much CPU

**Problem:** `/api/health` causes high CPU usage.

**Solutions:**

1. **Reduce check frequency:**
   ```javascript
   // Cache results for 30 seconds
   let cachedResult = null;
   let cacheTime = 0;
   
   app.get('/api/health', async (req, res) => {
     const now = Date.now();
     if (cachedResult && now - cacheTime < 30000) {
       return res.json(cachedResult);
     }
     
     cachedResult = await cerber.runChecks();
     cacheTime = now;
     res.json(cachedResult);
   });
   ```

2. **Use parallel execution:**
   ```javascript
   await cerber.runChecks({ parallel: true });
   ```

3. **Disable non-critical checks:**
   ```javascript
   const checks = [
     criticalCheck1,
     criticalCheck2
     // Skip expensive checks in production
   ];
   ```

---

## Getting More Help

### Still stuck?

1. **Check examples:**
   ```bash
   ls node_modules/cerber-core/examples/
   cat node_modules/cerber-core/examples/frontend-schema.ts
   ```

2. **Read documentation:**
   - [README.md](../README.md)
   - [SOLO.md](./SOLO.md)
   - [TEAM.md](./TEAM.md)
   - [USER_JOURNEY.md](../USER_JOURNEY.md)

3. **GitHub Issues:**
   - Report bugs: https://github.com/Agaslez/cerber-core/issues
   - Search existing issues
   - Include error messages and reproduction steps

4. **Community:**
   - Discussions: https://github.com/Agaslez/cerber-core/discussions
   - Twitter: [@cerbercore](https://twitter.com/cerbercore)

### Providing bug reports

Include:

1. **Environment:**
   ```bash
   node --version
   npm --version
   npm list cerber-core
   ```

2. **Error message:**
   ```
   Full error with stack trace
   ```

3. **Reproduction:**
   ```bash
   # Minimal steps to reproduce
   npm install cerber-core
   # ...
   ```

4. **Expected vs Actual:**
   ```
   Expected: Guardian blocks commit
   Actual: Commit succeeds
   ```

---

**Last updated:** January 3, 2026  
**Version:** 1.0.0
