/**
 * An anchor that is not an element: a caret, a pointer, a range. Give it a
 * `contextElement` when it lives inside a scrolling box.
 */
export interface VirtualAnchor {
  getBoundingClientRect: () => {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  };
  contextElement?: Element | null;
}

export interface AutoUpdateOptions {
  /** Update when a box around the anchor scrolls, and when the window does. @default true */
  ancestorScroll?: boolean;
  /** Update when the window resizes. @default true */
  ancestorResize?: boolean;
  /** Update when the anchor or the floating box changes size. @default true */
  elementResize?: boolean;
  /** Update while an ancestor runs a transition or animation, and when it ends. @default true */
  motion?: boolean;
  /** Update when the anchor's `style` or `class` changes. @default true */
  attributes?: boolean;
  /** Run `update` before returning. @default true */
  immediate?: boolean;
}

/** The element a virtual anchor stands in. */
export function anchorElement(anchor: Element | VirtualAnchor): Element | null;

/**
 * Run `update` now and whenever the anchor, the floating box, or what is
 * around them moves, until the returned function is called. `update` reads
 * layout and may return a function: those run after every overlay's `update`
 * of the frame has read.
 */
export function autoUpdate(
  anchor: Element | VirtualAnchor,
  floating: Element | null,
  update: () => void | (() => void),
  options?: AutoUpdateOptions,
): (() => void) & { update: () => void };
