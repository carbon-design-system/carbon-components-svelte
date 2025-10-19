/// <reference types="vitest" />
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeImports } from "carbon-preprocess-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    svelte({
      preprocess: [vitePreprocess(), optimizeImports()],
    }),
  ],
  optimizeDeps: {
    exclude: ["carbon-components-svelte", "carbon-icons-svelte"],
  },
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
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
