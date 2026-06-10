# Contributing

If you're not sure what to build or how to approach a change, [file an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues) before opening a PR.

## Prerequisites

Codebase:

- [Bun](https://bun.com/docs/installation)

Use Bun as the package manager and task runner. Run package scripts with `bun <script>` and one-off binaries with `bunx <bin>`.

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

### Set up

```sh
bun setup
```

This installs root and docs dependencies and generates TypeScript definitions and `docs/src/COMPONENT_API.json`.

Component documentation lives in `docs/`. The site uses [Vite](https://vite.dev/), [Routify 3](https://routify.dev/docs), Svelte 5, and MDsveX. The Vite config resolves `carbon-components-svelte` to the repository root, so edits under `src/` show up in the docs without a separate package link.

To preview the docs site locally:

```sh
cd docs
bun dev
```

The site serves at http://localhost:5173/ (or the next available port).

## Best practices

Conventions used across `src/`. Follow them in new and changed code.

### Code style

Comments:

- Do not add trivial comments. If a comment restates what the code already says, delete it or improve the code instead.
- Reserve comments for non-obvious behavior: Svelte reactivity edge cases, ARIA placement, workarounds for Carbon v10 gaps. See loop guards in [`ContentSwitcher.svelte`](src/ContentSwitcher/ContentSwitcher.svelte) and the duplicate-dispatch guard in [`Checkbox.svelte`](src/Checkbox/Checkbox.svelte).

Patterns:

- Use `function` declarations in `<script>`. Declare handlers, defaults, and logic as functions rather than inline in markup. Named functions give stable references for default prop values (see `defaultShouldFilter` in [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte)).
- Avoid `afterUpdate`. It runs after every DOM update and is easy to loop in Svelte 5. Prefer `$:` reactive statements with guards, event handlers, `onMount`, or `tick()` for DOM reads. Legacy code may still use `afterUpdate` for scroll-sync or measurement; do not add new uses without a strong reason.
- Reset cached positional state (scroll offset, highlighted index, measured sizes) reactively when its source collection changes, not just on open/close. A value cached against the old list, such as a scroll position into pre-filter results, silently points past the end of the new one. Use a `$:` guard comparing against the previous length or identity.
- Put the JSDoc block first, then `export let`, then imports. See [`Button.svelte`](src/Button/Button.svelte) and [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte).
- Forward DOM events with bare `on:click` / `on:focus` (no handler) on the underlying element ([`Button.svelte`](src/Button/Button.svelte)).
- Interpolate attribute values with Svelte's attribute syntax, not template literals: `id="{treeId}-{id}-subtree"`, not ``id={`${treeId}-${id}-subtree`}``. Keep template literals only when a value needs nested quotes or logic the shorthand can't express (see `aria-label` in [`PinCodeInput.svelte`](src/PinCodeInput/PinCodeInput.svelte)).
- Compound components use `setContext` / `getContext` with `carbon:` keys ([`CheckboxGroup.svelte`](src/Checkbox/CheckboxGroup.svelte)).
- Default element IDs use `ccs-${Math.random().toString(36)}`.
- Key `{#each}` blocks, for example `(item.id ?? index)` (see [`RecursiveList.svelte`](src/RecursiveList/RecursiveList.svelte)).
- Put shared logic in `src/utils/`, for example [`debounce.js`](src/utils/debounce.js) and [`isOutsideClick.js`](src/utils/isOutsideClick.js). Prefer pure, DOM-free functions for layout, geometry, and state-decision math (see [`virtualize.js`](src/utils/virtualize.js)). They are unit-testable in isolation, so edge cases get covered once in a util test instead of through expensive component renders.
- ComboBox, Dropdown, and MultiSelect share listbox behavior (virtualization, keyboard navigation, outside-click) through `src/utils/`. When you change shared menu behavior, apply and test the change in all three. The per-component wiring is parallel but not abstracted.
- Use Carbon v10 markup: `bx--` BEM classes in templates; SCSS patches use `$prefix` and tokens. See [Custom styles](#custom-styles-patching-carbon-v10).
- Do not add themeable styles in per-component `<style>` blocks (see [Custom styles](#custom-styles-patching-carbon-v10)).
- Use the legacy Svelte 5 API. Components use `export let`, `$:`, and `createEventDispatcher`. Do not introduce runes (`$state`, `$derived`, `$effect`) unless the project explicitly migrates.

The `{#if skeleton}` early-return pattern is being phased out. Follow it only when maintaining existing skeleton code.

API, docs, and workflow:

- Never hand-edit generated files. `src/**/*.svelte.d.ts`, `src/index.d.ts`, and `docs/src/COMPONENT_API.json` are produced by sveld and are gitignored.
- Document the public API in JSDoc. Cover every exported prop, event, slot, and rest-props target. See [Typing with JSDoc](#typing-with-jsdoc).
- Update component docs when appropriate. New props, features, and behavior changes need matching `.svx` updates. See [Component documentation](#component-documentation).
- Use `$$restProps` + `@restProps` for passthrough attributes (see [`Search.svelte`](src/Search/Search.svelte)).
- Scope lint and tests to what you changed. See [Checks](#checks) and [Unit tests](#unit-tests).

## Development workflow

Create a topic branch from `master`. Keep your PR focused and your branch current with upstream `master`.

```sh
git checkout -b new-feature
```

### Component format

Put each component in this layout:

```js
src/Component
│
└───Component.svelte // main component
└───ComponentSkeleton.svelte // Skeleton component (if applicable)
└───index.js // export components
```

Type definitions are generated by sveld. See [Typing with JSDoc](#typing-with-jsdoc).

### Typing with JSDoc

Types live in JSDoc comments, not TypeScript inside `.svelte` files. [sveld](https://github.com/carbon-design-system/sveld) (via `bun build:docs`) reads those comments and writes:

- `src/**/*.svelte.d.ts` and `src/index.d.ts` (consumer types)
- `docs/src/COMPONENT_API.json` (docs site API tables)

The auto-generated Props / Typedefs / Slots / Events tables at the bottom of each docs page come from `COMPONENT_API.json`. JSDoc is the source of truth for API tables; the `.svx` file covers usage examples and prose.

#### JSDoc tags

| Tag | Purpose |
| --- | --- |
| `@type` | Prop type |
| `@template` | Generic type params (supports defaults: `@template {ComboBoxItem<any>} [Item=ComboBoxItem<any>]`) |
| `@typedef` / `@property` | Item/shape types, event payloads |
| `@bindable writable` / `@bindable readonly` | Two-way and element refs |
| `@event` | Dispatched custom events (with payload type) |
| `@slot` | Named/default slot props |
| `@restProps` | Where `$$restProps` land |
| `@extends` | Inherit props from another component (skeleton wrappers) |
| `@default`, `@example` | Docs metadata |

Reference [`ComboBox.svelte`](src/ComboBox/ComboBox.svelte) for `@template`, `@typedef`, `@event`, `@slot`, and typed props. For generics in plain JS, see [`src/utils/debounce.js`](src/utils/debounce.js).

#### Example

```js
/**
 * Specify the size of the component
 * @type {"sm" | "default" | "lg"}
 */
export let size = "default";
```

#### After changing a component's API

Whenever you add, remove, or retype an exported prop, slot, or event (including its JSDoc `@type`), regenerate and verify:

```sh
bun build:docs   # sveld: types + COMPONENT_API.json
bun test:types   # svelte-check on tests/
```

`bun setup` already runs `build:docs` once. Repeat `build:docs` only when the component API changes.

### Creating a component

[File an issue](https://github.com/carbon-design-system/carbon-components-svelte/issues) first.

If you add a new component, export it from `src/index.js`:

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

See [Component documentation](#component-documentation) for the docs checklist.

### Component documentation

Update documentation when the change is user-facing:

- New component: add a new page
- New prop, event, or slot: document usage (JSDoc covers the API table; add an example if non-obvious)
- New feature or variant: add or extend an example section
- Notable behavioral change: update existing prose/examples so they stay accurate

Skip doc updates for internal refactors with no API or behavior change.

#### Where docs live

| Path | Purpose |
| --- | --- |
| `docs/src/pages/components/{Component}.svx` | Main component page (for example `Button.svx`): prose + examples |
| `docs/src/pages/framed/{Component}/{Example}.svelte` | Interactive demos referenced by `<FileSource>` |

Routify picks up new `.svx` files automatically. [`docs/scripts/index-docs.ts`](docs/scripts/index-docs.ts) indexes each page and its `##` headings for search. No separate nav registration is required.

Preview locally with `cd docs && bun dev`.

#### Example conventions

Before adding an example, read the component's `.svx` and follow its order, grouping, and voice. Reference pages: [`Button.svx`](docs/src/pages/components/Button.svx), [`ComboBox.svx`](docs/src/pages/components/ComboBox.svx).

Page structure:

1. Optional `<script>` imports at top (components + icons used inline)
2. One-paragraph intro describing what the component does
3. `## Section title` per variant/feature, each with a short description then the demo

Description language: imperative, prop-focused. See [Writing style](#writing-style) for Carbon content rules.

- "Set `kind="secondary"` for secondary actions."
- "Hide the label visually by setting `hideLabel` to `true`. The label remains available to screen readers."

Typical section order (follow sibling sections on that page):

1. Default / basic usage
2. Core variants grouped (kinds, sizes)
3. Feature sections (slots, filtering, typeahead, portal, etc.)
4. Layout options (direction, light)
5. Validation states (`invalid`, `warn`)
6. Interaction states (`disabled`, `readonly`)
7. Skeleton (if applicable)
8. Advanced / performance (virtualization, async)
9. Programmatic or reactive behavior last

Insert new sections in the logical group. Do not append every example to the end if it belongs with related variants.

Inline vs framed:

- Inline: simple, static demos directly in the `.svx` file
- `<FileSource src="/framed/Component/Example" />`: reactive state, `bind:this`, events, async behavior, or demos too large for inline. Add the Svelte file under `docs/src/pages/framed/{Component}/` (PascalCase name, for example `ReactiveComboBox.svelte`)

Other patterns:

- `[!NOTE]` admonitions for accessibility and non-obvious caveats
- Keyboard keys in prose: use `<DocKbd label="Enter" />` for named keys (`Enter`, `Escape`, `Shift`, `Ctrl`, `Space`, etc.). mdsvex auto-imports `DocKbd`; do not add a manual import. Do not use backticks (`Escape`), raw `<kbd>`, or bold (`**Enter**`). For combinations, use one component per key: `<DocKbd label="⌘" />+<DocKbd label="C" />`. Keep collective phrases as plain text ("arrow keys", "modifier keys", "keyboard navigation"). Prop values and UI copy inside component examples are out of scope (e.g. `placeholder="Enter user name..."`, `shortcutText="⌘C"`).
- Cross-links to related components: `[Modal](/components/Modal#modal-with-dropdowns)`
- Reuse the same sample data shapes as neighboring examples on that page

#### Writing style

Follow [Carbon's writing style](https://carbondesignsystem.com/guidelines/content/writing-style/): direct, concise, present tense. Section descriptions explain what a prop does and when to use it, not what the component "allows."

| Avoid | Prefer |
| --- | --- |
| Trivializers: "easy", "easily", "makes it easier to", "for performance reasons" | State the behavior directly |
| Latin abbreviations: `e.g.`, `i.e.` | "for example", "that is" (or rephrase without) |
| Indirect phrasing: "allows you to", "allowing you to", "allows for" | Direct imperative: "Set `…` to …", "Use `…` to …" |
| Filler tails that restate the obvious: "This provides more visual emphasis.", "This prevents user interaction." | Cut unless it adds when-to-use guidance |
| Passive or future tense in intros | Present tense, active voice |
| Varied `hideLabel` / `hideLegend` wording | Standard boilerplate (below) |

Standard boilerplate for hidden labels (copy verbatim):

> Hide the label visually by setting `hideLabel` to `true`. The label remains available to screen readers.

Use `hideLegend` analogously for legend-hiding props.

Before / after examples:

```
# Before
Set openOnClear to true to allow users to immediately see all available items.

# After
Set `openOnClear` to `true` to reopen the dropdown menu after clearing the selection.
This lets users immediately browse all available items without clicking the input again.
```

```
# Before
For async (e.g., server-side) filtering, bind to value…

# After
For async (for example, server-side) filtering, bind to `value`…
```

```
# Before
Virtualization allows you to render large lists efficiently for performance reasons.

# After
Virtualization renders only the items currently visible in the viewport, improving performance for large lists.
```

```
# Before
The menu closes from the trigger, the `Escape` key, or an outside click.

# After
The menu closes from the trigger, <DocKbd label="Escape" />, or an outside click.
```

#### New component checklist

1. Export from `src/index.js`
2. JSDoc all public API → `bun build:docs`
3. Create `docs/src/pages/components/{Component}.svx` modeled on a similar existing component
4. Add framed examples only where interactivity requires them
5. Preview with `cd docs && bun dev`

### Custom styles (patching Carbon v10)

The library pins `carbon-components` to v10 (`10.58.x`). When a style fix or feature from newer Carbon is missing from the v10 SCSS, or when the Svelte components need a tweak Carbon does not provide, put the patch in a hand-authored SCSS partial under `css/`. These compile into the shipped theme stylesheets. Use them instead of per-component `<style>` blocks for anything that should be themeable.

#### Anatomy of a partial

Each patch is a leading-underscore partial (for example `css/_breadcrumb.scss`, `css/_tag.scss`) that imports the Carbon variables and mixins it needs, defines a single named mixin, and emits it through Carbon's `exports()` import-once guard:

```scss
@import "carbon-components/scss/globals/scss/vars";
@import "carbon-components/scss/globals/scss/typography";

/// Small breadcrumb variant (Carbon React `size="sm"` parity)
/// @access private
/// @group components
@mixin breadcrumb-sm {
  .#{$prefix}--breadcrumb--sm {
    @include type-style("label-01");
    margin-right: $carbon--spacing-02;
  }
}

@include exports("breadcrumb-sm") {
  @include breadcrumb-sm;
}
```

#### Conventions

Style only through Carbon tokens and mixins: spacing (`$carbon--spacing-*`), type (`type-style(...)`), `to-rem(...)`, and theme color tokens. Do not hardcode raw `px` or hex values. Tokens keep themes consistent and survive a future Carbon upgrade.

Reference classes through `$prefix` (`.#{$prefix}--breadcrumb`), never a literal `.bx--…`.

Wrap output in `@include exports("name")` so a partial imported by multiple theme entry files emits its rules only once.

Document the mixin with SassDoc (`/// @access private`, `/// @group components`).

#### Registering a partial

A partial ships only after a theme entry file imports it. Add `@import "./name";` to the custom component overrides block, which comes _after_ Carbon's own `globals/scss/styles`, in all six entry files. Keep import order identical across them:

- `css/all.scss`
- `css/white.scss`
- `css/g10.scss`
- `css/g80.scss`
- `css/g90.scss`
- `css/g100.scss`

#### Rebuild and commit

The compiled `css/*.css` files are committed to the repo. After any edit under `css/`, rebuild:

```sh
bun build:css
```

This compiles every non-partial `*.scss` (sass, compressed) through autoprefixer and rewrites `css/*.css` and `css/css.d.ts`. Commit the regenerated CSS with your SCSS changes.

### Checks

See [Best practices](#best-practices) for scoping. Run checks against what you changed. Full-repo runs are slow and surface unrelated failures.

For format and lint, scope Biome to what you touched:

```sh
# Specific paths — always lints the current working tree
bunx biome check --write src/DataTable

# Staged files only (what a commit would include)
bunx biome check --write --staged

# Files committed on this branch relative to master
bunx biome check --write --changed --since=master
```

Pick the form that matches your state. `--changed` and `--staged` resolve their file
list from git, so each sees a different slice:

- Path scoping (`src/DataTable`) lints whatever is on disk now, committed or not. Use it
  while editing.
- `--staged` lints the git index. Run it after `git add`.
- `--changed` diffs commits against the default branch. It does **not** see uncommitted
  or unstaged edits, so it reports nothing until you commit.

`bun run lint` runs Biome over the entire repository. Reserve it for broad sweeps.

For unit tests, match a pattern against test file paths instead of running the whole suite:

```sh
bun run test DataTable
```

The full suite (`bun run test`) is slow and can hit unrelated flaky UIShell focus failures. Scope to the component you touched.

Types and E2E:

- `bun test:src-types` type-checks `src/` (uses `tsconfig.types.json`)
- `bun test:types` runs `svelte-check` on `*.svelte` and `.ts` files in `tests/`
- `bunx playwright test --grep "Breakpoint"` runs a focused E2E pattern (see [E2E testing](#e2e-testing-with-playwright)); `bun run test:e2e` runs the full E2E suite

## Testing

### Unit tests

Unit tests live in `tests/` and use Vitest with `@testing-library/svelte`. See [Checks](#checks) for scoped runs.

#### Layout

```
tests/
  ComponentName/
    ComponentName.test.ts              # assertions
    ComponentName.test.svelte          # default fixture
    ComponentName.custom.test.svelte   # variant fixtures as needed
```

Mirror `src/` component folders. Put complex setups in `*.test.svelte`, not inline in the `.ts` file.

#### Imports

In `.test.svelte` fixtures, import the component under test directly, not from the barrel:

```svelte
<script lang="ts">
  import ComboBox from "carbon-components-svelte/ComboBox/ComboBox.svelte";
</script>
```

Avoid `import { ComboBox } from "carbon-components-svelte"` in fixtures. Direct paths skip transforming the entire [`src/index.js`](src/index.js) barrel and are faster under Vitest. The alias in [`vite.config.ts`](vite.config.ts) resolves `carbon-components-svelte` to `src/`.

In `.test.ts` files, import types from the direct path and render via the fixture:

```ts
import type ComboBoxComponent from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBox from "./ComboBox.test.svelte";
```

Import shared utilities (for example exported helpers) from the component file or [`src/utils/`](src/utils/) as appropriate.

#### Queries and interactions

- Prefer accessible queries: `getByRole`, `getByLabelText`, `getByText` with `exact: true` when needed ([`ComboBox.test.ts`](tests/ComboBox/ComboBox.test.ts)).
- Use `data-testid` in unit tests only when roles are insufficient. E2E fixtures use `data-testid` routinely.
- Use the shared `user` helper from [`tests/utils/user.ts`](tests/utils/user.ts) for clicks and keyboard input.
- Type fixture props with `ComponentProps<typeof Component>` from `svelte` where helpful.

#### What to test

Prioritize high-value coverage:

- Default render and primary user interactions (open, select, submit, keyboard)
- Accessibility roles, labels, and ARIA state changes
- Regressions for bugs you fix
- Boundary inputs to pure utils: zero or negative sizes, empty collections, divide-by-zero, and out-of-range indices. Assert the defined fallback (clamp, empty, identity) rather than only that it doesn't throw.
- Generic/type contracts when adding `@template` props (see below)

Skip or avoid:

- Tests that mirror implementation details without asserting user-visible behavior
- Redundant permutations of the same code path
- Large fixture setups when a focused unit test on a util suffices

Add tests proportional to the change. Not every prop variant needs its own case.

#### Generics and type tests

Vitest exposes `expectTypeOf` globally (see [`tests/utils/setup-globals.ts`](tests/utils/setup-globals.ts)). Use it in a `describe("Generics", …)` block to verify `@template` JSDoc flows through to consumer types. Pure type assertions do not require a runtime render.

Pattern from [`Button.test.ts`](tests/Button/Button.test.ts) and [`ComboBox.test.ts`](tests/ComboBox/ComboBox.test.ts):

```ts
import type ComboBoxComponent from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import type { ComponentProps } from "svelte";

describe("Generics", () => {
  it("should support custom item types with generics", () => {
    type Product = { id: string; text: string; price: number };

    type ComponentType = ComboBoxComponent<Product>;
    type Props = ComponentProps<ComponentType>;

    expectTypeOf<Props["items"]>().toEqualTypeOf<readonly Product[]>();

    const itemToString = (item: Product) => item.text;
    expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
  });
});
```

Use `ComponentProps` and `ComponentEvents` from `svelte` for props and event payloads. For runtime smoke tests with custom item shapes, add a `*Generics.test.svelte` fixture ([`ComboBoxGenerics.test.svelte`](tests/ComboBox/ComboBoxGenerics.test.svelte)).

Common `expectTypeOf` matchers: `.toEqualTypeOf`, `.toExtend`, `.parameter(n)`, `.returns`, `.toHaveProperty`.

#### Other patterns

- `beforeEach(() => vi.clearAllMocks())` when tests use spies.
- Scope runs: `bun run test ComboBox` (see [Checks](#checks)).

#### Svelte 3 and Svelte 4 compatibility tests

The default `bun run test` harness uses Svelte 5. Separate workspaces under `tests-svelte3/` and `tests-svelte4/` run the same tests against older Svelte versions.

You only need these when fixing a failure reported from `bun run test:svelte3`, `bun run test:svelte4`, or their type-check scripts. Most changes do not require them.

Before running a compatibility script, install that workspace's dependencies. Without a local `node_modules`, the run may fall back to the Svelte 5 harness:

```sh
cd tests-svelte3 && bun install
cd ../tests-svelte4 && bun install
```

Then from the repo root:

```sh
bun run test:svelte3
bun run test:svelte4
```

### E2E testing with Playwright

E2E tests run in a real browser against HTML fixtures served by Vite. The Playwright config is in `playwright.config.ts`; the Vite config for fixtures is in `e2e/vite.config.ts`.

Run the full suite:

```sh
bun run test:e2e
```

Run a focused component or pattern:

```sh
# Single test file
bunx playwright test e2e/breakpoint.test.ts

# Tests matching a grep pattern (for example "Breakpoint" or "sm breakpoint")
bunx playwright test --grep "Breakpoint"
```

#### How fixtures are served (local vs CI)

The fixtures are a Vite multi-page app, one `.html` entry per fixture. How they are served depends on the environment, controlled by the `CI` env var in `playwright.config.ts`:

- **Locally**: Playwright starts the Vite **dev server**. It transforms modules on demand, so there is no build step and edits show up immediately.
- **In CI**: Playwright runs `vite build` once and serves the static output with `vite preview`. Bundled assets load faster and with less run-to-run variance than the dev server, which transforms unbundled modules on demand through a single process that competes with the browser workers for CPU.

Neither path needs a manual build. To reproduce the CI build locally, for example to debug a build-only failure, build the fixtures once:

```sh
bunx vite build --config e2e/vite.config.ts
```

The output lands in `e2e/fixtures/dist/` (gitignored). Serve it with `bunx vite preview --config e2e/vite.config.ts`, or run the whole CI path in one command:

```sh
CI=true bunx playwright test --project=chromium
```

To add a new E2E test, copy the Breakpoint example. Create these files:

| File                                     | Purpose                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `e2e/fixtures/MyComponentFixture.svelte` | Svelte component that renders the component under test. Use `data-testid` on elements you want to query.         |
| `e2e/fixtures/my-component.ts`           | Entry script that mounts the fixture into `#app`. Use the shared `mount()` utility from `./mount`.               |
| `e2e/fixtures/my-component.html`         | HTML page with `<div id="app"></div>` and a script tag loading the entry module.                                 |
| `e2e/my-component.test.ts`               | Playwright tests. Use `page.goto("/my-component.html")` in `beforeEach`, then `page.getByTestId(...)` to assert. |

Example fixture mount (`my-component.ts`):

```ts
import MyComponentFixture from "./MyComponentFixture.svelte";
import { mount } from "./mount";

mount(MyComponentFixture);
```

A few gotchas:

For components that hide content with CSS (for example ComposedModal), `toBeVisible()` can lie because the element stays in the DOM. Prefer `toHaveClass(/is-visible/)` on the container, or assert on `aria-hidden` / `inert`.

`getByText("Row 1")` also matches "Row 10", "Row 11", and so on. Use `getByRole("cell", { name: "Row 1", exact: true })` or a more specific selector when content can overlap.

Add a link to `e2e/fixtures/index.html` so the fixture is reachable from the index page.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
```

Subject line:

- Keep it concise: one line, imperative mood
- Common types: `fix`, `feat`, `docs`, `chore`, `test`, `refactor`
- Scope is the component or area; multi-word names are lowercase with dashes: `combo-box`, `code-snippet`, `data-table`, `ui-shell`, `accordion-item`
- Omit scope when the change spans many areas (`docs: …`, `chore: …`)
- Append `!` after the scope for breaking changes: `fix(accordion-item)!: …`

Examples:

```
fix(combo-box): close dropdown on outside click
docs(tree-view): fix slottable inline editing example
chore(deps-dev): bump vitest, svelte-check
```

Body (optional):

A body is not required. Add one when context helps reviewers or when closing an issue.

- Reference the issue: `Fixes #1000` or `Closes #1000` (GitHub auto-closes on merge)
- At most 2-3 sentences, full sentences, no bullet lists
- Wrap lines at 72 characters for readability in `git log`

Example with body:

```
fix(data-table): associate cells with column headers

Cells now set aria-labelledby to their column header id.
Fixes #3162
```

Avoid vague subjects (`fix bug`), PascalCase or camelCase scopes (`fix(ComboBox):`), and long subjects. Move detail to the body. Prefer `Fixes #N` in the body over PR numbers in the subject.

## Submit a pull request

Follow [Commit messages](#commit-messages) for each commit in your branch.

### Sync your fork

Before you open a PR, sync your fork with upstream:

```sh
git fetch upstream
git checkout master
git merge upstream/master
```

### Open a PR

Push your branch, then open a PR comparing `<YOUR_USER_ID>/feature` to `origin/master`.

## Maintainer guide

The following applies only to project maintainers.

### Release

This library publishes to NPM with [provenance](https://docs.npmjs.com/generating-provenance-statements) via a [GitHub workflow](https://github.com/carbon-design-system/carbon-components-svelte/blob/master/.github/workflows/release.yml).

Pushing a tag that starts with `v` (for example `v0.81.1`) triggers the workflow. It runs `bun ci`, `bun build:docs`, and `bunx culls --preserve=svelte` before publishing to NPM.

Maintainers still do a few things locally before tagging.

On a clean `master` branch, run `bun run release`. That will:

- Bump the semantic version in `package.json`
- Generate notes in `CHANGELOG.md`
- Run `bun run build:docs` to update generated documentation

It does not commit or tag. Do that manually:

```sh
# 1. Commit the changes using the new version as the commit message.
git commit -am "v0.81.1"

# 2. Create a tag.
git tag v0.81.1

# 3. Push the tag to the remote.
# This triggers the `release.yml` workflow to publish a new package to NPM (with provenance).
git push origin v0.81.1
```

If the workflow succeeds, the [`release.yml` workflow](https://github.com/carbon-design-system/carbon-components-svelte/actions/workflows/release.yml) publishes the new version to NPM.

### Post-release checklist

After the release is on NPM:

1. Create a [new release](https://github.com/carbon-design-system/carbon-components-svelte/releases/new) on GitHub. Click "Generate release notes" to list changes by commit with PR and author metadata. Drop notes that do not matter for the release (for example CI-only changes).

2. Mark it as the latest release.

3. On each related PR or issue, confirm the fix shipped. Future readers will want to know which version picked it up.

```md
Released in [v0.81.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.81.1).
```
