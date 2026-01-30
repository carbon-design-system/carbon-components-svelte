import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { testConfig } from "../tests/utils";

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
    setupFiles: ["./setup-tests.ts"],
  },
});
