/**
 * Flag outliers in a series by z-score.
 */
export type AnomalyOptions = {
  /** Standard deviations from the mean that count as an anomaly. @default 3 */
  threshold?: number;
  /**
   * Compare each value with the values before it, up to this many, instead of
   * with the whole series.
   */
  window?: number;
};

/**
 * `true` at each index whose value lies more than `threshold` standard
 * deviations from the mean. Missing values are never flagged.
 */
export function flagAnomalies(
  values: ReadonlyArray<number | null | undefined>,
  options?: AnomalyOptions,
): boolean[];
