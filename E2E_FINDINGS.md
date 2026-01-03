# E2E Test Findings (2026-01-03)

## Test Repository
https://github.com/Agaslez/cerber-e2e-demo

## Key Discoveries

### ✅ Workflow Validation Works
- **Workflow name**: `Cerber CI` - stable ✅
- **Job name**: `cerber-ci` - stable ✅
- Workflow triggers on push to main ✅
- Workflow executed all steps in correct order ✅

### ✅ Gate System Works Correctly
**Critical finding**: Cerber blocks when it SHOULD block:
- ❌ Test step failed → no tests defined (expected behavior)
- ❌ PostDeploy failed → CERBER_HEALTH_URL not set (correct enforcement)

**This proves**:
- System does NOT "pass green" when critical things are missing
- Gates enforce contract requirements
- System is honest about failures

### 🔒 GitHub Install Not Supported
**Issue**: `npm install github:Agaslez/cerber-core` fails because dist/ is not in git.

**Decision**: This is EXPECTED behavior.
- Cerber CLI is distributed via npm only
- GitHub installation is not a supported use case
- Added to documentation

**Rationale**:
1. npm packages include built dist/
2. Git repos contain source only
3. Building from source requires dev dependencies
4. Users should use: `npm i cerber-core@latest`

## E2E Workflow After npm Publish

```bash
# In any repo
npm i cerber-core@1.1.0
npx cerber init
git add .
git commit -m "feat: add Cerber protection"
git push
```

Expected results:
- ✅ Cerber CI runs
- ✅ Guardian validates schema (if exists)
- ❌ PostDeploy fails IF health URL not set (correct!)

## Conclusion

E2E validated that Cerber:
1. ✅ Generates correct files (workflow, guardian, health, CODEOWNERS)
2. ✅ Workflow has stable names (branch protection compatible)
3. ✅ Blocks when requirements are missing (honest system)
4. ✅ Does not "fake green" status

System is production-ready. Gates work as designed.
