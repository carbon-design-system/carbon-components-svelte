import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { svelteFreeTests } from "../tests/svelte-free-tests.ts";
import { testConfig } from "../tests/utils.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "carbon-components-svelte": path.resolve(__dirname, "../src"),
    },
    conditions: ["browser"],
  },
  // @ts-expect-error
  plugins: [svelte({ preprocess: [vitePreprocess()] })],
  server: {
    fs: {
      allow: [".."],
    },
  },
  test: {
    ...testConfig,
    include: ["../tests/**/*.test.ts"],
    exclude: [
      // `svelte/server` only exists in Svelte 5.
      "../tests/Snippets/**",
      "../tests/**/*.ssr.test.ts",
      "../tests/utils/ssr.test.ts",
      // Tests that never import Svelte can't differ between versions; the
      // Svelte 5 harness already runs them.
      ...svelteFreeTests(
        path.resolve(__dirname, "../tests"),
        path.resolve(__dirname, "../src"),
      ).map((file) => path.relative(__dirname, file)),
    ],
    setupFiles: ["./setup-tests.ts"],
    // `@testing-library/*` resolve from the root `node_modules`, outside this
    // harness. On Node 22 the `vmThreads` loader can't load those externally
    // (`@testing-library/dom` ships ESM in a CommonJS package), so let Vite
    // transform them. Inline all of them so jest-dom extends the same `expect`.
    server: { deps: { inline: [/@testing-library\//] } },
    // Pre-bundling fails at startup in CI here ("Missing
    // ./internal/disclose-version specifier in svelte"), likely Svelte 3's
    // package lacking an export a newer tool expects. Svelte 4/5 keep it.
    deps: { optimizer: { client: { enabled: false } } },
  },
});
