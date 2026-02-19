module.exports = {
  extends: "@react-native",
  rules: {
    "react-native/no-inline-styles": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  },
};
