# palimpsest

> pa·​limp·​sest

> writing material used one or more times after earlier writing has been erased – Merriam-Webster

The purpose of this app is to document and illustrate real world consumption of `carbon-components-svelte`.

## Getting Started

This app uses a linked copy of `carbon-components-svelte` to expedite local development.

First, run the following commands at the root of `carbon-components-svelte/`:

```bash
yarn build
yarn link
```

Next, link the library to this folder.

```bash
cd palimpsest
yarn link "carbon-components-svelte"
```

Finally, install this app's dependencies.

```bash
yarn install
```

## Available Scripts

### `yarn start`

Runs the app in development mode with livereload enabled. Visit [http://localhost:8080](http://localhost:8080).

### `yarn build`

Builds the app in production mode.
