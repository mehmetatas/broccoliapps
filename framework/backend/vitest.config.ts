import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/db/**/*.ts"],
      exclude: ["src/db/**/*.test.ts", "src/db/types.ts", "src/db/index.ts"],
    },
  },
});
