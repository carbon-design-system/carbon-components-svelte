export interface PhoneFormat {
  /** A mask pattern for the national number. A `0` is the trunk prefix. */
  pattern: string;
  /** The fewest digits of a complete number. */
  min: number;
  /** The most digits the pattern takes. */
  max: number;
  /** False for the grouping by threes used where a country has no entry. */
  known: boolean;
}

/** How a country writes its national numbers. */
export function phoneFormat(region: string): PhoneFormat;

/**
 * The calling code and national digits of an international number such as
 * "+44 20 7946 0958", or `null` without a leading `+` and a known code.
 */
export function parseInternational(
  text: string,
): { code: string; digits: string } | null;
