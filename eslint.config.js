import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Enforce double quotes
      "quotes": ["error", "double", { avoidEscape: true }],

      // Enforce arrow functions for callbacks
      "prefer-arrow-callback": "error",

      // Require braces for all control statements
      "curly": ["error", "all"],

      // No unused variables (use TypeScript version)
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
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
