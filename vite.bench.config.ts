import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Benchmarks reuse the vitest+jsdom harness (svelte compilation, DOM globals)
// so component perf numbers come from the same environment the test suite
// already mounts components in. Kept separate from vite.config.ts so `bun
// run test` never picks up `*.bench.ts` files.
export default defineConfig({
  root: "./bench",
  plugins: [svelte({ preprocess: [vitePreprocess()] })],
  resolve: {
    alias: {
      "carbon-components-svelte": path.resolve(__dirname, "src"),
    },
    conditions: ["browser"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    // Only *.dom.bench.ts — component benches that need jsdom + the svelte
    // plugin. Pure-logic benches (*.bench.ts) run straight under bun instead
    // (see CONTRIBUTING.md), with no jsdom/vitest overhead to muddy the numbers.
    include: ["*.dom.bench.ts"],
    setupFiles: ["../tests/utils/setup-globals.ts"],
    // mitata's own warmup + sampling runs well past vitest's 5s default.
    testTimeout: 60_000,
  },
});
