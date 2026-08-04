# Make Dropdown's and MultiSelect's `name` prop actually participate in form submission

## Context

This is `carbon-components-svelte`, a Svelte port of IBM's Carbon Design
System. Read `CONTRIBUTING.md` at the repo root before starting — it defines
the code style, JSDoc/typing, docs, and commit conventions this task must
follow. This repo uses Bun (`bun <script>`, `bunx <bin>`), not npm/pnpm.

Commit `9796644f8` (`feat(pin-code-input): add name with hidden form input`)
gave `PinCodeInput` a pattern for custom (non-native-input) controls to
participate in native HTML forms: when `name` is set, a real
`<input type="hidden">` mirrors the component's assembled value, so the value
shows up in `FormData`, plain `<form>` submission, and SvelteKit's
`use:enhance`. From `src/PinCodeInput/PinCodeInput.svelte`:

```svelte
{#if name}
  <input type="hidden" {name} {value} {required}>
{/if}
```

(placed near the end of the template, after the visible segment inputs, and
paired with `required={name ? undefined : required}` on the visible inputs so
the browser doesn't validate individually-empty segments when a single hidden
input already carries the real value).

Two components already expose a `name` prop that looks like it should do the
same thing, but currently doesn't work for form submission:

### Dropdown (single selection)

`src/Dropdown/Dropdown.svelte`: `export let name = undefined;` (~line 182,
documented as "Specify a name attribute for the list box"). It's passed as
`{name}` into `<ListBox ...>` (~line 551), but `ListBox` renders a plain
`<div>` (`src/ListBox/ListBox.svelte`, `$$restProps` spread onto a `<div>`) —
a `name` attribute on a `<div>` is inert; nothing is ever submitted.

Dropdown's actual selection state is `selectedId` (`export let selectedId`,
~line 51 — the id of the single selected item, resolved via
`$: selectedItem = itemsById.get(selectedId);`).

### MultiSelect (multi selection)

`src/MultiSelect/MultiSelect.svelte`: `export let name = undefined;`
(~line 197, "Specify a name attribute for the select"). It's only wired to a
real `<input>` in the `filterable` branch of the template (~line 913, `{name}`
on the filterable search `<input>`), and only when `filterable` is `true` —
the library's default (`export let filterable = false;`, ~line 92). In the
non-filterable default case, nothing carries `name` to any real form control
at all. Even in the filterable case, the input's `value` binding holds the
*filter text* the user typed, not the selected item IDs — so wiring `name`
there was never form-submission-correct to begin with.

MultiSelect's actual selection state is `selectedIds` (`export let
selectedIds = [];`, ~line 48 — an array of selected item ids).

## What to implement

### Dropdown

- Stop passing `{name}` to `<ListBox>` (it does nothing there today; leaving
  it is misleading). Confirm nothing in `tests/Dropdown/` asserts a `name`
  attribute on the ListBox wrapper element before removing it — if something
  does, that test is asserting the current broken behavior and should be
  updated as part of this change, not left in place.
- Add a hidden input mirroring `selectedId`, gated the same way PinCodeInput
  does it, placed after the closing `</ListBox>` tag (same section as the
  fluid divider / validation / helper text blocks that already follow
  `</ListBox>` around line 846):

  ```svelte
  {#if name}
    <input type="hidden" {name} value={selectedId ?? ""}>
  {/if}
  ```

  Match existing conventions: keep the `{#if name}` guard exactly like
  PinCodeInput's, so the hidden input is absent entirely when no `name` is
  set (a Dropdown used purely as a UI control, with no form, shouldn't grow a
  stray `<input>`).

### MultiSelect

- The visible filterable `<input>`'s `{name}` binding (~line 913) is
  semantically wrong (it would submit filter text, not selection) — remove it
  from that input.
- Add one hidden input per selected id, all sharing `name`, so the browser's
  native multi-value submission semantics apply (this mirrors how a native
  `<select multiple>` or a group of same-named checkboxes submits multiple
  values under one key). Place it after the closing `</ListBox>` tag (same
  section as the `{#if isFluid}` divider that already follows, around
  line 1205):

  ```svelte
  {#if name}
    {#each selectedIds as id (id)}
      <input type="hidden" {name} value={id}>
    {/each}
  {/if}
  ```

  Follow CONTRIBUTING's keyed-`{#each}` rule (`(id)` as the key, since
  `selectedIds` is already an array of unique ids).

### Both

- Update the `name` prop's JSDoc on both components to describe the actual
  new behavior, modeled on PinCodeInput's wording: "Specify a name attribute
  for native form participation. When set, a hidden input mirrors the
  selected value(s)." Adjust singular/plural for Dropdown vs. MultiSelect.
- Follow CONTRIBUTING's prop-ordering and JSDoc-first conventions; this is a
  JSDoc *content* change on an existing prop (not adding a new prop), so it
  still requires an API regeneration — see Validation below.

## Docs

Add a `## Form name` section to `Dropdown.svx` and `MultiSelect.svx` (in
`docs/src/pages/components/`), modeled directly on `PinCodeInput.svx`'s
existing section of the same name:

> Set `name` so the assembled code participates in native form submission
> (for example SvelteKit form actions and `FormData`). A hidden input mirrors
> `value`.

Adapt the wording to "the selected item" (Dropdown) / "the selected items"
(MultiSelect) instead of "the assembled code," and show a short example using
`<Form method="POST" action="?/submit">` + the component + a submit
`<Button>`, matching PinCodeInput's example structure (inline is fine; use a
framed example only if you need to demonstrate reading the submitted
`FormData`). Place the new section near the other "Content"/"Selection"
sections on each page — check each `.svx`'s existing heading list
(`grep -n "^#" docs/src/pages/components/Dropdown.svx`) and slot it in
logically rather than appending at the end, per CONTRIBUTING's section-order
guidance.

## Commits

Split feature and docs, per CONTRIBUTING's Conventional Commits rules. Keep
Dropdown and MultiSelect as separate commits since they're independent
components with independent fixes:

1. `feat(dropdown): make name participate in form submission`
2. `feat(multi-select): make name participate in form submission`
3. `docs(dropdown): document form name`
4. `docs(multi-select): document form name`

## Validation (keep it minimal and scoped — do not run the full suite)

```sh
bunx biome check --write src/Dropdown src/MultiSelect docs/src/pages/components/Dropdown.svx docs/src/pages/components/MultiSelect.svx
bun build:docs   # required after retyping the `name` prop's JSDoc; output is gitignored, don't commit it
bun run test Dropdown
bun run test MultiSelect
```

Add a focused unit test per component asserting the hidden input's presence
and `value` when `name` is set (and its absence when `name` is unset) — this
is a real behavior fix, and CONTRIBUTING calls out "regressions for bugs you
fix" as high-value coverage. Keep it to one or two cases per component, not
an exhaustive matrix.

Do not run `bun run lint`, `bun run test` (full suite), `bun test:e2e`, or the
Svelte 3/4 compatibility workspaces. Do not hand-edit
`src/**/*.svelte.d.ts` or `docs/src/COMPONENT_API.json` (generated, gitignored).
