module.exports = {
  "projects": [
    {
      "displayName": "legacy",
      "roots": [
        "<rootDir>/app"
      ],
      "transform": {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.legacy.json" }]
      },
      "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
      "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
      "testEnvironment": "node"
    },
    {
      "displayName": "nestjs",
      "roots": [
        "<rootDir>/src"
      ],
      "transform": {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }]
      },
      "testRegex": "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
      "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
      "testEnvironment": "node",
      "moduleNameMapper": {
        "^@common/(.*)$": "<rootDir>/src/common/$1",
        "^@categories/(.*)$": "<rootDir>/src/categories/$1",
        "^@traps/(.*)$": "<rootDir>/src/traps/$1",
        "^@translation/(.*)$": "<rootDir>/src/translation/$1",
        "^@health/(.*)$": "<rootDir>/src/health/$1"
      }
    }
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
  "coverageDirectory": "output/coverage/jest",
  "collectCoverageFrom": [
    "app/**/*.{ts,tsx}",
    "src/**/*.{ts,tsx}",
    "!app/**/*.d.ts",
    "!src/**/*.d.ts",
    "!app/**/index.{ts,tsx}",
    "!src/**/index.{ts,tsx}",
    "!app/**/*.test.{ts,tsx}",
    "!app/**/*.spec.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
    "!app/**/__tests__/**/*",
    "!src/**/__tests__/**/*"
  ]
}