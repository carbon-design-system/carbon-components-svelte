import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { optimizeImports } from "carbon-preprocess-svelte";

export default defineConfig(({ mode }) => {
  return {
    plugins: [svelte({ preprocess: [optimizeImports()] })],
    build: { minify: mode === "production" },
  };
});
