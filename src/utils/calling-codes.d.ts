/**
 * The calling code of a region, without the plus: "41" for "CH". `""` for a
 * region with none.
 */
export function callingCode(region: string): string;

/** The regions that share a calling code, the main one first. */
export function regionsForCallingCode(code: string): string[];

/**
 * Split the start of an international number into its calling code and the
 * rest. `null` when no calling code matches.
 */
export function splitCallingCode(
  digits: string,
): { code: string; rest: string } | null;
