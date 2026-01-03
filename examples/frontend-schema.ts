/**
 * ⚠️ EXAMPLE PATTERN (NOT SOURCE OF TRUTH)
 * 
 * This shows common React/Vue architecture patterns.
 * DO NOT copy blindly - customize to YOUR project structure.
 * 
 * The source of truth is CERBER.md.
 * This file is a template showing possible rules - YOU decide which fit YOUR architecture.
 * 
 * See: https://github.com/Agaslez/cerber-core#one-source-of-truth
 */

import type { GuardianSchema } from '../src/types';

export const frontendSchema: GuardianSchema = {
  requiredFiles: [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts', // or webpack.config.js
    '.gitignore',
    'README.md',
  ],

  forbiddenPatterns: [
    {
      pattern: /console\.(log|debug|info)/,
      name: 'Console statements in production code',
      exceptions: ['src/utils/logger.ts', 'src/dev/**'],
      severity: 'warning',
    },
    {
      pattern: /any\s+as\s+any|:\s*any/,
      name: 'TypeScript any type',
      exceptions: ['src/legacy/**'],
      severity: 'error',
    },
    {
      pattern: /fetch\(/,
      name: 'Direct fetch() calls - use apiClient instead',
      exceptions: ['src/api/apiClient.ts'],
      severity: 'error',
    },
    {
      pattern: /localStorage\.|sessionStorage\./,
      name: 'Direct storage access - use storageService',
      exceptions: ['src/services/storageService.ts'],
      severity: 'warning',
    },
    {
      pattern: /process\.env/,
      name: 'Direct environment variable access - use config',
      exceptions: ['src/config/env.ts', 'vite.config.ts'],
      severity: 'error',
    },
    {
      pattern: /\.test\.skip\(|\.describe\.skip\(/,
      name: 'Skipped tests',
      severity: 'warning',
    },
  ],

  requiredImports: {
    'src/components/**/*.tsx': ['import React', "import { FC, ReactNode"],
    'src/pages/**/*.tsx': ['import React'],
  },

  packageJsonRules: {
    requiredScripts: ['dev', 'build', 'test', 'lint'],
    requiredDevDependencies: ['typescript', 'vite', '@types/node'],
  },
};

export default frontendSchema;
