#!/bin/bash
# Cerber TEAM - Team Morning Dashboard
# 
# Author: Stefan Pitek
# Copyright: 2026 Stefan Pitek
# License: MIT
#
# Shows team morning dashboard with module health and assignments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║           🛡️  CERBER TEAM - Morning Dashboard            ║${NC}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Date:${NC} $(date '+%A, %B %d, %Y at %H:%M')"
echo ""

# Check if .cerber directory exists
if [ ! -d ".cerber" ]; then
    echo -e "${YELLOW}⚠️  No .cerber directory found${NC}"
    echo ""
    echo "Initialize Cerber TEAM by creating your first module:"
    echo "  bash team/scripts/cerber-add-module.sh my-first-module"
    echo ""
    exit 0
fi

# Module Status
echo -e "${BOLD}📦 Modules Status${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d ".cerber/modules" ]; then
    MODULE_COUNT=$(find .cerber/modules -maxdepth 1 -type d | tail -n +2 | wc -l)
    
    if [ "$MODULE_COUNT" -eq 0 ]; then
        echo -e "${BLUE}ℹ️${NC}  No modules found"
        echo ""
        echo "Create your first module:"
        echo "  bash team/scripts/cerber-add-module.sh my-module"
    else
        echo -e "Total modules: ${GREEN}${MODULE_COUNT}${NC}"
        echo ""
        
        # List modules with basic health check
        for module_dir in .cerber/modules/*/; do
            if [ -d "$module_dir" ]; then
                module_name=$(basename "$module_dir")
                
                # Quick health check
                HEALTH="✅"
                HEALTH_MSG="Healthy"
                
                if [ ! -f "${module_dir}/MODULE.md" ]; then
                    HEALTH="⚠️"
                    HEALTH_MSG="Missing MODULE.md"
                elif [ ! -f "${module_dir}/contract.json" ]; then
                    HEALTH="⚠️"
                    HEALTH_MSG="Missing contract.json"
                elif grep -q "\[MODULE_NAME\]" "${module_dir}/MODULE.md" 2>/dev/null; then
                    HEALTH="⚠️"
                    HEALTH_MSG="Uninitialized template"
                fi
                
                # Get owner if available
                OWNER="Unknown"
                if [ -f "${module_dir}/MODULE.md" ]; then
                    OWNER=$(grep "^\*\*Owner:\*\*" "${module_dir}/MODULE.md" | sed 's/\*\*Owner:\*\* //' | sed 's/\[Team Member Name\]/Unknown/' | sed 's/\[Your Name\]/Unknown/' || echo "Unknown")
                fi
                
                echo -e "  ${HEALTH} ${CYAN}${module_name}${NC}"
                echo -e "     Owner: ${OWNER}"
                echo -e "     Status: ${HEALTH_MSG}"
                echo ""
            fi
        done
    fi
else
    echo -e "${BLUE}ℹ️${NC}  No modules directory found"
    echo ""
fi

# Connection Contracts Status
echo ""
echo -e "${BOLD}🔗 Connection Contracts${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d ".cerber/connections/contracts" ]; then
    CONTRACT_COUNT=$(find .cerber/connections/contracts -name "*.json" 2>/dev/null | wc -l)
    
    if [ "$CONTRACT_COUNT" -eq 0 ]; then
        echo -e "${BLUE}ℹ️${NC}  No connection contracts found"
    else
        echo -e "Total connections: ${GREEN}${CONTRACT_COUNT}${NC}"
        echo ""
        
        # Quick validation
        VALID=0
        INVALID=0
        
        for contract in .cerber/connections/contracts/*.json; do
            if [ -f "$contract" ]; then
                if python3 -m json.tool "$contract" >/dev/null 2>&1 || \
                   node -e "JSON.parse(require('fs').readFileSync('$contract', 'utf8'))" 2>/dev/null; then
                    VALID=$((VALID + 1))
                else
                    INVALID=$((INVALID + 1))
                fi
            fi
        done
        
        echo -e "  ${GREEN}✅${NC} Valid: ${VALID}"
        if [ $INVALID -gt 0 ]; then
            echo -e "  ${RED}❌${NC} Invalid: ${INVALID}"
        fi
    fi
else
    echo -e "${BLUE}ℹ️${NC}  No connections directory found"
fi

# Recent Activity
echo ""
echo -e "${BOLD}📊 Recent Activity${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -d ".cerber/modules" ]; then
    # Find most recently modified modules
    echo "Recently updated modules:"
    echo ""
    
    find .cerber/modules -name "MODULE.md" -type f -exec ls -lt {} + 2>/dev/null | head -5 | while read -r line; do
        file=$(echo "$line" | awk '{print $NF}')
        module=$(echo "$file" | sed 's|.cerber/modules/||' | sed 's|/MODULE.md||')
        mod_time=$(echo "$line" | awk '{print $6, $7, $8}')
        
        if [ -n "$module" ]; then
            echo -e "  ${CYAN}${module}${NC} - Last modified: ${mod_time}"
        fi
    done
else
    echo -e "${BLUE}ℹ️${NC}  No activity to show"
fi

# Quick Actions
echo ""
echo ""
echo -e "${BOLD}🚀 Quick Actions${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Create module:      bash team/scripts/cerber-add-module.sh <name>"
echo "  Focus on module:    bash team/scripts/cerber-focus.sh <name>"
echo "  Check module:       bash team/scripts/cerber-module-check.sh <name>"
echo "  Check connections:  bash team/scripts/cerber-connections-check.sh"
echo ""

# Recommendations
echo -e "${BOLD}💡 Today's Focus${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for issues that need attention
NEEDS_ATTENTION=false

if [ -d ".cerber/modules" ]; then
    for module_dir in .cerber/modules/*/; do
        if [ -d "$module_dir" ]; then
            module_name=$(basename "$module_dir")
            
            if [ ! -f "${module_dir}/MODULE.md" ] || [ ! -f "${module_dir}/contract.json" ]; then
                if [ "$NEEDS_ATTENTION" = false ]; then
                    echo -e "${YELLOW}Modules needing attention:${NC}"
                    NEEDS_ATTENTION=true
                fi
                echo -e "  • ${module_name} - incomplete setup"
            elif grep -q "\[MODULE_NAME\]" "${module_dir}/MODULE.md" 2>/dev/null; then
                if [ "$NEEDS_ATTENTION" = false ]; then
                    echo -e "${YELLOW}Modules needing attention:${NC}"
                    NEEDS_ATTENTION=true
                fi
                echo -e "  • ${module_name} - template not customized"
            fi
        fi
    done
fi

if [ "$NEEDS_ATTENTION" = false ]; then
    echo -e "${GREEN}✅ All modules are in good shape!${NC}"
    echo ""
    echo "Ready to build great things today! 🚀"
fi

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

exit 0
