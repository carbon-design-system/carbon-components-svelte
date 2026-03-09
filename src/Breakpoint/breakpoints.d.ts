/**
 * Pixel sizes of Carbon grid breakpoints.
 */
export declare const breakpoints: Record<BreakpointSize, BreakpointValue>;

/** Breakpoint size key: sm, md, lg, xlg, or max. */
export type BreakpointSize = "sm" | "md" | "lg" | "xlg" | "max";

/** Pixel value for each breakpoint (320, 672, 1056, 1312, 1584). */
export type BreakpointValue = 320 | 672 | 1056 | 1312 | 1584;

export default breakpoints;
