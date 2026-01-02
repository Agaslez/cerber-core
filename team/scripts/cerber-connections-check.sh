#!/bin/bash
# Cerber TEAM - Connection Contract Validation
# 
# Author: Stefan Pitek
# Copyright: 2026 Stefan Pitek
# License: MIT
#
# Validates all connection contracts between modules

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONNECTIONS_DIR=".cerber/connections/contracts"
ERRORS=0
WARNINGS=0
CHECKED=0

echo ""
echo "🔗 Checking connection contracts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if connections directory exists
if [ ! -d "$CONNECTIONS_DIR" ]; then
    echo -e "${YELLOW}⚠️  No connections directory found${NC}"
    echo ""
    echo "Expected: ${CONNECTIONS_DIR}"
    echo ""
    echo "If you have modules with connections, create connection contracts:"
    echo "  mkdir -p ${CONNECTIONS_DIR}"
    echo "  cp team/templates/CONNECTION_TEMPLATE.json ${CONNECTIONS_DIR}/module-a-to-module-b.json"
    echo ""
    exit 0
fi

# Check if any contracts exist
CONTRACT_COUNT=$(find "$CONNECTIONS_DIR" -name "*.json" 2>/dev/null | wc -l)

if [ "$CONTRACT_COUNT" -eq 0 ]; then
    echo -e "${BLUE}ℹ️${NC}  No connection contracts found"
    echo ""
    echo "This is OK if modules don't communicate yet."
    echo ""
    echo "To create a connection contract:"
    echo "  cp team/templates/CONNECTION_TEMPLATE.json ${CONNECTIONS_DIR}/module-a-to-module-b.json"
    echo ""
    exit 0
fi

echo "Found ${CONTRACT_COUNT} connection contract(s)"
echo ""

# Track connections for circular dependency detection
declare -A connections

# Process each contract
for contract in "$CONNECTIONS_DIR"/*.json; do
    if [ ! -f "$contract" ]; then
        continue
    fi
    
    CHECKED=$((CHECKED + 1))
    CONTRACT_NAME=$(basename "$contract")
    
    echo "Checking: ${CONTRACT_NAME}"
    
    # Validate JSON syntax
    if ! python3 -m json.tool "$contract" >/dev/null 2>&1 && \
       ! node -e "JSON.parse(require('fs').readFileSync('$contract', 'utf8'))" 2>/dev/null; then
        echo -e "  ${RED}❌${NC} Invalid JSON syntax"
        ERRORS=$((ERRORS + 1))
        continue
    fi
    
    # Extract from and to modules
    FROM_MODULE=$(grep -o '"from"[[:space:]]*:[[:space:]]*"[^"]*"' "$contract" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
    TO_MODULE=$(grep -o '"to"[[:space:]]*:[[:space:]]*"[^"]*"' "$contract" | head -1 | sed 's/.*"\([^"]*\)".*/\1/')
    
    if [ -z "$FROM_MODULE" ] || [ -z "$TO_MODULE" ]; then
        echo -e "  ${RED}❌${NC} Missing 'from' or 'to' field"
        ERRORS=$((ERRORS + 1))
        continue
    fi
    
    # Store connection for circular check
    connections["${FROM_MODULE}->${TO_MODULE}"]=1
    
    # Check if modules exist
    FROM_EXISTS=false
    TO_EXISTS=false
    
    if [ -d ".cerber/modules/${FROM_MODULE}" ]; then
        FROM_EXISTS=true
    fi
    
    if [ -d ".cerber/modules/${TO_MODULE}" ]; then
        TO_EXISTS=true
    fi
    
    if [ "$FROM_EXISTS" = true ] && [ "$TO_EXISTS" = true ]; then
        echo -e "  ${GREEN}✅${NC} ${FROM_MODULE} → ${TO_MODULE} (valid)"
    else
        if [ "$FROM_EXISTS" = false ]; then
            echo -e "  ${RED}❌${NC} Module '${FROM_MODULE}' not found"
            ERRORS=$((ERRORS + 1))
        fi
        if [ "$TO_EXISTS" = false ]; then
            echo -e "  ${RED}❌${NC} Module '${TO_MODULE}' not found"
            ERRORS=$((ERRORS + 1))
        fi
    fi
    
    # Check required fields
    HAS_INTERFACE=$(grep -q '"interface"' "$contract" && echo "true" || echo "false")
    HAS_VERSION=$(grep -q '"version"' "$contract" && echo "true" || echo "false")
    
    if [ "$HAS_INTERFACE" = false ]; then
        echo -e "  ${YELLOW}⚠️${NC}  Missing 'interface' field"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    if [ "$HAS_VERSION" = false ]; then
        echo -e "  ${YELLOW}⚠️${NC}  Missing 'version' field"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Check for breaking changes field
    if ! grep -q '"breaking_changes"' "$contract"; then
        echo -e "  ${YELLOW}⚠️${NC}  Missing 'breaking_changes' field (recommended for versioning)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    echo ""
done

# Check for circular dependencies (simple check)
echo "Checking for circular dependencies..."
CIRCULAR_FOUND=false

for key in "${!connections[@]}"; do
    FROM=$(echo "$key" | cut -d'-' -f1)
    TO=$(echo "$key" | cut -d'>' -f2)
    
    # Check if reverse connection exists
    if [ -n "${connections[${TO}->${FROM}]}" ]; then
        echo -e "${YELLOW}⚠️${NC}  Potential circular dependency: ${FROM} ↔ ${TO}"
        CIRCULAR_FOUND=true
        WARNINGS=$((WARNINGS + 1))
    fi
done

if [ "$CIRCULAR_FOUND" = false ]; then
    echo -e "${GREEN}✅${NC} No circular dependencies detected"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CONNECTION CHECKS PASSED${NC}"
    echo ""
    echo "All ${CHECKED} connection contract(s) are valid!"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  CONNECTION CHECKS PASSED WITH WARNINGS${NC}"
    echo ""
    echo "Checked ${CHECKED} contract(s)"
    echo "Found ${WARNINGS} warning(s)"
    echo ""
    exit 0
else
    echo -e "${RED}❌ CONNECTION CHECK FAILED${NC}"
    echo ""
    echo "Checked ${CHECKED} contract(s)"
    echo "Found ${ERRORS} error(s) and ${WARNINGS} warning(s)"
    echo ""
    exit 1
fi
