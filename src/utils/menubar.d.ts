import type { Readable } from "svelte/store";

export type MenubarSubmenu = {
  isOpen: () => boolean;
  /** Open the submenu and focus its first item. */
  open: () => void;
  close: () => void;
};

/**
 * Roving-tabindex bookkeeping and keyboard navigation for a WAI-ARIA menubar.
 * One registered item is the bar's single Tab stop; arrows, Home, End and
 * type-ahead move focus between items.
 */
export function createMenubar(options?: {
  orientation?: "horizontal" | "vertical";
  /** Read on each ArrowLeft and ArrowRight in a horizontal bar. When it returns `true`, ArrowLeft moves to the next item. */
  rtl?: () => boolean;
}): {
  orientation: "horizontal" | "vertical";
  register: (node: HTMLElement, submenu?: MenubarSubmenu) => void;
  unregister: (node: HTMLElement) => void;
  setCurrent: (node: HTMLElement, isCurrent: boolean) => void;
  tabStop: Readable<HTMLElement | undefined>;
  handleKeydown: (event: KeyboardEvent) => void;
  handleFocusin: (event: FocusEvent) => void;
  destroy: () => void;
};
