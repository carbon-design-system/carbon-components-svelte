import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
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
    // `svelte/server` only exists in Svelte 5, and the hydration harness
    // builds with the root (Svelte 5) install.
    exclude: [
      "../tests/Snippets/**",
      "../tests/**/*.ssr.test.ts",
      "../tests/**/*.hydrate.test.ts",
      "../tests/utils/ssr.test.ts",
    ],
    setupFiles: ["./setup-tests.ts"],
    // `@testing-library/*` resolve from the root `node_modules`, outside this
    // harness. On Node 22 the `vmThreads` loader can't load those externally
    // (`@testing-library/dom` ships ESM in a CommonJS package), so let Vite
    // transform them. Inline all of them so jest-dom extends the same `expect`.
    server: { deps: { inline: [/@testing-library\//] } },
  },
});
