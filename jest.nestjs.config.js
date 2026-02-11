module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
  coverageDirectory: 'output/coverage/jest',
  coverageReporters: ['text', 'lcov', 'json', 'html'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@categories/(.*)$': '<rootDir>/src/categories/$1',
    '^@traps/(.*)$': '<rootDir>/src/traps/$1',
    '^@translation/(.*)$': '<rootDir>/src/translation/$1',
    '^@health/(.*)$': '<rootDir>/src/health/$1',
  },
};
