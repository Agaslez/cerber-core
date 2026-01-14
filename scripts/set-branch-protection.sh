#!/usr/bin/env bash
# Configure branch protection for main with PR FAST as the single required check.
# Usage: bash scripts/set-branch-protection.sh [owner/repo]

set -euo pipefail

REPO=${1:-Agaslez/cerber-core}
BRANCH=main
REQUIRED_CHECKS='["PR FAST (required)"]'

cat <<EOF
Applying branch protection to ${REPO}:${BRANCH}
- Require PR before merge
- Require Code Owner review
- Invalidate old approvals on new push
- Restrict direct pushes to main
- Require status checks: ${REQUIRED_CHECKS}
EOF

gh api \
  repos/${REPO}/branches/${BRANCH}/protection \
  -X PUT \
  -f required_status_checks.strict:=true \
  -f required_status_checks.contexts:=${REQUIRED_CHECKS} \
  -f enforce_admins:=true \
  -f required_pull_request_reviews.dismiss_stale_reviews:=true \
  -f required_pull_request_reviews.require_code_owner_reviews:=true \
  -f required_pull_request_reviews.required_approving_review_count:=1 \
  -f required_pull_request_reviews.require_last_push_approval:=true \
  -f restrictions:=null \
  -f allow_force_pushes:=false \
  -f allow_deletions:=false

echo "\n✅ Branch protection applied."
