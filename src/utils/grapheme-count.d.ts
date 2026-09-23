/**
 * Count user-perceived characters (grapheme clusters) in `value`.
 */
export function graphemeCount(value: string): number;

/**
 * Truncate `value` to at most `max` grapheme clusters.
 * Returns `value` unchanged if `max` is not a finite, non-negative number.
 */
export function truncateGraphemes(value: string, max: number): string;
