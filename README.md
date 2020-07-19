# carbon-components-svelte

[![NPM][npm]][npm-url]
[![Build][build]][build-badge]

> Svelte implementation of the [Carbon Design System](https://github.com/carbon-design-system)

## [Storybook](https://ibm.github.io/carbon-components-svelte)

## Getting Started

`carbon-components-svelte` can be installed as a development dependency.

```bash
yarn add -D carbon-components-svelte
```

## Usage

```html
<script>
  import { Button } from "carbon-components-svelte";
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://unpkg.com/carbon-components/css/carbon-components.min.css"
  />
</svelte:head>

<Button>Primary</Button>
```

Try it in the [CodeSandbox](https://codesandbox.io/s/carbon-components-svelte021-lhvc4).

## Contributing

Refer to the [Contributing guidelines](CONTRIBUTING.md).

## [Changelog](CHANGELOG.md)

## License

[Apache 2.0](LICENSE)

[npm]: https://img.shields.io/npm/v/carbon-components-svelte.svg?color=blue
[npm-url]: https://npmjs.com/package/carbon-components-svelte
[build]: https://travis-ci.com/ibm/carbon-components-svelte.svg?branch=master
[build-badge]: https://travis-ci.com/ibm/carbon-components-svelte
