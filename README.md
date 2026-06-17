# carbon-components-svelte

[![NPM][npm]][npm-url]
![npm downloads to date](https://img.shields.io/npm/dt/carbon-components-svelte?color=262626&style=for-the-badge)
<a href="https://discord.gg/J7JEUEkTRX">
<img src="https://img.shields.io/discord/689212587170201628?color=5865F2&style=for-the-badge" alt="Chat with us on Discord">
</a>

Carbon Components Svelte is a [Svelte](https://github.com/sveltejs/svelte) component library that implements the [Carbon Design System](https://www.carbondesignsystem.com/), an open source design system by IBM. Ship accessible, consistent, production-ready interfaces.

- **70+ components**: from inputs to data tables
- **5 built-in themes**: two light, three dark
- **Fully typed TypeScript API**: props, events, and slots
- **WCAG 2.1 AA**: keyboard and screen-reader ready

The Carbon Svelte ecosystem also includes:

- **[Carbon Icons Svelte](https://github.com/carbon-design-system/carbon-icons-svelte)**: 2,600+ Carbon icons as Svelte components
- **[Carbon Pictograms Svelte](https://github.com/carbon-design-system/carbon-pictograms-svelte)**: 1,500+ Carbon pictograms as Svelte components
- **[Carbon Charts Svelte](https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte)**: 25+ charts, powered by d3
- **[Carbon Preprocess Svelte](https://github.com/carbon-design-system/carbon-preprocess-svelte)**: Collection of Svelte preprocessors for Carbon

## [Documentation](https://svelte.carbondesignsystem.com)

## Installation

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

## Usage

### Styling

Before importing components, you will need to first apply Carbon component styles. The Carbon Design System supports five themes (2 light, 3 dark).

- **white.css**: Default Carbon theme (light)
- **g10.css**: Gray 10 theme (light)
- **g80.css**: Gray 80 theme (dark)
- **g90.css**: Gray 90 theme (dark)
- **g100.css**: Gray 100 theme (dark)
- **all.css**: All five themes (White, Gray 10, Gray 80, Gray 90, Gray 100) using [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

Each StyleSheet is [generated](scripts/build-css.ts) from the flagship [carbon-components](https://github.com/carbon-design-system/carbon/tree/main/packages/carbon-components) library.

The compiled CSS is generated from the following `.scss` files:

- [css/white.scss](css/white.scss)
- [css/g10.scss](css/g10.scss)
- [css/g80.scss](css/g80.scss)
- [css/g90.scss](css/g90.scss)
- [css/g100.scss](css/g100.scss)
- [css/all.scss](css/all.scss)

Import one theme once at the top-level entry point of your app, like `index.js` or `src/+layout.svelte`.

#### CSS StyleSheet

```js
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

### SCSS

The most performant method to load styles is to import SCSS directly from carbon-components. Although it requires more set up, you can reduce the size of the bundle CSS by importing individual component styles instead of a pre-compiled CSS StyleSheet.

Refer to the [official Carbon guide on SASS](https://github.com/carbon-design-system/carbon/blob/v10/docs/guides/sass.md) for documentation.

### Dynamic theming

To switch themes at runtime, import the combined "all.css" StyleSheet instead of a single theme. It bundles all five themes and toggles between them through a `theme` attribute on the HTML element.

```js
import "carbon-components-svelte/css/all.css";
```

Update the theme by setting the `theme` attribute on the `html` element. The default `theme` is `"white"`.

```html
<!doctype html>
<html lang="en" theme="g10">
  <body>
    ...
  </body>
</html>
```

Or programmatically switch between each of the five Carbon themes by setting the `theme` attribute on the HTML element.

```html
<script>
  let theme = "white"; // "white" | "g10" | "g80" | "g90" | "g100"

  $: document.documentElement.setAttribute("theme", theme);
</script>
```

Alternatively, use the [Theme component](https://svelte.carbondesignsystem.com/components/Theme) to manage the theme reactively.

### Importing components

Import components from `carbon-components-svelte` in the `script` tag of your Svelte file. Visit the [documentation site](https://svelte.carbondesignsystem.com) for examples.

```html
<!-- App.svelte -->
<script>
  import { Accordion, AccordionItem } from "carbon-components-svelte";
</script>

<Accordion>
  <AccordionItem title="Section 1" open> Content 1 </AccordionItem>
  <AccordionItem title="Section 2"> Content 2 </AccordionItem>
  <AccordionItem title="Section 3"> Content 3 </AccordionItem>
</Accordion>
```

**Refer to the [documentation site](https://svelte.carbondesignsystem.com) for component API documentation.**

## Preprocessors & Plugins

[carbon-preprocess-svelte](https://github.com/carbon-design-system/carbon-preprocess-svelte) is a collection of Svelte preprocessors for Carbon. It trims build times and bundle size with two drop-in tools for faster HMR in development and leaner CSS when you ship.

> [!NOTE]
> Using `carbon-preprocess-svelte` is optional and not a prerequisite for this library. It should be installed as a development dependency.

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

### `optimizeImports`

`optimizeImports` is a Svelte preprocessor that rewrites barrel imports from Carbon components/icons/pictograms packages to their source Svelte code paths. This can significantly speed up development and production build compile times while preserving typeahead and autocompletion offered by integrated development environments (IDE) like VS Code.

The preprocessor optimizes imports from the following packages:

- [carbon-components-svelte](https://github.com/carbon-design-system/carbon-components-svelte)
- [carbon-icons-svelte](https://github.com/carbon-design-system/carbon-icons-svelte)
- [carbon-pictograms-svelte](https://github.com/carbon-design-system/carbon-pictograms-svelte)

**Before & After**

```diff
- import { Button } from "carbon-components-svelte";
+ import Button from "carbon-components-svelte/src/Button/Button.svelte";

- import { Add } from "carbon-icons-svelte";
+ import Add from "carbon-icons-svelte/lib/Add.svelte";

- import { Airplane } from "carbon-pictograms-svelte";
+ import Airplane from "carbon-pictograms-svelte/lib/Airplane.svelte";
```

### `optimizeCss`

`optimizeCss` is a Vite plugin that removes unused Carbon styles at build time, often removing hundreds of kilobytes from production bundles. The plugin is compatible with Rollup ([Vite](https://vitejs.dev/guide/api-plugin) extends the Rollup plugin API).

`carbon-components-svelte@0.85.0` or greater is required.

```diff
$ vite build

Optimized index-CU4gbKFa.css
- Before: 606.26 kB
+ After:   53.22 kB (-91.22%)

dist/index.html                  0.34 kB │ gzip:  0.24 kB
dist/assets/index-CU4gbKFa.css  53.22 kB │ gzip:  6.91 kB
dist/assets/index-Ceijs3eO.js   53.65 kB │ gzip: 15.88 kB
```

> [!NOTE]
> This is a plugin and not a Svelte preprocessor. It should be added to the list of `vite.plugins`. For Vite set-ups, this plugin is only run when building the app. For Rollup and Webpack, you should conditionally apply the plugin to only execute when building for production.

### Configure your bundler

Add `optimizeImports` to your Svelte preprocessor and `optimizeCss` to your bundler plugins. See [examples](examples) for full configurations.

**Vite**

```js
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

**SvelteKit**

```js
// svelte.config.js
import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeImports } from "carbon-preprocess-svelte";

const config = {
  preprocess: [vitePreprocess(), optimizeImports()],
  kit: { adapter: adapter() },
};

export default config;
```

```js
// vite.config.js
import { sveltekit } from "@sveltejs/kit/vite";
import { optimizeCss } from "carbon-preprocess-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), optimizeCss()],
});
```

**Rollup**

```js
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

**Webpack**

```js
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

The icon and pictogram sets ship as separate packages of individual Svelte components. Each is optional, so install only what you need.

### Icons

2,600+ icons designed for product UI, in four sizes (16, 20, 24, and 32 pixels), set with a single prop.

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

- **[llms.txt](https://svelte.carbondesignsystem.com/llms.txt)**: a component index where each entry links to its per-component Markdown doc, sized for model context windows.
- **[llms-full.txt](https://svelte.carbondesignsystem.com/llms-full.txt)**: the full component documentation in a single plain-text file.

## Examples

- [examples/rollup](examples/rollup/)
- [examples/sveltekit](examples/sveltekit/)
- [examples/vite](examples/vite/)
- [examples/webpack](examples/webpack/)

## TypeScript support

[TypeScript definitions](types) are generated by [sveld](https://github.com/carbon-design-system/sveld).

## Contributing

Refer to the [Contributing guidelines](CONTRIBUTING.md).

## [Changelog](CHANGELOG.md)

## License

[Apache 2.0](LICENSE)

[npm]: https://img.shields.io/npm/v/carbon-components-svelte.svg?color=262626&style=for-the-badge
[npm-url]: https://npmjs.com/package/carbon-components-svelte

## <picture><source height="20" width="20" media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-dark.svg"><source height="20" width="20" media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"><img height="20" width="20" alt="IBM Telemetry" src="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"></picture> IBM Telemetry

This package uses IBM Telemetry to collect de-identified and anonymized metrics data in CI environments. By installing
this package as a dependency you are agreeing to telemetry collection. To opt out, see
[Opting out of IBM Telemetry data collection](https://github.com/ibm-telemetry/telemetry-js/tree/main#opting-out-of-ibm-telemetry-data-collection).
For more information on the data being collected, please see the
[IBM Telemetry documentation](https://github.com/ibm-telemetry/telemetry-js/tree/main#ibm-telemetry-collection-basics).
