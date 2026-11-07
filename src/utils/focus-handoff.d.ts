/** Keep keyboard focus when the focused element is removed or moved. */

/** What `announce` receives after focus moves. */
export interface HandoffInfo {
  /**
   * Where focus went: the `next` or `previous` item, the `fallback`, or the
   * `same` control again after a keyed move or a re-render.
   */
  reason: "next" | "previous" | "fallback" | "same";
  /** The element that now has focus. */
  target: HTMLElement;
  /** The item that held focus. It may no longer be in the page. */
  removed: HTMLElement;
}

export interface HandoffOptions {
  /**
   * Which elements are the siblings of the item that holds focus, with the
   * item among them, in order. A selector is matched against the item's
   * parent's children. A function returns the list. Default: all the
   * parent's element children.
   */
  siblings?: string | (() => Iterable<Element>);
  /**
   * Which control to focus inside a neighbouring item. A selector or a
   * function of the neighbour. Default: the control in the same position as
   * the one that had focus, for example the Delete button of the next row.
   */
  target?: string | ((item: Element) => HTMLElement | null | undefined);
  /**
   * Where focus goes when no neighbour can take it: the last item is gone,
   * or the list is empty. A function is read when it is needed. A
   * non-interactive element gets `tabindex="-1"`.
   * Default: the container (`focusHandoff`) or the parent of the element
   * (`captureFocusTarget`).
   */
  fallback?: HTMLElement | null | (() => HTMLElement | null | undefined);
  /**
   * Find the same control again after an update, for a node the framework
   * re-created. Tried before any neighbour.
   */
  find?: () => HTMLElement | null | undefined;
  /**
   * Called after focus moves. Send a message to a live region here, such as
   * "Row deleted, focus on next row".
   */
  announce?: (info: HandoffInfo) => void;
}

export interface FocusHandoffOptions extends HandoffOptions {
  /**
   * Selector for the items inside the container. Default: the container's
   * direct children.
   */
  items?: string;
  /**
   * Set to `false` to switch the hand-off off, for a list that unmounts
   * items on its own, such as a virtual list scrolling a focused row away.
   * @default true
   */
  enabled?: boolean;
  /**
   * Watch the whole subtree for removals. Set to `false` to watch the
   * container's direct children only, which costs less on a long list.
   * @default true
   */
  subtree?: boolean;
}

/**
 * Call right before removing the element that holds focus. Call the
 * returned function right after. Resolves to whether focus moved. Does
 * nothing when focus was not inside `element`, or when something else has
 * claimed focus by the time the update lands. SSR-safe.
 */
export function captureFocusTarget(
  element: HTMLElement | null | undefined,
  options?: HandoffOptions,
): () => Promise<boolean>;

/**
 * Svelte action: when the app removes or moves the item inside `container`
 * that holds focus, move focus to the next item, else the previous one, else
 * `fallback`, else the container. Never acts when focus was elsewhere.
 */
export function focusHandoff(
  container: HTMLElement,
  options?: FocusHandoffOptions,
): { update: (options?: FocusHandoffOptions) => void; destroy: () => void };
