export type HexBin = {
  key: string;
  /** Center, in the same space as the points. */
  x: number;
  y: number;
  count: number;
  /** Indices into the points given. */
  indices: number[];
};

/** SVG path of a pointy-top hexagon centered on the origin. */
export function hexagonPath(radius: number): string;

/** Bin points into pointy-top hexagons of the given radius. */
export function hexbin(
  points: ReadonlyArray<{ x: number; y: number } | null | undefined>,
  radius: number,
): HexBin[];
