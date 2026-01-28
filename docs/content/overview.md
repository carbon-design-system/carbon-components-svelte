Carbon Components Svelte is a [Svelte](https://github.com/sveltejs/svelte) component library that implements the [Carbon Design System](https://www.carbondesignsystem.com/), an open source design system by IBM.

## Installation

```sh
# npm
npm i carbon-components-svelte

# pnpm
pnpm i carbon-components-svelte

# Yarn
yarn add carbon-components-svelte

# Bun
bun add carbon-components-svelte
```

## Styling

Before importing components, you will need to first apply Carbon component styles. The Carbon Design System supports five themes (2 light, 3 dark): White, Gray 10, Gray 80, Gray 90, Gray 100.

This CSS needs only to be imported once, preferably at the root of your application.

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

// All themes
import "carbon-components-svelte/css/all.css";
```

The `all.css` StyleSheet uses CSS variables to dynamically switch between themes.

## Optimization

For smaller bundles and faster builds, use [carbon-preprocess-svelte](https://github.com/carbon-design-system/carbon-preprocess-svelte) with `optimizeImports` and `optimizeCss` below.

Install [carbon-preprocess-svelte](https://github.com/carbon-design-system/carbon-preprocess-svelte) as a development dependency:

```bash
npm i -D carbon-preprocess-svelte

# pnpm
pnpm i -D carbon-preprocess-svelte

# Yarn
yarn add -D carbon-preprocess-svelte

# Bun
bun add -D carbon-preprocess-svelte
```

### optimizeImports

`optimizeImports` is a Svelte preprocessor that rewrites barrel imports from Carbon components/icons/pictograms packages to their source Svelte code paths. This speeds up development and production build compile times while preserving IDE typeahead and autocompletion.

It optimizes imports from `carbon-components-svelte`, `carbon-icons-svelte`, and `carbon-pictograms-svelte`. Example transformation:

```diff
- import { Button } from "carbon-components-svelte";
+ import Button from "carbon-components-svelte/src/Button/Button.svelte";

- import { Add } from "carbon-icons-svelte";
+ import Add from "carbon-icons-svelte/lib/Add.svelte";
```

**SvelteKit:** add it to `svelte.config.js`. If you use Vite, `vitePreprocess` should run before `optimizeImports`:

```javascript
// svelte.config.js (SvelteKit)
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeImports } from "carbon-preprocess-svelte";

export default {
  preprocess: [vitePreprocess(), optimizeImports()],
};
```

**Plain Vite:** pass the preprocessor in `vite.config.js` when calling the Svelte plugin:

```javascript
// vite.config.js (plain Vite + Svelte)
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { optimizeCss, optimizeImports } from "carbon-preprocess-svelte";

export default {
  plugins: [svelte({ preprocess: [optimizeImports()] }), optimizeCss()],
};
```

### optimizeCss

`optimizeCss` is a Vite plugin that removes unused Carbon styles at build time. `carbon-components-svelte@0.85.0` or greater is required. Add it to your Vite config:

```javascript
// vite.config.js
import { sveltekit } from "@sveltejs/kit/vite";
import { optimizeCss } from "carbon-preprocess-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), optimizeCss()],
});
```

## Dynamic theming

Use the `all.css` StyleSheet for dynamic, client-side theming:

```javascript
import "carbon-components-svelte/css/all.css";
```

Programmatically switch between each of the five Carbon themes by setting the "theme" attribute on the HTML element:

```svelte
<script>
  let theme = "white"; // "white" | "g10" | "g80" | "g90" | "g100"

  $: document.documentElement.setAttribute("theme", theme);
</script>
```

You can use the `Theme` component to update the theme at runtime.

## Collection

The Carbon Svelte collection includes packages for icons, pictograms, and data visualization:

- **Carbon Components Svelte** — 50+ components — [GitHub](https://github.com/carbon-design-system/carbon-components-svelte)
- **Carbon Icons Svelte** — 2,500+ icons — [GitHub](https://github.com/carbon-design-system/carbon-icons-svelte)
- **Carbon Pictograms Svelte** — 1,500+ pictograms — [GitHub](https://github.com/carbon-design-system/carbon-pictograms-svelte)
- **Carbon Charts Svelte** — 25+ charts, powered by d3 — [GitHub](https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte)
- **Carbon Preprocess Svelte** — Collection of Carbon Svelte preprocessors — [GitHub](https://github.com/carbon-design-system/carbon-preprocess-svelte)
