export interface KanbanColumnLike {
  id: string;
  limit?: number;
  collapsible?: boolean;
}

export interface KanbanItemLike {
  id: string;
  column: string;
}

/** A drop position: a column and an index among its other cards. */
export interface KanbanTarget {
  /** Id of the column the card would land in. */
  column: string;
  /**
   * Position once the card is out of where it was: `0` is the top and the
   * column's size without the card is the bottom.
   */
  index: number;
}

export type StepKey = "up" | "down" | "start" | "end" | "previous" | "next";

/** Group card ids by column in the order of `items`. */
export function groupByColumn<Item extends KanbanItemLike>(
  columns: ReadonlyArray<{ id: string }>,
  items: ReadonlyArray<Item>,
): { ids: Map<string, string[]>; byId: Map<string, Item> };

/** The index a card lands at, given the slot it is inserted before. */
export function finalIndex(p: number, dragged: number): number;

/** The slot among a column's children that a final index inserts before. */
export function slotFor(index: number, dragged: number): number;

/** First slot whose midpoint lies past `point`, in `O(log n)` reads. */
export function slotAt(
  count: number,
  midpoint: (slot: number) => number,
  point: number,
): number;

/**
 * Apply a Kanban `move` event's detail to `items`, as the board does.
 * Returns a new array and leaves `items` and its cards unchanged; returns
 * `items` itself when the card lands where it was or is not found. Pure,
 * so it runs on the server.
 * @example
 * items = applyKanbanMove(items, event.detail);
 */
export function applyKanbanMove<Item extends KanbanItemLike>(
  items: ReadonlyArray<Item>,
  move: { id: string; to: string; index: number },
): ReadonlyArray<Item>;

/** Whether a card may enter a column under a hard limit. */
export function hasRoom(
  column: { limit?: number } | undefined,
  count: number,
  sameColumn: boolean,
): boolean;

/** Step a keyboard drag, or `null` when there is nowhere to go. */
export function stepTarget(options: {
  order: ReadonlyArray<string>;
  size: (column: string) => number;
  from: KanbanTarget;
  key: StepKey;
  skip?: (column: string) => boolean;
  full?: (column: string) => boolean;
}): { target: KanbanTarget | null; blocked?: string };

/** Edge-scroll speed in px/s; negative scrolls toward the start. */
export function edgeSpeed(options: {
  point: number;
  start: number;
  end: number;
  zone: number;
  max: number;
}): number;
