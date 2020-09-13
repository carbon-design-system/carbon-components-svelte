# docs

This application was scaffolded using the default webpack [Sapper](https://github.com/sveltejs/sapper) template.

**Purpose**

- Write integration/end-to-end tests using Cypress
- Serve as an alternative component development environment to Storybook
- Build components in a Server-side Rendering (SSR) environment

## Getting Started

`carbon-components-svelte` must be linked in order to reflect live updates during component development.

In the root folder of this project, run the following:

```sh
# carbon-components-svelte/
yarn link
```

Then, in this folder, link the package and install the dependencies:

```sh
cd docs

# carbon-components-svelte/docs/
yarn link "carbon-components-svelte"
yarn install
```

Before starting development, you will need to build the Carbon-themed CSS StyleSheet once.

```sh
node scripts/carbon-theme
```

A file containing the four Carbon themes will be outputted to `static/style.css`. Do not check this file into source control.

## Available Scripts

### `yarn dev`

Runs the Sapper app in development mode.

### `yarn build`

Builds the app for production (static export only).

### `yarn test`

Runs Cypress integration tests in a headless browser (i.e. CLI only).

### `yarn:test:tdd`

Runs Cypress tests in the Cypress GUI. This is helpful when authoring new tests.

## Deploying to IBM Cloud

Deploy to IBM Cloud using the Staticfile buildpack.

### Log in

Log in using the IBM Cloud CLI:

```sh
ibmcloud login

# or if using Single-Sign On (SSO):
ibmcloud login --sso
```

### Deploy

Build and deploy the app:

```sh
yarn build
ibmcloud target --cf
ibmcloud cf push
```
