// @ts-check
// The points, display and end labels of a survey scale, shared by
// `SurveyScale` and `LikertMatrix`.

/**
 * @typedef {object} ScalePoint
 * @property {number | string} value - Submitted with a form.
 * @property {string} [text] - Drawn in the option. Defaults to `value`.
 * @property {string} [label] - Names the option for screen readers.
 * @property {import("svelte").ComponentType} [icon] - Drawn in the option for `display="icon"`.
 * @property {number} [face] - A built-in face, 1 (very dissatisfied) to 5.
 */

/** @typedef {"nps" | "csat" | "likert"} ScalePreset */
/** @typedef {"number" | "label" | "icon"} ScaleDisplay */

/**
 * @typedef {"stronglyDisagree" | "disagree" | "somewhatDisagree" | "neitherAgreeNorDisagree" | "somewhatAgree" | "agree" | "stronglyAgree" | "veryDissatisfied" | "dissatisfied" | "neutral" | "satisfied" | "verySatisfied" | "notAtAllLikely" | "extremelyLikely"} ScaleTranslationId
 */

/** @typedef {(id: ScaleTranslationId) => string} ScaleTranslate */

// Translation ids, lowest first. The components hold the English text, so
// `translateWithId` and `setTranslateContext` can replace it.

/** @type {readonly ScaleTranslationId[]} */
export const LIKERT_5 = [
  "stronglyDisagree",
  "disagree",
  "neitherAgreeNorDisagree",
  "agree",
  "stronglyAgree",
];

/** @type {readonly ScaleTranslationId[]} */
export const LIKERT_7 = [
  "stronglyDisagree",
  "disagree",
  "somewhatDisagree",
  "neitherAgreeNorDisagree",
  "somewhatAgree",
  "agree",
  "stronglyAgree",
];

/** @type {readonly ScaleTranslationId[]} */
export const CSAT = [
  "veryDissatisfied",
  "dissatisfied",
  "neutral",
  "satisfied",
  "verySatisfied",
];

/**
 * Build the points of a preset, or return the caller's own.
 *
 * @param {object} options
 * @param {ScalePreset} [options.preset]
 * @param {5 | 7} [options.levels] - Likert only.
 * @param {readonly string[]} [options.labels] - Replaces the preset's labels, in order.
 * @param {readonly ScalePoint[]} [options.points] - Wins over the preset.
 * @param {ScaleTranslate} options.translate - The text of a preset label.
 * @returns {ScalePoint[]}
 */
export function resolvePoints({
  preset = "likert",
  levels = 5,
  labels,
  points,
  translate,
}) {
  if (points && points.length > 0) return [...points];

  if (preset === "nps") {
    return Array.from({ length: 11 }, (_, value) => ({
      value,
      text: String(value),
    }));
  }

  const defaults =
    preset === "csat" ? CSAT : levels === 7 ? LIKERT_7 : LIKERT_5;
  return defaults.map((id, index) => ({
    value: index + 1,
    label: labels?.[index] || translate(id),
    ...(preset === "csat" ? { face: index + 1 } : {}),
  }));
}

/**
 * What an option draws: a number for NPS, the label for Likert, a face for
 * CSAT.
 *
 * @param {ScalePreset} [preset]
 * @returns {ScaleDisplay}
 */
export function defaultDisplay(preset = "likert") {
  if (preset === "nps") return "number";
  return preset === "csat" ? "icon" : "label";
}

/**
 * The text of an option, drawn for `number` and read out for every display.
 *
 * @param {ScalePoint} point
 * @returns {string}
 */
export function pointText(point) {
  return point.text ?? String(point.value);
}

/**
 * The accessible name of an option, split into what is drawn and what is
 * hidden. A numeric option keeps its label as hidden text ("4 Satisfied"),
 * so the name still contains what is drawn.
 *
 * @param {ScalePoint} point
 * @param {ScaleDisplay} display
 * @returns {{ visible: string; hidden: string }}
 */
export function pointName(point, display) {
  if (display === "number") {
    return { visible: pointText(point), hidden: point.label ?? "" };
  }
  const label = point.label || pointText(point);
  return display === "label"
    ? { visible: label, hidden: "" }
    : { visible: "", hidden: label };
}

/**
 * Resolve the end labels. NPS carries its own. Other presets borrow the
 * first and last label, unless every option already shows its label. An
 * empty string hides an end.
 *
 * @param {object} options
 * @param {ScalePreset} [options.preset]
 * @param {ScaleDisplay} options.display
 * @param {readonly ScalePoint[]} options.points
 * @param {string | undefined} [options.minLabelText]
 * @param {string | undefined} [options.maxLabelText]
 * @param {boolean} [options.custom] - The points are the caller's.
 * @param {ScaleTranslate} options.translate - The text of NPS's ends.
 * @returns {{ min: string; max: string }}
 */
export function resolveEnds({
  preset = "likert",
  display,
  points,
  minLabelText,
  maxLabelText,
  custom = false,
  translate,
}) {
  const nps = preset === "nps" && !custom;
  const borrow = display !== "label";
  const first = points[0];
  const last = points[points.length - 1];
  return {
    min:
      minLabelText ??
      (nps ? translate("notAtAllLikely") : borrow ? (first?.label ?? "") : ""),
    max:
      maxLabelText ??
      (nps ? translate("extremelyLikely") : borrow ? (last?.label ?? "") : ""),
  };
}

/**
 * Find the point a value selects, comparing as strings since the DOM only
 * carries strings.
 *
 * @param {readonly ScalePoint[]} points
 * @param {unknown} value
 * @returns {ScalePoint | undefined}
 */
export function findPoint(points, value) {
  if (value === undefined || value === null) return undefined;
  const key = String(value);
  return points.find((point) => String(point.value) === key);
}
