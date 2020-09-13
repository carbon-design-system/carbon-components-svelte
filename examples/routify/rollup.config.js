import { createRollupConfigs } from "./scripts/base.config.js";
import slug from "remark-slug";
import { mdsvex } from "mdsvex";

const production = !process.env.ROLLUP_WATCH;

export const config = {
  staticDir: "static",
  distDir: "dist",
  buildDir: "dist/build",
  serve: !production,
  production,
  rollupWrapper: (cfg) => cfg,
  svelteWrapper: (svelte) => {
    svelte.preprocess = [mdsvex({ remarkPlugins: [slug], extension: "md" })];
    svelte.extensions = [".svelte", ".md"];
    return svelte;
  },
  swWrapper: (cfg) => cfg,
};

const configs = createRollupConfigs(config);

export default configs;
