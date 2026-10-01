import { JSDOM } from "jsdom";
import type { ComponentType, SvelteComponent } from "svelte";
import { render } from "svelte/server";

/**
 * Svelte's hydration markers: every comment (components author none, so these
 * are all `<!--[-->`, `<!--[-1-->`, `<!--]-->`, `<!---->`) plus the `<!>` it
 * puts before `</select>` and `</option>`.
 */
const HYDRATION_MARKER = /<!--[\s\S]*?-->|<!>/g;

const WHITESPACE_BETWEEN_TAGS = />\s+</g;

/**
 * The random part of `uniqueId()` ids, one alternative per prefix `src/`
 * passes it. Matches inside derived ids too (`helper-ccs-…`, `ccs-…-label`).
 * The lookbehind skips custom properties (`--ccs-separator`) and classes
 * (`bx--tree-node`, `__label-wrapper`).
 */
const RANDOM_ID =
  /(?<!\w|--)(?:ccs|cua|ctag|label|tree|structured-list)-[a-z0-9]{8,}/g;

/**
 * Makes server output stable for assertions: strips hydration comments,
 * replaces random ids with `id-1`, `id-2`, … in first-seen order (so an
 * `id`/`aria-controls` pair keeps matching), and drops whitespace between tags.
 */
export function normalizeSSR(html: string) {
  const ids = new Map<string, string>();

  return html
    .replace(HYDRATION_MARKER, "")
    .replace(RANDOM_ID, (id) => {
      let stable = ids.get(id);
      if (stable === undefined) {
        stable = `id-${ids.size + 1}`;
        ids.set(id, stable);
      }
      return stable;
    })
    .replace(WHITESPACE_BETWEEN_TAGS, "><")
    .trim();
}

/**
 * Server-renders a component and returns its normalized HTML plus a parsed
 * `document` for attribute and role queries. Only works in a file that starts
 * with `// @vitest-environment node`, where `.svelte` files compile for the
 * server. Pass `context` for a child that reads a parent's `getContext`, or
 * render a fixture that composes the parent instead.
 */
export function renderSSR<Props extends Record<string, unknown>>(
  component: ComponentType<SvelteComponent<Props>>,
  props?: Partial<Props>,
  options?: { context?: Map<unknown, unknown> },
): { html: string; document: Document };
// The overload checks props per component. `render` cannot forward a generic
// `Props`, because its options tuple is a conditional type on `Props`.
export function renderSSR(
  component: ComponentType<SvelteComponent>,
  props?: Record<string, unknown>,
  options: { context?: Map<unknown, unknown> } = {},
) {
  const html = normalizeSSR(render(component, { ...options, props }).body);
  const { document } = new JSDOM(html).window;

  return { html, document };
}
