#!/bin/bash
# Cerber TEAM - Add New Module
# 
# Author: Stefan Pitek
# Copyright: 2026 Stefan Pitek
# License: MIT
#
# Creates a new module from template with all required files

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
    echo "Usage: bash team/scripts/cerber-add-module.sh <module-name>"
    echo ""
    echo "Example:"
    echo "  bash team/scripts/cerber-add-module.sh payment-gateway"
    echo ""
    echo "Module naming conventions:"
    echo "  - Use kebab-case (lowercase with hyphens)"
    echo "  - Be descriptive but concise"
    echo "  - Examples: pricing-engine, user-auth, payment-gateway"
    exit 1
fi

MODULE_NAME="$1"
MODULE_DIR=".cerber/modules/${MODULE_NAME}"
TEMPLATE_DIR="team/templates"

echo ""
echo "🆕 Creating new module: ${MODULE_NAME}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if module already exists
if [ -d "$MODULE_DIR" ]; then
    echo -e "${RED}❌ Error: Module '${MODULE_NAME}' already exists${NC}"
    echo ""
    echo "Module directory: ${MODULE_DIR}"
    echo ""
    echo "To work on this module, use:"
    echo "  bash team/scripts/cerber-focus.sh ${MODULE_NAME}"
    exit 1
fi

# Create module directory
echo "Creating module directory..."
mkdir -p "$MODULE_DIR"
echo -e "${GREEN}✅${NC} Created ${MODULE_DIR}/"

# Copy MODULE.md from template
echo ""
echo "Creating MODULE.md from template..."
if [ -f "${TEMPLATE_DIR}/MODULE_TEMPLATE.md" ]; then
    cp "${TEMPLATE_DIR}/MODULE_TEMPLATE.md" "${MODULE_DIR}/MODULE.md"
    
    # Replace placeholder with actual module name
    # Using sed -i.bak for cross-platform compatibility (works on both Linux and macOS)
    sed -i.bak "s/\[MODULE_NAME\]/${MODULE_NAME}/g" "${MODULE_DIR}/MODULE.md"
    rm -f "${MODULE_DIR}/MODULE.md.bak"
    
    # Update date
    CURRENT_DATE=$(date '+%Y-%m-%d')
    sed -i.bak "s/YYYY-MM-DD/${CURRENT_DATE}/g" "${MODULE_DIR}/MODULE.md"
    rm -f "${MODULE_DIR}/MODULE.md.bak"
    
    echo -e "${GREEN}✅${NC} MODULE.md created from template"
else
    echo -e "${YELLOW}⚠️${NC}  Template not found, creating basic MODULE.md"
    cat > "${MODULE_DIR}/MODULE.md" <<EOF
# Module: ${MODULE_NAME}

**Owner:** [Your Name]
**Status:** Active
**Last Updated:** $(date '+%Y-%m-%d')

## Purpose

What this module does.

## Responsibilities

- Responsibility 1
- Responsibility 2

## Public Interface

Functions/classes that other modules can use.

## Dependencies

Modules this module uses.
EOF
    echo -e "${GREEN}✅${NC} Basic MODULE.md created"
fi

# Create contract.json
echo ""
echo "Creating contract.json..."
cat > "${MODULE_DIR}/contract.json" <<EOF
{
  "version": "1.0.0",
  "publicInterface": {},
  "dependencies": []
}
EOF
echo -e "${GREEN}✅${NC} contract.json initialized"

# Create dependencies.json
echo ""
echo "Creating dependencies.json..."
cat > "${MODULE_DIR}/dependencies.json" <<EOF
{
  "dependencies": []
}
EOF
echo -e "${GREEN}✅${NC} dependencies.json created"

# Update BIBLE.md if it exists
BIBLE_PATH=".cerber/BIBLE.md"
if [ -f "$BIBLE_PATH" ]; then
    echo ""
    echo "Updating BIBLE.md..."
    
    # Add module entry to BIBLE.md
    if ! grep -q "${MODULE_NAME}" "$BIBLE_PATH"; then
        # Try to add after "### Core Modules" section
        if grep -q "### Core Modules" "$BIBLE_PATH"; then
            # Find line number and insert after it
            LINE_NUM=$(grep -n "### Core Modules" "$BIBLE_PATH" | head -1 | cut -d: -f1)
            LINE_NUM=$((LINE_NUM + 2))
            
            # Create backup
            cp "$BIBLE_PATH" "${BIBLE_PATH}.bak"
            
            # Insert new module entry
            head -n $LINE_NUM "${BIBLE_PATH}.bak" > "$BIBLE_PATH"
            echo "" >> "$BIBLE_PATH"
            echo "**${MODULE_NAME}** - [Add description]" >> "$BIBLE_PATH"
            echo "   - Owner: [Your Name]" >> "$BIBLE_PATH"
            echo "   - Status: Active" >> "$BIBLE_PATH"
            echo "   - Files: \`src/modules/${MODULE_NAME}/\`" >> "$BIBLE_PATH"
            echo "" >> "$BIBLE_PATH"
            tail -n +$((LINE_NUM + 1)) "${BIBLE_PATH}.bak" >> "$BIBLE_PATH"
            
            rm -f "${BIBLE_PATH}.bak"
            echo -e "${GREEN}✅${NC} BIBLE.md updated with new module"
        else
            echo -e "${YELLOW}⚠️${NC}  Could not find '### Core Modules' section in BIBLE.md"
            echo "     Please manually add module to BIBLE.md"
        fi
    else
        echo -e "${BLUE}ℹ️${NC}  Module already exists in BIBLE.md"
    fi
else
    echo ""
    echo -e "${YELLOW}⚠️${NC}  BIBLE.md not found at ${BIBLE_PATH}"
    echo "     Consider creating a project BIBLE.md with:"
    echo "     cp team/templates/BIBLE_TEMPLATE.md .cerber/BIBLE.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Module '${MODULE_NAME}' created successfully!${NC}"
echo ""
echo "Module location: ${CYAN}${MODULE_DIR}/${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit module documentation:"
echo "     ${CYAN}nano ${MODULE_DIR}/MODULE.md${NC}"
echo ""
echo "  2. Define public interface in:"
echo "     ${CYAN}nano ${MODULE_DIR}/contract.json${NC}"
echo ""
echo "  3. List dependencies in:"
echo "     ${CYAN}nano ${MODULE_DIR}/dependencies.json${NC}"
echo ""
echo "  4. Enter focus mode to work on this module:"
echo "     ${CYAN}bash team/scripts/cerber-focus.sh ${MODULE_NAME}${NC}"
echo ""
echo "  5. Validate your module:"
echo "     ${CYAN}bash team/scripts/cerber-module-check.sh ${MODULE_NAME}${NC}"
echo ""

exit 0
