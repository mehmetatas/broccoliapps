import eslint from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "unused-imports": unusedImports,
      "@stylistic": stylistic,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Enforce double quotes
      quotes: ["error", "double", { avoidEscape: true }],

      // Require semicolons
      semi: ["error", "always"],

      // Enforce arrow functions for callbacks
      "prefer-arrow-callback": "error",

      // Enforce consistent indentation
      indent: ["error", 2],

      // Require braces for all control statements
      curly: ["error", "all"],

      // Disallow single-line braced blocks (e.g. if (x) { return; })
      "brace-style": ["error", "1tbs", { allowSingleLine: false }],

      // No spaces before commas, require space after commas
      "comma-spacing": ["error", { before: false, after: true }],

      // No spaces inside JSX curly braces
      "@stylistic/jsx-curly-spacing": ["error", { when: "never", children: true }],

      // No unnecessary parentheses
      "no-extra-parens": ["error", "all", { ignoreJSX: "multi-line" }],

      // No trailing whitespace
      "no-trailing-spaces": "error",

      // Max 1 consecutive empty line
      "no-multiple-empty-lines": ["error", { max: 1 }],

      // Disable base rules (let unused-imports handle it)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // Auto-remove unused imports
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [
      "**/*.js", // these are often config files like jest.config.js
      "**/dist/**",
      "**/node_modules/**",
      "**/cdk.out/**",
      "**/build/**",
      "expense-tracker/mobile-app/**",
      "ema-pulse/mobile-app/**",
    ],
  }
);
