# carbon-components-svelte

[![NPM][npm]][npm-url]
![GitHub](https://img.shields.io/github/license/carbon-design-system/carbon-components-svelte?color=262626&style=for-the-badge)
![npm downloads to date](https://img.shields.io/npm/dt/carbon-components-svelte?color=262626&style=for-the-badge)
<a href="https://discord.gg/J7JEUEkTRX">
<img src="https://img.shields.io/discord/689212587170201628?color=5865F2&style=for-the-badge" alt="Chat with us on Discord">
</a>

Carbon Components Svelte is a [Svelte](https://github.com/sveltejs/svelte) component library that implements the [Carbon Design System](https://github.com/carbon-design-system), an open source design system by IBM.

Design systems facilitate design and development through reuse, consistency, and extensibility.

The Carbon Svelte portfolio also includes:

- **[Carbon Icons Svelte](https://github.com/carbon-design-system/carbon-icons-svelte)**: 2,500+ Carbon icons as Svelte components
- **[Carbon Pictograms Svelte](https://github.com/carbon-design-system/carbon-pictograms-svelte)**: 1,500+ Carbon pictograms as Svelte components
- **[Carbon Charts Svelte](https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte)**: 25+ charts, powered by d3
- **[Carbon Preprocess Svelte](https://github.com/carbon-design-system/carbon-preprocess-svelte)**: Collection of Svelte preprocessors for Carbon

## [Documentation](https://svelte.carbondesignsystem.com)

Other forms of documentation are auto-generated:

- **[TypeScript definitions](types)**: Component TypeScript definitions
- **[Component API](docs/src/COMPONENT_API.json)**: Component API in JSON format

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

## Usage

### Styling

Before importing components, you will need to first apply Carbon component styles. The Carbon Design System supports five themes (2 light, 3 dark).

- **white.css**: Default Carbon theme (light)
- **g10.css**: Gray 10 theme (light)
- **g80.css**: Gray 80 theme (dark)
- **g90.css**: Gray 90 theme (dark)
- **g100.css**: Gray 100 theme (dark)
- **all.css**: All themes (White, Gray 10, Gray 90, Gray 100) using [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

Each StyleSheet is [generated](scripts/build-css.js) from the flagship [carbon-components](https://github.com/carbon-design-system/carbon/tree/main/packages/carbon-components) library.

The compiled CSS is generated from the following `.scss` files:

- [css/white.scss](css/white.scss)
- [css/g10.scss](css/g10.scss)
- [css/g80.scss](css/g80.scss)
- [css/g90.scss](css/g90.scss)
- [css/g100.scss](css/g100.scss)
- [css/all.scss](css/all.scss)

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

Use the "all.css" StyleSheet for dynamic, client-side theming.

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

Programmatically switch between each of the five Carbon themes by setting the "theme" attribute on the HTML element.

```html
<script>
  let theme = "white"; // "white" | "g10" | "g80" | "g90" | "g100"

  $: document.documentElement.setAttribute("theme", theme);
</script>
```

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

[carbon-preprocess-svelte](https://github.com/carbon-design-system/carbon-preprocess-svelte) is a collection of Svelte preprocessors for Carbon.

> [!NOTE]
> Using `carbon-preprocess-svelte` is optional and not a prerequisite for this library. It should be installed as a development dependency.

```sh
# npm
npm i -D carbon-preprocess-svelte

# pnpm
pnpm i -D carbon-preprocess-svelte

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

#### Usage

See [examples](examples) for full configurations.

```js
// svelte.config.js
import { optimizeImports } from "carbon-preprocess-svelte";

export default {
  preprocess: [optimizeImports()],
};
```

Any other preprocessors that transpile code in the `script` block should be invoked before `optimizeImports`.

For example, `vitePreprocess` should precede `optimizeImports`.

```diff
// svelte.config.js
+ import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { optimizeImports } from "carbon-preprocess-svelte";

export default {
  preprocess: [
+   vitePreprocess(),
    optimizeImports()
  ],
};
```

### `optimizeCss`

`optimizeCss` is a Vite plugin that removes unused Carbon styles at build time. The plugin is compatible with Rollup ([Vite](https://vitejs.dev/guide/api-plugin) extends the Rollup plugin API).

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

#### Usage

See [examples](examples) for full configurations.

```js
// vite.config.js
import { sveltekit } from "@sveltejs/kit/vite";
import { optimizeCss } from "carbon-preprocess-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit(), optimizeCss()],
});
```

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
