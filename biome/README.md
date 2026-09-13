# Biome GritQL plugins for the `src/` style rules

This directory holds a self-contained Biome config and a set of GritQL plugins that check the
naming/shape conventions documented for `src/`. It is **not** wired into the root `biome.json` or
CI; it is a separate, opt-in lint pass.

## Layout

```
biome/
  lint-style.json      # standalone Biome config (see "Why not biome.json" below)
  check-fixtures.ts     # asserts each fixture flags exactly its `// flag` lines
  rules/*.grit          # one GritQL plugin file per rule, rule id = file name
  fixtures/*.svelte, *.js  # one fixture per rule: lines that must fire and lines that must not
```

## Running

- `bun run lint:style` — lints `src/` with only the plugins in this directory (all built-in rules
  are disabled; only the checks below can report).
- `bun run lint:style:fixtures` — the test suite for this directory. Runs Biome against
  `biome/fixtures` and asserts, per fixture file, that diagnostics land on exactly the lines
  marked with a trailing `// flag` comment and no others. This must pass before every commit in
  this task from the first rule onward.

## Why not `biome.json`, and why not `extends`

The task sketch called for `biome/biome.json` extending the root config
(`"extends": ["../biome.json"]`), invoked as `biome lint --config-path=biome src`. Neither survived
contact with Biome 2.5.13; both are genuine tool bugs, verified by bisection, not misconfiguration:

1. **A file named `biome.json`/`biome.jsonc` anywhere under the repo breaks whole-repo Biome
   invocations, full stop.** As soon as `biome/biome.json` existed on disk, `bun lint` and
   `bun lint:changed` (i.e. plain `biome check .` from the repo root) failed with:
   ```
   Found a nested root configuration, but there's already a root configuration.
   ```
   This happens regardless of the nested file's own `"root"` value (tried `true`, `false`, and
   omitted) and regardless of `files.includes` excludes on the root config (tried `"!biome/**"`
   and the normalized `"!biome"` — no effect). Biome's nested-root scan for files literally named
   `biome.json`/`biome.jsonc` runs before `files.includes` filtering is applied. The fix is to
   name the file something else; `biome/lint-style.json` works. The root `biome.json` still
   excludes `biome/` via `"!biome"` in `files.includes`, so `bun lint`/`bun lint:changed` never
   try to format or lint anything in here, but the exclude is belt-and-braces — the rename is
   what actually fixes the crash.

2. **`extends` of the real root config fails the same way, independent of the rename, because of
   one specific rule.** With `biome/lint-style.json` containing `"extends": ["../biome.json"]`
   and invoked via `--config-path`, linting `src/Accordion` raised the identical "nested root
   configuration" error. Bisecting the entire root config down rule-by-rule isolated the trigger
   to a single line: `"complexity": { "useArrayFind": "error" }`. Any config that reaches that
   rule setting through an `extends` chain while also being passed via `--config-path` hits this
   bug — with or without `"root": false`, with or without `vcs` settings copied or disabled. Since
   the root `biome.json` cannot be edited to drop `useArrayFind` just to accommodate this task,
   `extends` is not viable here. `biome/lint-style.json` is fully self-contained instead:
   `"vcs": { "enabled": false }` and `"linter": { "rules": { "recommended": false } }`, so only
   plugin diagnostics can fire — which is actually what `bun run lint:style` wants anyway (a
   count of plugin hits, not a rerun of the main lint rules).

3. **`check-fixtures.ts` cannot invoke Biome with `cwd` at the repo root and a target of
   `biome/fixtures`.** That shape — an ancestor `cwd` that has its own root `biome.json`, and a
   lint target that is a descendant of the directory holding the `--config-path` config — hits
   the same false-positive "nested root configuration" error a third time, again unaffected by
   `files.includes`. The fix: the script spawns Biome with `cwd` set to `biome/` itself, and both
   `--config-path` and the target path relative to that `cwd` (`lint-style.json` and `fixtures`).
   `bun run lint:style` is unaffected by this because its target (`src`) is a *sibling* of
   `biome/`, not a descendant of it, invoked from the repo root as usual.

Net effect: `biome/lint-style.json` is a flat, standalone config (no `extends`), named so Biome's
ambient discovery never trips over it, and `check-fixtures.ts` runs from inside `biome/` to dodge
the same discovery bug for its own fixtures. None of this touches the root `biome.json` beyond the
one `"!biome"` files-includes exclude, and the root config never references these plugins.

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
multi-line. GritQL's `let`/`var` snippet forms never match (a known Biome limitation, see the
verified facts this task started from), so this rule matches `let` statements by full-text regex
on the statement node instead of by snippet. That same limitation means an `export let` prop's
inner declaration node has no `export` in its own text, so excluding it requires a `not $x <:
within r"export\s[^;]*;"` check rather than a text prefix check — a plain `^export` prefix
check on the statement's own text does not work here because the text never contains "export" in
the first place (confirmed empirically; the task's original suggestion that "the statement text
of an exported let starts with export" holds for plain `.js`/`.ts` modules but not for Svelte's
`export let`, which does not wrap the declaration in a real `ExportNamedDeclaration` node the way
a plain JS module does). The `within` regex is deliberately anchored with `[^;]*` (not `.*`) and
without `(?s)`/dotall on the outer wildcard, so it matches only the single wrapping declaration
and not the entire enclosing `<script>` block, which would otherwise also start with `export` and
incorrectly exclude every statement after the first exported prop in the file.

### `handler-naming`

Flags two handler-naming mistakes: a `function` or `const` named `on<Something>` (the
React/DOM "onClick"-style prefix, as opposed to this codebase's own `handle<Event>`
convention), and a `handle<Event>` name that capitalizes the DOM event name instead of
lower-casing it after the first letter (`handleKeyDown`/`handleMouseEnter`/`handleFocusOut`
instead of `handleKeydown`/`handleMouseenter`/`handleFocusout`). Both checks are scoped to
declarations (`function $n($a) { $b }` and `const $n = $v`, which also match `async`/`export`
variants), not to references, so `on:click={handleClick}` usage sites in markup are never
flagged. `let` bindings named `on<Something>` (e.g. `let onCalendarReposition = null;`, a real
shape in `DatePicker`) are intentionally out of scope per the task's own rule definition; only
`function` and `const` forms are checked.

### `element-ref-naming`

Flags `let`/`const` bindings whose name ends in `El`/`Element`, and bindings named exactly `el`.
Uses the same `export let` exclusion as `no-arrow-function-binding` (`export let containingElement`
is a real prop shape in `TagSet`). Names ending in `Node` (TreeView data nodes) are naturally
unaffected since the regex requires `El`/`Element`, and member-expression right-hand sides like
`document.activeElement` are never inspected in the first place — only the declared binding name
is.

Known limitation: the `let`-matching branches use `r"(?s)let\s+(\w+...)\s*=.*;"` so that a
multi-statement arrow/function body assigned to the binding (which can contain its own internal
`;`) still full-matches through to the binding's own closing `;`. The same dotall wildcard can
also full-match a *larger enclosing block* when that block's own last statement happens to end in
`;` (e.g. a `return {...};`), because Grit's `` `$x` `` visits every node, not just the statement
that starts with `let`, and that enclosing block's text also starts with the same `let ...`
token. This produces a second, much larger-spanning diagnostic on the same line in a few real
`src/` cases (see `utils/focus.js`, `UserAvatarGroup.svelte`) rather than a wrong line — every
flagged line is still correct, just occasionally reported twice. A stricter `[^;]*;` avoids the
duplicate but then fails to match legitimate multi-statement bodies, so it isn't a strict
improvement; left as documented behavior rather than "fixed" one way or the other.

### `prev-naming`

Flags `let` bindings matching `(?:last|previous|old)[A-Z]\w*`, e.g. `let lastSearchValue`. Only
`let` is checked (per the task's rule definition; `const`/`function` are not). `export let`
props with the same prefix (real shape: `export let previousButtonText` in
`InterstitialScreenFooter`) are excluded via the same `within` technique as the earlier rules.

### `boolean-naming`

Flags `let` bindings matching `(?:is|has|should)[A-Z]\w*`. `export let` boolean props (`export
let isOpen`, `export let hasDivider`, etc. — the standard way this codebase names boolean props)
are excluded via the same `within` technique; this is the one place the task's own reasoning for
why the exclusion should work turned out not to hold (see `no-arrow-function-binding` above), so
without the `within` check this rule would have flagged nearly every boolean prop in `src/`.
`function isOutsideClick() {}`-style predicates and `const` bindings (stores like `const
hasPrimaryItems = writable(false)`) are naturally out of scope, since the pattern only matches
`let` statements.

### `param-naming`

Flags function-declaration parameters named `opts`, `cfg`, `config`, `params`, `fn`, `cb`, `e`,
`evt`, `idx`, `el`, or `element` (checked via a word-boundary search over the whole,
comma-separated parameter-list text, so it doesn't matter which position the bad name is in), and
single-parameter arrow callbacks (`(e) => ...`) with one of the shorter names (`e`/`evt`/`idx`/`el`).

Discovered while building this rule: unlike every other identifier check in this directory (all
of which correctly require a *full* match against the node's text), matching a bare arrow
parameter identifier via `$p <: r"e|evt|idx|el"` does **not** enforce a full match — it matched
`event` too, because `"event"` contains `"e"` as a substring. Verified directly: the same
alternation used against a `function` name (`$n <: r"on[A-Z]\w*"`, as in `handler-naming`) does
behave as a full match and correctly leaves `actionOnClick` alone despite it containing `onC` as a
substring. The fix here is an explicit `^(?:e|evt|idx|el)\z` anchor on the arrow-parameter check
only; the function-parameter word-boundary search doesn't need it, since a "does this parameter
list contain one of these words" search is what's wanted there anyway.

The real-`src/` count for this rule (36) is well above the task's rough estimate of 15, but every
match inspected is a genuine, correctly-scoped hit — mostly `fn` in small utility helpers
(`debounce`, `rafThrottle`, `delayedSetter`, `batchStoreUpdates`) and `el`/`e` in inline array
callbacks and DOM handlers (`HeaderSearch`, `SearchMenu`, `yearSelectPlugin`) — so the estimate
was simply low, not a sign the pattern is wrong.

### `store-naming`

Flags `const $n = writable(...)`/`readable(...)`/`derived(...)` and any `let` binding, where `$n`
ends in `Store` (e.g. `queryStore`, `registryStore`). `export let ...Store` props are excluded via
the same `within` technique as the earlier `let`-based rules.

## Known limitation: dual `<script>` blocks

Svelte files with both a `<script context="module">` block and a regular `<script>` block (three
in this repo: `Theme.svelte`, `TreeView.svelte`, `TreeViewNode.svelte`) only have their **first**
script block visible to these plugins. Confirmed directly: a two-script fixture with `let
moduleVar` in the module script and `let instanceVar` in the instance script produces exactly one
diagnostic, for `moduleVar`; `instanceVar` is invisible to every rule in this directory. This
appears to be how Biome hands Svelte ASTs to the GritQL plugin engine, not something fixable from
a plugin file. `TreeView.svelte`'s ~1900-line instance script (the second block) is entirely
unscanned by every rule above as a result, which is why the baseline counts below likely
undercount real occurrences in those three files specifically.

## Baseline on 2026-09-12

`bun run lint:style` against `src/`, counted as distinct `(file, line)` locations (a few rules
also emit a second, larger-spanning duplicate diagnostic on the same line — see
`element-ref-naming` above — so raw diagnostic counts run a little higher than this):

| rule                      | count | task's rough estimate |
| -------------------------- | ----: | ---------------------: |
| `no-arrow-function-binding` |    11 |                     12 |
| `handler-naming`            |    25 |                     26 |
| `element-ref-naming`        |     9 |                     10 |
| `prev-naming`                |    11 |                     20 |
| `boolean-naming`             |    16 |                     12 |
| `param-naming`               |    36 |                     15 |
| `store-naming`               |    20 |                     20 |

All seven are within the task's "not 0, not hundreds" sanity bound. `param-naming` and
`prev-naming` are the two furthest from the rough estimate; both were individually spot-checked
against the matched `src/` lines (see each rule's section above) and every match inspected was a
genuine, correctly-scoped hit, so the estimates were simply off rather than the patterns being
wrong. `TreeView.svelte`'s unscanned second script block alone has real instances of at least
five of these seven patterns (checked directly), so every count above is a floor, not an exact
total; `Theme.svelte` and `TreeViewNode.svelte`'s second script blocks were also checked and, as
of this baseline, don't happen to trip any of the seven rules.
