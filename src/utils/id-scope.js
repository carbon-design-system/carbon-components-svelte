// @ts-check
import { getContext, setContext } from "svelte";
import { uniqueId } from "./unique-id.js";

/**
 * @typedef {object} IdScope
 * @property {string} prefix
 * @property {Map<string, number>} counts Next index per name.
 */

const ID_SCOPE = Symbol.for("carbon-components-svelte/id-scope");

/** @returns {IdScope | undefined} */
function nearestScope() {
  try {
    return getContext(ID_SCOPE);
  } catch {
    // Called after init (an event handler, a timer): there is no scope to read.
    return undefined;
  }
}

/**
 * Start an id scope for this component and everything it renders, slotted
 * children included, and return its prefix. A `useId()` call below the scope
 * returns `${prefix}-${n}`, with `n` counting calls in render order, so the
 * server and the browser agree and no id is random. Call it during component
 * init.
 *
 * A component with an `id` prop starts a scope from it (`createIdScope(id)`).
 * One with no such prop passes `$$restProps.id` and a `name`, and the prefix
 * is generated with `useId(name)` when the consumer gave no id. An app root
 * starts one with a fixed prefix (`createIdScope("app")`) so components with
 * no `id` get stable ids too. Two root scopes on one page need different
 * prefixes.
 * @param {string} [id] The prefix, such as a component's `id`.
 * @param {string} [name] Names the prefix `useId(name)` generates when `id` is empty.
 * @returns {string}
 */
export function createIdScope(id, name) {
  const prefix = id || useId(name);
  setContext(ID_SCOPE, { prefix, counts: new Map() });
  return prefix;
}

/**
 * Generate an id for this component. Call it during component init, and
 * eagerly: the server and the browser must make the same calls in the same
 * order.
 *
 * Inside an id scope (see `createIdScope`) the id is deterministic:
 * `${prefix}-${n}`, or `${prefix}-${name}-${n}` when `name` is given (the
 * count is per name). Without a scope it falls back to the random
 * `uniqueId(fallbackPrefix)`.
 * @param {string} [name] Optional kind of element, for a readable id.
 * @param {string} [fallbackPrefix] Prefix of the random id used without a scope.
 * @returns {string}
 */
export function useId(name, fallbackPrefix) {
  const scope = nearestScope();
  if (!scope) return uniqueId(fallbackPrefix);

  const key = name ?? "";
  const n = scope.counts.get(key) ?? 0;
  scope.counts.set(key, n + 1);
  return name ? `${scope.prefix}-${name}-${n}` : `${scope.prefix}-${n}`;
}
