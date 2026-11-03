/** What a reorder moved, from the tab list. */
export interface TabReorderDetail {
  /** The id of the tab that moved. */
  id: string;
  /** Where it was in the list. */
  oldIndex: number;
  /** Where it lands, counted with the tab already out of its old place. */
  newIndex: number;
  /** What moved it. */
  source: "pointer" | "keyboard";
}

/** Params for `tabReorder`. */
export interface TabReorderOptions {
  /** Set to `false` to ignore new presses and end an active drag. */
  enabled?: boolean;
  /** Read on each move: `true` when the tabs run right to left. */
  rtl?: () => boolean;
  /** Called once when a press has travelled far enough to be a drag. */
  onStart?: () => void;
  /** Called once when a drag ends, however it ends, before `onReorder`. */
  onEnd?: () => void;
  /** Called with the move. The owner of the data moves the tab. */
  onReorder?: (detail: TabReorderDetail) => void;
}

/** The gap a pointer is over: how many tabs lie before it. */
export function slotAt(
  centers: ReadonlyArray<number>,
  position: number,
  rtl?: boolean,
): number;

/** The index a tab takes when dropped into `slot`. */
export function slotToIndex(slot: number, oldIndex: number): number;

/** The tabs that make room for a move, and which way each steps. */
export function makeRoom(
  oldIndex: number,
  newIndex: number,
): { from: number; to: number; step: 1 | -1 } | null;

/** The index a move key sends a tab to, or `-1` for any other key. */
export function keyboardIndex(
  key: string,
  oldIndex: number,
  count: number,
  rtl?: boolean,
): number;

/** The scroll step for a pointer near the edge of a list. */
export function edgeScrollStep(
  position: number,
  start: number,
  end: number,
): number;

export const DRAG_THRESHOLD: number;
export const TOUCH_HOLD_MS: number;

/** Reorder a tab list by pointer drag or keyboard. Moves no node. */
export function tabReorder(
  node: HTMLElement,
  options: TabReorderOptions,
): { update: (options: TabReorderOptions) => void; destroy: () => void };
