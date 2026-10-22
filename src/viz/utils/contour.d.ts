export type DensityGridOptions = {
  width: number;
  height: number;
  /** Grid cell size, in the points' units. */
  cellSize?: number;
  /** Gaussian bandwidth, in the points' units. */
  bandwidth?: number;
};

export type DensityGrid = {
  /** Row-major, `rows × columns`. */
  values: Float64Array;
  columns: number;
  rows: number;
  cellSize: number;
  peak: number;
};

export type ContourLevel = {
  level: number;
  /** One SVG path of every isoline segment at this level. */
  d: string;
};

/** Smoothed density of points on a grid of square cells. */
export function densityGrid(
  points: ReadonlyArray<{ x: number; y: number } | null | undefined>,
  options: DensityGridOptions,
): DensityGrid;

/** Isolines of a density grid at each level, by marching squares. */
export function contours(
  grid: DensityGrid,
  levels: ReadonlyArray<number>,
): ContourLevel[];

/** Evenly spaced levels from a share of the peak up to the peak. */
export function levelsFor(
  peak: number,
  count: number,
  floor?: number,
): number[];
