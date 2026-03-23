import path from "node:path";
import { fileURLToPath } from "node:url";
import routify from "@roxi/routify/vite-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carbonRoot = path.resolve(__dirname, "..");
const outDir = path.resolve(__dirname, "dist");

export default defineConfig({
  resolve: {
    alias: {
      "carbon-components-svelte": carbonRoot,
    },
  },
  plugins: [
    routify({
      routesDir: { default: "src/pages" },
      extensions: [".svelte", ".svx"],
    }),
    svelte(),
    /**
     * Routify 3 sets `build.outDir` to `<outDir>/client` for CSR.
     * Override this so the static build is emitted to `dist/`.
     */
    {
      name: "outdir",
      config() {
        return { build: { outDir } };
      },
    },
  ],
  optimizeDeps: {
    include: ["clipboard-copy", "flatpickr/dist/plugins/rangePlugin"],
    exclude: [
      "carbon-components-svelte",
      "carbon-icons-svelte",
      "@roxi/routify",
    ],
  },
});
