export type GanttZoomLevel = "day" | "week" | "month" | "quarter";

export const MS_PER_DAY: number;

export const ZOOM_LEVELS: Record<
  GanttZoomLevel,
  { dayWidth: number; snap: number }
>;

export const ROW_HEIGHTS: Record<
  "compact" | "short" | "medium" | "default" | "tall",
  number
>;

export const MIN_BAR_WIDTH: number;

/** A day number from a `Date` (read by its local date parts) or a `YYYY-MM-DD` string. */
export function toDay(value: unknown): number | null;

/** A day number as a value of the same kind as `like`. */
export function fromDay(day: number, like: unknown): Date | string;

export function dayToDate(day: number): Date;

/** ISO weekday: 1 is Monday, 7 is Sunday. */
export function isoWeekday(day: number): number;

export function monthStart(day: number, months?: number): number;
export function quarterStart(day: number, quarters?: number): number;
export function yearStart(day: number, years?: number): number;
export function weekStart(day: number, firstDay: number): number;

export function localeWeek(locale: string | undefined): {
  firstDay: number;
  weekend: number[];
};

export interface ScheduleEntry {
  start: number | null;
  end: number | null;
  milestone: boolean;
  summary: boolean;
  progress: number;
}

export interface TaskLike {
  id: string | number;
  nodes?: ReadonlyArray<TaskLike>;
  start?: unknown;
  end?: unknown;
  milestone?: boolean;
  progress?: number;
}

export function computeSchedule(
  nodes: ReadonlyArray<TaskLike>,
): Map<string | number, ScheduleEntry>;

export function barHeightFor(rowHeight: number): number;

export interface GanttBar {
  id: string | number;
  key: string;
  row: number;
  start: number;
  end: number;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorY: number;
  milestone: boolean;
  summary: boolean;
  progress: number;
  editable: boolean;
}

export function placeBar(
  row: number,
  id: string | number,
  entry: ScheduleEntry,
  domainStart: number,
  dayWidth: number,
  rowHeight: number,
  editable: boolean,
): GanttBar | null;

export function linkPath(
  from: GanttBar,
  to: GanttBar,
  rowHeight: number,
): string;

export interface GanttLink {
  from: string | number;
  to: string | number;
}

export function anchorBar(
  id: string | number,
  barByKey: Map<string, GanttBar>,
  parentIdById: Map<string | number, string | number | symbol>,
): GanttBar | undefined;

export function isConflict(
  from: ScheduleEntry | undefined,
  to: ScheduleEntry | undefined,
): boolean;

export function applyDelta(
  start: number,
  end: number,
  mode: "move" | "start" | "end",
  delta: number,
): { start: number; end: number };

export function hitMode(
  offset: number,
  width: number,
): "move" | "start" | "end";

export function patchNode<
  T extends { id: string | number; nodes?: ReadonlyArray<unknown> },
>(
  nodes: readonly T[],
  id: string | number,
  patch: Record<string, unknown>,
): T[];

export interface AxisCell {
  key: string;
  x: number;
  width: number;
  label: string;
}

export interface Axis {
  start: number;
  end: number;
  dayWidth: number;
  top: AxisCell[];
  bottom: AxisCell[];
}

export function alignDomain(
  zoom: GanttZoomLevel,
  start: number,
  end: number,
  firstDay: number,
): { start: number; end: number };

export function buildAxis(options: {
  zoom: GanttZoomLevel;
  start: number;
  end: number;
  locale: string | undefined;
  firstDay: number;
  formatQuarter: (quarter: number, year: number) => string;
}): Axis;

export function weekendGradient(
  start: number,
  dayWidth: number,
  weekend: number[],
  color: string,
  minDayWidth?: number,
): string;

export interface BarLabelInfo {
  text: string;
  range: string;
  kind: "task" | "summary" | "milestone";
  progress: number;
  after: string[];
}

export function defaultBarLabel(info: BarLabelInfo): string;

export function formatRange(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
  start: number,
  end: number,
): string;

export function formatDay(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
  day: number,
): string;
