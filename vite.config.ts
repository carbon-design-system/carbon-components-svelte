import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeImports } from "carbon-preprocess-svelte";
import { defineConfig } from "vitest/config";
import pkg from "./package.json";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generates Vite aliases from package.json exports for component subpath imports.
 * Resolves imports like `carbon-components-svelte/Theme/Theme.svelte` to
 * `./src/Theme/Theme.svelte` since these subpaths aren't in package.json
 * exports and Vite needs runtime resolution (tsconfig only handles types).
 */
function generateAliasesFromExports() {
  const aliases: Record<string, string> = {};
  const exports = pkg.exports;

  const srcSvelteExport = exports["./src/*.svelte"];
  if (!srcSvelteExport) return aliases;

  const srcDir = path.resolve(__dirname, "./src");
  if (!fs.existsSync(srcDir)) return aliases;

  function scanDirectory(dir: string, basePath: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath, relativePath);
      } else if (entry.isFile() && entry.name.endsWith(".svelte")) {
        const importPath = relativePath;
        const aliasKey = `${pkg.name}/${importPath}`;
        aliases[aliasKey] = path.resolve(__dirname, "./src", importPath);
      }
    }
  }

  scanDirectory(srcDir);
  return aliases;
}

export default defineConfig({
  root: "./tests",
  plugins: [svelte({ preprocess: [vitePreprocess(), optimizeImports()] })],
  optimizeDeps: {
    exclude: ["carbon-components-svelte", "carbon-icons-svelte"],
  },
  resolve: {
    conditions: ["browser"],
    alias: generateAliasesFromExports(),
  },
  test: {
    globals: true,
    environment: "jsdom",
    clearMocks: true,
    // Suppress `console` output in CI.
    silent: !!process.env.CI,
    setupFiles: ["./tests/setup-tests.ts"],
  },
});
