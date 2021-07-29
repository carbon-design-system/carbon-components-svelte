import { optimizeImports } from "carbon-preprocess-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [optimizeImports()],
  kit: {
    target: "#svelte",
  },
};

export default config;
