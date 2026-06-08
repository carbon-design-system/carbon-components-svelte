import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.resolve(__dirname, "fixtures");

// Every fixture .html is its own entry point so `vite build` emits the full
// multi-page app. The dev server discovers these automatically, but the
// production build needs them listed explicitly.
const input = Object.fromEntries(
  fs
    .readdirSync(fixtures)
    .filter((file) => file.endsWith(".html"))
    .map((file) => [
      file.slice(0, -".html".length),
      path.resolve(fixtures, file),
    ]),
);

export default defineConfig({
  root: fixtures,
  plugins: [svelte({ preprocess: [vitePreprocess()] })],
  build: { rollupOptions: { input } },
  resolve: {
    alias: [
      {
        find: "carbon-components-svelte/css",
        replacement: path.resolve(__dirname, "../css"),
      },
      {
        find: "carbon-components-svelte",
        replacement: path.resolve(__dirname, "../src"),
      },
    ],
    conditions: ["browser"],
  },
});
