import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { configDefaults, defineConfig } from "vitest/config";
import { testConfig } from "./tests/utils.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server-render tests compile `.svelte` for the server. A `vmThreads` worker
// reuses the client build an earlier jsdom file compiled, so these files run
// in their own `forks` project.
const SSR_TESTS = ["**/*.ssr.test.ts", "utils/ssr.test.ts"];

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
      projects: [
        {
          extends: true,
          test: {
            name: "dom",
            exclude: [...configDefaults.exclude, ...SSR_TESTS],
          },
        },
        {
          extends: true,
          test: { name: "ssr", include: SSR_TESTS, pool: "forks" },
        },
      ],
    },
  });
}

export default createConfig();
