/**
 * Pixel sizes of Carbon grid breakpoints.
 * @type {Record<BreakpointSize, BreakpointValue>}
 */
export const breakpoints: Record<BreakpointSize, BreakpointValue>;

export type BreakpointSize = "sm" | "md" | "lg" | "xlg" | "max";

export type BreakpointValue = 320 | 672 | 1056 | 1312 | 1584;

export default breakpoints;
