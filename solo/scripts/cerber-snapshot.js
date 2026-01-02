#!/usr/bin/env node

/**
 * Cerber SOLO - Snapshot Tool
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Captures:
 * - Git statistics
 * - File counts
 * - LOC metrics
 * - Guardian status
 * - Saves to .cerber/snapshots/ (30-day retention)
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📸 Cerber SOLO - Daily Snapshot\n');

const snapshotDir = path.join(process.cwd(), '.cerber', 'snapshots');
const date = new Date();
const dateStr = date.toISOString().split('T')[0];
const timestamp = date.toISOString();

// Create snapshot directory
if (!fs.existsSync(snapshotDir)) {
  fs.mkdirSync(snapshotDir, { recursive: true });
  console.log(`✅ Created snapshot directory: ${snapshotDir}\n`);
}

const snapshot = {
  date: dateStr,
  timestamp: timestamp,
  version: '2.0-solo'
};

/**
 * Capture Git statistics
 */
function captureGitStats() {
  console.log('📊 Capturing Git statistics...');
  
  try {
    // Total commits
    const totalCommits = execSync('git rev-list --all --count', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    snapshot.git = {
      totalCommits: parseInt(totalCommits)
    };
    
    // Today's commits
    const todayCommits = execSync(`git log --since="00:00:00" --oneline | wc -l`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    snapshot.git.commitsToday = parseInt(todayCommits);
    
    // Current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    snapshot.git.branch = branch;
    
    // Get today's stats
    try {
      const stats = execSync(`git diff --shortstat HEAD~1..HEAD 2>/dev/null || echo "0 files changed"`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      
      const filesMatch = stats.match(/(\d+) file[s]? changed/);
      const insertionsMatch = stats.match(/(\d+) insertion[s]?\(\+\)/);
      const deletionsMatch = stats.match(/(\d+) deletion[s]?\(-\)/);
      
      snapshot.git.filesChanged = filesMatch ? parseInt(filesMatch[1]) : 0;
      snapshot.git.linesAdded = insertionsMatch ? parseInt(insertionsMatch[1]) : 0;
      snapshot.git.linesRemoved = deletionsMatch ? parseInt(deletionsMatch[1]) : 0;
    } catch (error) {
      // First commit or no changes
      snapshot.git.filesChanged = 0;
      snapshot.git.linesAdded = 0;
      snapshot.git.linesRemoved = 0;
    }
    
    console.log(`   ✅ Total commits: ${snapshot.git.totalCommits}`);
    console.log(`   ✅ Today's commits: ${snapshot.git.commitsToday}`);
    console.log(`   ✅ Branch: ${snapshot.git.branch}`);
    console.log(`   ✅ Files changed: ${snapshot.git.filesChanged}`);
    console.log(`   ✅ Lines: +${snapshot.git.linesAdded} -${snapshot.git.linesRemoved}`);
  } catch (error) {
    console.log('   ⚠️  Not a git repository');
    snapshot.git = { error: 'Not a git repository' };
  }
  
  console.log();
}

/**
 * Count files by type
 */
function captureFileCounts() {
  console.log('📁 Counting files...');
  
  const extensions = {
    '.ts': 0,
    '.tsx': 0,
    '.js': 0,
    '.jsx': 0,
    '.json': 0,
    '.md': 0
  };
  
  function countFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    // Skip node_modules, dist, build, etc.
    const skipDirs = ['node_modules', 'dist', 'build', '.git', '.next', 'out', 'coverage'];
    const dirName = path.basename(dir);
    if (skipDirs.includes(dirName)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        countFiles(filePath);
      } else {
        const ext = path.extname(file);
        if (extensions.hasOwnProperty(ext)) {
          extensions[ext]++;
        }
      }
    });
  }
  
  countFiles(process.cwd());
  
  snapshot.files = extensions;
  
  const total = Object.values(extensions).reduce((a, b) => a + b, 0);
  console.log(`   ✅ Total files: ${total}`);
  Object.entries(extensions).forEach(([ext, count]) => {
    if (count > 0) {
      console.log(`      ${ext}: ${count}`);
    }
  });
  
  console.log();
}

