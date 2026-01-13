#!/usr/bin/env node

/**
 * Fix parseOutput calls in tests to use asRaw() helper
 * 
 * Problem: Tests pass JSON objects to parseOutput(raw: string)
 * Solution: Add asRaw helper and use it consistently
 * 
 * Usage: node scripts/fix-parseoutput-tests.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, '..', 'test');

// Files to fix
const filesToFix = [
  'differential/actionlint-real-vs-fixture.test.ts',
  'differential/gitleaks-real-vs-fixture.test.ts',
  'differential/zizmor-real-vs-fixture.test.ts',
  'property/parsers-property-fuzz.test.ts',
];

// Helper function to add
const HELPER = `const asRaw = (v: unknown): string => (typeof v === 'string' ? v : JSON.stringify(v));`;

// Process each file
filesToFix.forEach((relPath) => {
  const filePath = path.join(testDir, relPath);

  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skip (not found): ${relPath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Check if helper already exists
  if (content.includes('const asRaw = (v: unknown)')) {
    console.log(`✅ Already fixed: ${relPath}`);
    return;
  }

  // Find where to insert helper (after imports, before describe)
  const importMatch = content.match(/import.*\n(?:import.*\n)*/);
  const importEnd = importMatch ? importMatch[0].length : 0;

  // Add helper after imports
  if (importEnd > 0) {
    content = content.slice(0, importEnd) + '\n' + HELPER + '\n' + content.slice(importEnd);
  }

  // Fix adapter.parseOutput() calls
  // Pattern: adapter.parseOutput(someJsonVar) → adapter.parseOutput(asRaw(someJsonVar))
  content = content.replace(
    /adapter\.parseOutput\(([a-zA-Z_][a-zA-Z0-9_]*(?:Json|Json\[\]|Output|Output\[\]|Data|etc))\)/g,
    (match, varName) => {
      // Skip if already wrapped with asRaw
      if (varName.startsWith('asRaw(')) {
        return match;
      }
      return `adapter.parseOutput(asRaw(${varName}))`;
    }
  );

  // Also fix direct object literals: adapter.parseOutput({ ... })
  // This is trickier, but we'll add a comment to manual review
  if (content.includes('adapter.parseOutput({')) {
    console.log(`⚠️  Manual review needed for direct objects: ${relPath}`);
  }

  // Write back
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${relPath}`);
  } else {
    console.log(`ℹ️  No changes: ${relPath}`);
  }
});

console.log('\n✅ Done! Review files and run: npm test');
