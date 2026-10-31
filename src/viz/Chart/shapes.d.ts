export type Symbol =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "cross"
  | "star";
export type Pattern =
  | "solid"
  | "diagonal"
  | "dots"
  | "crosshatch"
  | "horizontal"
  | "vertical";

export const SYMBOLS: readonly Symbol[];
export const PATTERNS: readonly Pattern[];

/** The path of a symbol centered on the origin, about the area of a circle of radius `r`. */
export function symbolPath(symbol: Symbol, r: number): string;

/** The strokes of one pattern tile, drawn in the series color over a tint of it. */
export function patternTile(pattern: Pattern): {
  size: number;
  d: string;
  dots?: boolean;
};

/** The shape of each series: a fixed map, or one per series in order under `"auto"`. */
export function assignShapes<Name extends string>(
  keys: ReadonlyArray<string | number>,
  assignment: "auto" | Partial<Record<string, Name>> | undefined,
  cycle: ReadonlyArray<Name>,
): Map<string | number, Name>;
