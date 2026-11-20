/**
 * The points, display and end labels of a survey scale, shared by
 * `SurveyScale` and `LikertMatrix`.
 */

export interface ScalePoint {
  /** Submitted with a form. */
  value: number | string;
  /** Drawn in the option. Defaults to `value`. */
  text?: string;
  /** Names the option for screen readers. */
  label?: string;
  /** Drawn in the option for `display="icon"`. */
  icon?: import("svelte").ComponentType;
  /** A built-in face, 1 (very dissatisfied) to 5. */
  face?: number;
}

export type ScalePreset = "nps" | "csat" | "likert";
export type ScaleDisplay = "number" | "label" | "icon";

export const LIKERT_5: readonly string[];
export const LIKERT_7: readonly string[];
export const CSAT: readonly string[];
export const NPS_MIN_LABEL: string;
export const NPS_MAX_LABEL: string;

/**
 * Build the points of a preset, or return the caller's own.
 */
export function resolvePoints(options: {
  preset?: ScalePreset;
  /** Likert only. */
  levels?: 5 | 7;
  /** Replaces the preset's labels, in order. */
  labels?: readonly string[];
  /** Wins over the preset. */
  points?: readonly ScalePoint[];
}): ScalePoint[];

/**
 * What an option draws: a number for NPS, the label for Likert, a face for
 * CSAT.
 */
export function defaultDisplay(preset?: ScalePreset): ScaleDisplay;

/**
 * The text of an option, drawn for `number` and read out for every display.
 */
export function pointText(point: ScalePoint): string;

/**
 * The accessible name of an option, split into what is drawn and what is
 * hidden. A numeric option keeps its label as hidden text ("4 Satisfied"),
 * so the name still contains what is drawn.
 */
export function pointName(
  point: ScalePoint,
  display: ScaleDisplay,
): { visible: string; hidden: string };

/**
 * Resolve the end labels. NPS carries its own. Other presets borrow the
 * first and last label, unless every option already shows its label. An
 * empty string hides an end.
 */
export function resolveEnds(options: {
  preset?: ScalePreset;
  display: ScaleDisplay;
  points: readonly ScalePoint[];
  minLabel?: string | undefined;
  maxLabel?: string | undefined;
  /** The points are the caller's. */
  custom?: boolean;
}): { min: string; max: string };

/**
 * Find the point a value selects, comparing as strings since the DOM only
 * carries strings.
 */
export function findPoint(
  points: readonly ScalePoint[],
  value: unknown,
): ScalePoint | undefined;
