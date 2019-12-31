# Contributing

## Getting Started

### Prerequisites

This project uses node (>=10) and yarn (>=1).

- [node](https://nodejs.org/en/download/package-manager/#macos) (version 10.x or greater)
- [yarn](https://yarnpkg.com/en/docs/install#mac-stable) (version 1.x or greater)

### Fork and Clone

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

### Install

Install the project dependencies:

```bash
yarn install
```

---

## Workflow

### Repo Structure

```js
.storybook // Storybook configuration
docs // static, exported Storybook used by GitHub Pages
src
│
└───components // individual components
└───internal // code excluded from the component library
└───lib // shared utilities
```

### Developing

This project uses Storybook for UI development and "live" documentation.

Run the following command to start the Storybook:

```bash
yarn start
```

#### Component Format

Individual components are located in the `src/components` folder:

Each component should adopt the following structure:

```js
src/components/Component
│
└───Component.svelte // main component
└───Component.Skeleton.svelte // Skeleton component (if any)
└───Component.Story.svelte // wrapper for individual stories
└───Component.stories.js // Storybook stories
└───index.js // export components (e.g. `Component.svelte`, `Component.Skeleton.svelte`)
```

### Building

#### Component Library

To build the component library, run `yarn build`.

The library should be compiled in two formats:

- **ES**: `lib/index.mjs`
- **UMD**: `lib/index.js`

#### Storybook

To build the Storybook, run `yarn build:storybook`.

The Storybook should be outputted to the `docs` folder.

## Submitting a Pull Request

### Sync Your Fork

Before submitting a pull request, make sure your fork is up to date with the latest upstream changes.

```bash
git fetch upstream
git checkout master
git merge upstream/master
```

### Submit a PR

After you've pushed your changes to remote, submit your PR. Make sure you are comparing `<YOUR_USER_ID>/feature` to `origin/master`.
