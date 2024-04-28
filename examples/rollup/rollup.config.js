import resolve from "@rollup/plugin-node-resolve";
import { optimizeCss, optimizeImports } from "carbon-preprocess-svelte";
import css from "rollup-plugin-css-only";
import svelte from "rollup-plugin-svelte";
import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.js",
  output: {
    sourcemap: !production,
    name: "app",
    file: "public/build/bundle.js",
    inlineDynamicImports: true,
  },
  plugins: [
    svelte({
      preprocess: [optimizeImports()],
      compilerOptions: { dev: !production },
    }),
    resolve({ browser: true, dedupe: ["svelte"] }),
    css({ output: "bundle.css" }),
    production && terser(),
    production && optimizeCss(),
  ],
};
