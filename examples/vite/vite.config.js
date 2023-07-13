import { svelte } from "@sveltejs/vite-plugin-svelte";
import { optimizeImports } from "carbon-preprocess-svelte";

/** @type {import('vite').UserConfig} */
export default {
  optimizeDeps: {
    exclude: ["carbon-components-svelte"],
  },
  plugins: [
    svelte({
      preprocess: [optimizeImports()],
    }),
  ],
};
