// @ts-check

/**
 * @typedef {{ type: string | null; text: string }} CodeToken
 */

const BLANK = /^\s+$/;

/**
 * Tokens for `nextText` from the tokens of `prevText`, lexing only the lines
 * the edit touched. A whole-text lexer costs about 10 ms on 5,000 lines, so
 * a large editor splices the edit in, and lexes the whole text once typing
 * pauses.
 *
 * The spliced lines are lexed alone, so the result is exact where a line
 * lexes the same without those above it. It returns `null`, and the caller
 * lexes the whole text, when a token that spans lines (a block comment, a
 * template string) crosses the edited lines' edges, or when the lines open a
 * comment or template of their own. A whitespace token that crosses an edge
 * is cut there, since the cut does not change what the lexer saw.
 * @param {CodeToken[]} tokens tokens of `prevText`, whose text joins back to it
 * @param {string} prevText
 * @param {string} nextText
 * @param {(code: string) => CodeToken[] | undefined} lex
 * @returns {CodeToken[] | null}
 */
export function spliceTokens(tokens, prevText, nextText, lex) {
  const shortest = Math.min(prevText.length, nextText.length);
  let head = 0;
  while (
    head < shortest &&
    prevText.charCodeAt(head) === nextText.charCodeAt(head)
  ) {
    head++;
  }
  if (head === prevText.length && head === nextText.length) return tokens;
  let tail = 0;
  while (
    tail < shortest - head &&
    prevText.charCodeAt(prevText.length - 1 - tail) ===
      nextText.charCodeAt(nextText.length - 1 - tail)
  ) {
    tail++;
  }

  // The edit grown to whole lines of the new text, and the same lines in the
  // old text.
  const regionStart = head === 0 ? 0 : nextText.lastIndexOf("\n", head - 1) + 1;
  const lineEnd = nextText.indexOf("\n", nextText.length - tail);
  const regionEnd = lineEnd === -1 ? nextText.length : lineEnd;
  const oldRegionEnd = regionEnd - (nextText.length - prevText.length);

  const region = nextText.slice(regionStart, regionEnd);
  if (
    (region.split("`").length & 1) === 0 ||
    region.lastIndexOf("/*") > region.lastIndexOf("*/")
  ) {
    return null;
  }

  /** @type {CodeToken[]} */
  const before = [];
  let position = 0;
  let index = 0;
  while (index < tokens.length) {
    const end = position + tokens[index].text.length;
    if (end > regionStart) break;
    before.push(tokens[index]);
    position = end;
    index++;
  }
  if (index < tokens.length && position < regionStart) {
    const token = tokens[index];
    if (token.type !== null || !BLANK.test(token.text)) return null;
    before.push({
      type: null,
      text: token.text.slice(0, regionStart - position),
    });
  }

  while (index < tokens.length) {
    const end = position + tokens[index].text.length;
    if (end > oldRegionEnd) break;
    position = end;
    index++;
  }
  /** @type {CodeToken[]} */
  const after = [];
  if (index < tokens.length && position < oldRegionEnd) {
    const token = tokens[index];
    if (token.type !== null || !BLANK.test(token.text)) return null;
    after.push({ type: null, text: token.text.slice(oldRegionEnd - position) });
    index++;
  }

  const lexed = lex(region);
  if (!lexed) return null;
  return before.concat(lexed, after, tokens.slice(index));
}
