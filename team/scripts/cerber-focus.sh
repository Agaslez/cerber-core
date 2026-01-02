#!/bin/bash
# Cerber TEAM - Focus Mode
# 
# Author: Stefan Pitek
# Copyright: 2026 Stefan Pitek
# License: MIT
#
# Creates FOCUS_CONTEXT.md with all relevant information for a single module
# This allows AI to work with 500 LOC instead of 10,000 LOC (10x faster)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if module name provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Module name required${NC}"
    echo ""
    echo "Usage: bash team/scripts/cerber-focus.sh <module-name>"
    echo ""
    echo "Example:"
    echo "  bash team/scripts/cerber-focus.sh pricing-engine"
    exit 1
fi

MODULE_NAME="$1"
MODULE_DIR=".cerber/modules/${MODULE_NAME}"
OUTPUT_FILE=".cerber/FOCUS_CONTEXT.md"

# Check if module exists
if [ ! -d "$MODULE_DIR" ]; then
    echo -e "${RED}❌ Error: Module '${MODULE_NAME}' not found${NC}"
    echo ""
    echo "Module directory does not exist: ${MODULE_DIR}"
    echo ""
    echo "Available modules:"
    if [ -d ".cerber/modules" ]; then
        ls -1 .cerber/modules/ 2>/dev/null || echo "  (none)"
    else
        echo "  (none - .cerber/modules directory not found)"
    fi
    echo ""
    echo "Create a new module with:"
    echo "  bash team/scripts/cerber-add-module.sh ${MODULE_NAME}"
    exit 1
fi

# Create .cerber directory if it doesn't exist
mkdir -p .cerber

# Start building focus context
echo "# FOCUS CONTEXT - ${MODULE_NAME}" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "**Generated:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
echo "**Module:** ${MODULE_NAME}" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Add MODULE.md (required)
if [ -f "${MODULE_DIR}/MODULE.md" ]; then
    echo "## Module Documentation" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    cat "${MODULE_DIR}/MODULE.md" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
else
    echo -e "${RED}❌ Error: ${MODULE_DIR}/MODULE.md not found${NC}"
    echo ""
    echo "MODULE.md is required for focus mode. Create it with:"
    echo "  bash team/scripts/cerber-add-module.sh ${MODULE_NAME}"
    exit 1
fi

# Add contract.json
if [ -f "${MODULE_DIR}/contract.json" ]; then
    echo "## Module Contract (Public Interface)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo '```json' >> "$OUTPUT_FILE"
    cat "${MODULE_DIR}/contract.json" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
else
    echo -e "${YELLOW}⚠️  Warning: ${MODULE_DIR}/contract.json not found${NC}"
fi

# Add dependencies.json
if [ -f "${MODULE_DIR}/dependencies.json" ]; then
    echo "## Module Dependencies" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo '```json' >> "$OUTPUT_FILE"
    cat "${MODULE_DIR}/dependencies.json" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
else
    echo -e "${YELLOW}⚠️  Warning: ${MODULE_DIR}/dependencies.json not found${NC}"
fi

# Find and add connection contracts
CONNECTIONS_DIR=".cerber/connections/contracts"
if [ -d "$CONNECTIONS_DIR" ]; then
    # Find contracts that mention this module
    FOUND_CONNECTIONS=false
    
    echo "## Connection Contracts" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    for contract in "$CONNECTIONS_DIR"/*.json; do
        if [ -f "$contract" ]; then
            # Check if this contract involves our module
            if grep -q "\"${MODULE_NAME}\"" "$contract" 2>/dev/null; then
                if [ "$FOUND_CONNECTIONS" = false ]; then
                    FOUND_CONNECTIONS=true
                fi
                
                CONTRACT_NAME=$(basename "$contract")
                echo "### ${CONTRACT_NAME}" >> "$OUTPUT_FILE"
                echo "" >> "$OUTPUT_FILE"
                echo '```json' >> "$OUTPUT_FILE"
                cat "$contract" >> "$OUTPUT_FILE"
                echo "" >> "$OUTPUT_FILE"
                echo '```' >> "$OUTPUT_FILE"
                echo "" >> "$OUTPUT_FILE"
            fi
        fi
    done
    
    if [ "$FOUND_CONNECTIONS" = false ]; then
        echo "*No connection contracts found for this module.*" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
    
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# Calculate statistics
LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
CHAR_COUNT=$(wc -c < "$OUTPUT_FILE")

# Output success message
echo ""
echo -e "${GREEN}✅ Focus context created successfully!${NC}"
echo ""
echo -e "${CYAN}📖 Focus context: ${OUTPUT_FILE}${NC}"
echo -e "${CYAN}📊 Context contains ${LINE_COUNT} lines (${CHAR_COUNT} characters)${NC}"
echo ""
echo -e "${BLUE}🤖 AI can now work with focused context instead of entire codebase${NC}"
echo -e "${BLUE}   This is typically 10x faster for AI processing${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. View context: ${CYAN}cat ${OUTPUT_FILE}${NC}"
echo -e "  2. Share with AI for focused work on ${MODULE_NAME}"
echo -e "  3. Validate module: ${CYAN}bash team/scripts/cerber-module-check.sh ${MODULE_NAME}${NC}"
echo ""

exit 0
