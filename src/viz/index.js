// Data visualization subpackage: `carbon-components-svelte/viz`.
// Styles ship separately in `carbon-components-svelte/css/viz.css`.
// May import from core (`../utils`, `../icons`); core must never import from here.

export { extent, extentBy } from "./utils/extent.js";
export { scaleBand, scalePoint } from "./utils/scale-band.js";
export { scaleLinear } from "./utils/scale-linear.js";
export { scaleLog } from "./utils/scale-log.js";
export { scaleTime } from "./utils/scale-time.js";
export { niceDomain, tickStep, ticks } from "./utils/ticks.js";
export {
  niceTimeDomain,
  timeTickFormat,
  timeTicks,
} from "./utils/time-ticks.js";
export {
  categoricalColors,
  VIZ_CATEGORICAL_COUNT,
  VIZ_DIVERGING_STEPS,
  VIZ_GROUP_OPTIONS,
  VIZ_SEMANTIC_COLORS,
  VIZ_SEQUENTIAL_STEPS,
  vizColor,
} from "./utils/tokens.js";
