import { execSync } from "child_process";
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";
import { findForbiddenDeps, formatForbiddenDepsError } from "./dependency-verification";

export interface LambdaConfig {
  entry: string;
  outdir: string;
  forbiddenDeps?: string[];
}

export interface ClientConfig {
  name: string;
  entry: string;
  cssEntry: string;
}

export interface BuildAppOptions {
  rootDir: string;
  lambdas: LambdaConfig[];
  clients?: ClientConfig[];
  staticDir?: string; // defaults to "static"
}

export const buildApp = async (options: BuildAppOptions): Promise<void> => {
  const { rootDir, lambdas, clients, staticDir = "static" } = options;

  // Build ID for cache busting (timestamp format: yyyyMMddHHmmss)
  const isDevBuild = process.env.NODE_ENV === "development";
  const buildId = isDevBuild
    ? ""
    : new Date()
        .toISOString()
        .replace(/[-T:.Z]/g, "")
        .slice(0, 14);

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
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
    },
  };

  // Define globals for SSR builds
  const ssrDefines = {
    __BUILD_ID__: JSON.stringify(buildId),
  };

  const buildLambda = async ({ entry, outdir, forbiddenDeps }: LambdaConfig) => {
    const entryFile = path.join(entry, "lambda.ts");
    const outFile = path.join(outdir, "index.js");

    console.log(`  ${entryFile} → ${outFile}`);

    // UI entries need BUILD_ID for static asset references
    const needsBuildId = entry.startsWith("src/ui/");

    const result = await esbuild.build({
      ...sharedConfig,
      entryPoints: [path.join(rootDir, entryFile)],
      outfile: path.join(rootDir, outFile),
      define: needsBuildId ? ssrDefines : undefined,
    });

    // Check for forbidden dependencies
    if (forbiddenDeps && forbiddenDeps.length > 0 && result.metafile) {
      const found = findForbiddenDeps(result.metafile, forbiddenDeps, entryFile);
      if (found.length > 0) {
        throw new Error(formatForbiddenDepsError(outdir, found));
      }
    }

    // Write package.json for ESM support
    fs.mkdirSync(path.join(rootDir, outdir), { recursive: true });
    fs.writeFileSync(path.join(rootDir, outdir, "package.json"), JSON.stringify({ type: "module" }, null, 2));
  };

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
    const monorepoRoot = findMonorepoRoot(rootDir);
    const postcssPath = path.join(monorepoRoot, "node_modules/.bin/postcss");
    execSync(`"${postcssPath}" "${path.join(rootDir, cssEntry)}" -o "${path.join(outDir, cssFileName)}"`, {
      stdio: "inherit",
      cwd: rootDir,
    });
  };

  const copyStaticAssets = () => {
    const srcDir = path.join(rootDir, staticDir);
    const destDir = path.join(rootDir, "dist/static");

    fs.mkdirSync(destDir, { recursive: true });

    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`  static/${file} → dist/static/${file}`);
    }
  };

  // Build lambdas
  console.log("Building Lambda functions...\n");
  for (const lambda of lambdas) {
    await buildLambda(lambda);
  }

  // Build clients (if any)
  if (clients && clients.length > 0) {
    console.log("\nBuilding client bundles...\n");
    for (const client of clients) {
      await buildClient(client);
    }
    console.log(`\n  Build ID: ${buildId || "(dev)"}`);
  }

  // Copy static assets
  console.log("\nCopying static assets...\n");
  copyStaticAssets();

  console.log("\nDone!");
};

/** Walk up from rootDir to find the monorepo root (directory containing the root package.json with workspaces). */
const findMonorepoRoot = (startDir: string): string => {
  let dir = startDir;
  let parent;
  do {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (pkg.workspaces) {
        return dir;
      }
    }

    parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  } while (dir);

  throw new Error("Could not find monorepo root");
};
