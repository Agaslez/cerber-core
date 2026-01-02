#!/usr/bin/env node

/**
 * Cerber SOLO - Performance Budget Enforcer
 * 
 * Extends Cerber Core with automation for solo developers
 * 
 * Enforces:
 * - Total bundle size limit
 * - Largest chunk limit
 * - Image size constraints
 * - Blocks build if exceeded
 * 
 * @author Stefan Pitek
 * @copyright 2026 Stefan Pitek
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📊 Cerber SOLO - Performance Budget Enforcer\n');

// Load configuration
function loadConfig() {
  const configPath = path.join(__dirname, '../config/performance-budget.json');
  
  if (!fs.existsSync(configPath)) {
    console.log('⚠️  No performance-budget.json found, using defaults');
    return {
      bundleSize: { max: 500, warning: 400, unit: 'KB' },
      largestChunk: { max: 250, warning: 200, unit: 'KB' },
      images: { max: 200, unit: 'KB' }
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.log(`❌ Error loading config: ${error.message}`);
    process.exit(1);
  }
}

const config = loadConfig();
const violations = [];
const warnings = [];

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size / 1024;
}

/**
 * Find all JS bundle files
 */
function findBundleFiles() {
  const distDirs = ['dist', 'build', 'out', '.next'];
  
  for (const dir of distDirs) {
    const distPath = path.join(process.cwd(), dir);
    if (fs.existsSync(distPath)) {
      console.log(`📁 Found build directory: ${dir}`);
      return { dir, path: distPath };
    }
  }
  
  return null;
}

/**
 * Recursively find all files matching pattern
 */
function findFiles(dir, pattern, results = []) {
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, pattern, results);
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  });
  
  return results;
}

/**
 * Check bundle sizes
 */
function checkBundleSizes() {
  console.log('\n📦 Checking bundle sizes...\n');
  
  const buildInfo = findBundleFiles();
  
  if (!buildInfo) {
    console.log('⚠️  No build directory found (dist/build/out/.next)');
    console.log('   Run your build command first (npm run build)');
    return;
  }
  
  // Find all JS files
  const jsFiles = findFiles(buildInfo.path, /\.js$/);
  
  if (jsFiles.length === 0) {
    console.log('ℹ️  No JavaScript bundles found');
    return;
  }
  
  let totalSize = 0;
  let largestFile = null;
  let largestSize = 0;
  
  jsFiles.forEach(file => {
    const sizeKB = getFileSizeKB(file);
    totalSize += sizeKB;
    
    if (sizeKB > largestSize) {
      largestSize = sizeKB;
      largestFile = file;
    }
    
    const relativePath = path.relative(process.cwd(), file);
    
    // Check individual chunk size
    if (config.largestChunk && sizeKB > config.largestChunk.max) {
      console.log(`  🔴 ${relativePath}: ${sizeKB.toFixed(1)} KB (EXCEEDS ${config.largestChunk.max} KB)`);
      violations.push({
        type: 'chunk-size',
        file: relativePath,
        size: sizeKB,
        limit: config.largestChunk.max
      });
    } else if (config.largestChunk && sizeKB > config.largestChunk.warning) {
      console.log(`  🟡 ${relativePath}: ${sizeKB.toFixed(1)} KB (warning: ${config.largestChunk.warning} KB)`);
      warnings.push({
        type: 'chunk-size',
        file: relativePath,
        size: sizeKB,
        limit: config.largestChunk.warning
      });
    } else {
      console.log(`  ✅ ${relativePath}: ${sizeKB.toFixed(1)} KB`);
    }
  });
  
  console.log(`\n📊 Total bundle size: ${totalSize.toFixed(1)} KB`);
  
  if (config.bundleSize) {
    if (totalSize > config.bundleSize.max) {
      console.log(`  🔴 EXCEEDS limit of ${config.bundleSize.max} KB`);
      violations.push({
        type: 'total-size',
        size: totalSize,
        limit: config.bundleSize.max
      });
    } else if (totalSize > config.bundleSize.warning) {
      console.log(`  🟡 Warning: Approaching limit (${config.bundleSize.warning} KB)`);
      warnings.push({
        type: 'total-size',
        size: totalSize,
        limit: config.bundleSize.warning
      });
    } else {
      console.log(`  ✅ Within budget (${config.bundleSize.max} KB)`);
    }
  }
  
  if (largestFile) {
    console.log(`\n📦 Largest chunk: ${path.relative(process.cwd(), largestFile)} (${largestSize.toFixed(1)} KB)`);
  }
}

/**
 * Check image sizes
 */
function checkImageSizes() {
  console.log('\n🖼️  Checking image sizes...\n');
  
  const imageDirs = ['public', 'static', 'assets', 'src/assets'];
  let imagesFound = false;
  
  imageDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) return;
    
    const images = findFiles(dirPath, /\.(jpg|jpeg|png|gif|webp|svg)$/i);
    
    if (images.length === 0) return;
    
    imagesFound = true;
    
    images.forEach(file => {
      const sizeKB = getFileSizeKB(file);
      const relativePath = path.relative(process.cwd(), file);
      
      if (config.images && sizeKB > config.images.max) {
        console.log(`  🔴 ${relativePath}: ${sizeKB.toFixed(1)} KB (EXCEEDS ${config.images.max} KB)`);
        violations.push({
          type: 'image-size',
          file: relativePath,
          size: sizeKB,
          limit: config.images.max
        });
      } else if (sizeKB > 100) {
        console.log(`  🟡 ${relativePath}: ${sizeKB.toFixed(1)} KB`);
      } else {
        console.log(`  ✅ ${relativePath}: ${sizeKB.toFixed(1)} KB`);
      }
    });
  });
  
  if (!imagesFound) {
    console.log('ℹ️  No images found in common directories');
  }
}

// Run checks
checkBundleSizes();
checkImageSizes();

// Summary
console.log('\n' + '='.repeat(60));

if (violations.length > 0) {
  console.log('\n❌ PERFORMANCE BUDGET VIOLATED\n');
  violations.forEach(v => {
    if (v.type === 'total-size') {
      console.log(`  🔴 Total bundle size: ${v.size.toFixed(1)} KB (limit: ${v.limit} KB)`);
    } else if (v.type === 'chunk-size') {
      console.log(`  🔴 ${v.file}: ${v.size.toFixed(1)} KB (limit: ${v.limit} KB)`);
    } else if (v.type === 'image-size') {
      console.log(`  🔴 ${v.file}: ${v.size.toFixed(1)} KB (limit: ${v.limit} KB)`);
    }
  });
  
  console.log('\n💡 Recommendations:');
  console.log('   - Enable code splitting');
  console.log('   - Use dynamic imports');
  console.log('   - Compress images');
  console.log('   - Remove unused dependencies');
  console.log('   - Analyze bundle with webpack-bundle-analyzer');
  
  console.log('\n='.repeat(60));
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  Performance warnings detected\n');
  warnings.forEach(w => {
    if (w.type === 'total-size') {
      console.log(`  🟡 Total bundle size: ${w.size.toFixed(1)} KB (warning: ${w.limit} KB)`);
    } else if (w.type === 'chunk-size') {
      console.log(`  🟡 ${w.file}: ${w.size.toFixed(1)} KB (warning: ${w.limit} KB)`);
    }
  });
  
  console.log('\n='.repeat(60));
  process.exit(0);
} else {
  console.log('\n✅ All performance budgets met!\n');
  console.log('='.repeat(60));
  process.exit(0);
}
