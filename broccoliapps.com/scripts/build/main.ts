import * as path from "path";
import { fileURLToPath } from "url";
import { buildApp } from "@broccoliapps/dev-tools";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

buildApp({
  rootDir,
  lambdas: [
    { entry: "src/api", outdir: "dist/api", forbiddenDeps: ["preact", "preact-render-to-string"] },
    { entry: "src/ui/server", outdir: "dist/ssr" },
    { entry: "src/events", outdir: "dist/events", forbiddenDeps: ["preact", "preact-render-to-string", "hono"] },
    { entry: "src/jobs", outdir: "dist/jobs", forbiddenDeps: ["preact", "preact-render-to-string", "hono"] },
  ],
  clients: [
    { name: "app", entry: "src/ui/client/index.tsx", cssEntry: "src/ui/client/app.css" },
  ],
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
