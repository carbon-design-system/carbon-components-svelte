import path from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import {
  generateAliasesFromExports,
  getDirname,
  testConfig,
} from "../tests/utils";

const __dirname = getDirname(import.meta.url);

export default defineConfig({
  resolve: {
    conditions: ["browser"],
    alias: {
      ...generateAliasesFromExports(__dirname, "../src"),
      "carbon-components-svelte": path.resolve(__dirname, "../src/index.js"),
    },
  },
  // @ts-expect-error
  plugins: [svelte()],
  server: {
    fs: {
      allow: [".."],
    },
  },
  test: {
    ...testConfig,
    include: ["../tests/**/*.test.ts", "./svelte5/**/*.test.ts"],
    setupFiles: ["./setup-tests.ts"],
  },
});
