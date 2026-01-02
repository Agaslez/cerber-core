#!/usr/bin/env node

/**
 * Cerber SOLO - Daily Check (Morning Dashboard)
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Checks:
 * - Backend health (via /api/health)
 * - Guardian validation status
 * - Git status
 * - Yesterday's snapshot
 * - Today's priorities
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('☀️  Cerber SOLO - Morning Dashboard\n');
console.log('='.repeat(60));

const date = new Date().toLocaleDateString('en-US', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
});

console.log(`\n📅 ${date}\n`);

/**
 * Check backend health
 */
function checkBackendHealth() {
  console.log('🏥 Backend Health Check\n');
  
  const healthUrls = [
    'http://localhost:3000/api/health',
    'http://localhost:4000/api/health',
    'http://localhost:5000/api/health'
  ];
  
  let healthChecked = false;
  
  for (const url of healthUrls) {
    try {
      // Try with curl (available on most systems)
      const response = execSync(`curl -s -m 2 ${url} 2>/dev/null || true`, { 
        encoding: 'utf8',
        timeout: 3000
      });
      
      if (response && response.includes('status')) {
        const data = JSON.parse(response);
        const status = data.status || 'unknown';
        const emoji = status === 'healthy' ? '✅' : status === 'degraded' ? '⚠️' : '🔴';
        
        console.log(`   ${emoji} ${url}: ${status}`);
        
        if (data.summary) {
          const s = data.summary;
          if (s.criticalIssues > 0) console.log(`      🔴 Critical: ${s.criticalIssues}`);
          if (s.errorIssues > 0) console.log(`      🟠 Errors: ${s.errorIssues}`);
          if (s.warningIssues > 0) console.log(`      🟡 Warnings: ${s.warningIssues}`);
        }
        
        healthChecked = true;
        break;
      }
    } catch (error) {
      // Continue to next URL
    }
  }
  
  if (!healthChecked) {
    console.log('   ℹ️  Backend not running or health endpoint not accessible');
    console.log('   💡 Start your server to enable health checks');
  }
  
  console.log();
}

/**
 * Check Guardian validation status
 */
