# Contributing

## Prerequisites

This project uses Node.js and Yarn.

- [Node.js](https://nodejs.org/en/download/package-manager/#macos) (version >=12)
- [Yarn](https://yarnpkg.com/en/docs/install#mac-stable)

## Fork and Clone

Fork the repo and clone your fork:

```bash
git clone <YOUR_FORK>
cd carbon-components-svelte
```

Set the original repo as the upstream:

```bash
git remote add upstream git@github.com:IBM/carbon-components-svelte.git
# verify that the upstream is added
git remote -v
```

## Install

Install the project dependencies:

```bash
yarn install
```

---

## Workflow

### Develop

This project uses Storybook for UI development and "live" documentation.

Run the following command to start the Storybook:

```bash
yarn start
```

#### Component Format

Each component should adopt the following structure:

```js
src/Component
│
└───Component.svelte // main component
└───Component.Skeleton.svelte // Skeleton component (if any)
└───Component.Story.svelte // wrapper for individual stories
└───Component.stories.js // Storybook stories
└───index.js // export components (e.g. `Component.svelte`, `Component.Skeleton.svelte`)
```

### Build

#### Component Library

To build the component library, run `yarn build`.

The library should be compiled in two formats:

- **ES**: `lib/index.mjs`
- **UMD**: `lib/index.js`

#### Storybook

To build the Storybook, run `yarn build`.

The Storybook should be outputted to the `storybook-static` folder.

## Submit a Pull Request

### Sync Your Fork

Before submitting a pull request, make sure your fork is up to date with the latest upstream changes.

```bash
git fetch upstream
git checkout master
git merge upstream/master
```

### Submit a PR

After you've pushed your changes to remote, submit your PR. Make sure you are comparing `<YOUR_USER_ID>/feature` to `origin/master`.
