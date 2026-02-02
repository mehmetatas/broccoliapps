import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Enforce double quotes
      quotes: ["error", "double", { avoidEscape: true }],

      // Enforce arrow functions for callbacks
      "prefer-arrow-callback": "error",

      // Require braces for all control statements
      curly: ["error", "all"],

      // Disallow single-line braced blocks (e.g. if (x) { return; })
      "brace-style": ["error", "1tbs", { allowSingleLine: false }],

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
      "**/dist/**",
      "**/node_modules/**",
      "**/cdk.out/**",
      "**/build/**",
      "expense-tracker/mobile-app/**",
      "ema-pulse/mobile-app/**",
    ],
  }
);
