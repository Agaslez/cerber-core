#!/bin/bash
# Real-time monitoring of GitHub Actions status
# Run: bash .monitor-github-actions.sh

REPO="Agaslez/cerber-core"
BRANCH="main"
MAX_WAIT=3600  # 1 hour timeout
POLL_INTERVAL=15  # Check every 15 seconds

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "🔍 MONITORING GitHub Actions for $REPO ($BRANCH)"
echo "   Started: $TIMESTAMP"
echo "   Max wait: ${MAX_WAIT}s (polling every ${POLL_INTERVAL}s)"
echo "   Dashboard: https://github.com/$REPO/actions"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

elapsed=0
last_status=""

while [ $elapsed -lt $MAX_WAIT ]; do
    # Check push status
    push_test=$(git push origin main --dry-run 2>&1 | grep -E "error|rejected")
    
    if [ -z "$push_test" ]; then
        # Push should work now - checks passed!
        echo -e "${GREEN}✅ $(date '+%H:%M:%S') - Status checks PASSED!${NC}"
        echo ""
        echo "🚀 Ready to push! Running: git push origin main"
        git push origin main
        exit 0
    else
        current_status=$(echo "$push_test" | head -1)
        
        # Only print if status changed
        if [ "$last_status" != "$current_status" ]; then
            echo -e "${YELLOW}⏳ $(date '+%H:%M:%S') - Waiting for checks...${NC}"
            echo "   $current_status"
            last_status="$current_status"
        else
            # Print progress dots every 60s
            if [ $((elapsed % 60)) -eq 0 ]; then
                echo -ne "${BLUE}.${NC}"
            fi
        fi
    fi
    
    sleep $POLL_INTERVAL
    elapsed=$((elapsed + POLL_INTERVAL))
done

echo -e "${RED}❌ Timeout after ${MAX_WAIT}s - checks did not complete${NC}"
echo "   Check manually: https://github.com/$REPO/actions"
exit 1
