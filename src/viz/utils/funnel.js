// @ts-check
// Funnel math: conversion, drop-off, and bar length per stage, in one pass.

/** @typedef {import("./funnel.d.ts").FunnelStage<any>} FunnelStage */

/**
 * Per-stage statistics for a funnel.
 *
 * Bar length is relative to the largest stage, not the first: real funnels
 * are not always monotonic, and a later stage can exceed an earlier one. Such
 * a stage has a step rate above 1, a negative drop, and is never the largest
 * drop. The largest drop is the biggest absolute loss, earliest on a tie.
 * Negative and non-finite values count as zero.
 *
 * @template {string | number} Id
 * @param {ReadonlyArray<import("./funnel.d.ts").FunnelStage<Id>>} stages
 * @param {{ scale?: "linear" | "sqrt" }} [options]
 * @returns {import("./funnel.d.ts").FunnelStats<Id>}
 */
export function getFunnelStats(stages, { scale = "linear" } = {}) {
  const n = stages.length;
  /** @type {number[]} */
  const values = new Array(n);
  let max = 0;
  for (let i = 0; i < n; i++) {
    const value = stages[i].value;
    values[i] = Number.isFinite(value) && value > 0 ? value : 0;
    if (values[i] > max) max = values[i];
  }

  const first = n > 0 ? values[0] : 0;
  const scaledMax = scale === "sqrt" ? Math.sqrt(max) : max;
  let largestDropIndex = -1;
  let largestDrop = 0;

  /** @type {import("./funnel.d.ts").FunnelRow<Id>[]} */
  const rows = new Array(n);
  for (let i = 0; i < n; i++) {
    const value = values[i];
    const previous = i > 0 ? values[i - 1] : null;
    const stepRate =
      previous === null || previous === 0 ? null : value / previous;
    const dropAbs = previous === null ? null : previous - value;
    if (dropAbs !== null && dropAbs > largestDrop) {
      largestDrop = dropAbs;
      largestDropIndex = i;
    }
    const scaled = scale === "sqrt" ? Math.sqrt(value) : value;
    rows[i] = {
      stage: stages[i],
      index: i,
      stats: {
        value,
        pct: scaledMax > 0 ? (scaled / scaledMax) * 100 : 0,
        previousPct: 0,
        stepRate,
        overallRate: first > 0 ? value / first : null,
        dropAbs,
        dropPct: stepRate === null ? null : 1 - stepRate,
        isLargestDrop: false,
      },
    };
    if (i > 0) rows[i].stats.previousPct = rows[i - 1].stats.pct;
  }
  if (largestDropIndex !== -1)
    rows[largestDropIndex].stats.isLargestDrop = true;

  return {
    rows,
    total: first,
    max,
    overallRate: n > 1 && first > 0 ? values[n - 1] / first : null,
    largestDropIndex,
  };
}
