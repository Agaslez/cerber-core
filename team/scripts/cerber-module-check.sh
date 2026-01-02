#!/bin/bash
# Cerber TEAM - Module Validation
# 
# Author: Stefan Pitek
# Copyright: 2026 Stefan Pitek
# License: MIT
#
# Validates a single module for compliance with module system requirements

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if module name provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Module name required${NC}"
    echo ""
    echo "Usage: bash team/scripts/cerber-module-check.sh <module-name>"
    echo ""
    echo "Example:"
    echo "  bash team/scripts/cerber-module-check.sh pricing-engine"
    exit 1
fi

MODULE_NAME="$1"
MODULE_DIR=".cerber/modules/${MODULE_NAME}"
ERRORS=0
WARNINGS=0

echo ""
echo "🔍 Validating module: ${MODULE_NAME}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if module exists
if [ ! -d "$MODULE_DIR" ]; then
    echo -e "${RED}❌ Module directory not found: ${MODULE_DIR}${NC}"
    exit 1
fi

# Check MODULE.md exists
if [ -f "${MODULE_DIR}/MODULE.md" ]; then
    echo -e "${GREEN}✅${NC} MODULE.md exists"
    
    # Check if MODULE.md has required sections
    if grep -q "## Purpose" "${MODULE_DIR}/MODULE.md" && \
       grep -q "## Responsibilities" "${MODULE_DIR}/MODULE.md" && \
       grep -q "## Public Interface" "${MODULE_DIR}/MODULE.md"; then
        echo -e "${GREEN}✅${NC} MODULE.md has required sections"
    else
        echo -e "${YELLOW}⚠️${NC}  MODULE.md missing required sections (Purpose, Responsibilities, Public Interface)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check if MODULE.md is not just template
    if grep -q "\[MODULE_NAME\]" "${MODULE_DIR}/MODULE.md"; then
        echo -e "${YELLOW}⚠️${NC}  MODULE.md appears to be unmodified template"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌${NC} MODULE.md missing"
    ERRORS=$((ERRORS + 1))
fi

# Check contract.json exists and is valid JSON
if [ -f "${MODULE_DIR}/contract.json" ]; then
    echo -e "${GREEN}✅${NC} contract.json exists"
    
    # Validate JSON syntax
    if python3 -m json.tool "${MODULE_DIR}/contract.json" >/dev/null 2>&1 || \
       node -e "JSON.parse(require('fs').readFileSync('${MODULE_DIR}/contract.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} contract.json is valid JSON"
        
        # Check required fields
        if grep -q '"version"' "${MODULE_DIR}/contract.json" && \
           grep -q '"publicInterface"' "${MODULE_DIR}/contract.json"; then
            echo -e "${GREEN}✅${NC} contract.json has required fields"
        else
            echo -e "${YELLOW}⚠️${NC}  contract.json missing required fields (version, publicInterface)"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}❌${NC} contract.json has invalid JSON syntax"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌${NC} contract.json missing"
    ERRORS=$((ERRORS + 1))
fi

# Check dependencies.json exists and is valid JSON
if [ -f "${MODULE_DIR}/dependencies.json" ]; then
    echo -e "${GREEN}✅${NC} dependencies.json exists"
    
    # Validate JSON syntax
    if python3 -m json.tool "${MODULE_DIR}/dependencies.json" >/dev/null 2>&1 || \
       node -e "JSON.parse(require('fs').readFileSync('${MODULE_DIR}/dependencies.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} dependencies.json is valid JSON"
        
        # Check if dependencies reference valid modules
        if [ -f "${MODULE_DIR}/dependencies.json" ]; then
            # Extract dependency names (assuming array format)
            deps=$(grep -o '"[^"]*"' "${MODULE_DIR}/dependencies.json" | tr -d '"' | grep -v "dependencies" || echo "")
            if [ -n "$deps" ]; then
                ALL_DEPS_VALID=true
                for dep in $deps; do
                    if [ -d ".cerber/modules/${dep}" ]; then
                        :  # Dependency exists
                    else
                        echo -e "${YELLOW}⚠️${NC}  Dependency '${dep}' not found in .cerber/modules/"
                        WARNINGS=$((WARNINGS + 1))
                        ALL_DEPS_VALID=false
                    fi
                done
                if [ "$ALL_DEPS_VALID" = true ]; then
                    echo -e "${GREEN}✅${NC} All dependencies reference valid modules"
                fi
            fi
        fi
    else
        echo -e "${RED}❌${NC} dependencies.json has invalid JSON syntax"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️${NC}  dependencies.json missing (optional but recommended)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for forbidden cross-module imports (if source files exist)
# This is a placeholder - would need to know actual source directory structure
if [ -d "src/modules/${MODULE_NAME}" ]; then
    echo -e "${BLUE}ℹ️${NC}  Source directory found: src/modules/${MODULE_NAME}"
    # Could add more sophisticated import checking here
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ MODULE CHECK PASSED${NC}"
    echo ""
    echo "Module '${MODULE_NAME}' is fully compliant!"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  MODULE CHECK PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Found ${WARNINGS} warning(s)"
    echo "Module is functional but could be improved"
    echo ""
    exit 0
else
    echo -e "${RED}❌ MODULE CHECK FAILED${NC}"
    echo ""
    echo "Found ${ERRORS} error(s) and ${WARNINGS} warning(s)"
    echo "Please fix errors before using this module"
    echo ""
    exit 1
fi
