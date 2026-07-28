module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src/functions'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/functions/**/*.js',
    '!src/functions/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text']
};