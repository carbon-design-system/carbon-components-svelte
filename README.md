# carbon-components-svelte

[![NPM][npm]][npm-url]
[![Build][build]][build-badge]

> Svelte implementation of the [Carbon Design System](https://github.com/carbon-design-system)

**NOTE**: Currently, this project is under active development. See the [issue tracker](https://github.com/IBM/carbon-components-svelte/projects/1) for the anticipated v1.0.0 release.

## [Storybook](https://ibm.github.io/carbon-components-svelte) · [Svelte REPL](https://svelte.dev/repl/201b02d3a92440f99de9129e83a67871?version=3.16.7)

## Getting Started

`carbon-components-svelte` can be installed as a development dependency.

```bash
yarn add -D carbon-components-svelte
```

## Usage

```html
<script>
  import { Button } from 'carbon-components-svelte';
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://unpkg.com/carbon-components@10.9.0/css/carbon-components.min.css" />
</svelte:head>

<Button>Primary</Button>
```

Try it in the [Svelte REPL](https://svelte.dev/repl/201b02d3a92440f99de9129e83a67871?version=3.16.7).

## Contributing

Refer to the [Contributing guidelines](CONTRIBUTING.md).

## [Changelog](CHANGELOG.md)

## License

[Apache 2.0](LICENSE)

[npm]: https://img.shields.io/npm/v/carbon-components-svelte.svg?color=blue
[npm-url]: https://npmjs.com/package/carbon-components-svelte
[build]: https://travis-ci.com/ibm/carbon-components-svelte.svg?branch=master
[build-badge]: https://travis-ci.com/ibm/carbon-components-svelte
