#!/usr/bin/env node

/**
 * Cerber SOLO - Dashboard
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Features:
 * - Colored terminal output
 * - System health summary
 * - Quick actions menu
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const { execSync } = require('child_process');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

function colorize(text, color) {
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function header(text) {
  console.log();
  console.log(colorize('='.repeat(60), 'cyan'));
  console.log(colorize(text, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan'));
  console.log();
}

function section(title) {
  console.log(colorize(`\n${title}`, 'yellow'));
  console.log(colorize('-'.repeat(40), 'dim'));
}

function success(text) {
  console.log(colorize(`✅ ${text}`, 'green'));
}

function warning(text) {
  console.log(colorize(`⚠️  ${text}`, 'yellow'));
}

function error(text) {
  console.log(colorize(`❌ ${text}`, 'red'));
}

function info(text) {
  console.log(colorize(`ℹ️  ${text}`, 'blue'));
}

function metric(label, value, status = 'normal') {
  const statusColor = status === 'good' ? 'green' : 
                      status === 'warning' ? 'yellow' : 
                      status === 'error' ? 'red' : 'white';
  console.log(`   ${colorize(label + ':', 'dim')} ${colorize(value, statusColor)}`);
}

// Main dashboard
header('🛡️  Cerber SOLO Dashboard');

// System status
section('📊 System Status');

try {
  const packagePath = require('path').join(process.cwd(), 'package.json');
  const fs = require('fs');
  
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    metric('Project', pkg.name || 'unknown');
    metric('Version', pkg.version || '0.0.0');
    success('Package configuration found');
  } else {
    warning('No package.json found');
  }
} catch (err) {
  error('Could not read package.json');
}

// Git status
section('📂 Git Status');

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
    encoding: 'utf8',
    stdio: 'pipe'
  }).trim();
  
  metric('Branch', branch);
  
  const status = execSync('git status --short', { encoding: 'utf8', stdio: 'pipe' }).trim();
  
  if (status) {
    const lines = status.split('\n').length;
    warning(`${lines} file(s) with changes`);
  } else {
    success('Working directory clean');
  }
  
  // Check for unpushed commits
  try {
    const unpushed = execSync('git log @{u}.. --oneline 2>/dev/null || true', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    
    if (unpushed) {
      const count = unpushed.split('\n').filter(l => l.trim()).length;
      info(`${count} unpushed commit(s)`);
    }
  } catch (err) {
    // No upstream
  }
} catch (err) {
  info('Not a git repository');
}

// Guardian status
section('🛡️  Guardian Status');

const guardianPaths = [
  'scripts/validate-schema.mjs',
  'scripts/validate-schema.js',
  '.husky/pre-commit'
];

const guardianExists = guardianPaths.some(p => {
  const fs = require('fs');
  const path = require('path');
  return fs.existsSync(path.join(process.cwd(), p));
});

if (guardianExists) {
  success('Guardian installed and active');
} else {
  warning('Guardian not detected');
}

// SOLO tools
section('⚡ SOLO Tools');

const tools = [
  { name: 'Auto-repair', cmd: 'cerber:repair' },
  { name: 'Deps health', cmd: 'cerber:deps' },
  { name: 'Performance', cmd: 'cerber:perf' },
  { name: 'Docs sync', cmd: 'cerber:docs' },
  { name: 'Feature flags', cmd: 'cerber:flags' },
  { name: 'Snapshot', cmd: 'cerber:snapshot' }
];

console.log();
tools.forEach(tool => {
  console.log(`   ${colorize('•', 'cyan')} ${tool.name}: ${colorize(`npm run ${tool.cmd}`, 'dim')}`);
});

// Quick actions
section('🚀 Quick Actions');

console.log();
console.log(colorize('  1.', 'bright') + ' Run morning check:     ' + colorize('npm run cerber:morning', 'cyan'));
console.log(colorize('  2.', 'bright') + ' Auto-fix issues:       ' + colorize('npm run cerber:repair', 'cyan'));
console.log(colorize('  3.', 'bright') + ' Check dependencies:    ' + colorize('npm run cerber:deps', 'cyan'));
console.log(colorize('  4.', 'bright') + ' Before pushing:        ' + colorize('npm run cerber:pre-push', 'cyan'));
console.log(colorize('  5.', 'bright') + ' End of day snapshot:   ' + colorize('npm run cerber:snapshot', 'cyan'));

// Footer
console.log();
console.log(colorize('='.repeat(60), 'cyan'));
console.log(colorize('\n✨ Cerber SOLO - Built by Stefan Pitek\n', 'magenta'));

process.exit(0);
