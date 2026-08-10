# Prompt: cross-file type inference for prop defaults in sveld

Use this as an implementation brief for [carbon-design-system/sveld](https://github.com/carbon-design-system/sveld).

## Problem

sveld is AST-local. When a prop default is a **call to an imported function**, it does not follow the import to read the callee's return type (JSDoc `@returns`, `.d.ts`, or TS signature). The emitted prop type collapses incorrectly.

In carbon-components-svelte we extracted a shared helper:

```js
// src/utils/uniqueId.js
/**
 * @param {string} [prefix]
 * @returns {string}
 */
export function uniqueId(prefix = "ccs") {
  return `${prefix}-${Math.random().toString(36).slice(2)}`;
}
```

```ts
// src/utils/uniqueId.d.ts
export function uniqueId(prefix?: string): string;
```

Then replaced ~55 in-component defaults:

```js
// before (inferred as string)
export let id = `ccs-${Math.random().toString(36)}`;

// after (emitted as undefined)
export let id = uniqueId();
```

Generated output (sveld 0.36.2):

```ts
/**
 * Set an id for the list box component
 * @default uniqueId()
 */
id?: undefined;
```

That is worse than falling back to `any`. Consumers and `svelte-check` then reject every `id="..."` pass:

`Type 'string' is not assignable to type 'undefined'.`

Workaround we had to ship: add explicit `@type {string}` on every such prop and regenerate. That works, but it duplicates information the helper already declares.

## Why this matters

JS-first Svelte libraries (carbon-components-svelte's model) push shared runtime helpers into modules. Prop defaults like `uniqueId()`, `createId()`, `getDefaultItems()` are normal. Today each call site needs a redundant `@type`, or types silently go wrong.

Related work already in sveld (build on this, don't reinvent):

- inherit JSDoc from **same-file** identifier / function-declaration defaults
- infer return type for **same-file** un-annotated function defaults
- opt-in `resolveTypes` for expanding imported **type** aliases on `$props()` (different problem: docs expansion, not value-call return types)

Gap: **CallExpression** whose callee is an **imported value**.

## Desired behavior

Given:

```svelte
<script>
  import { uniqueId } from "../utils/uniqueId.js";

  /** Set an id for the input element */
  export let id = uniqueId();
</script>
```

Emit:

```ts
/**
 * Set an id for the input element
 * @default uniqueId()
 */
id?: string;
```

Resolution order for the prop type should stay:

1. explicit TypeScript annotation
2. explicit JSDoc `@type` on the prop
3. **initializer inference, including cross-file call returns** (new)
4. `any` (never invent `undefined` for a failed call inference)

`@default` can keep printing `uniqueId()` (or the source text). Do not require inlining the helper body into `@default`.

## Proposed approach

Keep the default path AST-only and cheap. Add a narrow resolver for call defaults:

1. Prop initializer is `CallExpression`.
2. Callee is an `Identifier` (start with named imports; default import / member calls can be follow-ups).
3. Find the matching `ImportDeclaration` in the component.
4. Resolve the module relative to the `.svelte` file (`./x.js`, `../utils/x.js`).
5. Read return type from, in order:
   - sibling `x.d.ts` / package types for that specifier
   - `x.js` / `x.ts` with `@returns` / `@return` on the exported function
   - TS `export function …: T` / `export const … = (): T => …`
6. Cache by resolved file + export name for the run.
7. If unresolved, fall back to `any` (or leave unset so the existing `any` path runs). **Do not emit `undefined`.**

Optional later:

- `Foo.bar()` member calls when `Foo` is a namespace import
- re-exports (`export { uniqueId } from "./id.js"`)
- `resolveTypes`-style TypeScript program reuse if you already spin up a `TypeResolver` for other features

Non-goals for the first cut:

- full project-wide semantic checking of every expression
- evaluating the function
- replacing explicit `@type` when authors want a narrower override

## Acceptance tests

Add fixtures roughly like:

**A. Local `.js` + `@returns`**

```
utils/uniqueId.js   // @returns {string}
Button.svelte       // export let id = uniqueId()
```

Expect `id?: string`.

**B. Local `.d.ts` beside `.js`**

Same as A, types only in `uniqueId.d.ts`. Expect `id?: string`.

**C. Explicit `@type` wins**

```js
/** @type {"a" | "b"} */
export let id = uniqueId();
```

Expect `id?: "a" | "b"`.

**D. Unresolvable import**

Unknown specifier or missing export. Expect `any` (or today's non-`undefined` fallback), never `id?: undefined`.

**E. Same-file function still works**

```js
function uniqueId() { return "x"; }
export let id = uniqueId();
```

Keep existing same-file inference behavior.

**F. Regression: template literal defaults**

```js
export let id = `ccs-${Math.random().toString(36)}`;
```

Still `id?: string`.

## Concrete failure to fix (carbon-components-svelte)

Repo: https://github.com/carbon-design-system/carbon-components-svelte  
Branch context: extracting `src/utils/uniqueId.js` and replacing `` `ccs-${Math.random().toString(36)}` `` defaults.

Without `@type {string}` on each prop, `bun build:docs` (sveld) wrote `id?: undefined` / `inputName?: undefined` / etc., and `bun test:types` (`svelte-check --tsgo`) reported ~120 errors of the form `Type 'string' is not assignable to type 'undefined'`.

Success criterion: remove those redundant `@type {string}` annotations on `uniqueId()` defaults, regenerate, and `test:types` stays green with `id?: string`.

## Implementation notes for the agent

- Start from how same-file "inherit JSDoc from identifier / function defaults" works; extend that path across import boundaries instead of adding a parallel system.
- Prefer reading `.d.ts` / `@returns` text over running `tsc`, unless `resolveTypes` already gives you a cheap program you can query.
- Emit diagnostics under the existing type-inference / `--strict` machinery when a call default could not be resolved (optional but useful).
- Document the new capability next to initializer inference and `resolveTypes`, and stress that failed cross-file inference must not emit `undefined`.
