/**
 * Format a byte count as a human-readable size.
 * `units: "decimal"` (default) uses 1000 (B, kB, MB, GB, TB);
 * `units: "binary"` uses 1024 (B, KiB, MiB, GiB, TiB).
 * Rounds to one fractional digit and drops a trailing ".0".
 * Pass `locale` to format the number with that locale's decimal separator.
 * Returns `""` for negative or non-finite input.
 */
export function formatFileSize(
  bytes: number,
  options?: {
    units?: "decimal" | "binary";
    locale?: string;
  },
): string;
