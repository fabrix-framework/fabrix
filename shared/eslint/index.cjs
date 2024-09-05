const eslint = require("@eslint/js");
const tsEslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");
const importPlugin = require("eslint-plugin-import");
const { fixupPluginRules } = require("@eslint/compat");

module.exports = tsEslint.config(
  {
    ignores: [
      "**/eslint.config.cjs",
      "**/package.json",
      "**/tsconfig.json",
      "**/tsconfig.tsbuildinfo",
    ],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  prettier,
  {
    plugins: {
      // https://github.com/import-js/eslint-plugin-import/issues/2556
      import: fixupPluginRules(importPlugin),
    },
    languageOptions: {
      parser: tsEslint.parser,
      parserOptions: {
        project: true,
      },
      ecmaVersion: 5,
      sourceType: "script",
    },
    rules: {
      // @typescript-eslint
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": [
        "error",
        {
          fixToUnknown: true,
        },
      ],
      "@typescript-eslint/no-misused-promises": [
        "warn",
        {
          checksVoidReturn: false,
        },
      ],
      "@typescript-eslint/no-floating-promises": [
        "warn",
        {
          ignoreVoid: false,
        },
      ],
      "@typescript-eslint/no-unsafe-return": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "variable",
          modifiers: ["const"],
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
      "@typescript-eslint/ban-ts-comment": "off",

      // no-*
      "no-useless-escape": "error",
      "no-empty": "error",
      "no-var": "error",
      "no-console": "error",

      // import
      "import/order": [
        "error",
        {
          "newlines-between": "never",
        },
      ],
      "import/newline-after-import": "error",
      "import/first": "error",
    },
  }
);
