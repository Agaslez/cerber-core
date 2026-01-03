# GitHub Repository Setup Checklist

Complete this checklist after pushing security changes to GitHub.

## ✅ COMPLETED (Automated)

- [x] `.gitignore` enhanced (secrets, credentials, OS files)
- [x] `SECURITY.md` created (vulnerability reporting, best practices)
- [x] `.github/workflows/security.yml` (npm audit, secret scanning)
- [x] `.github/workflows/codeql.yml` (code analysis)
- [x] `.github/dependabot.yml` (automated dependency updates)
- [x] `.github/FUNDING.yml` (sponsorship configuration)
- [x] README sponsor section added
- [x] Git history checked (no secrets found ✅)
- [x] All changes committed and pushed

## 📋 MANUAL SETUP REQUIRED

### 1. Enable Branch Protection (5 minutes) ⭐ CRITICAL

**Go to:** https://github.com/Agaslez/cerber-core/settings/branches

**Click:** "Add rule" or "Add branch protection rule"

**Configuration:**
```
Branch name pattern: main

☑️ Require a pull request before merging
   ☑️ Require approvals: 1
   ☑️ Dismiss stale pull request approvals when new commits are pushed
   
☑️ Require status checks to pass before merging
   ☑️ Require branches to be up to date before merging
   Status checks (add after first workflow run):
     - security-audit
     - build-test
     - analyze / Analyze Code (javascript)
     
☑️ Require conversation resolution before merging

☑️ Require linear history

☑️ Do not allow bypassing the above settings
   ☑️ Include administrators

☑️ Restrict who can push to matching branches
   Add: Agaslez (your username)
```

**Click:** "Create" or "Save changes"

**Why:** Prevents accidental force-push, requires PR reviews, enforces clean history.

---

### 2. Enable Security Features (3 minutes) ⭐ CRITICAL

**Go to:** https://github.com/Agaslez/cerber-core/settings/security_analysis

**Enable ALL of these:**

```
☑️ Dependency graph (should already be on)
☑️ Dependabot alerts
☑️ Dependabot security updates
☑️ Code scanning (CodeQL analysis)
☑️ Secret scanning
☑️ Secret scanning push protection (prevents commits with secrets)
```

**Click:** "Enable" for each one.

**Why:** Automatic vulnerability detection, prevents secret leaks, analyzes code quality.

---

### 3. Configure Repository Settings (2 minutes)

**Go to:** https://github.com/Agaslez/cerber-core/settings

**General Settings:**

**Features:**
```
☑️ Issues (enabled)
☑️ Discussions (optional - for community Q&A)
☐ Wikis (disabled - use docs/ folder instead)
☐ Projects (disabled unless you use them)
☑️ Preserve this repository (enabled for GitHub Archive Program)
```

**Pull Requests:**
```
☐ Allow merge commits (disabled)
☑️ Allow squash merging (enabled)
☐ Allow rebase merging (disabled)
☑️ Always suggest updating pull request branches
☑️ Automatically delete head branches
```

**Archives:**
```
☑️ Include Git LFS objects in archives
```

**Click:** "Save" at bottom.

---

### 4. Add Repository Topics (1 minute)

**Go to:** https://github.com/Agaslez/cerber-core

**Click:** "⚙️" next to "About" (top right)

**Add topics:**
```
typescript
nodejs
code-quality
pre-commit
health-checks
architecture
guardian
cerber
focus-mode
ai-development
module-boundaries
```

**Website:** Leave empty for now (add when you create cerber.dev)

**Description:** 
```
Module boundaries, focus contexts, and health monitoring for Node.js in the AI era
```

**Click:** "Save changes"

---

### 5. Setup GitHub Sponsors (30 minutes) ⭐ PRIORITY

**Go to:** https://github.com/sponsors

**Click:** "Set up GitHub Sponsors" or "Join the waitlist"

**Profile Setup:**

**Public profile:**
```
Display name: Stefan Pitek
Short bio: Creator of Cerber Core - Code quality guardian for Node.js
Location: Poland (or your location)
Organization: (leave empty unless you have one)
```

**Profile details:**
```
Headline: Building Cerber Core - Architecture enforcement & AI-optimized development tools

Introduction:
Hi! I'm Stefan, creator of Cerber Core - a comprehensive toolkit for 
maintaining code quality and architecture in growing Node.js projects.

Cerber Core helps teams:
- ✅ Enforce architecture rules with Guardian (pre-commit)
- ✅ Monitor runtime health with Cerber 
- ✅ Work 10x faster with AI using Focus Mode (500 LOC vs 10K)
- ✅ Automate code quality with SOLO scripts

Your sponsorship helps:
- Keep the project actively maintained
- Fund new features and integrations  
- Provide faster support to the community
- Create tutorials and documentation

Every sponsor makes a difference - thank you! 💙
```

**Sponsorship tiers:**

**Tier 1: $5/month - ☕ Coffee Supporter**
```
Title: Coffee Supporter
Description: 
Buy me a coffee and keep Cerber Core development going!

What you get:
- Sponsor badge on your profile
- Access to sponsor-only discussions
- My eternal gratitude ☕
```

**Tier 2: $25/month - 🥉 Bronze Sponsor**
```
Title: Bronze Sponsor
Description:
Support ongoing development and get priority attention.

What you get:
- Everything from Coffee tier
- Small logo in README
- Priority support (24h response time)
- Vote on feature requests
```

