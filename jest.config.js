module.exports = {
  "roots": [
    "<rootDir>/app"
  ],
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  "coverageReporters": [
    "text",
    "lcov",
    "json",
    "html"
  ],
  "reporters": [
    "default",
    ["jest-junit", {
      "outputDirectory": "output/coverage/junit",
      "outputName": "junit.xml",
      "usePathForSuiteName": true
    }]
  ],
  "testEnvironment": "node",
  "coverageDirectory": "output/coverage/jest",
  "collectCoverageFrom": [
    "app/**/*.{ts,tsx}",
    "!app/**/*.d.ts",
    "!app/**/index.{ts,tsx}",
    "!app/**/*.test.{ts,tsx}",
    "!app/**/*.spec.{ts,tsx}",
    "!app/**/__tests__/**/*"
  ]
}