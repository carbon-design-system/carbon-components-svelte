// @ts-check
import { noop } from "../utils/noop.js";
import { findShortcutScope } from "./shortcut-registry.js";

/**
 * Svelte action: register a keyboard shortcut with the nearest
 * `ShortcutProvider`, so the help sheet lists it. `onTrigger` runs when the
 * keys are pressed while the element is connected, enabled, shown and not
 * inert, and, while a modal dialog is open, inside it. A shortcut without
 * `mod` or `ctrl` is ignored while the user types in a field. Inside a
 * nested provider, the shortcut belongs to that scope.
 *
 * Put it on an element that holds the control, not on a component, since
 * components cannot take actions.
 *
 * @param {HTMLElement} node
 * @param {import("./shortcut-registry.js").ShortcutSpec} params
 * @returns {{ update: (params: import("./shortcut-registry.js").ShortcutSpec) => void, destroy: () => void }}
 * @example
 * ```svelte
 * <div use:shortcut={{ keys: "mod+k", label: "Open command palette", onTrigger: open }}>
 *   <Button on:click={open}>Search</Button>
 * </div>
 * ```
 */
export function shortcut(node, params) {
  const scope = findShortcutScope(node);
  if (!scope) {
    console.warn(
      "[shortcut] no ShortcutProvider around this element. Wrap the app in one.",
    );
    return { update: noop, destroy: noop };
  }
  return scope.register(params, node);
}
