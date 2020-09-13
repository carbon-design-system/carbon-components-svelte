import svelte from "rollup-plugin-svelte-hot";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import copy from "rollup-plugin-copy";
import fs from "fs";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";
import { spassr } from "spassr";
import { version } from "../package.json";

export function createRollupConfigs(config) {
  const { production, serve, distDir } = config;
  const useDynamicImports = process.env.BUNDLING === "dynamic" || !!production;

  fs.rmdirSync(distDir, { recursive: true });

  if (serve) spassr({ serveSpa: true, serveSsr: true, silent: false });

  return [
    baseConfig(config, { dynamicImports: false }),
    useDynamicImports && baseConfig(config, { dynamicImports: true }),
  ].filter(Boolean);
}

function baseConfig(config, ctx) {
  const { dynamicImports } = ctx;
  const {
    staticDir,
    distDir,
    production,
    buildDir,
    svelteWrapper,
    rollupWrapper,
  } = config;

  const outputConfig = !!dynamicImports
    ? { format: "esm", dir: buildDir }
    : { format: "iife", file: `${buildDir}/bundle.js` };

  const svelteConfig = {
    dev: !production,
    css: (css) => css.write(`${buildDir}/bundle.css`, !production),
    hot: false,
  };

  const rollupConfig = {
    inlineDynamicImports: !dynamicImports,
    input: "src/main.js",
    output: { name: "routify_app", sourcemap: !production, ...outputConfig },
    plugins: [
      copy({
        targets: [
          { src: [`${staticDir}/*`, "!*/(__index.html)"], dest: distDir },
          {
            src: [`${staticDir}/__index.html`],
            dest: distDir,
            rename: "__app.html",
            transform,
          },
        ],
        copyOnce: true,
        flatten: false,
      }),
      replace({ "process.env.VERSION": JSON.stringify(version) }),
      postcss({
        extract: "bundle.css",
        extensions: [".css"],
      }),
      svelte(svelteWrapper(svelteConfig, ctx)),
      resolve({
        browser: true,
        dedupe: (importee) => !!importee.match(/svelte(\/|$)/),
      }),
      commonjs(),
      production && terser(),
      !production && livereload(distDir),
    ],
    watch: {
      clearScreen: false,
      buildDelay: 100,
    },
  };

  return rollupWrapper(rollupConfig, ctx);

  function transform(contents) {
    const scriptTag =
      typeof config.scriptTag != "undefined"
        ? config.scriptTag
        : '<script type="module" defer src="/build/main.js"></script>';
    const bundleTag = '<script defer src="/build/bundle.js"></script>';
    return contents
      .toString()
      .replace("__SCRIPT__", dynamicImports ? scriptTag : bundleTag);
  }
}
