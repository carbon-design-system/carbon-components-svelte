import type { ShortcutSpec } from "./shortcut-registry.js";

/**
 * Registers a keyboard shortcut with the nearest `ShortcutProvider`, so the
 * help sheet lists it. Put it on an element that holds the control.
 */
export function shortcut(
  node: HTMLElement,
  params: ShortcutSpec,
): {
  update: (params: ShortcutSpec) => void;
  destroy: () => void;
};
