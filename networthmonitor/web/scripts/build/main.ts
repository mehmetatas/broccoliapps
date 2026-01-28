import { execSync } from "child_process";
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "../..");

// Build ID for cache busting (timestamp format: yyyyMMddHHmmss)
const isDevBuild = process.env.NODE_ENV === "development";
const buildId = isDevBuild ? "" : new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);

interface LambdaConfig {
  entry: string;
  outdir: string;
  forbiddenDeps?: string[];
}

const lambdas: LambdaConfig[] = [
  { entry: "src/api", outdir: "dist/api", forbiddenDeps: ["preact", "preact-render-to-string"] },
  { entry: "src/ui/www/server", outdir: "dist/www" },
  { entry: "src/jobs", outdir: "dist/jobs", forbiddenDeps: ["preact", "preact-render-to-string"] },
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
  banner: {
    js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
  },
};

// Define globals for SSR builds
const ssrDefines = {
  __BUILD_ID__: JSON.stringify(buildId),
};

const buildLambda = async ({ entry, outdir }: LambdaConfig) => {
  // Support both .ts and .tsx lambda files
  const entryFile = path.join(entry, "lambda.ts");
  const outFile = path.join(outdir, "index.js");

  console.log(`  ${entryFile} → ${outFile}`);

  // www needs BUILD_ID for static asset references
  const needsBuildId = entry.startsWith("src/ui/");

  await esbuild.build({
    ...sharedConfig,
    entryPoints: [path.join(rootDir, entryFile)],
    outfile: path.join(rootDir, outFile),
    define: needsBuildId ? ssrDefines : undefined,
  });

  // Write package.json for ESM support
  fs.mkdirSync(path.join(rootDir, outdir), { recursive: true });
  fs.writeFileSync(path.join(rootDir, outdir, "package.json"), JSON.stringify({ type: "module" }, null, 2));
};

interface ClientConfig {
  name: string;
  entry: string;
  cssEntry: string;
}

const clients: ClientConfig[] = [
  { name: "www", entry: "src/ui/www/client/index.tsx", cssEntry: "src/ui/www/client/app.css" },
  { name: "app", entry: "src/ui/app/index.tsx", cssEntry: "src/ui/app/app.css" },
];

const buildClient = async ({ name, entry, cssEntry }: ClientConfig) => {
  const jsFileName = buildId ? `${name}.${buildId}.js` : `${name}.js`;
  const cssFileName = buildId ? `${name}.${buildId}.css` : `${name}.css`;
  const outDir = path.join(rootDir, "dist/static");

  fs.mkdirSync(outDir, { recursive: true });

  console.log(`  ${entry} → dist/static/${jsFileName}`);

  await esbuild.build({
    entryPoints: [path.join(rootDir, entry)],
    bundle: true,
    minify: !isDevBuild,
    platform: "browser",
    target: ["es2020", "chrome89", "firefox108", "safari16.4"],
    outfile: path.join(outDir, jsFileName),
    sourcemap: true,
    format: "esm",
    jsx: "automatic",
    jsxImportSource: "preact",
    external: ["*.css"],
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react-dom/client": "preact/compat",
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(isDevBuild ? "development" : "production"),
      "import.meta.env.DEV": isDevBuild ? "true" : "false",
    },
  });

  // Build CSS with PostCSS
  console.log(`  ${cssEntry} → dist/static/${cssFileName}`);
  const monorepoRoot = path.join(rootDir, "..");
  const postcssPath = path.join(monorepoRoot, "node_modules/.bin/postcss");
  execSync(`"${postcssPath}" "${path.join(rootDir, cssEntry)}" -o "${path.join(outDir, cssFileName)}"`, {
    stdio: "inherit",
    cwd: rootDir,
  });
};

const build = async () => {
  console.log("Building Lambda functions...\n");

  for (const lambda of lambdas) {
    await buildLambda(lambda);
  }

  console.log("\nBuilding client bundles...\n");
  for (const client of clients) {
    await buildClient(client);
  }
  console.log(`\n  Build ID: ${buildId || "(dev)"}`);

  console.log("\nDone!");
};

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
