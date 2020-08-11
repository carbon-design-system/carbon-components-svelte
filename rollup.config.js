import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import svelte from "rollup-plugin-svelte";
import generateDocs from "./scripts/rollup/plugin-generate-docs";

export default ["es", "umd"].map((format) => {
  const UMD = format === "umd";

  return {
    input: "src",
    output: {
      format,
      file: UMD ? pkg.main : pkg.module,
      name: UMD ? "carbon-components-svelte" : undefined,
      globals: { flatpickr: "flatpickr" },
    },
    external: Object.keys(pkg.dependencies),
    plugins: [
      svelte(),
      resolve(),
      commonjs(),
      UMD && terser(),
      !UMD && generateDocs(),
    ],
  };
});
