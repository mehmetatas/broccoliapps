import type * as esbuild from "esbuild";

export interface ForbiddenDepResult {
  dep: string;
  chain: string[];
}

// Build reverse import map: file -> files that import it
const buildImportedByMap = (metafile: esbuild.Metafile): Map<string, string[]> => {
  const importedBy = new Map<string, string[]>();
  for (const [filePath, info] of Object.entries(metafile.inputs)) {
    for (const imp of info.imports) {
      const existing = importedBy.get(imp.path) || [];
      existing.push(filePath);
      importedBy.set(imp.path, existing);
    }
  }
  return importedBy;
};

// Find import chain from forbidden dep back to entry point
const findImportChain = (metafile: esbuild.Metafile, forbiddenFile: string, entryFile: string): string[] => {
  const importedBy = buildImportedByMap(metafile);
  const visited = new Set<string>();
  const queue: { file: string; chain: string[] }[] = [{ file: forbiddenFile, chain: [forbiddenFile] }];

  while (queue.length > 0) {
    const { file, chain } = queue.shift()!;
    if (visited.has(file)) {
      continue;
    }
    visited.add(file);

    if (file.includes(entryFile)) {
      return chain.reverse();
    }

    const importers = importedBy.get(file) || [];
    for (const importer of importers) {
      queue.push({ file: importer, chain: [...chain, importer] });
    }
  }

  return [forbiddenFile]; // Fallback if chain not found
};

// Shorten path for display
const shortenPath = (p: string): string => {
  if (p.includes("node_modules/")) {
    const match = p.match(/node_modules\/([^/]+)/);
    return match ? `node_modules/${match[1]}` : p;
  }
  return p.replace(/^.*?src\//, "src/");
};

/**
 * Analyze a bundle's metafile for forbidden dependencies.
 * Returns an array of found forbidden deps with their import chains.
 */
export const findForbiddenDeps = (
  metafile: esbuild.Metafile,
  forbiddenDeps: string[],
  entryFile: string
): ForbiddenDepResult[] => {
  const results: ForbiddenDepResult[] = [];
  const seenDeps = new Set<string>();

  for (const inputPath of Object.keys(metafile.inputs)) {
    for (const dep of forbiddenDeps) {
      if (inputPath.includes(`node_modules/${dep}/`) && !seenDeps.has(dep)) {
        seenDeps.add(dep);
        const chain = findImportChain(metafile, inputPath, entryFile);
        results.push({ dep, chain: chain.map(shortenPath) });
      }
    }
  }

  return results;
};

/**
 * Format forbidden deps results into a readable error message.
 */
export const formatForbiddenDepsError = (outdir: string, results: ForbiddenDepResult[]): string => {
  const details = results.map(({ dep, chain }) => `  ${dep}:\n    ${chain.join("\n    → ")}`).join("\n\n");
  return `Bundle "${outdir}" contains forbidden dependencies:\n\n${details}`;
};