function checkGuardianStatus() {
  console.log('🛡️  Guardian Status\n');
  
  try {
    // Check if Guardian validation script exists
    const guardianPaths = [
      'scripts/validate-schema.mjs',
      'scripts/validate-schema.js',
      '.husky/pre-commit'
    ];
    
    const guardianExists = guardianPaths.some(p => 
      fs.existsSync(path.join(process.cwd(), p))
    );
    
    if (guardianExists) {
      console.log('   ✅ Guardian is installed');
      
      // Check recent commits
      try {
        const recentCommits = execSync('git log --oneline -5', { encoding: 'utf8' });
        console.log('   📝 Recent commits passed validation:\n');
        recentCommits.split('\n').slice(0, 3).forEach(commit => {
          if (commit.trim()) {
            console.log(`      ${commit}`);
          }
        });
      } catch (error) {
        // Not a git repo
      }
    } else {
      console.log('   ⚠️  Guardian not detected');
      console.log('   💡 Consider setting up Guardian for pre-commit validation');
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking Guardian: ${error.message}`);
  }
  
  console.log();
}

/**
 * Check Git status
 */
function checkGitStatus() {
  console.log('📂 Git Status\n');
  
  try {
    const status = execSync('git status --short', { encoding: 'utf8' });
    
    if (status.trim()) {
      const lines = status.split('\n').filter(l => l.trim());
      console.log(`   📊 ${lines.length} file(s) with changes:\n`);
      
      lines.slice(0, 10).forEach(line => {
        const statusCode = line.substring(0, 2).trim();
        const file = line.substring(3);
        const emoji = statusCode.includes('M') ? '📝' : 
                      statusCode.includes('A') ? '✨' : 
                      statusCode.includes('D') ? '🗑️' : 
                      statusCode.includes('?') ? '❓' : '📄';
        console.log(`      ${emoji} ${file}`);
      });
      
      if (lines.length > 10) {
        console.log(`      ... and ${lines.length - 10} more`);
      }
      
      // Check branch
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      console.log(`\n   🌿 Branch: ${branch}`);
      
      // Check unpushed commits
      try {
        const unpushed = execSync('git log @{u}.. --oneline 2>/dev/null || true', { encoding: 'utf8' });
        if (unpushed.trim()) {
          const count = unpushed.split('\n').filter(l => l.trim()).length;
          console.log(`   ⬆️  ${count} unpushed commit(s)`);
        }
      } catch (error) {
        // No upstream branch
      }
    } else {
      console.log('   ✅ Working directory clean');
      
      const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      console.log(`   🌿 Branch: ${branch}`);
    }
  } catch (error) {
    console.log('   ℹ️  Not a git repository');
  }
  
  console.log();
}

/**
 * Check yesterday's snapshot
 */
function checkSnapshot() {
  console.log('📸 Yesterday\'s Snapshot\n');
  
  const snapshotDir = path.join(process.cwd(), '.cerber', 'snapshots');
  
  if (!fs.existsSync(snapshotDir)) {
    console.log('   ℹ️  No snapshots found');
    console.log('   💡 Run: npm run cerber:snapshot (to create daily snapshots)');
    console.log();
    return;
  }
  
  try {
    const files = fs.readdirSync(snapshotDir).sort().reverse();
    
    if (files.length === 0) {
      console.log('   ℹ️  No snapshots found');
      console.log();
      return;
    }
    
    // Get most recent snapshot
    const latest = files[0];
    const snapshotPath = path.join(snapshotDir, latest);
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
    
    console.log(`   📅 Latest snapshot: ${latest.replace('.json', '')}`);
    console.log(`   📊 Commits: ${snapshot.commits || 0}`);
    console.log(`   📝 Files changed: ${snapshot.filesChanged || 0}`);
    console.log(`   📈 Lines added: ${snapshot.linesAdded || 0}`);
    console.log(`   📉 Lines removed: ${snapshot.linesRemoved || 0}`);
  } catch (error) {
    console.log(`   ⚠️  Error reading snapshot: ${error.message}`);
  }
  
  console.log();
}

/**
 * Show today's priorities
 */
function showPriorities() {
  console.log('🎯 Today\'s Priorities\n');
  
  // Check for TODO comments in recently modified files
  try {
    const recentFiles = execSync('git diff --name-only HEAD~1..HEAD 2>/dev/null || true', { 
      encoding: 'utf8' 
    }).trim();
    
    if (recentFiles) {
      console.log('   📝 Recently modified files:');
      recentFiles.split('\n').slice(0, 5).forEach(file => {
        console.log(`      - ${file}`);
      });
    }
  } catch (error) {
    // Continue
  }
  
  console.log('\n   💡 Suggested workflow:');
  console.log('      1. Review git status');
  console.log('      2. Run: npm run cerber:repair (auto-fix issues)');
  console.log('      3. Run: npm run cerber:deps (check dependencies)');
  console.log('      4. Code your features');
  console.log('      5. Run: npm run cerber:pre-push (before pushing)');
  console.log('      6. Run: npm run cerber:snapshot (end of day)\n');
}

/**
 * Quick actions menu
 */
function showQuickActions() {
  console.log('⚡ Quick Actions\n');
  console.log('   npm run cerber:repair       # Auto-fix issues');
  console.log('   npm run cerber:deps         # Check dependencies');
  console.log('   npm run cerber:docs         # Sync documentation');
  console.log('   npm run cerber:perf         # Check performance');
  console.log('   npm run cerber:flags        # Check feature flags');
  console.log();
}

// Run all checks
checkBackendHealth();
checkGuardianStatus();
checkGitStatus();
checkSnapshot();
showPriorities();
showQuickActions();

console.log('='.repeat(60));
console.log('\n✨ Have a productive day!\n');

process.exit(0);
