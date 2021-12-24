// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: "./out/test",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/nock-setup.js"],

  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
};
