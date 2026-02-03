import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact()],
  root: ".",
  publicDir: false,
  server: {
    port: 5080,
    strictPort: true,
    cors: true,
  },
  build: {
    // We use esbuild for production builds
    // Vite is only for dev server with HMR
    outDir: "dist/static",
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      // Ensure preact is resolved correctly
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
});
