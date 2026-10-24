/** Svelte action for arrow-key roving focus. */

export type RovingFocusOrientation = "horizontal" | "vertical" | "both";

export type RovingFocusOptions = {
  /** Items inside `node`. Also filters which keydown events count. */
  selector: string;
  /** Item list in tab order. Default: `node.querySelectorAll(selector)`. */
  getItems?: () => HTMLElement[];
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
  isDisabled?: (item: HTMLElement) => boolean;
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
export function rovingFocus(
  node: HTMLElement,
  options: RovingFocusOptions,
): {
  update: (options: RovingFocusOptions) => void;
  destroy: () => void;
};
