# 📸 Screenshot Guide - CI Runs Evidence

## Overview

Add visual proof of Cerber protecting production applications. This makes the case study and README more credible.

---

## 🎯 Screenshots Needed

### 1. Frontend CI Run
**Source:** https://github.com/Agaslez/Eiksir-front-dashboard/actions/runs/20668597387

**What to capture:**
- Full workflow run page
- Expand "Cerber CI" job (or similar)
- Show all green checkmarks ✅
- Visible steps:
  - Guardian Schema Check
  - Linting
  - Tests
  - Cerber validation
- Exit code 0

**Save as:** `docs/proof/ci-frontend.png`

---

### 2. Backend CI Run
**Source:** https://github.com/Agaslez/Eliksir-Backend-front-dashboard/actions/runs/20664365046

**What to capture:**
- Full workflow run page
- Expand "Cerber CI" job (or similar)
- Show all green checkmarks ✅
- Visible steps:
  - Quality Gate
  - Deploy checks
  - Cerber integrity
- Exit code 0

**Save as:** `docs/proof/ci-backend.png`

---

## 📋 Step-by-Step Instructions

### Option A: Browser Screenshot (Recommended)

**For Frontend:**
1. Open: https://github.com/Agaslez/Eiksir-front-dashboard/actions/runs/20668597387
2. Wait for page to load completely
3. Expand the "Cerber CI" or main job section
4. Use browser screenshot tool:
   - **Windows:** `Win + Shift + S` (Snipping Tool)
   - **Mac:** `Cmd + Shift + 4`
   - **Chrome:** `Ctrl + Shift + P` → "Capture full size screenshot"
5. Capture from header down to all green checks
6. Save as `ci-frontend.png`
7. Copy to: `D:\REP\eliksir-website.tar\cerber-core-github\docs\proof\ci-frontend.png`

**For Backend:**
1. Open: https://github.com/Agaslez/Eliksir-Backend-front-dashboard/actions/runs/20664365046
2. Repeat steps 2-7 above
3. Save as `ci-backend.png`

---

### Option B: GitHub CLI (If Screenshots Fail)

If visual screenshots aren't working, embed text logs:

```bash
# Frontend
gh api repos/Agaslez/Eiksir-front-dashboard/actions/runs/20668597387 > docs/proof/frontend-run.json

# Backend
gh api repos/Agaslez/Eliksir-Backend-front-dashboard/actions/runs/20664365046 > docs/proof/backend-run.json
```

Then reference JSON in docs.

---

## 🎨 Screenshot Best Practices

**Quality:**
- Resolution: At least 1920x1080
- Format: PNG (not JPG - keeps text sharp)
- Size: < 500 KB (optimize if needed)

**Content:**
- Include GitHub header (shows it's real repo)
- Show timestamp (proves it's recent)
- Expand relevant job sections
- Capture all green checkmarks ✅
- Show "Conclusion: Success" or similar

**What to avoid:**
- Cutting off important info
- Too much whitespace
- Personal info visible (if any)
- Failed runs (we want success examples)

---

## 📝 After Adding Screenshots

Update these files to reference them:

### 1. README.md
```markdown
## 🏆 Proof: Used in Production

![Frontend CI](docs/proof/ci-frontend.png)
![Backend CI](docs/proof/ci-backend.png)
```

### 2. docs/case-studies/eliksir.md
```markdown
## Evidence (Live CI Runs)

**Frontend Pipeline:**
![Cerber protecting frontend](../proof/ci-frontend.png)
[View full run →](https://github.com/Agaslez/Eiksir-front-dashboard/actions/runs/20668597387)
```

---

## ✅ Verification

Before committing, check:
- [ ] Files exist in `docs/proof/`
- [ ] PNG format
- [ ] Size < 500 KB each
- [ ] Text is readable at 100% zoom
- [ ] Green checkmarks visible ✅
- [ ] GitHub header shown

---

## 🚀 Commit Command

```bash
git add docs/proof/*.png
git commit -m "docs: add CI run screenshots as proof

- Frontend CI: Cerber validation + tests
- Backend CI: Quality gate + deploy checks
- Visual evidence for case study and README"
git push
```

---

**Why This Matters:**
- Visual proof > text descriptions
- Screenshots = social proof
- Makes case study immediately credible
- Shows Cerber in real production context

---

*Need help? Check the links work first, then capture the screenshots. If GitHub Actions pages change layout, update this guide.*
