module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  testTimeout: process.env.CI ? 20000 : 10000,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  
  // Support for test tags (@fast, @integration, @e2e, @signals)
  // Usage: npm run test:fast   (runs only @fast tests)
  testNamePattern: process.env.CERBER_TEST_TAG
    ? process.env.CERBER_TEST_TAG
    : undefined,
  
  // Increase timeout for heavy tests
  maxWorkers: process.env.CI ? '50%' : 'auto',
};
