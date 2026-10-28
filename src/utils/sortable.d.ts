export type { SortDetail } from "./sortable-model.js";

/** What the announcement functions of `sortable` receive. */
export interface SortableAnnouncement {
  /** The item's label, from `getLabel`. */
  label: string;
  /** The item's place, counting from 1. */
  position: number;
  /** The number of items in the list it is in or over. */
  count: number;
  /** The `label` of the list the item is in or over. */
  name: string;
  /** Whether the item is over a different list than the one it came from. */
  listChanged: boolean;
}

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
   * The axis the items run along. Wrapping grids are not supported.
   * @default "vertical"
   */
  orientation?: "vertical" | "horizontal";
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
  /** The `aria-roledescription` of each target. @default "sortable item" */
  roleDescriptionText?: string;
  /**
   * Read when a target takes focus, through `aria-describedby`.
   * @default "Press Space to pick up. Use the arrow keys to move, Space to drop, and Escape to cancel."
   */
  instructionsText?: string;
  /**
   * The accessible name given to a handle that has none.
   * @default ({ label }) => `Reorder ${label}`
   */
  handleLabelText?: (args: { label: string }) => string;
  /** @default ({ label, position, count }) => `Picked up ${label}, position ${position} of ${count}.` */
  pickedUpText?: (args: SortableAnnouncement) => string;
  /** @default ({ label, position, count }) => `${label} moved to position ${position} of ${count}.` */
  movedText?: (args: SortableAnnouncement) => string;
  /** @default ({ label, position, count }) => `Dropped ${label} at position ${position} of ${count}.` */
  droppedText?: (args: SortableAnnouncement) => string;
  /** @default ({ label, position, count }) => `Cancelled. ${label} is back at position ${position} of ${count}.` */
  cancelledText?: (args: SortableAnnouncement) => string;
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
