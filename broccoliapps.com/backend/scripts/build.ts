import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

interface LambdaConfig {
  entry: string;
  outdir: string;
}

const lambdas: LambdaConfig[] = [
  { entry: "src/example/api", outdir: "dist/api" },
  { entry: "src/example/ui/server", outdir: "dist/ssr" },
  { entry: "src/example/events", outdir: "dist/events" },
  { entry: "src/example/jobs", outdir: "dist/jobs" },
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
};

async function build() {
  console.log("Building Lambda functions...\n");

  for (const lambda of lambdas) {
    const entryPath = path.join(rootDir, lambda.entry, "lambda.ts");
    const outdir = path.join(rootDir, lambda.outdir);

    console.log(`  ${lambda.entry} → ${lambda.outdir}/index.js`);

    await esbuild.build({
      ...sharedConfig,
      entryPoints: [entryPath],
      outfile: path.join(outdir, "index.js"),
    });

    // Write package.json for ESM support
    fs.writeFileSync(path.join(outdir, "package.json"), JSON.stringify({ type: "module" }, null, 2));
  }

  console.log("\nDone!");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
