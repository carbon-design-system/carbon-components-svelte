// @ts-check
// Finds the mention being typed at the caret. Pure and DOM-free, so every
// rule is unit-tested in node and costs one short backward scan per trigger.

/**
 * A trigger as the engine reads it.
 * @typedef {Object} MentionRule
 * @property {string} char One character that starts a mention.
 * @property {"word-start" | "line-start"} [position="word-start"]
 * @property {boolean} [allowSpaces=false] Let the query run across spaces.
 * @property {number} [minQueryLength=0]
 * @property {number} [maxQueryLength=32]
 */

/**
 * The mention at the caret.
 * @typedef {Object} MentionMatch
 * @property {number} index Index of the matching rule in the list passed in.
 * @property {string} char
 * @property {string} query Text between the trigger and the caret.
 * @property {number} start Index of the trigger character.
 * @property {number} end The caret.
 */

/**
 * A trigger may follow a space, an opening bracket or quote, or text in a
 * script written without spaces (Han, kana and fullwidth forms), where no
 * space separates a mention from the word before it. Anything else, a
 * letter, a digit or `.`, `+`, `-`, `_`, means the character is part of a
 * word: `a@b.com` is an address, not a mention.
 */
const BOUNDARY =
  /[\s([{<"'\u00ab\u2018\u201c\u3000-\u303f\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

/** Punctuation that ends a query, as a space does. */
const TERMINATOR = /[,;:!?()[\]{}<>"\u201c\u201d]/;

const NEWLINE = /[\r\n\u2028\u2029]/;
const EDGE_SPACE = /^\s|\s$/;
const SPACE = /\s/;

/**
 * Whether a trigger character can start a mention at `index`.
 * @param {string} value
 * @param {number} index
 * @param {"word-start" | "line-start"} position
 */
function startsMention(value, index, position) {
  if (index === 0) return true;
  const previous = value[index - 1];
  if (position === "line-start") return NEWLINE.test(previous);
  return BOUNDARY.test(previous);
}

/**
 * Find the mention at `caret`: the nearest trigger character before it that
 * starts a word (or a line), with a query that holds no whitespace or
 * terminating punctuation. When several rules match, the one whose trigger
 * is closest to the caret wins. Looks back at most `maxQueryLength`
 * characters, so the cost does not grow with the text.
 *
 * @param {string} value
 * @param {number} caret
 * @param {ReadonlyArray<MentionRule>} rules
 * @returns {MentionMatch | null}
 */
export function detectMention(value, caret, rules) {
  if (caret < 1 || caret > value.length) return null;

  /** @type {MentionMatch | null} */
  let best = null;

  for (let r = 0; r < rules.length; r++) {
    const rule = rules[r];
    const maxQueryLength = rule.maxQueryLength ?? 32;
    const minQueryLength = rule.minQueryLength ?? 0;
    const allowSpaces = rule.allowSpaces === true;
    const floor = Math.max(0, caret - maxQueryLength - 1);

    for (let i = caret - 1; i >= floor; i--) {
      const ch = value[i];
      if (ch === rule.char) {
        if (best && best.start >= i) break;
        const query = value.slice(i + 1, caret);
        if (
          query.length >= minQueryLength &&
          startsMention(value, i, rule.position ?? "word-start") &&
          // Spaces at the edges are not a name: "@ " opens nothing.
          !(allowSpaces && EDGE_SPACE.test(query))
        ) {
          best = { index: r, char: rule.char, query, start: i, end: caret };
        }
        break;
      }
      if (TERMINATOR.test(ch) || NEWLINE.test(ch)) break;
      if (!allowSpaces && SPACE.test(ch)) break;
    }
  }

  return best;
}
