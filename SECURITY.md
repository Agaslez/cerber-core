# Security Policy

## Supported Versions

Currently supported versions of Cerber Core with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**⚠️ DO NOT create public issues for security vulnerabilities.**

If you discover a security vulnerability in Cerber Core, please report it responsibly:

### How to Report

**Email:** st.pitek@gmail.com

**Subject:** `[SECURITY] Cerber Core - [Brief Description]`

**Include:**
1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** (who is affected, what data is at risk)
4. **Affected versions** (e.g., 1.0.0, 1.0.1)
5. **Suggested fix** (if you have one)
6. **Your contact information** (for follow-up)

### What to Expect

- **Acknowledgment:** Within 24-48 hours
- **Initial Assessment:** Within 7 days
- **Fix Timeline:** 7-14 days (depending on severity)
- **Public Disclosure:** After fix is released and users have had time to update

### Severity Levels

We use the following severity classifications:

- **Critical:** Immediate risk of data breach, RCE, or complete system compromise
- **High:** Significant security risk affecting many users
- **Medium:** Moderate security risk with limited impact
- **Low:** Minor security issue or best practice violation

## Security Best Practices

### For Users

When using Cerber Core in your projects:

#### 1. Never Commit Secrets to Schemas

```typescript
// ❌ BAD - Hardcoded API key
const schema = {
  name: 'Backend',
  apiKey: 'sk_live_abc123def456'  // NEVER DO THIS!
};

// ✅ GOOD - Use environment variables
const schema = {
  name: 'Backend',
  apiKey: process.env.API_KEY
};
```

#### 2. Use Environment Variables

```bash
# .env (keep in .gitignore!)
API_KEY=sk_live_abc123def456
DATABASE_URL=postgresql://localhost:5432/mydb

# .env.example (commit this for documentation)
API_KEY=your_api_key_here
DATABASE_URL=your_database_url_here
```

#### 3. Keep .gitignore Updated

Ensure your `.gitignore` includes:
```
.env
.env.*
*.key
*.pem
secrets/
credentials.json
```

#### 4. Update Regularly

```bash
# Check for updates
npm outdated

# Update Cerber Core
npm update cerber-core

# Check for security vulnerabilities
npm audit
npm audit fix
```

#### 5. Enable Security Features

```bash
# Enable Dependabot (GitHub)
# Settings → Security & analysis → Dependabot alerts

# Enable npm audit in CI/CD
npm audit --audit-level=moderate
```

### For Contributors

When contributing to Cerber Core:

#### 1. Code Review

- All PRs require review before merge
- Security-sensitive changes require 2+ reviews
- Never merge your own PRs

#### 2. Dependency Updates

- Review dependency changes carefully
- Check for known vulnerabilities: `npm audit`
- Prefer well-maintained, popular packages
- Verify package authenticity (typosquatting)

#### 3. Input Validation

```typescript
// ✅ GOOD - Validate user input
function validateSchema(schema: unknown): GuardianSchema {
  if (!schema || typeof schema !== 'object') {
    throw new Error('Invalid schema');
  }
  // ... more validation
}

// ❌ BAD - Trust user input
function validateSchema(schema: any) {
  return schema; // No validation!
}
```

#### 4. Avoid Dangerous Patterns

```typescript
// ❌ DANGEROUS
eval(userInput);
new Function(userInput)();
child_process.exec(userInput);

// ✅ SAFE
// Use safe alternatives or strict validation
```

## Known Security Considerations

### Guardian (Pre-Commit Validator)

**Data Flow:**
- ✅ Runs locally on developer's machine
- ✅ Does NOT send code to external services
- ✅ Does NOT make network requests
- ✅ Safe for proprietary/confidential codebases

**Limitations:**
- ⚠️ Can be bypassed with `git commit --no-verify`
- ⚠️ Relies on local .git hooks (not server-side)
- ⚠️ Architect approvals are comments (not cryptographic)

**Recommendations:**
- Enforce Guardian in CI/CD pipeline (server-side validation)
- Use signed commits for critical projects
- Regularly audit architect approvals

### Cerber (Runtime Health Monitoring)

**Data Flow:**
- ✅ Runs on your server/infrastructure
- ✅ No external API calls (unless you add them in health checks)
- ✅ Your data stays on your infrastructure
- ✅ Health check results are internal (not sent externally)

**Limitations:**
- ⚠️ Health checks run with application privileges
- ⚠️ Diagnostic data may contain sensitive information
- ⚠️ /api/health endpoint exposes system status

**Recommendations:**
```typescript
// Secure health endpoint
app.get('/api/health', authenticateRequest, async (req, res) => {
  const result = await cerber.runChecks();
  
  // Filter sensitive data before responding
  const sanitized = {
    status: result.status,
    // Omit diagnostics in production
    issues: result.issues.map(i => ({
      code: i.code,
      severity: i.severity
      // Remove: diagnostics, rootCause (may contain paths/secrets)
    }))
  };
  
  res.json(sanitized);
});
```

### SOLO (Automation Scripts)

**Data Flow:**
- ✅ Runs locally on developer's machine
- ✅ No telemetry or usage tracking
- ✅ No external network requests
- ✅ Open source (audit yourself)

**Limitations:**
- ⚠️ Bash scripts execute with user privileges
- ⚠️ Auto-repair can modify code (use --dry-run first)

**Recommendations:**
- Review scripts before running: `cat node_modules/cerber-core/solo/scripts/cerber-auto-repair.js`
- Use `--dry-run` before applying changes
- Backup code before auto-repair: `git commit -m "Before auto-repair"`

### TEAM (Focus Mode)

**Data Flow:**
- ✅ Generates context files locally
- ✅ No external API calls
- ✅ .cerber/ directory is git-ignored by default

**Limitations:**
- ⚠️ FOCUS_CONTEXT.md may contain sensitive code
- ⚠️ Module boundaries rely on developer discipline

**Recommendations:**
- Add `.cerber/` to `.gitignore`
- Review FOCUS_CONTEXT.md before sharing with AI
- Use module boundaries to limit context exposure

## Security Audits

Cerber Core has undergone the following security reviews:

- **Internal Audit:** January 2026 - Stefan Pitek
- **Community Review:** Open for security researchers

Want to help? Review the code and report findings to st.pitek@gmail.com

## Compliance

### GDPR (EU)
- ✅ No personal data collection
- ✅ No tracking or analytics
- ✅ No cookies or external requests

### SOC 2
- ✅ Open source (auditable)
- ✅ No data storage
- ✅ Local execution only

### HIPAA / PCI-DSS
- ⚠️ Cerber Core itself is compliant (no data handling)
- ⚠️ Your health checks may access sensitive data - implement appropriate controls

## Hall of Fame

Security researchers who have responsibly disclosed vulnerabilities:

**2026:**
- *Become the first!*

We appreciate responsible disclosure and will credit researchers (with permission) who help improve Cerber Core's security.

## Contact

**Security Issues:** st.pitek@gmail.com  
**General Issues:** https://github.com/Agaslez/cerber-core/issues  
**GitHub:** [@Agaslez](https://github.com/Agaslez)

---

**Last Updated:** January 3, 2026  
**Version:** 1.0.0