**Tier 3: $100/month - 🥈 Silver Sponsor**
```
Title: Silver Sponsor
Description:
Serious support for serious projects.

What you get:
- Everything from Bronze tier
- Medium logo in README (prominent placement)
- Priority support (12h response time)
- Monthly 30-minute consultation call
- Early access to new features
```

**Tier 4: $500/month - 🥇 Gold Sponsor**
```
Title: Gold Sponsor
Description:
Premium sponsorship with hands-on support.

What you get:
- Everything from Silver tier
- Large logo in README (top position)
- Priority support (4h response time)
- Monthly 1-hour consultation call
- Custom feature requests considered
- Your use case in documentation
```

**Tier 5: $2,500/month - 💎 Platinum Sponsor**
```
Title: Platinum Sponsor
Description:
Enterprise-level partnership and support.

What you get:
- Everything from Gold tier
- Logo on project website (when created)
- Dedicated support channel (Discord/Slack)
- Weekly strategic calls
- Custom integrations and features
- Your company featured in case studies
- Private training sessions for your team
```

**Payment setup:**
```
☑️ Connect Stripe (recommended)
☐ Connect PayPal (alternative)
```

**Bank account:** Set up payout account (Stripe or bank transfer)

**Tax information:** 
- W-9 form (if US)
- W-8BEN form (if non-US)
- Consult with tax advisor for your country

**Click:** "Submit for review"

**Wait:** 1-2 days for GitHub approval

---

### 6. Create Buy Me A Coffee Account (10 minutes)

**Go to:** https://www.buymeacoffee.com/signup

**Setup:**
```
Username: stefanpitek (or cerbercore if available)
Display name: Stefan Pitek / Cerber Core
Email: st.pitek@gmail.com
Profile description: 
  Creator of Cerber Core - architecture enforcement & 
  health monitoring for Node.js projects
```

**Customization:**
```
Coffee price: $5 (default)
☑️ Allow supporters to choose amount
☑️ Show supporter names publicly (optional)
```

**Payment:**
```
Connect Stripe or PayPal for payments
```

**Profile image:** Upload Cerber logo or professional photo

**Get widget code** → Copy HTML embed code

**Update FUNDING.yml:**
```yaml
# Uncomment this line in .github/FUNDING.yml:
custom: ['https://www.buymeacoffee.com/stefanpitek']
```

**Commit change:**
```bash
cd cerber-core-github
git add .github/FUNDING.yml
git commit -m "chore: Enable Buy Me A Coffee in funding options"
git push origin main
```

---

### 7. Verify Everything Works (5 minutes)

**Check GitHub Actions:**

Go to: https://github.com/Agaslez/cerber-core/actions

You should see:
- ✅ Security Checks workflow (runs on push/schedule)
- ✅ CodeQL Analysis workflow (runs on push/schedule)

**Check Dependabot:**

Go to: https://github.com/Agaslez/cerber-core/network/updates

You should see:
- ✅ Dependabot enabled
- Dependabot will create PRs for outdated dependencies

**Check Sponsor Button:**

Go to: https://github.com/Agaslez/cerber-core

You should see:
- ❤️ "Sponsor" button (top right, next to "Star")
- Clicking it shows GitHub Sponsors option

**Test Security Scanning:**

Create a test branch with a fake secret:
```bash
git checkout -b test-security
echo "password = 'fake123'" >> test-secret.txt
git add test-secret.txt
git commit -m "test: Check secret scanning"
git push origin test-security
```

Go to: https://github.com/Agaslez/cerber-core/security/secret-scanning

You should see alert about potential secret!

**Delete test branch:**
```bash
git checkout main
git branch -D test-security
git push origin --delete test-security
```

---

## 🎯 PRIORITY ORDER

### DO NOW (Before npm publish):
```
1. ✅ Enable branch protection (5 min) ⭐ CRITICAL
2. ✅ Enable security features (3 min) ⭐ CRITICAL
3. ✅ Configure repository settings (2 min)
4. ✅ Add repository topics (1 min)
```
**Total: 11 minutes**

### DO AFTER npm publish:
```
5. ✅ Setup GitHub Sponsors (30 min) ⭐ HIGH PRIORITY
6. ✅ Create Buy Me A Coffee (10 min)
7. ✅ Verify everything works (5 min)
```
**Total: 45 minutes**

---

## 📧 Contact for Help

If you encounter issues during setup:

**Email:** st.pitek@gmail.com

**Include:**
- Which step you're on
- Screenshot of error (if any)
- Your GitHub username

---

## ✅ Completion Checklist

Print this and check off as you complete:

```
[ ] 1. Branch protection enabled
[ ] 2. Secret scanning enabled
[ ] 3. Dependabot enabled
[ ] 4. CodeQL analysis enabled
[ ] 5. Repository settings configured
[ ] 6. Topics added
[ ] 7. GitHub Sponsors submitted for review
[ ] 8. Buy Me A Coffee account created
[ ] 9. FUNDING.yml updated with Buy Me A Coffee link
[ ] 10. All workflows running successfully
[ ] 11. Sponsor button visible on repo
```

**When all checked:** 🎉 Your repository is secure and ready for sponsors!

---

**Last Updated:** January 3, 2026  
**Repository:** https://github.com/Agaslez/cerber-core
