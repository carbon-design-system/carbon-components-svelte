# Biome GritQL plugins for the `src/` style rules

This directory holds the GritQL plugins that check the naming/shape conventions documented for
`src/`. The plugins are registered in the root `biome.json`, under an `overrides` entry scoped to
`src/**`, not the top-level `plugins` array (see "Why the plugins are scoped to `src/**`" below).
Because they're registered this way, they run as ordinary error-severity diagnostics under
`bun lint`, `bun lint:changed`, and `bunx biome ci`, the same three commands that run every other
rule in the repo.

## Layout

```
biome/
  check-fixtures.ts     # asserts each fixture flags exactly its `// flag` lines
  rules/*.grit          # one GritQL plugin file per rule, referenced from the root biome.json
  fixtures/*.svelte, *.js  # one fixture per rule: lines that must fire and lines that must not
```

## Running

- `bun run lint`, `bun run lint:changed`, or `bunx biome ci`: lints the whole repo, including
  these plugins, via the root `biome.json`.
- `bun run lint:style:fixtures`: the test suite for these plugins. It runs Biome against a scratch
  copy of `biome/fixtures` and asserts, per fixture file, that diagnostics land on exactly the
  lines marked with a trailing `// flag` comment and no others. This must pass before every commit
  that touches a rule.

## History: why these plugins used to live in a separate config

These plugins previously lived behind a standalone `biome/lint-style.json`, invoked via
`bun run lint:style` as a separate, opt-in pass. That separation worked around two Biome 2.5.13
bugs that made folding the plugins into the root `biome.json`, or even `extends`-ing it,
impossible:

1. **A file named `biome.json`/`biome.jsonc` anywhere under the repo broke whole-repo Biome
   invocations, full stop.** As soon as `biome/biome.json` existed on disk, `bun lint` and
   `bun lint:changed` failed with `Found a nested root configuration, but there's already a root
   configuration.`, regardless of the nested file's own `"root"` value or any `files.includes`
   exclude on the root config. The workaround was to name the file `biome/lint-style.json` instead.

2. **`extends` of the real root config failed the same way**, independent of the rename, because
   of one specific rule: any config that reached `"complexity": { "useArrayFind": "error" }`
   through an `extends` chain while also being passed via `--config-path` hit the identical
   "nested root configuration" error. Since the root config couldn't be edited to drop that rule
   just to accommodate the plugins, `biome/lint-style.json` was fully self-contained instead
   (`"vcs": { "enabled": false }`, `"linter": { "rules": { "recommended": false } }`), with no
   `extends`.

Neither bug applies anymore: there is now exactly one `biome.json` in the repo (the root one), the
plugins are declared in it via a scoped `overrides` entry (see below), and nothing `extends`
anything. `bun run lint:style` and `biome/lint-style.json` no longer exist.

## Why the plugins are scoped to `src/**`

The plugins are declared under an `overrides` entry (`"includes": ["src/**"]`), not the top-level
`plugins` array. The top-level array applies to every file `files.includes` lets through, and these
plugins are unaffordably slow outside `src/`: a single 522-line `e2e/date-picker.test.ts` took
~9 seconds on its own with the plugins active repo-wide, versus ~0.1s/file averaged over all of
`src/`, and instant once scoped away from `e2e/`. The likely cause, per the `element-ref-naming`
"known limitation" below, is that Grit's `` `$x` `` snippets visit every AST node and test the full
node-text regex against each one. Deeply-nested test files (many `describe`/`it`/`test` callbacks)
have both far more nodes and larger per-node text spans than a typical `src/` component's `<script>`
block, so the same dotall/greedy regexes cost much more there. `overrides[].plugins` (a real, if
under-documented, Biome 2.5.13 config field) runs the plugins only for files matching that override's
`includes`, which keeps the cost bounded to `src/` and avoids the blowup entirely. A `bunx biome ci`
over the whole repo (`src/`, `tests/`, `e2e/`, `docs/`, etc.) completes in under 200ms of actual
check time with this scoping, versus not completing within many minutes without it.

Scoping the plugins to `src/**` this way also gives them access to Biome's full HTML/Svelte parsing
(`html.experimentalFullSupportEnabled: true`, set at the root), which the old standalone
`biome/lint-style.json` never had. That surfaced one real hit that was previously invisible: a
`param-naming` violation inside a `use:action={{ ... }}` attribute expression in
`ContentSwitcher.svelte`. The standalone config's more limited Svelte parsing couldn't see it,
because attribute-expression JS isn't fully analyzed without that flag. Counts gathered under the
standalone config undercount for the same reason `TreeView.svelte`'s second `<script>` block does
(see "Known limitation: dual `<script>` blocks" below): both are blind spots the standalone harness
had that the root config does not.

## `check-fixtures.ts` and the `files.includes` exclude

The root `biome.json` excludes `biome/fixtures` from `files.includes` so the fixtures'
deliberately-bad naming patterns never trip the real lint run. Biome 2.5.13 applies that exclude to
explicitly-passed CLI paths too: `biome lint biome/fixtures` (with or without
`--files-ignore-unknown=true`) reports `these paths were provided but ignored`, and there is no CLI
flag that un-ignores an explicitly-targeted path once `files.includes` excludes it. `check-fixtures.ts`
works around this by copying `biome/fixtures` to a scratch directory outside the excluded path and
linting the copy with the repo's own root config (`--config-path` pointing at the real
`biome.json`, no second config file). The scratch directory is created under `src/` itself
(`src/biome-fixture-check-<random>/`, removed immediately after) rather than in the OS temp
directory, because the plugins only apply to `src/**` (see above): a copy anywhere else would be
linted with no plugins active at all, and the check would pass vacuously. It also passes
`--only=plugin` so the fixtures' intentionally odd code doesn't also trip unrelated built-in
rules; with `--only=plugin`, every diagnostic's `category` is `"plugin"`.

## Rules

Rules are added one at a time; each entry below is added in the same commit as its `.grit` file
and fixture.

### `no-arrow-function-binding`

Flags arrow functions assigned to a binding: `const`/`let` (including `$:` reactive statements
and reactive IIFEs), whether or not `async`. The correct form is a named `function` declaration.
Arrows passed as callback arguments, arrows as object property values, and arrows returned from
another function are all left alone, since those aren't "declaring a function" in the sense this
rule cares about.

`export let` props with an arrow-function default (a very common Svelte pattern, e.g.
`export let itemToString = (item) => item.text;`) are deliberately excluded, single- or
multi-line. GritQL's `let`/`var` snippet forms never match, a known Biome limitation, so this rule
matches `let` statements by full-text regex on the statement node instead of by snippet. That same
limitation means an `export let` prop's inner declaration node has no `export` in its own text, so
excluding it requires a `not $x <: within r"export\s[^;]*;"` check rather than a text prefix
check. A plain `^export` prefix check on the statement's own text does not work here, because the
text never contains "export" in the first place: Svelte's `export let` does not wrap the
declaration in a real `ExportNamedDeclaration` node the way a plain `.js`/`.ts` module does. The
`within` regex is deliberately anchored with `[^;]*` (not `.*`) and without `(?s)`/dotall on the
outer wildcard, so it matches only the single wrapping declaration and not the entire enclosing
`<script>` block, which would otherwise also start with `export` and incorrectly exclude every
statement after the first exported prop in the file.

### `handler-naming`

Flags two handler-naming mistakes: a `function` or `const` named `on<Something>` (the
React/DOM "onClick"-style prefix, as opposed to this codebase's own `handle<Event>`
convention), and a `handle<Event>` name that capitalizes the DOM event name instead of
lower-casing it after the first letter (`handleKeyDown`/`handleMouseEnter`/`handleFocusOut`
instead of `handleKeydown`/`handleMouseenter`/`handleFocusout`). Both checks are scoped to
declarations (`function $n($a) { $b }` and `const $n = $v`, which also match `async`/`export`
variants), not to references, so `on:click={handleClick}` usage sites in markup are never
flagged. `let` bindings named `on<Something>` (e.g. `let onCalendarReposition = null;`, a real
shape in `DatePicker`) are intentionally out of scope; only `function` and `const` forms are
checked.

### `element-ref-naming`

Flags `let`/`const` bindings whose name ends in `El`/`Element`, and bindings named exactly `el`.
Uses the same `export let` exclusion as `no-arrow-function-binding` (`export let containingElement`
is a real prop shape in `TagSet`). Names ending in `Node` (TreeView data nodes) are naturally
unaffected since the regex requires `El`/`Element`, and member-expression right-hand sides like
`document.activeElement` are never inspected in the first place: only the declared binding name is.

Known limitation: the `let`-matching branches use `r"(?s)let\s+(\w+...)\s*=.*;"` so that a
multi-statement arrow/function body assigned to the binding (which can contain its own internal
`;`) still full-matches through to the binding's own closing `;`. The same dotall wildcard can
also full-match a *larger enclosing block* when that block's own last statement happens to end in
`;` (e.g. a `return {...};`), because Grit's `` `$x` `` visits every node, not just the statement
that starts with `let`, and that enclosing block's text also starts with the same `let ...`
token. This produces a second, much larger-spanning diagnostic on the same line in a few real
`src/` cases (see `utils/focus.js`, `UserAvatarGroup.svelte`); every flagged line is still correct,
just occasionally reported twice. A stricter `[^;]*;` would avoid the duplicate but then fails to
match legitimate multi-statement bodies, so the current pattern trades an occasional duplicate
diagnostic for correct handling of multi-statement bindings.

### `prev-naming`

Flags `let` bindings matching `(?:last|previous|old)[A-Z]\w*`, e.g. `let lastSearchValue`. Only
`let` is checked; `const`/`function` are not. `export let` props with the same prefix (real
shape: `export let previousButtonText` in `InterstitialScreenFooter`) are excluded via the same
`within` technique as the earlier rules.

### `boolean-naming`

Flags `let` bindings matching `(?:is|has|should)[A-Z]\w*`. `export let` boolean props (`export
let isOpen`, `export let hasDivider`, etc., the standard way this codebase names boolean props)
are excluded via the same `within` technique. Without that check, this rule would flag nearly
every boolean prop in `src/`, because Svelte's `export let` doesn't produce the
`ExportNamedDeclaration` node a text-prefix check would rely on (see `no-arrow-function-binding`
above). `function isOutsideClick() {}`-style predicates and `const` bindings (stores like `const
hasPrimaryItems = writable(false)`) are naturally out of scope, since the pattern only matches
`let` statements.

### `param-naming`

Flags function-declaration parameters named `opts`, `cfg`, `config`, `params`, `fn`, `cb`, `e`,
`evt`, `idx`, `el`, or `element` (checked via a word-boundary search over the whole,
comma-separated parameter-list text, so it doesn't matter which position the bad name is in), and
single-parameter arrow callbacks (`(e) => ...`) with one of the shorter names (`e`/`evt`/`idx`/`el`).

Unlike every other identifier check in this directory, which requires a *full* match against the
node's text, matching a bare arrow parameter identifier via `$p <: r"e|evt|idx|el"` does **not**
enforce a full match: it also matches `event`, because `"event"` contains `"e"` as a substring.
The same alternation used against a `function` name (`$n <: r"on[A-Z]\w*"`, as in
`handler-naming`) does behave as a full match, and correctly leaves `actionOnClick` alone despite
it containing `onC` as a substring. The fix here is an explicit `^(?:e|evt|idx|el)\z` anchor on
the arrow-parameter check only; the function-parameter word-boundary search doesn't need it, since
a "does this parameter list contain one of these words" search is what's wanted there anyway.

This rule has the highest match count of the seven in `src/` (36 locations). Every match inspected
is a genuine, correctly-scoped hit, mostly `fn` in small utility helpers (`debounce`,
`rafThrottle`, `delayedSetter`, `batchStoreUpdates`) and `el`/`e` in inline array callbacks and DOM
handlers (`HeaderSearch`, `SearchMenu`, `yearSelectPlugin`).

### `store-naming`

Flags `const $n = writable(...)`/`readable(...)`/`derived(...)` and any `let` binding, where `$n`
ends in `Store` (e.g. `queryStore`, `registryStore`). `export let ...Store` props are excluded via
the same `within` technique as the earlier `let`-based rules.

## Known limitation: dual `<script>` blocks

Svelte files with both a `<script context="module">` block and a regular `<script>` block (three
in this repo: `Theme.svelte`, `TreeView.svelte`, `TreeViewNode.svelte`) only have their **first**
script block visible to these plugins. A two-script fixture with `let moduleVar` in the module
script and `let instanceVar` in the instance script produces exactly one diagnostic, for
`moduleVar`; `instanceVar` is invisible to every rule in this directory. This appears to be how
Biome hands Svelte ASTs to the GritQL plugin engine, not something fixable from a plugin file.

`TreeView.svelte`'s ~1900-line instance script (the second block) is entirely unscanned by every
rule above as a result, and it has real instances of at least five of the seven patterns, so any
match count taken against `src/` is a floor there, not a total. `Theme.svelte` and
`TreeViewNode.svelte`'s second script blocks don't currently trip any of the seven rules, but that
can change as those files evolve.
