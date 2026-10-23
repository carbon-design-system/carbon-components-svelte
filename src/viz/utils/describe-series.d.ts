/**
 * Plain-language summary of a series, used as a chart's text alternative.
 */
import type { NumberFormat } from "./format-compact.js";

export type SeriesSummary = {
  /** Number of finite values. */
  count: number;
  min: number;
  max: number;
  first: number;
  last: number;
  mean: number;
  trend: "up" | "down" | "flat";
  /** `(last - first) / |first|`. `null` when `first` is `0` or missing. */
  changeRatio: number | null;
  /** The summary sentence, such as "Trending up 12%. Minimum 3, …". */
  text: string;
};

/** Sentence builders. Values arrive already formatted. */
export type DescribeMessages = {
  empty: () => string;
  trend: (parts: { trend: "up" | "down" | "flat"; change: string }) => string;
  range: (parts: { min: string; max: string; last: string }) => string;
};

export type DescribeOptions = {
  /** How `min`, `max`, and `last` are written. Defaults to compact notation. */
  format?: NumberFormat;
  locale?: string;
  /** Replace any of the English sentence builders. */
  messages?: Partial<DescribeMessages>;
};

/**
 * Summarize `values`: extremes, first and last, mean, overall direction, and
 * a sentence built from them. A change within 1% of the first value counts
 * as flat. Override `messages` to localize or reword the sentence.
 */
export function describeSeries(
  values: ReadonlyArray<number | null | undefined>,
  options?: DescribeOptions,
): SeriesSummary;
