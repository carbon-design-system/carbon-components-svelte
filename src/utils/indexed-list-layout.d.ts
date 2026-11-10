export type IndexedLayout = {
  /** Items per section, empty ones included. */
  counts: ReadonlyArray<number>;
  itemHeight: number;
  headerHeight: number;
  /** The sections that hold items, in order. */
  sections: number[];
  /** The offset of each of those sections' header. */
  starts: number[];
  /** The offset of every section's header, or -1 for an empty one. */
  offsets: number[];
  /** The height of every header and item. */
  total: number;
};

export type IndexedRow =
  | { type: "header"; section: number; key: string }
  | { type: "item"; section: number; index: number; key: string };

export type IndexedWindow = {
  /** The rows to render, top to bottom. */
  rows: IndexedRow[];
  /** Space above the first row, in pixels. */
  before: number;
  /** Space below the last row, in pixels. */
  after: number;
  /** The section whose header is at the top of the viewport, or -1. */
  section: number;
};

export function buildIndexedLayout(
  counts: ReadonlyArray<number>,
  itemHeight: number,
  headerHeight: number,
): IndexedLayout;

export function positionAt(layout: IndexedLayout, offset: number): number;

export function getIndexedWindow(
  layout: IndexedLayout,
  scrollTop: number,
  viewport: number,
  overscan: number,
  /** How far the last scroll moved, signed. */
  lead?: number,
): IndexedWindow;
