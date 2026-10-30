export interface CodeToken {
  type: string | null;
  text: string;
}

/**
 * Tokens for `nextText` from those of `prevText`, lexing only the lines the
 * edit touched, or `null` when the edit is too near a multi-line token to
 * trust and the whole text must be lexed.
 */
export function spliceTokens(
  tokens: CodeToken[],
  prevText: string,
  nextText: string,
  lex: (code: string) => CodeToken[] | undefined,
): CodeToken[] | null;
