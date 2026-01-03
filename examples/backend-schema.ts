/**
 * ⚠️ EXAMPLE PATTERN (NOT SOURCE OF TRUTH)
 * 
 * This shows common Node.js/Express architecture patterns.
 * DO NOT copy blindly - customize to YOUR project structure.
 * 
 * The source of truth is CERBER.md.
 * This file is a template showing possible rules - YOU decide which fit YOUR architecture.
 * 
 * See: https://github.com/Agaslez/cerber-core#one-source-of-truth
 */

import type { GuardianSchema } from '../src/types';

export const backendSchema: GuardianSchema = {
  requiredFiles: [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    '.env.example',
    '.gitignore',
    'README.md',
  ],

  forbiddenPatterns: [
    {
      pattern: /password\s*=\s*['"][^'"]+['"]/i,
      name: 'Hardcoded passwords',
      severity: 'error',
    },
    {
      pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
      name: 'Hardcoded API keys',
      severity: 'error',
    },
    {
      pattern: /mongodb:\/\/[^'"]+:[^'"]+@/,
      name: 'MongoDB connection string with credentials',
      exceptions: ['.env.example'],
      severity: 'error',
    },
    {
      pattern: /console\.(log|debug|info)/,
      name: 'Console statements - use logger instead',
      exceptions: ['src/utils/logger.ts', 'scripts/**'],
      severity: 'warning',
    },
    {
      pattern: /eval\(|new Function\(/,
      name: 'Dangerous eval() or Function() constructor',
      severity: 'error',
    },
    {
      pattern: /app\.use\(cors\(\)\)/,
      name: 'CORS enabled for all origins - specify allowed origins',
      exceptions: ['src/middleware/cors.ts'],
      severity: 'error',
    },
    {
      pattern: /\.findOne\(|\.find\(|\.updateOne\(/,
      name: 'Direct Mongoose calls - use repository pattern',
      exceptions: ['src/repositories/**', 'src/models/**'],
      severity: 'warning',
    },
  ],

  requiredImports: {
    'src/routes/**/*.ts': ['import express', 'import { Router'],
    'src/controllers/**/*.ts': ['import { Request, Response'],
  },

  packageJsonRules: {
    requiredScripts: ['start', 'dev', 'build', 'test', 'lint'],
    requiredDependencies: ['express', 'dotenv'],
    requiredDevDependencies: ['typescript', '@types/node', '@types/express'],
  },
};

export default backendSchema;
