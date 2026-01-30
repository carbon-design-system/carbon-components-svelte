import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { testConfig } from "./tests/utils";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: "./tests",
  plugins: [svelte({ preprocess: [vitePreprocess()] })],
  resolve: {
    alias: {
      "carbon-components-svelte": path.resolve(__dirname, "src"),
    },
    conditions: ["browser"],
  },
  test: {
    ...testConfig,
    setupFiles: ["./tests/setup-tests.ts"],
  },
});
