import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { readFile } from "fs/promises";

const pkg = JSON.parse(
  await readFile(new URL("./package.json", import.meta.url))
);

/**
 * @type {import('vite').UserConfig}
 */
const config = defineConfig({
  plugins: [svelte({ emitCss: false })],
  build: {
    lib: { name: pkg.name, entry: "src" },
    rollupOptions: {
      external: Object.keys(pkg.dependencies),
      output: {
        dir: "lib",
        inlineDynamicImports: true,
        globals: { flatpickr: "flatpickr" },
      },
    },
  },
});

export default config;
