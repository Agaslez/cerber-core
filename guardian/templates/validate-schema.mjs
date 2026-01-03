#!/usr/bin/env node
/**
 * Guardian Pre-Commit Validator
 * 
 * This script runs before every git commit to validate your code
 * against your architecture schema (FRONTEND_SCHEMA.ts or BACKEND_SCHEMA.ts)
 * 
 * Setup:
 * 1. Copy this file to your project: scripts/validate-schema.mjs
 * 2. Install husky: npx husky-init
 * 3. Add hook: npx husky add .husky/pre-commit "node scripts/validate-schema.mjs"
 * 4. Commit: git commit -m "test" (Guardian will validate automatically)
 */

import { Guardian } from 'cerber-core/guardian';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

async function main() {
  console.log(`${colors.blue}🛡️  Guardian - Pre-Commit Validation${colors.reset}\n`);

  // Find schema file (try both FRONTEND_SCHEMA and BACKEND_SCHEMA)
  const schemaFiles = [
    'FRONTEND_SCHEMA.ts',
    'BACKEND_SCHEMA.ts',
    'src/FRONTEND_SCHEMA.ts',
    'src/BACKEND_SCHEMA.ts',
    'SCHEMA.ts',
    'src/SCHEMA.ts'
  ];

  let schemaPath = null;
  for (const file of schemaFiles) {
    const fullPath = resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      schemaPath = fullPath;
      console.log(`${colors.gray}Found schema: ${file}${colors.reset}`);
      break;
    }
  }

  if (!schemaPath) {
    console.error(`${colors.red}❌ No schema file found!${colors.reset}`);
    console.error(`${colors.gray}Expected one of: ${schemaFiles.join(', ')}${colors.reset}\n`);
    console.error(`${colors.yellow}💡 Create a schema file:${colors.reset}`);
    console.error(`   cp node_modules/cerber-core/examples/frontend-schema.ts ./FRONTEND_SCHEMA.ts`);
    console.error(`   # or`);
    console.error(`   cp node_modules/cerber-core/examples/backend-schema.ts ./BACKEND_SCHEMA.ts\n`);
    process.exit(1);
  }

  // Load schema dynamically
  let schema;
  try {
    const schemaModule = await import(`file://${schemaPath}`);
    schema = schemaModule.default || schemaModule.schema || schemaModule;
    
    if (typeof schema === 'function') {
      schema = schema();
    }
  } catch (err) {
    console.error(`${colors.red}❌ Failed to load schema file!${colors.reset}`);
    console.error(`${colors.gray}${err.message}${colors.reset}\n`);
    process.exit(1);
  }

  // Validate with Guardian
  const guardian = new Guardian(schema);
  const result = await guardian.validate(process.cwd());

  // Note: Guardian already prints results internally
  // We just need to check if validation passed and exit accordingly
  
  // Guardian validation result is already printed
  // Exit based on whether there were errors
  if (result.valid === false) {
    console.log(`\n${colors.yellow}💡 To fix errors:${colors.reset}`);
    console.log(`   1. Remove forbidden patterns (console.log, debugger, etc.)`);
    console.log(`   2. Add missing required files`);
    console.log(`   3. Or add architect approval with comment:${colors.reset}`);
    console.log(`      ${colors.gray}// ARCHITECT_APPROVED: Temporary debug - 2026-01-03 - Lead Dev${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Guardian validation passed!${colors.reset}\n`);
  process.exit(0);
}

main().catch(err => {
  console.error(`${colors.red}❌ Guardian failed:${colors.reset}`, err);
  process.exit(1);
});
