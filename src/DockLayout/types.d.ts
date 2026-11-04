import type { Readable } from "svelte/store";
import type { DockEdge, DockNode } from "../utils/dock-layout.js";

/** A document a tab stands for. */
export interface DockDocument {
  id: string;
  label: string;
  modified?: boolean;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface DockLabelParams {
  /** The group's place in reading order, from 1. */
  index: number;
  /** How many groups there are. */
  count: number;
  /** The label of the group's active tab. */
  label: string | undefined;
}

/** What the groups and splits read from the root. */
export interface DockShared {
  documentsById: Record<string, DockDocument>;
  /** Each group's place in reading order, from 1. */
  groupNumbers: Map<string, number>;
  activeGroupId: string;
  maximized: string | null;
  type: "default" | "container";
  size: "sm" | "md" | "lg" | "xl" | undefined;
  dismissible: boolean;
  lazy: boolean;
  emptyText: string;
  groupLabelText: (params: DockLabelParams) => string;
  stripLabelText: (params: { index: number; count: number }) => string;
  resizeLabelText: (params: { before: string; after: string }) => string;
  groupName: (params: { first: number; last: number }) => string;
}

/** What the groups and splits call on the root. */
export interface DockContext {
  shared: Readable<DockShared>;
  /** `docking` is `true` while a drag is over anything but its own strip. */
  docking: { docking: boolean };
  setActiveGroup: (groupId: string) => void;
  activate: (tabId: string) => void;
  /** Returns `false` when the app kept the tab. */
  close: (tabId: string) => boolean;
  /** Returns `false` when the app refused the move. */
  reorder: (
    groupId: string,
    tabId: string,
    index: number,
    source: "pointer" | "keyboard",
  ) => boolean;
  resize: (path: ReadonlyArray<number>, sizes: ReadonlyArray<number>) => void;
}

export type { DockEdge, DockNode };
