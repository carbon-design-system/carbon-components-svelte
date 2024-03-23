import { sveltekit } from "@sveltejs/kit/vite";
import { optimizeCss } from "carbon-preprocess-svelte";

/** @type {import('vite').UserConfig} */
export default {
  // Optional: since we use the `optimizeImports` preprocessor, we can exclude
  // `carbon-components-svelte` and `carbon-pictograms-svelte` from the
  // `optimizeDeps` configuration for even faster cold starts.
  optimizeDeps: {
    exclude: ["carbon-components-svelte", "carbon-pictograms-svelte"],
  },
  plugins: [sveltekit(), optimizeCss()],
};
