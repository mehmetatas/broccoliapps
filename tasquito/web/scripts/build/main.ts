import * as path from "path";
import { fileURLToPath } from "url";
import { buildApp } from "@broccoliapps/dev-tools";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

buildApp({
  rootDir,
  lambdas: [
    { entry: "src/api", outdir: "dist/api", forbiddenDeps: ["preact", "preact-render-to-string"] },
    { entry: "src/ui/www/server", outdir: "dist/www" },
  ],
  clients: [
    { name: "www", entry: "src/ui/www/client/index.tsx", cssEntry: "src/ui/www/client/app.css" },
    { name: "app", entry: "src/ui/app/index.tsx", cssEntry: "src/ui/app/app.css" },
  ],
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
