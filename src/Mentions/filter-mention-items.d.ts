export type MentionItem = {
  id: string | number;
  text: string;
  secondary?: string;
  insertText?: string;
  disabled?: boolean;
};

/** Lowercase and drop accents, so "jose" finds "José". */
export function foldText(text: string | undefined): string;

/**
 * Build the folded copies of `items` ahead of the first query, so the first
 * key typed after the trigger does not pay for them.
 */
export function warmMentionItems(items: ReadonlyArray<MentionItem>): void;

/**
 * Items that match `query`, best first, at most `limit`: a prefix of the
 * text, then the start of a later word, then a substring, then a match on
 * `secondary` only.
 */
export function filterMentionItems<T extends MentionItem>(
  items: ReadonlyArray<T>,
  query: string,
  limit?: number,
): T[];
