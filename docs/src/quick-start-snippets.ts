import type { CarbonTheme } from "carbon-components-svelte/src/Theme/Theme.svelte";

export const installCmds = {
  npm: "npm i carbon-components-svelte",
  pnpm: "pnpm add carbon-components-svelte",
  yarn: "yarn add carbon-components-svelte",
  bun: "bun add carbon-components-svelte",
} as const;

export type InstallCmds = Record<"npm" | "pnpm" | "yarn" | "bun", string>;

export const preprocessInstallCmds = {
  npm: "npm i -D carbon-preprocess-svelte",
  pnpm: "pnpm add -D carbon-preprocess-svelte",
  yarn: "yarn add -D carbon-preprocess-svelte",
  bun: "bun add -D carbon-preprocess-svelte",
} as const;

export const usageExample = `<script>
  import { Button } from "carbon-components-svelte";
</script>

<Button>Hello Carbon</Button>`;

export const dynamicThemeCss = `import "carbon-components-svelte/css/all.css";`;

export const iconsInstallCmds = {
  npm: "npm i carbon-icons-svelte",
  pnpm: "pnpm add carbon-icons-svelte",
  yarn: "yarn add carbon-icons-svelte",
  bun: "bun add carbon-icons-svelte",
} as const;

export const pictogramsInstallCmds = {
  npm: "npm i carbon-pictograms-svelte",
  pnpm: "pnpm add carbon-pictograms-svelte",
  yarn: "yarn add carbon-pictograms-svelte",
  bun: "bun add carbon-pictograms-svelte",
} as const;

export function iconsExample(size: number) {
  const usage = size === 16 ? "<Add />" : `<Add size={${size}} />`;

  return `<script>
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

${usage}`;
}

export function pictogramsExample(size: number) {
  const usage =
    size === 64 ? "<Cloud />" : `<Cloud width={${size}} height={${size}} />`;

  return `<script>
  import Cloud from "carbon-pictograms-svelte/lib/Cloud.svelte";
</script>

${usage}`;
}

const imp = (names: string, mod: string) => `import ${names} from "${mod}";`;
const CPS = "carbon-preprocess-svelte";

export const sveltekitConfig = `// svelte.config.js
${imp("adapter", "@sveltejs/adapter-static")}
${imp("{ vitePreprocess }", "@sveltejs/vite-plugin-svelte")}
${imp("{ optimizeImports }", CPS)}

const config = {
  preprocess: [vitePreprocess(), optimizeImports()],
  kit: { adapter: adapter() },
};

export default config;`;

export const sveltekitViteConfig = `// vite.config.js
${imp("{ sveltekit }", "@sveltejs/kit/vite")}
${imp("{ optimizeCss }", CPS)}
${imp("{ defineConfig }", "vite")}

export default defineConfig({
  plugins: [sveltekit(), optimizeCss()],
});`;

export const viteConfig = `// vite.config.js
${imp("{ svelte, vitePreprocess }", "@sveltejs/vite-plugin-svelte")}
${imp("{ optimizeCss, optimizeImports }", CPS)}

export default {
  plugins: [
    svelte({
      preprocess: [vitePreprocess(), optimizeImports()],
    }),
    optimizeCss(),
  ],
};`;

export const rollupConfig = `// rollup.config.js
${imp("svelte", "rollup-plugin-svelte")}
${imp("{ optimizeCss, optimizeImports }", CPS)}

const production = !process.env.ROLLUP_WATCH;

export default {
  plugins: [
    svelte({
      preprocess: [optimizeImports()],
    }),
    production && optimizeCss(),
  ],
};`;

export const webpackConfig = `// webpack.config.mjs
${imp("{ OptimizeCssPlugin, optimizeImports }", CPS)}

export default {
  module: {
    rules: [
      {
        test: /\\.svelte$/,
        use: {
          loader: "svelte-loader",
          options: {
            preprocess: [optimizeImports()],
          },
        },
      },
    ],
  },
  plugins: [new OptimizeCssPlugin()],
};`;

export const preprocessors = [
  {
    title: "optimizeImports",
    body: "Rewrites barrel imports to direct source paths, dramatically cutting cold build and HMR times.",
  },
  {
    title: "optimizeCss",
    body: "Tree-shakes unused Carbon CSS at build time, often removing hundreds of kilobytes from production bundles.",
  },
] as const;

export function themeCssImport(theme: CarbonTheme) {
  return `import "carbon-components-svelte/css/${theme}.css";`;
}

export function themeToggle(theme: CarbonTheme) {
  return `<script>
  let theme = "${theme}"; // "white" | "g10" | "g80" | "g90" | "g100"

  $: document.documentElement.setAttribute("theme", theme);
</script>`;
}

export function themeHtml(theme: CarbonTheme) {
  return `<html theme="${theme}">`;
}
