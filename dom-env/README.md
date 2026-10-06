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

The adapter builds `dist/dom-env.js` with `bun build` when a source file is newer than the bundle, then evaluates it inside each test file's VM context. Evaluating it there, rather than importing it, means the DOM's classes use that context's own `Array`, `Object`, and `Error`, so `instanceof` checks in tests and libraries behave.

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

## Develop

```sh
bun run build   # dist/dom-env.js
bun run test    # smoke tests in a bare VM context
```
