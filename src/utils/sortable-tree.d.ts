import type { DndTextValues } from "./dnd-text.js";

/** The `detail` of the `move` event that `sortableTree` dispatches. */
export interface TreeMoveDetail {
  /** The id of the row that moved. */
  id: string;
  /** The id of the row it lands on. */
  targetId: string;
  /**
   * Where it lands: `"before"` and `"after"` make it a sibling of the target,
   * `"inside"` makes it the target's last child.
   */
  position: "before" | "inside" | "after";
  /** What drove the move. */
  source: "pointer" | "keyboard";
}

/** Params for `sortableTree`. */
export interface SortableTreeOptions {
  /** Names the tree in announcements and events. @default "" */
  name?: string;
  /** What announcements call the tree. Defaults to `name`. */
  label?: string;
  /** Selects the rows. @default "[role='treeitem']" */
  rowSelector?: string;
  /** The attribute that holds a row's id. @default "data-tree-row-id" */
  idAttribute?: string;
  /**
   * Selects the element inside each row that starts a drag and takes the
   * keyboard, such as a grip button. By default the whole row drags by
   * pointer, and Alt+M on a focused row lifts it. A handle is the better
   * choice on touch: a finger on a row without one scrolls.
   */
  handleSelector?: string;
  /** Set to `true` to turn dragging and the keyboard off. */
  disabled?: boolean;
  /** Pixels the pointer moves before a drag starts. @default 4 */
  threshold?: number;
  /**
   * Veto a place before it is offered. A row can never be dropped on itself
   * or inside its own descendants, whatever this says. The place is not drawn
   * and the keyboard skips it.
   */
  canDrop?: (detail: TreeMoveDetail) => boolean;
  /** The text announced and shown on the drag preview. @default the row's text */
  getLabel?: (row: HTMLElement) => string;
  /**
   * Translate or reword a string. Return `undefined` to keep the English
   * default. The ids are `roleDescription`, `instructions`, `handleLabel`,
   * `pickedUp`, `moved`, `movedBefore`, `movedInside`, `movedAfter`,
   * `dropped`, `droppedBefore`, `droppedInside`, `droppedAfter` and
   * `cancelled`; the values are `label`, `target`, `position` and `count`.
   */
  translateWithId?: (id: string, values: DndTextValues) => string | undefined;
}

/**
 * Move the rows of a tree by pointer or keyboard. Dispatches a cancelable,
 * bubbling `move` event with a `TreeMoveDetail`, and never moves an element
 * or changes your data.
 */
export function sortableTree(
  node: HTMLElement,
  options?: SortableTreeOptions,
): {
  update: (options?: SortableTreeOptions) => void;
  destroy: () => void;
};

/**
 * Apply a `move` event to nodes shaped like `TreeView`'s (`id`, `nodes`)
 * without mutating them. Set `childrenKey` when the children live under
 * another property.
 */
export function applyTreeMove<T extends { id: string | number }>(
  nodes: ReadonlyArray<T>,
  detail: TreeMoveDetail,
  childrenKey?: string,
): T[];

declare module "svelte/elements" {
  // Types `on:move` on any element, so a TypeScript consumer of the action
  // does not need its own declaration. Importing `sortableTree` loads this.
  interface HTMLAttributes<T> {
    "on:move"?: (
      event: CustomEvent<TreeMoveDetail> & {
        currentTarget: EventTarget & T;
      },
    ) => void;
  }
}
