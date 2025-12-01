import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";
import { generateAliasesFromExports, getDirname } from "../vite.config";

const __dirname = getDirname(import.meta.url);

export default defineConfig({
  resolve: {
    conditions: ["browser"],
    alias: generateAliasesFromExports(__dirname, "../src"),
  },
  // @ts-expect-error
  plugins: [svelte()],
  server: {
    fs: {
      allow: [".."],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    clearMocks: true,
    // Suppress `console` output in CI.
    silent: !!process.env.CI,
    include: ["../tests/**/*.test.ts"],
    setupFiles: ["./setup-tests.ts"],
  },
});
