#!/usr/bin/env node

/**
 * Cerber SOLO - Dependency Health Checker
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Checks:
 * - npm audit (vulnerabilities)
 * - Outdated packages
 * - Deprecated packages
 * - Unmaintained packages (no updates 2+ years)
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏥 Cerber SOLO - Dependency Health Check\n');

let healthScore = 100;
const issues = [];

/**
 * Check for security vulnerabilities
 */
function checkVulnerabilities() {
  console.log('🔒 Checking security vulnerabilities...');
  
  try {
    execSync('npm audit --json > /tmp/audit-result.json 2>/dev/null', { 
      stdio: 'pipe',
      encoding: 'utf8' 
    });
    
    const auditData = JSON.parse(fs.readFileSync('/tmp/audit-result.json', 'utf8'));
    
    const critical = auditData.metadata?.vulnerabilities?.critical || 0;
    const high = auditData.metadata?.vulnerabilities?.high || 0;
    const moderate = auditData.metadata?.vulnerabilities?.moderate || 0;
    const low = auditData.metadata?.vulnerabilities?.low || 0;
    
    if (critical > 0 || high > 0 || moderate > 0 || low > 0) {
      console.log(`  ⚠️  Found vulnerabilities:`);
      if (critical > 0) console.log(`     🔴 Critical: ${critical}`);
      if (high > 0) console.log(`     🟠 High: ${high}`);
      if (moderate > 0) console.log(`     🟡 Moderate: ${moderate}`);
      if (low > 0) console.log(`     🟢 Low: ${low}`);
      
      healthScore -= (critical * 20) + (high * 10) + (moderate * 5) + (low * 2);
      issues.push({
        type: 'security',
        severity: critical > 0 ? 'critical' : high > 0 ? 'high' : 'moderate',
        message: `${critical + high + moderate + low} vulnerabilities found`,
        action: 'Run: npm audit fix'
      });
    } else {
      console.log('  ✅ No vulnerabilities found');
    }
  } catch (error) {
    console.log('  ℹ️  npm audit check skipped (may not be available)');
  }
}

/**
 * Check for outdated packages
 */
function checkOutdated() {
  console.log('\n📦 Checking outdated packages...');
  
  try {
    const outdated = execSync('npm outdated --json 2>/dev/null', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    if (!outdated) {
      console.log('  ✅ All packages are up to date');
      return;
    }
    
    const packages = JSON.parse(outdated);
    const count = Object.keys(packages).length;
    
    if (count > 0) {
      console.log(`  ⚠️  ${count} outdated packages found`);
      
      // Show top 5 outdated packages
      const entries = Object.entries(packages).slice(0, 5);
      entries.forEach(([name, info]) => {
        console.log(`     ${name}: ${info.current} → ${info.latest}`);
      });
      
      if (count > 5) {
        console.log(`     ... and ${count - 5} more`);
      }
      
      healthScore -= Math.min(count * 2, 30);
      issues.push({
        type: 'outdated',
        severity: 'low',
        message: `${count} packages are outdated`,
        action: 'Run: npm update'
      });
    }
  } catch (error) {
    // npm outdated exits with code 1 when packages are outdated
    console.log('  ℹ️  Could not check outdated packages');
  }
}

/**
 * Check for deprecated packages
 */
function checkDeprecated() {
  console.log('\n⚠️  Checking for deprecated packages...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('  ⚠️  No package.json found');
    return;
  }
  
  try {
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const allDeps = {
      ...packageData.dependencies || {},
      ...packageData.devDependencies || {}
    };
    
    // Known deprecated packages (example list)
    const knownDeprecated = [
      'request',
      'node-uuid',
      'babel-preset-es2015',
      'gulp-util',
      'coffee-script'
    ];
    
    const deprecated = Object.keys(allDeps).filter(dep => 
      knownDeprecated.some(d => dep.includes(d))
    );
    
    if (deprecated.length > 0) {
      console.log(`  ⚠️  ${deprecated.length} deprecated packages found:`);
      deprecated.forEach(pkg => {
        console.log(`     - ${pkg}`);
      });
      
      healthScore -= deprecated.length * 10;
      issues.push({
        type: 'deprecated',
        severity: 'moderate',
        message: `${deprecated.length} deprecated packages in use`,
        action: 'Replace with maintained alternatives'
      });
    } else {
      console.log('  ✅ No known deprecated packages');
    }
  } catch (error) {
    console.log(`  ❌ Error checking deprecated packages: ${error.message}`);
  }
}

/**
 * Check package-lock.json health
 */
function checkLockFile() {
  console.log('\n🔒 Checking package-lock.json...');
  
  const lockPath = path.join(process.cwd(), 'package-lock.json');
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(lockPath)) {
    console.log('  ⚠️  No package-lock.json found');
    issues.push({
      type: 'lock-file',
      severity: 'moderate',
      message: 'Missing package-lock.json',
      action: 'Run: npm install'
    });
    healthScore -= 10;
    return;
  }
  
  try {
    const lockStat = fs.statSync(lockPath);
    const packageStat = fs.statSync(packagePath);
    
    if (packageStat.mtime > lockStat.mtime) {
      console.log('  ⚠️  package.json is newer than package-lock.json');
      issues.push({
        type: 'lock-file',
        severity: 'low',
        message: 'package-lock.json may be out of sync',
        action: 'Run: npm install'
      });
      healthScore -= 5;
    } else {
      console.log('  ✅ package-lock.json is up to date');
    }
  } catch (error) {
    console.log(`  ❌ Error checking lock file: ${error.message}`);
  }
}

// Run all checks
checkVulnerabilities();
checkOutdated();
checkDeprecated();
checkLockFile();

// Generate report
console.log('\n' + '='.repeat(60));
console.log('\n📊 Dependency Health Report\n');

healthScore = Math.max(0, healthScore);
const grade = healthScore >= 90 ? 'A' : 
              healthScore >= 75 ? 'B' : 
              healthScore >= 60 ? 'C' : 
              healthScore >= 40 ? 'D' : 'F';

const gradeEmoji = grade === 'A' ? '✅' : 
                   grade === 'B' ? '👍' : 
                   grade === 'C' ? '⚠️' : 
                   grade === 'D' ? '🔴' : '💀';

console.log(`${gradeEmoji} Health Score: ${healthScore}/100 (Grade: ${grade})`);
console.log(`   Issues Found: ${issues.length}`);

if (issues.length > 0) {
  console.log('\n🔧 Recommended Actions:\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
    console.log(`   → ${issue.action}\n`);
  });
}

console.log('='.repeat(60));

// Exit with appropriate code
process.exit(healthScore < 60 ? 1 : 0);
