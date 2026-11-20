export type AnnotationSpan = { id: string; start: number; end: number };

export type HighlightSegment = {
  start: number;
  end: number;
  /** The annotations over this stretch, in the order given. */
  ids: string[];
  /** Whether the active annotation covers it. */
  active: boolean;
  /** Whether the unsaved selection covers it. */
  draft: boolean;
};

export type HighlightKind = "base" | "overlap" | "active" | "draft";

/**
 * Split the text into stretches with the same set of annotations over them,
 * drop the stretches with none, and join neighbors that look alike.
 */
export function computeSegments(
  spans: ReadonlyArray<AnnotationSpan>,
  options?: {
    activeId?: string | null;
    draft?: { start: number; end: number } | null;
  },
): HighlightSegment[];

/**
 * The ranges to paint for one kind of highlight. Touching ranges are joined.
 */
export function segmentsOfKind(
  segments: ReadonlyArray<HighlightSegment>,
  kind: HighlightKind,
): Array<{ start: number; end: number }>;
