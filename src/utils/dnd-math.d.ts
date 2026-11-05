/** A key's meaning for a lifted item. See `keyIntent`. */
export type DndIntent =
  | "back"
  | "forward"
  | "up"
  | "down"
  | "prevZone"
  | "nextZone"
  | "start"
  | "end"
  | "pageBack"
  | "pageForward"
  | "enter";

/** The way the items of a zone run. `"grid"` wraps. */
export type DndOrientation = "vertical" | "horizontal" | "grid";

/** A physical edge of a box. */
export type DndEdge = "left" | "right" | "top" | "bottom";

/** Where a drop lands on a tree row. */
export type TreePosition = "before" | "inside" | "after";

export interface DndBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function insertionSlot(
  count: number,
  midpoint: (index: number) => number,
  pointer: number,
): number;

export function slotToIndex(
  slot: number,
  oldIndex: number,
  sameList: boolean,
): number;

export function indexToSlot(
  index: number,
  oldIndex: number,
  sameList: boolean,
): number;

export function nearestBox(
  boxes: ReadonlyArray<DndBox>,
  x: number,
  y: number,
  rtl?: boolean,
): { index: number; after: boolean } | null;

export function closestEdge(box: DndBox, x: number, y: number): DndEdge;

export function treePosition(
  top: number,
  height: number,
  y: number,
  canInside?: boolean,
): TreePosition;

export function cellAt(offset: number, pitch: number, count: number): number;

export function edgeScrollSpeed(options: {
  pointer: number;
  start: number;
  end: number;
  zone?: number;
  maxSpeed?: number;
  held?: number;
  ramp?: number;
}): number;

export function keyIntent(
  key: string,
  orientation: DndOrientation,
  rtl: boolean,
): DndIntent | null;

export const PAGE_STEP: number;

export function stepIndex(
  index: number,
  intent: DndIntent,
  max: number,
): number;
