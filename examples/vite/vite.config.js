import { svelte } from "@sveltejs/vite-plugin-svelte";
import { optimizeCss, optimizeImports } from "carbon-preprocess-svelte";

/** @type {import('vite').UserConfig} */
export default {
  // Optional: since we use the `optimizeImports` preprocessor, we can exclude
  // `carbon-components-svelte` and `carbon-pictograms-svelte` from the
  // `optimizeDeps` configuration for even faster cold starts.
  optimizeDeps: {
    exclude: ["carbon-components-svelte"],
  },
  plugins: [
    svelte({
      preprocess: [optimizeImports()],
    }),
    optimizeCss(),
  ],
};
