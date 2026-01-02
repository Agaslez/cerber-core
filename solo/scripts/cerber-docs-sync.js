#!/usr/bin/env node

/**
 * Cerber SOLO - Documentation Sync Validator
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Validates:
 * - Extract API endpoints from code
 * - Compare with README
 * - Find ENV vars in code vs docs
 * - Detect stale documentation
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📚 Cerber SOLO - Documentation Sync Validator\n');

const issues = [];

/**
 * Extract API endpoints from code
 */
function extractAPIEndpoints() {
  console.log('🔍 Extracting API endpoints from code...\n');
  
  try {
    // Find app.get, app.post, router.get, router.post patterns
    const patterns = [
      'app\\.get\\(',
      'app\\.post\\(',
      'app\\.put\\(',
      'app\\.delete\\(',
      'router\\.get\\(',
      'router\\.post\\(',
      'router\\.put\\(',
      'router\\.delete\\('
    ];
    
    const endpoints = new Set();
    
    patterns.forEach(pattern => {
      try {
        const cmd = `grep -r "${pattern}" --include="*.ts" --include="*.js" . 2>/dev/null || true`;
        const results = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
        
        if (results) {
          // Extract endpoint paths
          const pathRegex = /['"]([\/][^'"]+)['"]/g;
          let match;
          while ((match = pathRegex.exec(results)) !== null) {
            endpoints.add(match[1]);
          }
        }
      } catch (error) {
        // Continue on error
      }
    });
    
    if (endpoints.size > 0) {
      console.log(`  ✅ Found ${endpoints.size} API endpoints in code:`);
      Array.from(endpoints).slice(0, 10).forEach(endpoint => {
        console.log(`     ${endpoint}`);
      });
      if (endpoints.size > 10) {
        console.log(`     ... and ${endpoints.size - 10} more`);
      }
    } else {
      console.log('  ℹ️  No API endpoints found in code');
    }
    
    return endpoints;
  } catch (error) {
    console.log(`  ⚠️  Error extracting endpoints: ${error.message}`);
    return new Set();
  }
}

/**
 * Check if endpoints are documented in README
 */
function checkEndpointsInReadme(endpoints) {
  console.log('\n📖 Checking README for endpoint documentation...\n');
  
  const readmePath = path.join(process.cwd(), 'README.md');
  
  if (!fs.existsSync(readmePath)) {
    console.log('  ⚠️  No README.md found');
    issues.push({
      type: 'missing-readme',
      severity: 'high',
      message: 'README.md not found'
    });
    return;
  }
  
  try {
    const readme = fs.readFileSync(readmePath, 'utf8');
    const undocumented = [];
    
    endpoints.forEach(endpoint => {
      if (!readme.includes(endpoint)) {
        undocumented.push(endpoint);
      }
    });
    
    if (undocumented.length > 0) {
      console.log(`  ⚠️  ${undocumented.length} endpoints not documented in README:`);
      undocumented.slice(0, 5).forEach(endpoint => {
        console.log(`     - ${endpoint}`);
      });
      if (undocumented.length > 5) {
        console.log(`     ... and ${undocumented.length - 5} more`);
      }
      
      issues.push({
        type: 'undocumented-endpoints',
        severity: 'moderate',
        message: `${undocumented.length} endpoints missing from README`,
        endpoints: undocumented
      });
    } else if (endpoints.size > 0) {
      console.log('  ✅ All endpoints are documented in README');
    }
  } catch (error) {
    console.log(`  ❌ Error reading README: ${error.message}`);
  }
}

/**
 * Extract environment variables from code
 */
function extractEnvVars() {
  console.log('\n🔐 Extracting environment variables from code...\n');
  
  try {
    const cmd = `grep -r "process\\.env\\." --include="*.ts" --include="*.js" . 2>/dev/null || true`;
    const results = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    
    const envVars = new Set();
    const envRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    
    let match;
    while ((match = envRegex.exec(results)) !== null) {
      envVars.add(match[1]);
    }
    
    if (envVars.size > 0) {
      console.log(`  ✅ Found ${envVars.size} environment variables in code:`);
      Array.from(envVars).slice(0, 10).forEach(varName => {
        console.log(`     ${varName}`);
      });
      if (envVars.size > 10) {
        console.log(`     ... and ${envVars.size - 10} more`);
      }
    } else {
      console.log('  ℹ️  No environment variables found');
    }
    
    return envVars;
  } catch (error) {
    console.log(`  ⚠️  Error extracting env vars: ${error.message}`);
    return new Set();
  }
}

