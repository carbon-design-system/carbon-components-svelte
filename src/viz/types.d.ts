/**
 * The types a consumer names when typing props: series colors and the
 * tooltip's options. Components import them from their own modules; this
 * module re-exports them from the subpackage entry.
 */

export type {
  TooltipOptions,
  TooltipPoint,
  TooltipSort,
} from "./Chart/model.js";
export type {
  VizColor,
  VizColorToken,
  VizDivergingPalette,
  VizSemanticColor,
  VizSequentialHue,
} from "./utils/tokens.js";
