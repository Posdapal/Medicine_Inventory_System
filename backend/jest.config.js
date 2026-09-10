module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/tests/unit/**/*.test.js'],
  clearMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  collectCoverageFrom: [
    'src/controllers/**/*.js', 'src/services/**/*.js', 'src/middleware/**/*.js',
    'src/schedulers/**/*.js', 'src/utils/**/*.js',
    '!src/controllers/roles.controller.js', '!src/controllers/permissions.controller.js',
  ],
  coverageReporters: ['text', 'html', 'json', 'json-summary'],
  coverageThreshold: { global: { statements: 75, branches: 75, functions: 75, lines: 75 } },
};
