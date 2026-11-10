import type { HighlightKind, HighlightSegment } from "./segments";
import type { TextIndex } from "./text-index";

/** The `CSS.highlights` name of each kind of highlight. */
export const HIGHLIGHT_NAMES: Record<HighlightKind, string>;

/** Whether this browser paints ranges with `CSS.highlights`. */
export function supportsHighlightApi(): boolean;

export type HighlightLayer = {
  technique: "highlight-api" | "mark";
  /** Whether painting changes the DOM, so the text index is built again. */
  rewrites: boolean;
  /** Paint the segments. Returns `true` when the DOM changed. */
  paint(index: TextIndex, segments: ReadonlyArray<HighlightSegment>): boolean;
  /** Put the document back as it was. */
  unwrap(): void;
  destroy(): void;
};

export function createHighlightLayer(
  technique: "highlight-api" | "mark",
): HighlightLayer;
