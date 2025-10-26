import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { optimizeCss, optimizeImports } from "carbon-preprocess-svelte";
import css from "rollup-plugin-css-only";
import svelte from "rollup-plugin-svelte";

const production = !process.env.ROLLUP_WATCH;

export default {
  input: "src/index.js",
  output: {
    sourcemap: !production,
    format: "iife",
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
    commonjs(),
    css({ output: "bundle.css" }),
    production && terser(),
    production && optimizeCss(),
  ],
};
