/** The cell size and gaps of a laid-out `DashboardGrid`, in px. */
export interface GridMetrics {
  /** Columns at the current width. */
  cols: number;
  columnWidth: number;
  rowHeight: number;
  gapX: number;
  gapY: number;
  /** A column plus one gap. */
  pitchX: number;
  /** A row plus one gap. */
  pitchY: number;
  rtl: boolean;
}

/** The size of each track in a computed `grid-template-columns` value. */
export function parseTrackSizes(value: string): number[];

/** Read the cell size and the gaps from a laid-out grid. */
export function readGrid(grid: HTMLElement): GridMetrics | null;

/** The nearest cell a distance from the grid's first cell falls in. */
export function cellAt(offset: number, pitch: number, count: number): number;

/** The cells a size covers. */
export function cellSpan(size: number, track: number, gap: number): number;

/** Scroll speed (px/s, signed) for a pointer near the edges of a scroll area. */
export function edgeScrollSpeed(options: {
  pointer: number;
  start: number;
  end: number;
  zone?: number;
  maxSpeed?: number;
  held?: number;
  ramp?: number;
}): number;