/**
 * Check if env vars are documented
 */
function checkEnvVarsInDocs(envVars) {
  console.log('\n📝 Checking environment variable documentation...\n');
  
  const readmePath = path.join(process.cwd(), 'README.md');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  let readme = '';
  let envExample = '';
  
  if (fs.existsSync(readmePath)) {
    readme = fs.readFileSync(readmePath, 'utf8');
  }
  
  if (fs.existsSync(envExamplePath)) {
    envExample = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  const undocumented = [];
  const missingFromExample = [];
  
  envVars.forEach(varName => {
    if (!readme.includes(varName)) {
      undocumented.push(varName);
    }
    if (!envExample.includes(varName)) {
      missingFromExample.push(varName);
    }
  });
  
  if (undocumented.length > 0) {
    console.log(`  ⚠️  ${undocumented.length} env vars not in README:`);
    undocumented.slice(0, 5).forEach(varName => {
      console.log(`     - ${varName}`);
    });
    if (undocumented.length > 5) {
      console.log(`     ... and ${undocumented.length - 5} more`);
    }
    
    issues.push({
      type: 'undocumented-env-vars',
      severity: 'low',
      message: `${undocumented.length} env vars not documented`,
      vars: undocumented
    });
  }
  
  if (missingFromExample.length > 0) {
    console.log(`\n  ⚠️  ${missingFromExample.length} env vars not in .env.example:`);
    missingFromExample.slice(0, 5).forEach(varName => {
      console.log(`     - ${varName}`);
    });
    if (missingFromExample.length > 5) {
      console.log(`     ... and ${missingFromExample.length - 5} more`);
    }
    
    issues.push({
      type: 'missing-env-example',
      severity: 'moderate',
      message: `${missingFromExample.length} env vars not in .env.example`,
      vars: missingFromExample
    });
  }
  
  if (undocumented.length === 0 && missingFromExample.length === 0 && envVars.size > 0) {
    console.log('  ✅ All env vars are documented');
  }
}

/**
 * Check for TODO and FIXME comments
 */
function checkTodoComments() {
  console.log('\n📌 Checking for TODO/FIXME comments...\n');
  
  try {
    const cmd = `grep -rn "TODO\\|FIXME" --include="*.ts" --include="*.js" --include="*.md" . 2>/dev/null || true`;
    const results = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    
    if (results) {
      const lines = results.split('\n').filter(line => line.trim());
      console.log(`  ℹ️  Found ${lines.length} TODO/FIXME comments:`);
      lines.slice(0, 5).forEach(line => {
        console.log(`     ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
      });
      if (lines.length > 5) {
        console.log(`     ... and ${lines.length - 5} more`);
      }
    } else {
      console.log('  ✅ No TODO/FIXME comments found');
    }
  } catch (error) {
    // Continue on error
  }
}

// Run all checks
const endpoints = extractAPIEndpoints();
checkEndpointsInReadme(endpoints);

const envVars = extractEnvVars();
checkEnvVarsInDocs(envVars);

checkTodoComments();

// Summary
console.log('\n' + '='.repeat(60));

if (issues.length > 0) {
  console.log('\n📋 Documentation Sync Report\n');
  console.log(`Issues found: ${issues.length}\n`);
  
  issues.forEach((issue, idx) => {
    const severityEmoji = issue.severity === 'high' ? '🔴' : 
                          issue.severity === 'moderate' ? '🟡' : '🔵';
    console.log(`${idx + 1}. ${severityEmoji} [${issue.severity.toUpperCase()}] ${issue.message}`);
  });
  
  console.log('\n💡 Recommended Actions:');
  console.log('   1. Update README.md with missing endpoints');
  console.log('   2. Add missing vars to .env.example');
  console.log('   3. Document environment variables');
  console.log('   4. Run: npm run cerber:repair (to auto-sync .env.example)');
} else {
  console.log('\n✅ Documentation is in sync!\n');
}

console.log('\n' + '='.repeat(60));

process.exit(issues.length > 0 ? 1 : 0);
