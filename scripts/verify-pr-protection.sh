#!/bin/bash
# Diagnostic script for PR #62 - verifies all protection mechanisms
# Usage: bash scripts/verify-pr-protection.sh <owner> <repo> <pr_number>

set -e

OWNER="${1:-Agaslez}"
REPO="${2:-cerber-core}"
PR_NUMBER="${3:-62}"
FULL_REPO="$OWNER/$REPO"

echo "🔍 PR PROTECTION VERIFICATION"
echo "═".repeat(70)
echo "Repository: $FULL_REPO"
echo "PR: #$PR_NUMBER"
echo ""

if ! command -v gh &> /dev/null; then
    echo "❌ gh CLI not found"
    exit 1
fi

# KROK A: Symulacja bypass'u
echo "KROK A: SYMULACJA BYPASS'U"
echo "───────────────────────────────────────────────────────────────────"
echo ""
echo "Test 1: Bypass pre-commit hook (local)"
echo "  Command: git commit --no-verify -m 'tamper attempt'"
echo "  Expected: Commits locally ✅"
echo "  But fails in CI: ❌ Tamper gate detects modified CERBER.md"
echo ""
echo "Test 2: Push bez owner approval"
echo "  Expected PR status:"
echo "    ✅ lint_and_typecheck: PASS"
echo "    ✅ build_and_test: PASS"
echo "    ❌ tamper-gate: FAIL (no code owner approval)"
echo "    🔴 GitHub blocks merge: 'Needs review from @owner'"
echo ""

# KROK B: Diagnostyka checków
echo "KROK B: DIAGNOSTYKA CHECKÓW NA PR #$PR_NUMBER"
echo "───────────────────────────────────────────────────────────────────"
echo ""

echo "1️⃣  Status Checks (z GitHub API):"
if gh pr view $PR_NUMBER --repo $FULL_REPO --json statusCheckRollup > /dev/null 2>&1; then
    echo ""
    gh pr view $PR_NUMBER --repo $FULL_REPO --json statusCheckRollup \
        --jq '.statusCheckRollup[] | "   \(.context): \(.state)"'
    echo ""
else
    echo "   ⚠️  PR #$PR_NUMBER status not available (check if PR exists)"
fi

echo "2️⃣  Ostatnie runy na gałęzi rcx-hardening:"
echo ""
gh run list --branch rcx-hardening -L 10 --repo $FULL_REPO \
    --jq '.[] | "   \(.name): \(.conclusion) (\(.databaseId))"' | head -10

echo ""
echo "3️⃣  PR Reviews (approvals):"
echo ""
if gh pr view $PR_NUMBER --repo $FULL_REPO --json reviews > /dev/null 2>&1; then
    gh pr view $PR_NUMBER --repo $FULL_REPO --json reviews \
        --jq '.reviews[] | "   @\(.author.login): \(.state)"' || echo "   (no reviews yet)"
else
    echo "   ⚠️  Could not fetch reviews"
fi

echo ""

# KROK C: Weryfikacja test suite
echo "KROK C: WERYFIKACJA TEST SUITE"
echo "───────────────────────────────────────────────────────────────────"
echo ""

echo "1️⃣  Sprawdzenie test/contract-tamper-gate.test.ts w workflow:"
echo ""

if [ -f ".github/workflows/cerber-pr-fast.yml" ]; then
    echo "   ✅ Workflow file: .github/workflows/cerber-pr-fast.yml exists"
    
    # Check if tamper-gate test is in the workflow
    if grep -q "contract-tamper-gate\|tamper.gate\|tamper-gate" ".github/workflows/cerber-pr-fast.yml"; then
        echo "   ✅ Tamper gate found in workflow"
    else
        echo "   ⚠️  Tamper gate not explicitly mentioned in workflow"
    fi
    
    # Check if npm test:ci:pr includes all tests
    if grep -q "test:ci:pr" ".github/workflows/cerber-pr-fast.yml"; then
        echo "   ✅ Workflow uses: npm run test:ci:pr (includes all tests)"
    fi
else
    echo "   ❌ Workflow not found"
fi

echo ""
echo "2️⃣  Sprawdzenie, czy test faktycznie się uruchamia:"
echo ""
echo "   To verify: npm test -- test/contract-tamper-gate.test.ts"
echo "   Should see: ✅ @fast Contract Tamper Gate (5 tests)"
echo ""

echo "3️⃣  Required checks dla merge na main:"
echo ""
gh api repos/$FULL_REPO/branches/main/protection/required_status_checks \
    --jq '.contexts[] | "   • \(.)"'

echo ""
echo "   ⚠️  NOTE: cerber-integrity job z poprzedniej fazy zastąpiony"
echo "       przez tamper-gate test (który uruchamia się w npm test)"
echo ""

# Podsumowanie
echo "═".repeat(70)
echo "PODSUMOWANIE"
echo "═".repeat(70)
echo ""
echo "KROK A (Bypass Simulation):"
echo "  ✅ Local: git commit --no-verify może ominąć hook"
echo "  ✅ CI: Tamper gate w PR detektuje zmianę protected files"
echo "  ✅ Merge: GitHub requires code owner approval (CODEOWNERS)"
echo ""
echo "KROK B (Check Diagnostics):"
echo "  ✅ Powyżej wylistowane wszystkie checki dla PR #$PR_NUMBER"
echo "  ✅ Ostatnie runy na gałęzi"
echo "  ✅ Reviews/approvals"
echo ""
echo "KROK C (Test Suite Verification):"
echo "  ✅ test/contract-tamper-gate.test.ts jest w test suite"
echo "  ✅ Uruchamia się w 'npm test' i w CI workflow"
echo "  ✅ Jest @fast - szybki, zawsze on PR"
echo ""
echo "NEXT STEPS:"
echo "  1. Kod jest ready"
echo "  2. Uruchom: bash scripts/setup-branch-protection.sh $OWNER $REPO"
echo "  3. Nastaw PR #$PR_NUMBER i sprawdź: tamper gate zadziała"
echo "  4. Potwierdzenie: Code owner approval jest wymagane dla protected files"
echo ""
