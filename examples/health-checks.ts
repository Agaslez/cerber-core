/**
 * Example Health Checks for Cerber
 * Shows typical runtime checks for web applications
 */

import * as fs from 'fs';
import * as path from 'path';
import { makeIssue } from '../src/cerber';
import type { CerberCheck } from '../src/types';

/**
 * Check if required environment variables are set
 */
export const checkEnvVariables: CerberCheck = async (ctx) => {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'API_PORT',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    return [makeIssue({
      code: 'ENV_MISSING',
      component: 'Environment',
      severity: 'critical',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      fix: 'Set missing variables in .env file or environment',
    })];
  }

  return [];
};

/**
 * Check database connectivity
 */
export const checkDatabase: CerberCheck = async (ctx) => {
  const startTime = Date.now();
  
  try {
    // Example: ping database
    // await db.ping();
    
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      return [makeIssue({
        code: 'DB_SLOW',
        component: 'Database',
        severity: 'warning',
        message: `Database connection slow: ${duration}ms`,
        durationMs: duration,
        fix: 'Check database performance and connection pool settings',
      })];
    }

    return [];
  } catch (err) {
    return [makeIssue({
      code: 'DB_DOWN',
      component: 'Database',
      severity: 'critical',
      message: `Database connection failed: ${err.message}`,
      rootCause: err.stack,
      fix: 'Verify DATABASE_URL and database server status',
    })];
  }
};

/**
 * Check disk space
 */
export const checkDiskSpace: CerberCheck = async (ctx) => {
  // This is OS-specific, simplified example
  try {
    const stats = fs.statfsSync(ctx.rootDir);
    const freePercent = (stats.bavail / stats.blocks) * 100;

    if (freePercent < 10) {
      return [makeIssue({
        code: 'DISK_LOW',
        component: 'System',
        severity: 'critical',
        message: `Disk space critically low: ${freePercent.toFixed(1)}% free`,
        fix: 'Free up disk space or increase volume size',
        details: { freePercent },
      })];
    }

    if (freePercent < 20) {
      return [makeIssue({
        code: 'DISK_WARNING',
        component: 'System',
        severity: 'warning',
        message: `Disk space running low: ${freePercent.toFixed(1)}% free`,
        details: { freePercent },
      })];
    }

    return [];
  } catch (err) {
    return [makeIssue({
      code: 'DISK_CHECK_FAILED',
      component: 'System',
      severity: 'warning',
      message: `Unable to check disk space: ${err.message}`,
    })];
  }
};

/**
 * Check if required files exist
 */
export const checkRequiredFiles: CerberCheck = async (ctx) => {
  const required = [
    '.env',
    'package.json',
    'package-lock.json',
  ];

  const missing = required.filter(file => 
    !fs.existsSync(path.join(ctx.rootDir, file))
  );

  if (missing.length > 0) {
    return [makeIssue({
      code: 'FILES_MISSING',
      component: 'Configuration',
      severity: 'error',
      message: `Missing required files: ${missing.join(', ')}`,
      fix: 'Create missing configuration files',
      details: { missing },
    })];
  }

  return [];
};

/**
 * Check memory usage
 */
export const checkMemoryUsage: CerberCheck = async (ctx) => {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

  if (heapUsedPercent > 90) {
    return [makeIssue({
      code: 'MEMORY_HIGH',
      component: 'System',
      severity: 'critical',
      message: `Memory usage critically high: ${heapUsedPercent.toFixed(1)}%`,
      fix: 'Restart application or investigate memory leaks',
      details: {
        heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      },
    })];
  }

  return [];
};

/**
 * Check package.json and lock file sync
 */
export const checkPackageLockSync: CerberCheck = async (ctx) => {
  const packagePath = path.join(ctx.rootDir, 'package.json');
  const lockPath = path.join(ctx.rootDir, 'package-lock.json');

  if (!fs.existsSync(lockPath)) {
    return [makeIssue({
      code: 'LOCK_MISSING',
      component: 'Dependencies',
      severity: 'warning',
      message: 'package-lock.json is missing',
      fix: 'Run npm install to generate lock file',
    })];
  }

  const packageMtime = fs.statSync(packagePath).mtime;
  const lockMtime = fs.statSync(lockPath).mtime;

  if (packageMtime > lockMtime) {
    return [makeIssue({
      code: 'LOCK_OUTDATED',
      component: 'Dependencies',
      severity: 'warning',
      message: 'package-lock.json is older than package.json',
      fix: 'Run npm install to update lock file',
    })];
  }

  return [];
};
