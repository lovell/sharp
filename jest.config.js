/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  // extent timeout to 1 minute
  testTimeout: 60000,

  // setup and teardown sharp for unit tests
  globalSetup: '<rootDir>/test/unit-setup.js',
  globalTeardown: '<rootDir>/test/unit-teardown.js',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: [
    'json',
    'lcov',
    'clover'
  ],

  // An array of file extensions your modules use
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '<rootDir>/test/unit/*.js'
  ]
};
