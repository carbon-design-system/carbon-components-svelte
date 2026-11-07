// @ts-check
// Cuts a query into the runs the field draws behind its text. The runs hold
// the text exactly: joined, they are the input's value, so the layer lines
// up with the glyphs of the input.

import { tokenize } from "./token-query.js";

/**
 * @typedef {import("./token-query.js").TokenError} TokenError
 */

/**
 * A piece of a qualifier.
 * @typedef {Object} QualifierPart
 * @property {"sign" | "key" | "value" | "separator"} kind `sign` is the `-`, `key` includes the colon, `separator` is a comma.
 * @property {string} text
 * @property {boolean} error An error covers this piece.
 */

/**
 * @typedef {Object} TextRun
 * @property {"text"} type Space and words that are not highlighted.
 * @property {string} text
 */

/**
 * @typedef {Object} PhraseRun
 * @property {"phrase"} type A quoted phrase, quotes included.
 * @property {string} text
 * @property {boolean} negated
 * @property {boolean} error
 */

/**
 * @typedef {Object} QualifierRun
 * @property {"qualifier"} type
 * @property {boolean} negated
 * @property {boolean} error
 * @property {QualifierPart[]} parts
 * @property {number} start
 * @property {number} end
 */

/** @typedef {TextRun | PhraseRun | QualifierRun} HighlightRun */

/**
 * @param {ReadonlyArray<TokenError>} errors
 * @param {number} start
 * @param {number} end
 */
function covers(errors, start, end) {
  return errors.some(
    (error) =>
      error.start < end && (error.end > start || error.start === error.end),
  );
}

/**
 * @param {string} text
 * @param {ReadonlyArray<TokenError>} [errors]
 * @returns {HighlightRun[]}
 */
export function highlightRuns(text, errors = []) {
  /** @type {HighlightRun[]} */
  const runs = [];
  let at = 0;

  /** @param {number} to */
  function plain(to) {
    if (to <= at) return;
    const last = runs[runs.length - 1];
    if (last?.type === "text") last.text += text.slice(at, to);
    else runs.push({ type: "text", text: text.slice(at, to) });
    at = to;
  }

  for (const token of tokenize(text)) {
    plain(token.start);
    if (token.type === "text") {
      if (token.phrase) {
        runs.push({
          type: "phrase",
          text: text.slice(token.start, token.end),
          negated: token.negated,
          error: covers(errors, token.start, token.end),
        });
        at = token.end;
      }
      // A word stays plain text.
      continue;
    }

    /** @type {QualifierPart[]} */
    const parts = [];
    let cursor = token.start;
    if (token.negated) {
      parts.push({ kind: "sign", text: "-", error: false });
      cursor = token.bodyStart;
    }
    const keyEnd = (token.keyEnd ?? token.end) + 1;
    parts.push({
      kind: "key",
      text: text.slice(cursor, keyEnd),
      error: covers(errors, cursor, keyEnd - 1),
    });
    cursor = keyEnd;
    for (const piece of token.pieces ?? []) {
      if (piece.start > cursor) {
        parts.push({
          kind: "separator",
          text: text.slice(cursor, piece.start),
          error: false,
        });
      }
      if (piece.end > piece.start) {
        parts.push({
          kind: "value",
          text: text.slice(piece.start, piece.end),
          error: covers(errors, piece.start, piece.end),
        });
      }
      cursor = piece.end;
    }
    if (cursor < token.end) {
      parts.push({
        kind: "separator",
        text: text.slice(cursor, token.end),
        error: false,
      });
    }
    runs.push({
      type: "qualifier",
      negated: token.negated,
      error: parts.some((part) => part.error),
      parts,
      start: token.start,
      end: token.end,
    });
    at = token.end;
  }
  plain(text.length);
  return runs;
}
