#!/bin/bash
# Configure GitHub branch protection on main branch
# Usage: bash scripts/setup-branch-protection.sh <owner> <repo>

set -e

OWNER="${1:-Agaslez}"
REPO="${2:-cerber-core}"
FULL_REPO="$OWNER/$REPO"

echo "🛡️  BRANCH PROTECTION SETUP"
echo "=================================="
echo "Repository: $FULL_REPO"
echo "Branch: main"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ gh CLI not found. Install from: https://github.com/cli/cli"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ gh CLI not authenticated. Run: gh auth login"
    exit 1
fi

echo "✅ gh CLI authenticated"
echo ""

# 1. Set required status checks
echo "1️⃣  Setting required status checks..."
gh api repos/$FULL_REPO/branches/main/protection/required_status_checks \
  -X PATCH \
  -f strict:=true \
  -f contexts:='["lint_and_typecheck","build_and_test"]' \
  --silent

echo "   ✅ Required checks: lint_and_typecheck, build_and_test"
echo ""

# 2. Require code owner reviews
echo "2️⃣  Requiring code owner reviews..."
gh api repos/$FULL_REPO/branches/main/protection/required_pull_request_reviews \
  -X PATCH \
  -f required_approving_review_count:=1 \
  -f require_code_owner_reviews:=true \
  -f dismiss_stale_reviews:=false \
  -f require_last_push_approval:=true \
  --silent

echo "   ✅ Code owner review: REQUIRED"
echo "   ✅ Dismiss stale reviews: NO (strict)"
echo "   ✅ Require approval of recent push: YES (new push clears approvals)"
echo ""

# 3. Enforce push restrictions
echo "3️⃣  Enforcing push restrictions..."
gh api repos/$FULL_REPO/branches/main/protection \
  -X PATCH \
  -f allow_force_pushes:=false \
  -f allow_deletions:=false \
  -f restrict_who_can_push_to_matching_branches:=true \
  --silent

echo "   ✅ Force pushes: BLOCKED"
echo "   ✅ Branch deletion: BLOCKED"
echo "   ✅ Direct pushes: RESTRICTED (PR only)"
echo ""

# 4. Enforce rules on admins
echo "4️⃣  Enforcing rules on admins..."
gh api repos/$FULL_REPO/branches/main/protection \
  -X PATCH \
  -f enforce_admins:=true \
  --silent

echo "   ✅ Rules apply to: ALL (including admins)"
echo ""

# 5. Verify configuration
echo "5️⃣  Verifying configuration..."
echo ""

echo "Required Status Checks:"
gh api repos/$FULL_REPO/branches/main/protection/required_status_checks \
  --jq '.contexts | join(", ")'

echo ""
echo "Required Pull Request Reviews:"
gh api repos/$FULL_REPO/branches/main/protection/required_pull_request_reviews \
  --jq '{require_code_owner: .require_code_owner_reviews, require_recent_approval: .require_last_push_approval, dismiss_stale: .dismiss_stale_reviews}'

echo ""
echo "Push Restrictions:"
gh api repos/$FULL_REPO/branches/main/protection \
  --jq '{allow_force_pushes, allow_deletions, enforce_admins}'

echo ""
echo "═".repeat(50)
echo "✅ BRANCH PROTECTION CONFIGURED SUCCESSFULLY"
echo "═".repeat(50)
echo ""
echo "Summary:"
echo "  • Required: code owner (@owner) approval"
echo "  • Required: status checks pass (lint, build)"
echo "  • New pushes clear approvals (strict mode)"
echo "  • No direct commits to main (PR only)"
echo "  • No force pushes allowed"
echo ""
echo "Testing:"
echo "  1. Create PR with protected file change"
echo "  2. Verify tamper gate job runs"
echo "  3. Verify PR shows 'Needs review from @owner'"
echo "  4. Code owner approves"
echo "  5. Status checks pass"
echo "  6. Merge is now allowed"
echo ""
