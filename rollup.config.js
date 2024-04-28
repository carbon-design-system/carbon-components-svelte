import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import svelte from "rollup-plugin-svelte";

export default {
  input: "src",
  inlineDynamicImports: true,
  output: {
    file: pkg.module,
    globals: { flatpickr: "flatpickr" },
  },
  external: Object.keys(pkg.dependencies),
  plugins: [svelte({ emitCss: false }), resolve()],
};
