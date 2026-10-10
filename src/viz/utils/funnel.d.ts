/**
 * Funnel math: conversion, drop-off, and bar length per stage, in one pass.
 */
import type { VizColor } from "./tokens.js";

export type FunnelStage<Id extends string | number = string> = {
  id: Id;
  label: string;
  value: number;
  /** Overrides the funnel's `color` for this stage. */
  color?: VizColor;
  /** Renders the label as a link. */
  href?: string;
  /** Median time spent reaching this stage from the previous one. */
  medianDurationMs?: number;
};

export type FunnelStageStats = {
  /** The stage value, with negative and non-finite values as `0`. */
  value: number;
  /** Bar length from 0 to 100, relative to the largest stage. */
  pct: number;
  /** `pct` of the previous stage. `0` for the first stage. */
  previousPct: number;
  /** `value / previous`. `null` for the first stage or a zero previous. */
  stepRate: number | null;
  /** `value / first`. `null` when the first stage is zero. */
  overallRate: number | null;
  /** `previous - value`. `null` for the first stage. */
  dropAbs: number | null;
  /** `1 - stepRate`. */
  dropPct: number | null;
  isLargestDrop: boolean;
};

export type FunnelRow<Id extends string | number = string> = {
  stage: FunnelStage<Id>;
  stats: FunnelStageStats;
  index: number;
};

export type FunnelStats<Id extends string | number = string> = {
  rows: FunnelRow<Id>[];
  /** Value of the first stage. */
  total: number;
  /** Value of the largest stage. */
  max: number;
  /** Last stage over first. `null` with fewer than two stages. */
  overallRate: number | null;
  /** Index of the stage with the biggest absolute loss, or `-1`. */
  largestDropIndex: number;
};

/**
 * Per-stage statistics for a funnel.
 *
 * Bar length is relative to the largest stage, not the first: real funnels
 * are not always monotonic, and a later stage can exceed an earlier one. Such
 * a stage has a step rate above 1, a negative drop, and is never the largest
 * drop. The largest drop is the biggest absolute loss, earliest on a tie.
 * Negative and non-finite values count as zero.
 */
export function getFunnelStats<Id extends string | number = string>(
  stages: ReadonlyArray<FunnelStage<Id>>,
  options?: { scale?: "linear" | "sqrt" },
): FunnelStats<Id>;
