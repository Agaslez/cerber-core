# 💬 Discord Community Setup

## Invite Link
**https://discord.gg/XzGUgxrRnn**

---

## Channel Structure

```
📢 INFORMATION
├─ 📌 welcome (read-only)
├─ 📢 announcements (read-only)
└─ 📋 roadmap (read-only)

💬 COMMUNITY
├─ 💬 general
├─ 🎨 showcase (projects using Cerber)
└─ 💡 feedback (feature requests, ideas)

🆘 SUPPORT
├─ ❓ help (technical questions)
├─ 🐛 bug-reports
└─ 🔧 troubleshooting

🛠️ DEVELOPMENT
└─ 👨‍💻 contributors (for repo contributors)
```

---

## 📌 #welcome Message (Copy/Paste Ready)

```markdown
👋 **Welcome to Cerber Community!**

**Cerber** is a contract-first project guardian for AI-assisted development.

🎯 **What we solve:**
• AI agents delete important files
• Copilot pushes hardcoded secrets  
• Cursor removes "protected" code
• No single source of truth for architecture

💪 **How Cerber works:**
1. You write `CERBER.md` contract (your project rules)
2. Cerber enforces it automatically:
   ✅ Pre-commit hook blocks violations
   ✅ CI validates on every push
   ✅ Optional post-deploy health checks

📊 **Current status (48h since launch):**
• 1,559 downloads/week on npm
• v1.1.10 live (tested and working)
• v1.2.0 stable coming Jan 12 (API freeze)

🔗 **Quick Links:**
• NPM: https://npmjs.com/package/cerber-core
• GitHub: https://github.com/Agaslez/cerber-core
• Docs: https://github.com/Agaslez/cerber-core#readme
• Case Study: https://github.com/Agaslez/cerber-core/blob/main/docs/case-studies/eliksir.md

📝 **How to help:**
• Share your use case in #showcase
• Report bugs in #bug-reports
• Request features in #feedback
• Ask questions in #help

**Let's build AI guardrails together** 🚀
```

---

## 📜 #rules Message (Copy/Paste Ready)

```markdown
📜 **Community Rules**

1️⃣ **Be respectful** - We're all learning
2️⃣ **Stay on topic** - Use appropriate channels
3️⃣ **No spam** - Promotional content only in #showcase
4️⃣ **Help others** - Share your knowledge
5️⃣ **Provide context** - When asking for help, show code/errors
6️⃣ **Search first** - Check #help history before asking

**Zero tolerance for:**
• Harassment or hate speech
• Piracy or illegal content
• Phishing or malware

**Questions?** DM @Stefan
```

---

## 📢 #announcements Launch Message (Copy/Paste Ready)

```markdown
📢 **Cerber Community Launch - January 5, 2026**

Hey everyone! 👋

This Discord just went live. Here's where we are and where we're going.

---

## ✅ What Works (Tested Today)

We ran a fresh install test as a new user:
• `npm i -D cerber-core` → ✅ Installs perfectly
• `npx cerber init` → ✅ Generates CERBER.md template
• `npx cerber init` (2nd time) → ✅ Creates hooks/workflows/scripts
• `npx cerber doctor` → ✅ Validates setup (exit code 0)
• Pre-commit guardian → ✅ Blocks violations

**The tool works. It's production-ready.**

---

## 🏆 Proof: Used in Production

Cerber protects real SaaS applications right now:

**Eliksir Frontend CI:**
https://github.com/Agaslez/Eiksir-front-dashboard/actions/runs/20668597387
• Guardian Schema Check ✅
• Linting ✅
• Tests ✅
• Cerber validation ✅

**Eliksir Backend CI:**
https://github.com/Agaslez/Eliksir-Backend-front-dashboard/actions/runs/20664365046
• Quality Gate ✅
• Deploy checks ✅
• Cerber integrity ✅

These aren't demo projects - **live production systems serving real users**.

📖 Full case study: [How Cerber prevented 47 production bugs](https://github.com/Agaslez/cerber-core/blob/main/docs/case-studies/eliksir.md)

---

## 📈 Early Traction (48 Hours)

• **1,559 downloads/week** on npm
• **17 versions** (fast iteration based on feedback)
• **0 critical bugs** in core functionality
• **Real production usage** at Eliksir SaaS

---

## 🎯 What's Next (Jan 6-12)

**v1.2.0 - API Stability Commitment:**
• API freeze → no breaking changes until v2.0.0
• Semantic versioning strictly followed
• 5+ showcase projects documented
• Stability over features

**Your role:**
1. **Try it** - Install and report what breaks
2. **Share** - Post your project in #showcase
3. **Request** - What guardrails do YOU need? (#feedback)

---

## 💬 Why This Community Matters

Cerber exists because AI tools break projects. But **which violations matter most?**

Your feedback shapes:
• What patterns to forbid
• What files to protect
• What health checks to run
• What features to build next

**Be brutally honest.** This is 48h old and I want to get it right.

Drop your thoughts below 👇

— Stefan (creator)
```

---

## 🗺️ #roadmap Message (Copy/Paste Ready)

```markdown
🗺️ **Cerber Roadmap**

**v1.2.0 - API Stability (Jan 12, 2026)** 🔒
• API freeze commitment (no breaking changes until v2.0.0)
• Semantic versioning strictly followed
• Discord community established
• 5+ showcase projects documented
• **Priority: Stability over features**

**v1.3.0 - Enhanced Validation (Feb 2026)** 🛡️
• Custom validator plugins
• Better error messages
• File dependency tracking
• Performance improvements

**v2.0.0 - Team Features (Q2 2026)** 👥
• Multi-module support
• CODEOWNERS integration
• Team workflows
• Advanced CI/CD gates

**Future Ideas (Your input needed):** 💡
• VS Code extension (Guardian in editor)
• Real-time validation (watch mode)
• AI contract generator (roadmap → CERBER.md)
• Slack/Discord notifications
• GitLab/Bitbucket support

**Vote on priorities in #feedback!**

---

Last updated: Jan 5, 2026
```

---

## Badge for README

Add this to top of README.md:

```markdown
[![Discord](https://img.shields.io/discord/DISCORD_SERVER_ID?label=discord&logo=discord&logoColor=white)](https://discord.gg/XzGUgxrRnn)
```

Replace `DISCORD_SERVER_ID` with your actual server ID from Discord settings.

---

## First User Onboarding Template

When someone joins, ping them in #general:

```markdown
👋 Welcome @username!

Quick start:
1. Check #welcome for intro
2. Try Cerber: `npm i -D cerber-core && npx cerber init`
3. Read case study: https://github.com/Agaslez/cerber-core/blob/main/docs/case-studies/eliksir.md
4. Share your project in #showcase (even WIP!)
5. Ask anything in #help

What brought you here? 🤔
```

---

## Daily Engagement (10-15 min)

✅ Respond to #help questions (< 2h response time)
✅ React with emoji to posts (shows you're reading)
✅ Pin valuable feedback in #feedback
✅ Showcase users' projects (repost in #announcements)
✅ Update #roadmap weekly

---

**Discord is your retention engine. Use it.** 🚀
