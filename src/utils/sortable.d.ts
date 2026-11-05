import type { DndTextValues } from "./dnd-text.js";

export type { SortDetail } from "./sortable-model.js";

/** Params for `sortable`. */
export interface SortableOptions {
  /** Identifies the list in `sort` events and announcements. @default "" */
  name?: string;
  /**
   * What announcements call the list, such as "Backlog". Defaults to `name`,
   * which is a key for your data and not always fit to be read aloud.
   */
  label?: string;
  /**
   * Lists with the same `group` are connected: an item can move between them.
   * The `sort` event then has a different `from` and `to`.
   */
  group?: string;
  /**
   * Selects the items inside `node`. By default, the children of `node`.
   * Set it when the items are not direct children, such as `"li"` when `node`
   * wraps a component that renders the list.
   */
  itemSelector?: string;
  /**
   * Selects the element inside each item that starts a drag and takes the
   * keyboard, such as a grip button. By default the whole item does both.
   * A handle is the better choice on touch and when an item holds links or
   * buttons: a finger on an item without one scrolls the page.
   */
  handleSelector?: string;
  /**
   * The way the items run: down a column, along a row, or across a grid that
   * wraps. A grid moves with the arrow keys along both axes.
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal" | "grid";
  /**
   * How a move is shown. `"line"` draws an insertion line at the drop place.
   * `"gap"` moves the neighbors aside by the size of the item, so the gap
   * shows where it lands; it suits a few hundred items, and a list with
   * `aria-posinset` (a windowed list) or a grid uses `"line"` instead.
   * @default "line"
   */
  feedback?: "line" | "gap";
  /** Set to `true` to turn dragging and the keyboard off. */
  disabled?: boolean;
  /**
   * Make the list one tab stop: the arrow keys, Home and End move focus
   * between the items' keyboard targets. Set to `false` to manage `tabindex`
   * yourself.
   * @default true
   */
  roving?: boolean;
  /** Pixels the pointer moves before a drag starts. @default 4 */
  threshold?: number;
  /**
   * The item's id, passed back in `sort` events. By default the
   * `data-sortable-id` of the item or of a descendant, else its `id`.
   */
  getId?: (item: HTMLElement) => string | undefined;
  /**
   * The text announced and shown on the drag preview. By default the
   * `data-sortable-label` of the item or of a descendant, else its text.
   */
  getLabel?: (item: HTMLElement) => string;
  /**
   * Translate or reword a string. Return `undefined` to keep the English
   * default. The ids are `roleDescription`, `instructions`, `handleLabel`,
   * `pickedUp`, `moved`, `movedList`, `dropped`, `droppedList` and
   * `cancelled`; the values are `label`, `position`, `count` and `name`.
   */
  translateWithId?: (id: string, values: DndTextValues) => string | undefined;
}

/**
 * Reorder the items of a list by pointer or keyboard. Dispatches a
 * cancelable, bubbling `sort` event with a `SortDetail` on the list the item
 * lands in, and never moves an element or changes your data.
 */
export function sortable(
  node: HTMLElement,
  options?: SortableOptions,
): {
  update: (options?: SortableOptions) => void;
  destroy: () => void;
};

declare module "svelte/elements" {
  // Types `on:sort` on any element, so a TypeScript consumer of the action
  // does not need its own declaration. Importing `sortable` loads this.
  interface HTMLAttributes<T> {
    "on:sort"?: (
      event: CustomEvent<import("./sortable-model.js").SortDetail> & {
        currentTarget: EventTarget & T;
      },
    ) => void;
  }
}
