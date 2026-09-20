import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { testConfig } from "./tests/utils.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * `dev` left `undefined` (the default) omits `compilerOptions` entirely, so
 * `bun run test` keeps vite-plugin-svelte's own default. `vite.config.perf.ts`
 * passes `dev: false` to disable Svelte 5's dev-mode instrumentation (stack
 * capture on every state write), which otherwise dominates jsdom timings —
 * see "Counting redundant work" in CONTRIBUTING.md.
 */
export function createConfig({ dev }: { dev?: boolean } = {}) {
  return defineConfig({
    root: "./tests",
    plugins: [
      svelte({
        preprocess: [vitePreprocess()],
        ...(dev === undefined ? {} : { compilerOptions: { dev } }),
      }),
    ],
    resolve: {
      alias: {
        "carbon-components-svelte": path.resolve(__dirname, "src"),
      },
      conditions: ["browser"],
    },
    test: {
      ...testConfig,
      setupFiles: ["./setup-tests.ts"],
    },
  });
}

export default createConfig();
