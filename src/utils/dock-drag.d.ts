import type { DockPosition } from "./dock-layout.js";

/** A rectangle by its edges, in viewport pixels. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** The part of a group a point is over. */
export type DockZone = "strip" | "center" | "left" | "right" | "top" | "bottom";

/** Where a drag would dock if it were let go now. */
export interface DockDropTarget {
  /** The group the drop lands on. */
  groupId: string;
  /** What the drop does there. */
  position: DockPosition;
  /** The part of the group the pointer is over. */
  zone: DockZone;
  /** Where among the group's tabs, when dropped on its strip. */
  index?: number;
}

/** A completed drop. */
export interface DockDrop {
  tabId: string;
  fromGroupId: string;
  groupId: string;
  position: DockPosition;
  index?: number;
}

/** Params for `dockDrag`. */
export interface DockDragOptions {
  /** Set to `false` to ignore new presses and end an active drag. */
  enabled?: boolean;
  /** Read on each move: `true` when the page runs right to left. */
  rtl?: () => boolean;
  /** The elements the drag draws on. */
  elements: () => {
    ghost: HTMLElement | null;
    preview: HTMLElement | null;
    marker: HTMLElement | null;
  };
  /**
   * Written while a drag is over anything but its own tab strip, and for the
   * rest of the task after a drop: the owner refuses the strip's own
   * `reorder` while this is `true`.
   */
  state: { docking: boolean };
  /** Return `false` to refuse a drop on a place. */
  canDock?: (drop: {
    tabId: string;
    fromGroupId: string;
    groupId: string;
    position: DockPosition;
  }) => boolean;
  onStart?: () => void;
  onEnd?: () => void;
  /** Called when the place a drop would land changes; `null` for none. */
  onTarget?: (target: DockDropTarget | null) => void;
  onDrop: (drop: DockDrop) => void;
}

export const EDGE_RATIO: number;
export function dropZone(
  box: Box,
  stripBottom: number,
  x: number,
  y: number,
): DockZone;
export function zonePosition(zone: DockZone, rtl?: boolean): DockPosition;
export function previewBox(box: Box, zone: DockZone): Box;
export function slotEdge(
  lefts: ReadonlyArray<number>,
  rights: ReadonlyArray<number>,
  slot: number,
  rtl?: boolean,
): number;
export function dockDrag(
  node: HTMLElement,
  options: DockDragOptions,
): { update: (options: DockDragOptions) => void; destroy: () => void };
