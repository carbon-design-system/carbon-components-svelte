import type { Writable } from "svelte/store";

/**
 * Build ArrowUp/ArrowDown/Home/End navigation over the enabled
 * `[role="option"]` descendants of a menu element, tracking the active
 * option by id in `highlightedId`. Options marked `aria-disabled="true"`
 * are skipped.
 */
export function createOptionListNavigator(options: {
  getMenuRef: () => HTMLElement | null;
  highlightedId: Writable<string | null>;
  includeHidden?: boolean;
}): {
  getOptionElements: () => HTMLElement[];
  moveActive: (step: 1 | -1) => void;
  setActiveEdge: (edge: "first" | "last") => void;
};
