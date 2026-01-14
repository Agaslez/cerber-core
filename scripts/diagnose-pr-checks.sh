#!/bin/bash
# Diagnostic script to check PR #62 required checks against workflow jobs
# Usage: bash scripts/diagnose-pr-checks.sh

set -e

REPO="${1:-Agaslez/cerber-core}"
PR_NUMBER="${2:-62}"

echo "🔍 DIAGNOSTIC: PR #${PR_NUMBER} on ${REPO}"
echo "=================================="

# 1. Get PR status checks
echo ""
echo "1️⃣  Fetching PR #${PR_NUMBER} status checks..."
if command -v gh &> /dev/null; then
    echo "✅ gh CLI available"
    
    # Get the actual status checks from PR
    echo ""
    echo "📋 Required Status Checks on PR:"
    gh pr view $PR_NUMBER --json statusCheckRollup --repo $REPO 2>/dev/null | jq '.statusCheckRollup[] | {name: .context, state: .state}' || echo "⚠️  Could not fetch (need gh login)"
    
    # Get latest workflow runs
    echo ""
    echo "🔄 Latest 10 workflow runs on rcx-hardening:"
    gh run list --branch rcx-hardening -L 10 --repo $REPO 2>/dev/null | head -15 || echo "⚠️  Could not fetch runs"
else
    echo "❌ gh CLI not available. Install from: https://github.com/cli/cli"
    exit 1
fi

# 2. Check workflow files
echo ""
echo "2️⃣  Analyzing workflow jobs..."
echo "📁 Checking .github/workflows/ for job definitions:"

if [ -d ".github/workflows" ]; then
    for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
        if [ -f "$workflow" ]; then
            echo ""
            echo "📄 File: $(basename $workflow)"
            # Extract job names
            grep -E "^\s+[a-zA-Z0-9_-]+:\s*$" "$workflow" | sed 's/:$//' | sed 's/^/   └─ Job: /' || true
        fi
    done
else
    echo "❌ .github/workflows directory not found"
fi

# 3. Expected vs Actual
echo ""
echo "3️⃣  Expected Required Checks (from contract):"
echo "   └─ lint_and_typecheck (PR-fast)"
echo "   └─ build_and_test (PR-fast)"
echo "   └─ cerber-integrity (NEW - checks protected files)"
echo ""
echo "4️⃣  To apply this diagnostic to GitHub PR:"
cat << 'EOF'
  
  # 1. Fetch current checks:
  gh pr view 62 --json statusCheckRollup --repo Agaslez/cerber-core
  
  # 2. List all branch protection rules:
  gh api repos/Agaslez/cerber-core/branches/main/protection/required_status_checks
  
  # 3. If ghost checks found, remove them:
  gh api repos/Agaslez/cerber-core/branches/main/protection/required_status_checks \
    -X PATCH \
    -f required:true \
    -f contexts:='["lint_and_typecheck","build_and_test","cerber-integrity"]'
  
  # 4. Rerun failed checks:
  gh run rerun <RUN_ID> --failed --repo Agaslez/cerber-core

EOF

echo ""
echo "✅ Diagnostic complete. Check output above for mismatches."
