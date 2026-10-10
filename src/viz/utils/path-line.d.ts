/**
 * SVG path builders for lines and areas. Inputs are already in pixel space.
 */

export type Point = { x: number; y: number };

/**
 * `"monotone"` is the only smooth curve offered: it never overshoots the
 * data between neighbors, so it cannot invent peaks or dips.
 */
export type Curve =
  | "linear"
  | "step"
  | "step-before"
  | "step-after"
  | "monotone";

export type PathOptions = {
  /** @default "linear" */
  curve?: Curve;
  /** Decimal places kept in the output. @default 2 */
  precision?: number;
};

/**
 * Split `points` into runs of consecutive present points. A missing or
 * non-finite point ends the current run, so gaps are never bridged.
 */
export function splitRuns(
  points: ReadonlyArray<Point | null | undefined>,
): Array<{ start: number; points: Point[] }>;

/**
 * Path commands through one gap-free run. `move` is the command that reaches
 * the first point: `"M"` to start a subpath, `"L"` to continue one.
 */
export function runCommands(
  points: ReadonlyArray<Point>,
  curve: Curve,
  f: (value: number) => string,
  move: "M" | "L",
): string[];

/** Resolve path options into a curve and a number formatter. */
export function resolvePathOptions(options?: PathOptions): {
  curve: Curve;
  f: (value: number) => string;
};

/**
 * SVG path `d` through `points`. A `null` or non-finite point is a gap: the
 * line stops and a new subpath starts after it. A run of one point becomes a
 * zero-length segment, which round line caps paint as a dot.
 */
export function pathLine(
  points: ReadonlyArray<Point | null | undefined>,
  options?: PathOptions,
): string;
