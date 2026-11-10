export type MentionRule = {
  /** One character that starts a mention. */
  char: string;
  /** @default "word-start" */
  position?: "word-start" | "line-start";
  /** @default false */
  allowSpaces?: boolean;
  /** @default 0 */
  minQueryLength?: number;
  /** @default 32 */
  maxQueryLength?: number;
};

export type MentionMatch = {
  /** Index of the matching rule in the list passed in. */
  index: number;
  char: string;
  /** Text between the trigger and the caret. */
  query: string;
  /** Index of the trigger character. */
  start: number;
  /** The caret. */
  end: number;
};

/**
 * Find the mention at `caret`: the nearest trigger character before it that
 * starts a word (or a line), with a query that holds no whitespace or
 * terminating punctuation.
 */
export function detectMention(
  value: string,
  caret: number,
  rules: ReadonlyArray<MentionRule>,
): MentionMatch | null;
