import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { findForbiddenDeps, formatForbiddenDepsError } from "./dependency-verification";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "../..");

interface LambdaConfig {
  entry: string;
  outdir: string;
  forbiddenDeps?: string[];
}

const lambdas: LambdaConfig[] = [
  { entry: "src/example/api", outdir: "dist/api", forbiddenDeps: ["preact", "preact-render-to-string"] },
  { entry: "src/example/ui/server", outdir: "dist/ssr" },
  { entry: "src/example/events", outdir: "dist/events", forbiddenDeps: ["preact", "preact-render-to-string", "hono"] },
  { entry: "src/example/jobs", outdir: "dist/jobs", forbiddenDeps: ["preact", "preact-render-to-string", "hono"] },
];

const sharedConfig: esbuild.BuildOptions = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  jsx: "automatic",
  jsxImportSource: "preact",
  sourcemap: true,
  minify: false,
  metafile: true,
};

const buildLambda = async ({ entry, outdir, forbiddenDeps }: LambdaConfig) => {
  const entryFile = path.join(entry, "lambda.ts");
  const outFile = path.join(outdir, "index.js");

  console.log(`  ${entryFile} → ${outFile}`);

  const result = await esbuild.build({
    ...sharedConfig,
    entryPoints: [path.join(rootDir, entryFile)],
    outfile: path.join(rootDir, outFile),
  });

  // Check for forbidden dependencies
  if (forbiddenDeps && forbiddenDeps.length > 0 && result.metafile) {
    const found = findForbiddenDeps(result.metafile, forbiddenDeps, entryFile);
    if (found.length > 0) {
      throw new Error(formatForbiddenDepsError(outdir, found));
    }
  }

  // Write package.json for ESM support
  fs.writeFileSync(path.join(outdir, "package.json"), JSON.stringify({ type: "module" }, null, 2));
};

const build = async () => {
  console.log("Building Lambda functions...\n");

  for (const lambda of lambdas) {
    await buildLambda(lambda);
  }

  console.log("\nDone!");
};

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
