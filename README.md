# carbon-components-svelte

[![NPM][npm]][npm-url]
![GitHub](https://img.shields.io/github/license/ibm/carbon-components-svelte?color=262626&style=for-the-badge)
![npm downloads to date](https://img.shields.io/npm/dt/carbon-components-svelte?color=262626&style=for-the-badge)
[![Build][build]][build-badge]

Carbon Components Svelte is a [Svelte](https://github.com/sveltejs/svelte) component library that implements the [Carbon Design System](https://github.com/carbon-design-system), an open source design system by IBM.

Design systems facilitate design and development through reuse, consistency, and extensibility.

The Carbon Svelte portfolio also includes:

- **[Carbon Icons Svelte](https://github.com/IBM/carbon-icons-svelte)**: 5800+ Carbon icons as Svelte components
- **[Carbon Pictograms Svelte](https://github.com/IBM/carbon-pictograms-svelte)**: 600+ Carbon pictograms as Svelte components
- **[Carbon Charts Svelte](https://github.com/carbon-design-system/carbon-charts/tree/master/packages/svelte)**: 16 chart types, powered by d3

## [Documentation](http://ibm.biz/carbon-svelte)

<a href="https://www.vercel.com?utm_source=carbon-components-svelte&utm_campaign=oss" target="_blank"><img height="34px" src="./docs/public/powered-by-vercel.svg" alt="Deploys by Vercel" /></a>

The [documentation website](http://ibm.biz/carbon-svelte) contains live demos and examples.

Other forms of documentation are auto-generated:

- **[TypeScript definitions](types)**: Component TypeScript definitions
- **[Component Index](COMPONENT_INDEX.md)**: Markdown file documenting component props, slots, and events
- **[Component API](docs/src/COMPONENT_API.json)**: Component API metadata in JSON format

## Getting started

Install `carbon-components-svelte` as a development dependency.

```sh
yarn add -D carbon-components-svelte
# OR
npm i -D carbon-components-svelte
```

## Usage

The quickest way to get started is to customize a template from the [examples](examples/) folder.

Example set-ups demonstrate usage with popular application bundlers and frameworks. They include a mix of client-side rendering (CSR) and server-side rendering (SSR) approaches.

- **[examples/rollup](examples/rollup/)**: SPA bundled using [Rollup](https://github.com/rollup/rollup)
- **[examples/rollup-typescript](examples/rollup-typescript/)**: SPA bundled using [Rollup](https://github.com/rollup/rollup) with TypeScript support
- **[examples/routify](examples/routify/)**: SPA + static export using [Routify](https://github.com/roxiness/routify)
- **[examples/sapper](examples/sapper/)**: SSR + static export using [Sapper](https://github.com/sveltejs/sapper)
- **[examples/svite](examples/svite/)**: SPA developed with Svite, bundled with [Rollup](https://github.com/rollup/rollup)
- **[examples/webpack](examples/webpack/)**: SPA bundled with [webpack](https://github.com/webpack/webpack)

### Scaffolding

Each example is published in a dedicated branch of the same name.

Use [degit](https://github.com/Rich-Harris/degit) to scaffold a new project:

For example, to use the `svite` template, run the following commands:

```sh
npx degit ibm/carbon-components-svelte#svite svelte-app
cd svelte-app
yarn install
```

### Importing components

Import components from `carbon-components-svelte` in the `script` tag of your Svelte file.

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

**Refer to [COMPONENT_INDEX.md](COMPONENT_INDEX.md) for component API documentation.**

### Precompiled CSS StyleSheets

`carbon-components-svelte` includes precompiled CSS StyleSheets for each Carbon theme:

- **white.css**: Default Carbon theme (light)
- **g10.css**: Gray 10 theme (light)
- **g90.css**: Gray 90 theme (dark)
- **g100.css**: Gray 100 theme (dark)
- **all.css**: All themes (White, Gray 10, Gray 90, Gray 100) using CSS variables

Each StyleSheet is [generated](scripts/build-css.js) from the flagship [carbon-components](https://github.com/carbon-design-system/carbon/tree/master/packages/components) library..

#### Usage

##### `svelte-preprocess`

The easiest way to import a StyleSheet is with [svelte-preprocess](https://github.com/sveltejs/svelte-preprocess).

```js
const svelteOptions = {
  preprocess: require("svelte-preprocess")(),
};
```

```html
<!-- App.svelte -->
<style lang="scss" global>
  /** Gray 10 theme **/
  @import "carbon-components-svelte/css/g10";
</style>
```

##### JavaScript import

Importing a CSS file in a JavaScript file will require the appropriate file loader(s).

```js
import "carbon-components-svelte/css/all.css";
import App from "./App.svelte";

const app = new App({ target: document.body });

export default app;
```

See [webpack.config.js](examples/webpack/webpack.config.js) in [examples/webpack](examples/webpack).

### TypeScript support

[TypeScript definitions](types) are generated by [sveld](https://github.com/IBM/sveld).

## Contributing

Refer to the [Contributing guidelines](CONTRIBUTING.md).

## [Changelog](CHANGELOG.md)

## License

[Apache 2.0](LICENSE)

[npm]: https://img.shields.io/npm/v/carbon-components-svelte.svg?color=262626&style=for-the-badge
[npm-url]: https://npmjs.com/package/carbon-components-svelte
[build]: https://img.shields.io/travis/com/ibm/carbon-components-svelte?color=24a148&style=for-the-badge
[build-badge]: https://travis-ci.com/ibm/carbon-components-svelte
