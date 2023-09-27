# Contributing

Before submitting a pull request (PR), consider [filing an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues) to gain clarity and direction.

- [Prerequisites](#prerequisites)
- [Project set-up](#project-set-up)
  - [Install](#install)
- [Documentation set-up](#documentation-set-up)
- [Development workflow](#development-workflow)
  - [Component Format](#component-format)
  - [Editing a component](#editing-a-component)
  - [Creating a component](#creating-a-component)
  - [Run `yarn build:docs`](#run-yarn-builddocs)
- [Submit a Pull Request](#submit-a-pull-request)
  - [Sync Your Fork](#sync-your-fork)
  - [Submit a PR](#submit-a-pr)

## Prerequisites

- [Node.js](https://nodejs.org/en/download/package-manager/) (version >=12)
- [Yarn](https://classic.yarnpkg.com/en/docs/install)

## Project set-up

Fork the repo and clone your fork:

```sh
git clone <YOUR_FORK>
cd carbon-components-svelte
```

Set the original repository as the upstream:

```sh
git remote add upstream git@github.com:carbon-design-system/carbon-components-svelte.git
# verify that the upstream is added
git remote -v
```

### Install

Install the project dependencies:

```sh
# carbon-components-svelte/
yarn install
```

## Documentation set-up

Component documentation is located in the `docs` folder. The website is built using svite, routify, and MDsveX. You will need to create a symbolic project link in order to see live changes reflected when developing locally.

First, create a symbolic link at the root of the project folder:

```sh
# carbon-components-svelte/
yarn link
```

Go into the `docs` folder:

```sh
cd docs
```

Link `"carbon-components-svelte"`:

```sh
yarn link "carbon-components-svelte"
yarn install
```

If linked correctly, any change to a component in the `src` folder should be reflected in the `docs` site.

---

## Development workflow

Create a topic branch from `master`. Keep your PR focused and branch up-to-date with upstream `master`.

```sh
git checkout -b new-feature
```

Preview changes to components from the `src` folder in the documentation website located in `docs/`.

In the `docs` folder, run:

```sh
yarn dev
```

The site should be served at `http://localhost:3000/` (or the next available port).

### Component Format

Each component should adopt the following structure:

```js
src/Component
│
└───Component.svelte // main component
└───ComponentSkeleton.svelte // Skeleton component (if applicable)
└───index.js // export components
```

### Editing a component

If adding or editing an exported component prop, be sure to annotate its value using [JSDoc](https://jsdoc.app/) conventions.

```js
/**
 * Specify the size of the component
 * @type {"sm" | "default" | "lg"}
 */
export let size = "default";
```

### Creating a component

First, [submit an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues).

If creating a new component, don't forget it from `src/index.js`:

```diff
export { CopyButton } from "./CopyButton";
export { ComboBox } from "./ComboBox";
+ export { FixedComboBox } from "./FixedComboBox";
export {
  ComposedModal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "./ComposedModal";
```

### Run `yarn build:docs`

Run the following command to re-generate TypeScript definitions and documentation.

```sh
# carbon-components-svelte/
yarn build:docs
```

## Submit a Pull Request

### Sync Your Fork

Before submitting a pull request, make sure your fork is up to date with the latest upstream changes.

```sh
git fetch upstream
git checkout master
git merge upstream/master
```

### Submit a PR

After you've pushed your changes to remote, submit your PR. Make sure you are comparing `<YOUR_USER_ID>/feature` to `origin/master`.

## Maintainer guide

The following items only apply to project maintainers.

### Release

Locally, while on `master` and the branch is clean, run `yarn release`. This command will:

- Build library and docs
- Bump package.json version
- Add notes to Changelog

This command will not create a commit nor tag. Afterwards, perform the following manually:

```sh
# 1. Stage prepared files for a commit
git add .

# 2. Commit based on the current version, either manually or with jq
git commit -m "v$(jq -r '.version' package.json)"

# 3. Create a tag based on the current version, either manually or with `jq`:
git tag "v$(jq -r '.version' package.json)"

# 4. Push branch and tag, then publish
git push origin master [tag]
yarn publish

# 5. Generate release notes on GitHub, and comment on issues and pull requests
```
