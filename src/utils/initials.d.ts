export interface InitialsOptions {
  /** Maximum number of initials returned. Defaults to 2. */
  max?: number;
  /** BCP 47 tag for grapheme segmentation and upper casing. */
  locale?: string;
}

/**
 * Derive initials from a full name: the first user-perceived character of
 * each word, capped at `max`, upper cased.
 */
export function getInitials(
  name: string | null | undefined,
  options?: InitialsOptions,
): string;