/**
 * Count lines of code
 */
function captureLOC() {
  console.log('📏 Counting lines of code...');
  
  try {
    // Use cloc if available, otherwise use simple wc
    try {
      const clocOutput = execSync('cloc . --json 2>/dev/null', { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
      
      const clocData = JSON.parse(clocOutput);
      
      if (clocData.SUM) {
        snapshot.loc = {
          total: clocData.SUM.code || 0,
          comments: clocData.SUM.comment || 0,
          blank: clocData.SUM.blank || 0
        };
        
        console.log(`   ✅ Code lines: ${snapshot.loc.total}`);
        console.log(`   ✅ Comments: ${snapshot.loc.comments}`);
        console.log(`   ✅ Blank lines: ${snapshot.loc.blank}`);
      }
    } catch (error) {
      // cloc not available, use simple line count
      const tsLines = execSync(`find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo 0`, { 
        encoding: 'utf8'
      }).trim();
      
      snapshot.loc = {
        total: parseInt(tsLines) || 0,
        method: 'simple'
      };
      
      console.log(`   ✅ Estimated lines: ${snapshot.loc.total}`);
      console.log('   ℹ️  Install cloc for detailed stats');
    }
  } catch (error) {
    console.log('   ⚠️  Could not count LOC');
    snapshot.loc = { error: error.message };
  }
  
  console.log();
}

/**
 * Check Guardian status
 */
function captureGuardianStatus() {
  console.log('🛡️  Checking Guardian status...');
  
  const guardianPaths = [
    'scripts/validate-schema.mjs',
    'scripts/validate-schema.js',
    '.husky/pre-commit'
  ];
  
  const guardianExists = guardianPaths.some(p => 
    fs.existsSync(path.join(process.cwd(), p))
  );
  
  snapshot.guardian = {
    installed: guardianExists
  };
  
  console.log(`   ${guardianExists ? '✅' : '⚠️'}  Guardian: ${guardianExists ? 'installed' : 'not detected'}`);
  console.log();
}

/**
 * Check package.json info
 */
function capturePackageInfo() {
  console.log('📦 Checking package info...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packagePath)) {
    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      snapshot.package = {
        name: packageData.name || 'unknown',
        version: packageData.version || '0.0.0',
        dependencies: Object.keys(packageData.dependencies || {}).length,
        devDependencies: Object.keys(packageData.devDependencies || {}).length
      };
      
      console.log(`   ✅ Project: ${snapshot.package.name}@${snapshot.package.version}`);
      console.log(`   ✅ Dependencies: ${snapshot.package.dependencies}`);
      console.log(`   ✅ Dev dependencies: ${snapshot.package.devDependencies}`);
    } catch (error) {
      console.log('   ⚠️  Could not parse package.json');
    }
  } else {
    console.log('   ℹ️  No package.json found');
  }
  
  console.log();
}

// Capture all data
captureGitStats();
captureFileCounts();
captureLOC();
captureGuardianStatus();
capturePackageInfo();

// Save snapshot
const snapshotPath = path.join(snapshotDir, `${dateStr}.json`);
fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');

console.log('💾 Snapshot saved!');
console.log(`   Location: ${snapshotPath}\n`);

// Cleanup old snapshots (keep 30 days)
console.log('🧹 Cleaning up old snapshots...');

try {
  const files = fs.readdirSync(snapshotDir);
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  let deleted = 0;
  
  files.forEach(file => {
    const filePath = path.join(snapshotDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.mtime.getTime() < thirtyDaysAgo) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  });
  
  if (deleted > 0) {
    console.log(`   ✅ Deleted ${deleted} old snapshot(s)`);
  } else {
    console.log(`   ✅ No old snapshots to delete`);
  }
} catch (error) {
  console.log('   ⚠️  Could not cleanup old snapshots');
}

console.log();
console.log('='.repeat(60));
console.log('\n✅ Snapshot complete!\n');
console.log('📊 View your snapshots in: .cerber/snapshots/\n');
console.log('='.repeat(60));

process.exit(0);
