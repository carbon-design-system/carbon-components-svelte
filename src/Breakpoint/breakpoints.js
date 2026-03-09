/**
 * Pixel sizes of Carbon grid breakpoints.
 * @typedef {"sm" | "md" | "lg" | "xlg" | "max"} BreakpointSize
 * @typedef {320 | 672 | 1056 | 1312 | 1584} BreakpointValue
 * @type {Record<BreakpointSize, BreakpointValue>}
 */
export const breakpoints = Object.freeze({
  sm: 320,
  md: 672,
  lg: 1056,
  xlg: 1312,
  max: 1584,
});

export default breakpoints;
