// @ts-check

/**
 * StrykerJS Mutation Testing Configuration
 * 
 * Verifies that tests actually catch regressions by mutating source code
 * and checking if tests fail. Target mutation score: > 55%
 */

/** @type {import('@stryker-mutator/core').StrykerOptions} */
const config = {
  // Package manager
  packageManager: 'npm',

  // Test runner
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.cjs',
  },

  // TypeScript configuration
  tsconfigFile: 'tsconfig.json',

  // Mutation coverage targets
  mutate: [
    // Core orchestrator logic
    'src/core/Orchestrator.ts',
    
    // Adapter implementations
    'src/adapters/ActionlintAdapter.ts',
    'src/adapters/GitleaksAdapter.ts',
    'src/adapters/ZizmorAdapter.ts',

    // Utilities
    'src/utils/*.ts',
    'src/reporting/*.ts',
    'src/scm/git.ts',

    // Exclude type definitions and test helpers
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],

  // Disable mutation of specific files/patterns
  ignoreStatic: false,

  // Concurrency
  concurrency: 4, // Use 4 workers
  timeoutMS: 5000,
  timeoutFactor: 1.25,

  // Reporters
  reporters: ['html', 'json', 'text', 'text-summary'],
  htmlReporter: {
    baseDir: 'stryker-report',
  },
  jsonReporter: {
    baseDir: '.', // Report in project root
  },

  // Mutation score thresholds
  thresholds: {
    high: 75, // Aim for 75% coverage
    medium: 65, // At least 65%
    low: 55, // Minimum 55%
  },

  // Disable killing test runner between mutations for speed
  disableBail: false,

  // Disable type checker during mutations (faster, but less safe)
  disableTypeCheck: true,

  // Log level
  logLevel: 'info',

  // Dashboard report (optional)
  // dashboard: {
  //   project: 'github.com/your/project',
  //   version: '1.0.0',
  //   module: 'cerber-core',
  // },

  // Plugins to use
  plugins: ['@stryker-mutator/typescript-checker'],

  // Jest config overrides for mutation testing
  commandRunner: {
    command: 'npm',
  },

  // Mutants to skip (if any are causing issues)
  // skipType: [],

  // Target language version
  // languageVersion: 'ES2020',

  // Clear text reporter options
  clearTextReporter: {
    allowConsoleColors: true,
  },
};

export default config;
