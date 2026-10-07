A complete [Svelte](https://github.com/sveltejs/svelte) component library that implements the [IBM Carbon Design System](https://www.carbondesignsystem.com/). Ship accessible, consistent, production-ready interfaces.

- **100+ components** — from inputs to data tables
- **5 built-in themes** — two light, three dark
- **Fully typed TypeScript API** — props, events, and slots
- **WCAG 2.1 AA** — keyboard and screen-reader ready

## Quick start

Install the library, pick a theme, and render your first component. Three steps to a running app, plus customization options below.

### 1. Install the package

```sh
# npm
npm i carbon-components-svelte

# pnpm
pnpm add carbon-components-svelte

# Yarn
yarn add carbon-components-svelte

# Bun
bun add carbon-components-svelte
```

### 2. Apply a theme stylesheet

Import one precompiled Carbon theme. The Carbon Design System supports five themes (2 light, 3 dark): White, Gray 10, Gray 80, Gray 90, Gray 100.

Import this once at the top-level, like `index.js` or `src/+layout.svelte`.

```javascript
// White theme
import "carbon-components-svelte/css/white.css";

// Gray 10 theme
import "carbon-components-svelte/css/g10.css";

// Gray 80 theme
import "carbon-components-svelte/css/g80.css";

// Gray 90 theme
import "carbon-components-svelte/css/g90.css";

// Gray 100 theme
import "carbon-components-svelte/css/g100.css";

// All themes (for dynamic theming)
import "carbon-components-svelte/css/all.css";
```

### 3. Import a component

```svelte
<script>
  import { Button } from "carbon-components-svelte";
</script>

<Button>Hello Carbon</Button>
```

Explore the full [component index](/component-index).

## Dynamic theming

To switch themes at runtime, import the combined `all.css` stylesheet instead of a single theme. It bundles all five themes and toggles between them through a `theme` attribute on the HTML element.

Import the stylesheet once, at the top-level entry point of your app:

```javascript
import "carbon-components-svelte/css/all.css";
```

Then set the theme reactively in Svelte:

```svelte
<script>
  let theme = "white"; // "white" | "g10" | "g80" | "g90" | "g100"

  $: document.documentElement.setAttribute("theme", theme);
</script>
```

Or statically in your HTML:

```html
<html theme="white"></html>
```

Or use the [Theme component](/components/Theme) to manage the theme reactively.

## Faster builds, smaller bundles

The fast path is enough to build. [carbon-preprocess-svelte](https://github.com/carbon-design-system/carbon-preprocess-svelte) trims build times and bundle size with three drop-in tools: faster HMR in development, and leaner CSS and JavaScript when you ship. Each works on its own.

Add carbon-preprocess-svelte as a dev dependency:

```sh
# npm
npm i -D carbon-preprocess-svelte

# pnpm
pnpm add -D carbon-preprocess-svelte

# Yarn
yarn add -D carbon-preprocess-svelte

# Bun
bun add -D carbon-preprocess-svelte
```

### optimizeImports

Rewrites barrel imports to direct source paths, dramatically cutting cold build and HMR times.

### optimizeCss

Tree-shakes unused Carbon CSS at build time, often removing hundreds of kilobytes from production bundles. Set `propAware: true` to also remove styles for prop values your app never passes.

### optimizeComponents

Rewrites each Carbon component your app renders for the props it passes, removing branches and child components that can never run. It runs on production builds only, and fails the build if a module outside its `content` globs imports a Carbon component. For Webpack and Rspack, use `OptimizeComponentsPlugin`.

```javascript
// vite.config.js
import { svelte } from "@sveltejs/vite-plugin-svelte";
import {
  optimizeComponents,
  optimizeCss,
  optimizeImports,
} from "carbon-preprocess-svelte";

export default {
  plugins: [
    optimizeComponents(),
    svelte({ preprocess: [optimizeImports()] }),
    optimizeCss({ propAware: true }),
  ],
};
```

### Configure your bundler

Add `optimizeImports` to your Svelte preprocessor and `optimizeCss` to your bundler plugins.

**Vite:**

```javascript
// vite.config.js
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeCss, optimizeImports } from "carbon-preprocess-svelte";

export default {
  plugins: [
    svelte({
      preprocess: [vitePreprocess(), optimizeImports()],
    }),
    optimizeCss(),
  ],
};
```

**SvelteKit:**

```javascript
// vite.config.js
import adapter from "@sveltejs/adapter-static";
import { sveltekit } from "@sveltejs/kit/vite";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeCss, optimizeImports } from "carbon-preprocess-svelte";

export default {
  plugins: [
    sveltekit({
      preprocess: [vitePreprocess(), optimizeImports()],
      adapter: adapter(),
    }),
    optimizeCss(),
  ],
};
```

On SvelteKit 2, pass the same `preprocess` in `svelte.config.js` and the adapter under `kit`.

**Rollup:**

```javascript
// rollup.config.js
import svelte from "rollup-plugin-svelte";
import { optimizeCss, optimizeImports } from "carbon-preprocess-svelte";

const production = !process.env.ROLLUP_WATCH;

export default {
  plugins: [
    svelte({
      preprocess: [optimizeImports()],
    }),
    production && optimizeCss(),
  ],
};
```

**Webpack:**

Rspack implements Webpack's plugin and loader APIs, so the same configuration works in `rspack.config.mjs`.

```javascript
// webpack.config.mjs
import { OptimizeCssPlugin, optimizeImports } from "carbon-preprocess-svelte";

export default {
  module: {
    rules: [
      {
        test: /\.svelte$/,
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
};
```

## Icons and pictograms

The icon and pictogram sets ship as separate packages of individual Svelte components. Both are professionally designed, original iconography crafted to complement the scale and grid of Carbon components. Each is optional, so install only what you need.

### Icons

2,700+ icons designed for product UI, in four sizes (16, 20, 24, and 32 pixels), set with a single prop.

```sh
# npm
npm i carbon-icons-svelte

# pnpm
pnpm add carbon-icons-svelte

# Yarn
yarn add carbon-icons-svelte

# Bun
bun add carbon-icons-svelte
```

```svelte
<script>
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<Add size={24} />
```

### Pictograms

1,500+ illustrative pictograms for empty states, onboarding, hero sections, and feature callouts. Larger than icons, 64px by default.

```sh
# npm
npm i carbon-pictograms-svelte

# pnpm
pnpm add carbon-pictograms-svelte

# Yarn
yarn add carbon-pictograms-svelte

# Bun
bun add carbon-pictograms-svelte
```

```svelte
<script>
  import Cloud from "carbon-pictograms-svelte/lib/Cloud.svelte";
</script>

<Cloud />
```

## Documentation for LLMs

Documentation is available in LLM-friendly plain text for use with coding assistants, plus a standalone Markdown document for every component. Append `.md` to any component's URL to read it.

- **[llms.txt](/llms.txt)** — A component index where each entry links to its per-component Markdown doc, sized for model context windows.
- **[llms-full.txt](/llms-full.txt)** — The full component documentation in a single plain-text file.

## Collection

The Carbon Svelte collection includes packages for icons, pictograms, and data visualization:

- **Carbon Components Svelte** — 100+ components — [GitHub](https://github.com/carbon-design-system/carbon-components-svelte)
- **Carbon Icons Svelte** — 2,700+ icons — [GitHub](https://github.com/carbon-design-system/carbon-icons-svelte)
- **Carbon Pictograms Svelte** — 1,500+ pictograms — [GitHub](https://github.com/carbon-design-system/carbon-pictograms-svelte)
- **Carbon Charts Svelte** — 25+ charts, powered by d3 — [GitHub](https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte)
- **Carbon Preprocess Svelte** — Svelte preprocessors and build plugins — [GitHub](https://github.com/carbon-design-system/carbon-preprocess-svelte)
