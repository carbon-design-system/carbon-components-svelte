# dom-env

A zero-dependency DOM for component tests, built against this repo's suite. It replaces jsdom as the vitest environment and runs on Node 22+ and Bun.

## Use

`dom-env` runs only in vitest's `vmThreads` pool. Point `environment` at the adapter (paths resolve from the vitest root):

```ts
test: {
  pool: "vmThreads",
  environment: "../dom-env/vitest.js",
}
```

The adapter builds `dist/dom-env.js` with Rolldown (`build.js`) when a source file is newer than the bundle, then evaluates it inside each test file's VM context. Evaluating it there, rather than importing it, means the DOM's classes use that context's own `Array`, `Object`, and `Error`, so `instanceof` checks in tests and libraries behave.

## Design

| Choice | Why |
| --- | --- |
| Children are linked fields (`_first`, `_next`, ...) | Insert and remove are O(1) pointer updates |
| Selectors compile to cached closures over internal fields | Matching never goes through public getters |
| Style declarations store strings and parse lazily | Every style write in jsdom runs a CSS parser |
| Mutation records and live-range updates only when observed | Most tests have neither |
| Live collections are Proxies | `list[0]` always reads the current tree |
| One compiled `vm.Script` per worker | Each test file only pays to run the bundle, not compile it |

## Compatibility

Where tests observe jsdom-specific behavior, dom-env matches jsdom instead of the spec: style value normalization (lowercase units, `0` to `0px`, hex to `rgb()`, `calc()` simplification), computed-style defaults, `click()` and label-forwarded event details, and leaving out APIs the test setup mocks when missing (`animate`, `matchMedia`, `ResizeObserver`, `showModal`, `scrollIntoView`).

It follows browsers where jsdom doesn't: `inert` subtrees can't take focus.

## Strict mode

A member dom-env lacks reads as `undefined`, and writing it makes an expando, so a missing API can go unnoticed. Strict mode lists those lookups per test file, with the line that made each:

```ts
test: {
  environmentOptions: { domEnv: { strict: "warn" } }, // or "error"
}
```

`DOM_ENV_STRICT=warn` turns it on for one run. "warn" prints the list; "error" fails the file's teardown with it.

| Reported | Left out |
| --- | --- |
| Reads and writes of members no DOM class has, from tests and the code under test | Lookups made by libraries, which probe for what browsers lack |
| CSS properties set or read that dom-env doesn't know | Lookups on prototypes, which is how setup code polyfills |
| | Private expandos (`_x`, `__click`) and other classes' fields |
| | Globals that setup code defines after checking for them |

A Proxy at the end of every DOM prototype chain sees only the lookups that miss, so implemented members cost nothing. Some reports are members browsers lack too (`navigator.userAgentData` outside Chromium), which the code under test checks for.

## Leak checks

A listener on the window, the document, `<html>` or `<body>` outlives the component that added it, and so does a MutationObserver on a node still in the page. With `environmentOptions: { domEnv: { leaks: true } }` (or `DOM_ENV_LEAKS=1`), dom-env records each one with up to four lines that asked for it, skipping library frames such as Svelte's runtime:

```ts
const mark = __domEnv.leaks.mark(); // before a test
// ...after its cleanup:
__domEnv.leaks.since(mark, "/src/"); // [{ what: "keydown listener on window", at: "src/utils/dismiss.js:44:27 <- ..." }]
```

`include` keeps entries whose innermost line's path contains it, so a test's own listeners can be left out. Records hold their listener and observer weakly, so tracking never keeps alive what a test expects to be collected. This repo checks after every test in `tests/utils/setup-globals.ts`.

## DOM checks

Structural accessibility rules that need no layout, run on the live document, so markup is checked in every state the tests reach. With `environmentOptions: { domEnv: { checks: true } }` (or `DOM_ENV_CHECKS`), dom-env runs them when a dispatched event's effects settle (the next macrotask), and `__domEnv.checks.run()` runs them on demand; `__domEnv.checks.take()` returns the findings so far.

| Rule | Finds |
| --- | --- |
| `idref` | An `aria-*` id reference, `for`, `list`, `form` or `headers` naming an id not in the document. As in axe, `aria-controls` and `aria-owns` may dangle while `aria-expanded="false"`. |
| `duplicate-id` | Two elements in the document with one id |
| `aria-hidden-focus` | An element in the tab order inside `aria-hidden="true"` |
| `nested-interactive` | An element in the tab order inside a role whose content is presentational (button, checkbox, option, tab...) |

"In the tab order" uses `checkVisibility`, so content hidden with `display` or `visibility` in inline styles or `<style>` sheets doesn't count. The checks use the DOM methods as they were when enabled, so a test spying on `querySelectorAll` doesn't see them.

This repo runs them in a custom vitest runner (`tests/utils/dom-check-runner.ts`) between a test's body and its `afterEach` hooks, and fails the test on findings about the library's own generated ids or on the other rules. `skipDomChecks(rule)` lets a test opt out.

## CSS coverage

Which selectors of a stylesheet some DOM state in the tests matches. With `DOM_ENV_CSS_COVERAGE=<dir>` and a stylesheet (`DOM_ENV_CSS=<file>`, or `environmentOptions: { domEnv: { cssCoverage: { stylesheet } } }`), dom-env checks the selectors after each dispatched event's effects settle and when `__domEnv.coverage.check()` is called, and each test file writes the ones that matched to a JSON file in `<dir>`.

| Choice | Why |
| --- | --- |
| Pseudo-elements and `:hover`/`:focus`/`:active`... come off first | A test's DOM can't show those states; the markup they style is what counts |
| A selector is checked until it first matches | Coverage only needs one match |
| Selectors are indexed by a class of their last compound | Only those whose element could be in the document are tried |
| Selectors parse once per worker | The stylesheet can be large (`all.css` has 7,190) |

This repo's `bun run test:css-coverage` runs the Svelte 5 tests this way and reports, with `scripts/css-coverage.ts`, the selectors no test matched: dead CSS (a `bx--` class `src/` never produces) and states no test renders.

## Develop

```sh
node build.js   # dist/dom-env.js
bun run test    # smoke tests in a bare VM context
```
