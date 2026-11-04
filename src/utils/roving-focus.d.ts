/** Svelte action for arrow-key roving focus. */

export type RovingFocusOrientation = "horizontal" | "vertical" | "both";

/**
 * `T` is what `getItems` returns: elements by default, or a component's
 * own registry entries, read only through `isDisabled` and the index.
 * `focusOnMove` and `itemsOnly` call `focus` and `contains` on the items,
 * so they need elements.
 */
export type RovingFocusOptions<T = HTMLElement> = {
  /** Items inside `node`. Also filters which keydown events count. */
  selector: string;
  /** Item list in tab order. Default: `node.querySelectorAll(selector)`. */
  getItems?: () => readonly T[];
  /** @default "horizontal" */
  orientation?: RovingFocusOrientation;
  /** Wrap at the ends. @default true */
  wrap?: boolean;
  /** @default false */
  skipDisabled?: boolean;
  /** @default true */
  home?: boolean;
  /** @default true */
  end?: boolean;
  /** @default el => el.disabled || aria-disabled */
  isDisabled?: (item: T) => boolean;
  getActiveIndex: () => number;
  onMove?: (index: number, event: KeyboardEvent) => void;
  /** Call `.focus()` on the new item. @default false */
  focusOnMove?: boolean;
  /** Ignore keydown from elements outside `getItems()`, such as matching controls in a nested popover. @default false */
  itemsOnly?: boolean;
  /** Read on each horizontal arrow key. When it returns `true`, ArrowLeft moves to the next item and ArrowRight to the previous one. @default () => false */
  rtl?: () => boolean;
};

/** Arrow/Home/End keydown on `node` calls `onMove` with the next index. */
export function rovingFocus<T = HTMLElement>(
  node: HTMLElement,
  options: RovingFocusOptions<T>,
): {
  update: (options: RovingFocusOptions<T>) => void;
  destroy: () => void;
};
