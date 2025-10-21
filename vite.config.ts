/// <reference types="vitest" />
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeImports } from "carbon-preprocess-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./tests",
  plugins: [
    svelte({
      preprocess: [vitePreprocess(), optimizeImports()],
    }),
  ],
  optimizeDeps: {
    exclude: ["carbon-components-svelte", "carbon-icons-svelte"],
  },
  resolve: { conditions: ["browser"] },
  test: {
    globals: true,
    environment: "jsdom",
    clearMocks: true,
    // Suppress `console` output in CI.
    silent: !!process.env.CI,
    setupFiles: ["./tests/setup-tests.ts"],
  },
});
