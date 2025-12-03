import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
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
    alias: generateAliasesFromExports(__dirname, "../src"),
  },
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
