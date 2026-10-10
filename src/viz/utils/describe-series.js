// @ts-check
// Plain-language summary of a series, used as a chart's text alternative.
import { resolveFormat } from "./format-compact.js";

/** @typedef {import("./describe-series.d.ts").SeriesSummary} SeriesSummary */
/** @typedef {import("./describe-series.d.ts").DescribeOptions} DescribeOptions */
/** @typedef {import("./describe-series.d.ts").DescribeMessages} DescribeMessages */

/** @type {DescribeMessages} */
const MESSAGES = {
  empty: () => "No data.",
  trend: ({ trend, change }) =>
    trend === "flat"
      ? "No overall change."
      : `Trending ${trend}${change ? ` ${change}` : ""}.`,
  range: ({ min, max, last }) =>
    `Minimum ${min}, maximum ${max}, latest ${last}.`,
};

/**
 * Summarize `values`: extremes, first and last, mean, overall direction, and
 * a sentence built from them. A change within 1% of the first value counts
 * as flat. Override `messages` to localize or reword the sentence.
 *
 * @param {ReadonlyArray<number | null | undefined>} values
 * @param {DescribeOptions} [options]
 * @returns {SeriesSummary}
 */
export function describeSeries(values, options = {}) {
  const messages = { ...MESSAGES, ...options.messages };
  const format = resolveFormat(options.format, options.locale);

  let count = 0;
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let first = Number.NaN;
  let last = Number.NaN;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (count === 0) first = value;
    last = value;
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
    count += 1;
  }

  if (count === 0) {
    return {
      count: 0,
      min: Number.NaN,
      max: Number.NaN,
      first,
      last,
      mean: Number.NaN,
      trend: "flat",
      changeRatio: null,
      text: messages.empty(),
    };
  }

  const delta = last - first;
  const changeRatio = first === 0 ? null : delta / Math.abs(first);
  const flat =
    changeRatio === null ? delta === 0 : Math.abs(changeRatio) < 0.01;
  /** @type {SeriesSummary["trend"]} */
  const trend = flat ? "flat" : delta > 0 ? "up" : "down";

  const change =
    changeRatio === null || flat
      ? ""
      : resolveFormat(
          { style: "percent", maximumFractionDigits: 0 },
          options.locale,
        )(Math.abs(changeRatio));

  const text = [
    messages.trend({ trend, change }),
    messages.range({ min: format(min), max: format(max), last: format(last) }),
  ].join(" ");

  return {
    count,
    min,
    max,
    first,
    last,
    mean: sum / count,
    trend,
    changeRatio,
    text,
  };
}
