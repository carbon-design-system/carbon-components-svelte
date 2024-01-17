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
  - [Run `npm run build:docs`](#run-npm-run-builddocs)
- [Submit a Pull Request](#submit-a-pull-request)
  - [Sync Your Fork](#sync-your-fork)
  - [Submit a PR](#submit-a-pr)

## Prerequisites

- [Node.js](https://nodejs.org/en/download/package-manager/) (version >=18)
- [npm](https://docs.npmjs.com/cli) (bundled with Node.js)

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
npm install
```

## Documentation set-up

Component documentation is located in the `docs` folder. The website is built using svite, routify, and MDsveX. You will need to create a symbolic project link in order to see live changes reflected when developing locally.

First, create a symbolic link at the root of the project folder:

```sh
# carbon-components-svelte/
npm link
```

Go into the `docs` folder:

```sh
cd docs
```

Link `"carbon-components-svelte"`:

```sh
npm link "carbon-components-svelte"
npm install
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
npm run dev
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

### Run `npm run build:docs`

Run the following command to re-generate TypeScript definitions and documentation.

```sh
# carbon-components-svelte/
npm run build:docs
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

This library is published to NPM with [provenance](https://docs.npmjs.com/generating-provenance-statements) via a [GitHub workflow](https://github.com/carbon-design-system/carbon-components-svelte/blob/master/.github/workflows/release.yml).

The workflow is automatically triggered when pushing a tag that begins with `v` (e.g., `v0.81.1`).

However, maintainers must perform a few things in preparation for a release.

<!-- Instructions for next/* releases -->

While performing a prerelease:

1. manually bump `package.json`'s `version` key to your target version.
2. ensure the `--first-release` flag is passed to the `standard-version` command.
3. Run `npm run release` then continue below.

For regular releases, while on `master` and the branch is clean, run `npm run release`. This command will:

- Bump the semantic version in `package.json`
- Generate notes in `CHANGELOG.md`
- Run `npm run build:docs` to update the generated documentation

This command will not create a commit nor tag. Afterwards, perform the following manually:

```sh
# 1. Commit the changes using the new version as the commit message.
git commit -am "v0.81.1"

# 2. Create a tag.
git tag v0.81.1

# 3. Push the tag to the remote.
# This will trigger the `release.yml` workflow to publish a new package to NPM (with provenance).
git push origin v0.81.1
```

If all goes as expected, the [`release.yml` workflow](https://github.com/carbon-design-system/carbon-components-svelte/actions/workflows/release.yml) should trigger a new run and publish the new version to NPM.

### Post-release checklist

After confirming that the new release is published to NPM, perform the following:

1. Create a [new release](https://github.com/carbon-design-system/carbon-components-svelte/releases/new) on GitHub. Click "Generate release notes" to automatically list changes by commit with the relevant Pull Request and author metadata. You may manually remove notes that are not relevant to the release (e.g., CI changes).

2. Publish the release as the latest release.

3. As good practice, visit the Pull Request and/or issue for each commit and manually confirm that it's been released. This is helpful for future readers to understand what version includes the new feature or fix.

```md
Released in [v0.81.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.81.1).
```
