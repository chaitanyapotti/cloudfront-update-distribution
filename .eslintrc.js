require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ["@toruslabs/node"],
  ignorePatterns: [".eslintrc.js"],
  parser: "@typescript-eslint/parser",
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2021,
    project: "./tsconfig.json",
    sourceType: "module",
  },
};
