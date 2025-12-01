import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import {
  generateAliasesFromExports,
  getDirname,
  testConfig,
} from "./tests/utils";

const __dirname = getDirname(import.meta.url);

export default defineConfig({
  root: "./tests",
  plugins: [svelte({ preprocess: [vitePreprocess()] })],
  resolve: {
    conditions: ["browser"],
    alias: generateAliasesFromExports(__dirname),
  },
  test: {
    ...testConfig,
    setupFiles: ["./tests/setup-tests.ts"],
  },
});
