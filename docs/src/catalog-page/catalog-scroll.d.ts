export interface ScrollSnapshot {
  /** The query string the list was showing. */
  key: string;
  /** The first item in view. */
  index: number;
  /** How far into that item's row the viewport starts, in pixels. */
  within: number;
  /** The page's scroll position, a fallback. */
  y: number;
}

interface Geometry {
  /** Where the first row starts, in page pixels. */
  listTop: number;
  /** Row height plus gap. */
  stride: number;
  columns: number;
}

export function anchorAt(geometry: Geometry & { scrollY: number }): {
  index: number;
  within: number;
};

export function scrollForAnchor(
  geometry: Geometry & { index: number; within: number },
): number;

export function readSnapshot(key: string): ScrollSnapshot | null;

export function writeSnapshot(snapshot: ScrollSnapshot): void;
