import type { VizColor, VizSemanticColor } from "../utils/tokens.js";

export type GanttOptions<T> = {
  id?: (row: T, index: number) => unknown;
  label?: (row: T, index: number) => unknown;
  /** The workstream a task belongs to. */
  group?: (row: T, index: number) => unknown;
  start: (row: T, index: number) => unknown;
  end: (row: T, index: number) => unknown;
  /** Share done, 0 to 1. */
  progress?: (row: T, index: number) => unknown;
  /** Id, or ids, of the tasks this one waits for. */
  dependsOn?: (row: T, index: number) => unknown;
  domain?: readonly [Date | number | string, Date | number | string];
  colors?: Record<string, VizSemanticColor | VizColor>;
  palette?: number;
  plot: { x0: number; x1: number };
  rowHeight: number;
  locale?: string;
  utc?: boolean;
};

export type GanttRow<T> = {
  id: string;
  label: string;
  group: string;
  color: string;
  /** Epoch milliseconds, before clipping. */
  from: number;
  to: number;
  duration: number;
  progress: number | null;
  deps: string[];
  /** Row from the top. */
  line: number;
  y: number;
  /** Bar ends in pixels, after clipping. */
  x0: number;
  x1: number;
  row: T;
  index: number;
};

export type GanttLink = {
  id: string;
  from: string;
  to: string;
  /** The waiting task starts before the one it waits for ends. */
  late: boolean;
  d: string;
};

export type Gantt<T> = {
  domain: [number, number];
  x: { map(value: number | Date): number; invert(px: number): number };
  groups: Array<{ key: string; color: string; y: number; count: number }>;
  /** Top to bottom. */
  tasks: GanttRow<T>[];
  links: GanttLink[];
  ticks: Array<{ value: number; px: number; label: string }>;
  xLabel: (value: number) => string;
  height: number;
};

/** Tasks as bars on one time scale, grouped, with dependency arrows. */
export function buildGantt<T>(
  rows: ReadonlyArray<T>,
  options: GanttOptions<T>,
): Gantt<T>;
