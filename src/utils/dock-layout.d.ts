/** A leaf: tabs that share one strip and one panel. */
export interface DockGroup {
  type: "group";
  /** Names the group. Unique in a layout; a group without one is given one. */
  id: string;
  /** Tab ids, in strip order. */
  tabs: string[];
  /** The tab whose panel shows. Defaults to the first. */
  activeId?: string;
}

/** Panes laid out in a row (side by side) or a column (stacked). */
export interface DockSplit {
  type: "row" | "column";
  /** At least two. */
  children: DockNode[];
  /** Each child's share of the split, in percent, adding up to 100. */
  sizes: number[];
}

export type DockNode = DockGroup | DockSplit;

/** A side of a group. `start` and `end` follow the inline axis. */
export type DockEdge = "start" | "end" | "top" | "bottom";

/** Where a tab docks on a group: an edge splits it, the center joins it. */
export type DockPosition = DockEdge | "center";

/** A direction between groups. */
export type DockDirection = "start" | "end" | "up" | "down";

/** A rectangle in percent of the layout. */
export interface DockRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function equalSizes(count: number): number[];
export function fitSizes(
  sizes: ReadonlyArray<number> | undefined,
  count: number,
): number[];
export function groups(layout: DockNode): DockGroup[];
export function findGroup(
  layout: DockNode,
  groupId: string,
): DockGroup | undefined;
export function findTab(layout: DockNode, tabId: string): DockGroup | undefined;
export function tabIds(layout: DockNode): string[];
export function layoutRects(layout: DockNode): Map<string, DockRect>;
export function nextGroupId(layout: DockNode): string;
export function normalizeDockLayout(
  layout: unknown,
  options?: { known?: Iterable<string> },
): DockNode;
export function closeDockTab(layout: DockNode, tabId: string): DockNode;
export function activate(layout: DockNode, tabId: string): DockNode;
export function moveDockTab(
  layout: DockNode,
  tabId: string,
  groupId: string,
  index?: number,
): DockNode;
export function splitDockTab(
  layout: DockNode,
  tabId: string,
  groupId: string,
  edge: DockEdge,
): DockNode;
export function dockTab(
  layout: DockNode,
  tabId: string,
  groupId: string,
  position: DockPosition,
  index?: number,
): DockNode;
export function addDockTab(
  layout: DockNode,
  tabId: string,
  groupId?: string,
): DockNode;
export function resize(
  layout: DockNode,
  path: ReadonlyArray<number>,
  sizes: ReadonlyArray<number>,
): DockNode;
export function neighbor(
  layout: DockNode,
  groupId: string,
  direction: DockDirection,
): string | undefined;
export function reconcileDockLayout(
  layout: unknown,
  ids: ReadonlyArray<string>,
  options?: { groupId?: string },
): DockNode;
export function parseDockLayout(
  text: string | null | undefined,
  options?: { known?: Iterable<string> },
): DockNode | undefined;
