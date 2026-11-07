// @ts-check
// The pure core of `InlineSuggest`: which text to offer after the caret,
// whether what the user typed still fits it, what a key does with it and
// how much of it one word is. No DOM.

const TRAILING_WORD = /\S*$/;
const LEADING_WORD = /^[^\p{L}\p{N}]*[\p{L}\p{N}_'’-]+/u;

/**
 * Lowercase, for comparing what was typed with what was offered. The
 * result may differ in length from its input (`İ`), so callers compare
 * two folded strings and never index one by the other's length.
 * @param {string} text
 * @param {boolean} ignoreCase
 */
function fold(text, ignoreCase) {
  return ignoreCase ? text.toLowerCase() : text;
}

/**
 * The part of the text before the caret that candidates complete.
 *
 * `scope` picks how far back it reaches: the whole value, the current
 * line, or the current word. `after` then narrows it to what follows the
 * last occurrence of a marker, so `ada@gm` offers domains for `gm`. No
 * fragment (`null`) when the marker is absent.
 *
 * @param {string} value
 * @param {number} caret
 * @param {{ scope?: "value" | "line" | "word"; after?: string }} [options]
 * @returns {string | null}
 */
export function fragmentBeforeCaret(value, caret, options = {}) {
  const { scope = "value", after = "" } = options;
  let text = value.slice(0, caret);
  if (scope === "line") {
    text = text.slice(text.lastIndexOf("\n") + 1);
  } else if (scope === "word") {
    const match = TRAILING_WORD.exec(text);
    text = match ? match[0] : "";
  }
  if (after) {
    const at = text.lastIndexOf(after);
    if (at === -1) return null;
    text = text.slice(at + after.length);
  }
  return text;
}

/**
 * The text that continues `fragment` into the first candidate it is a
 * prefix of. List order is priority, so put recent or likely values first.
 * A candidate equal to the fragment has nothing to add and is skipped. The
 * result is the candidate's own tail, so the user's casing is kept.
 *
 * @param {ReadonlyArray<string>} candidates
 * @param {string} fragment
 * @param {{ ignoreCase?: boolean; minLength?: number }} [options]
 * @returns {string}
 */
export function completeFromList(candidates, fragment, options = {}) {
  const { ignoreCase = true, minLength = 1 } = options;
  if (fragment.length < minLength) return "";
  const wanted = fold(fragment, ignoreCase);
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length <= fragment.length) {
      continue;
    }
    if (fold(candidate.slice(0, fragment.length), ignoreCase) === wanted) {
      return candidate.slice(fragment.length);
    }
  }
  return "";
}

/**
 * What the user inserted if `next` is `prev` with text added at the end,
 * else `null`. Ghost text only shows with the caret at the end, so typing
 * through it is always an append.
 *
 * @param {string} prev
 * @param {string} next
 * @returns {string | null}
 */
export function appendedText(prev, next) {
  if (next.length <= prev.length || !next.startsWith(prev)) return null;
  return next.slice(prev.length);
}

/**
 * What is left of `suggestion` after the user typed `inserted`, or `null`
 * when the typing left it. An empty string means it was typed in full.
 *
 * @param {string} suggestion
 * @param {string} inserted
 * @param {boolean} [ignoreCase=true]
 * @returns {string | null}
 */
export function typeThrough(suggestion, inserted, ignoreCase = true) {
  if (!inserted || inserted.length > suggestion.length) return null;
  const head = suggestion.slice(0, inserted.length);
  return fold(head, ignoreCase) === fold(inserted, ignoreCase)
    ? suggestion.slice(inserted.length)
    : null;
}

/** @type {Intl.Segmenter | null | undefined} */
let segmenter;

/**
 * The leading words-and-spaces of `suggestion` up to the end of its first
 * word: what Ctrl+Right accepts. Leading spaces and punctuation come with
 * the word, so ` the quick` yields ` the`. With no word in it, all of it.
 *
 * @param {string} suggestion
 * @returns {string}
 */
export function firstWord(suggestion) {
  if (segmenter === undefined) {
    segmenter =
      typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
        ? new Intl.Segmenter(undefined, { granularity: "word" })
        : null;
  }
  if (segmenter) {
    for (const part of segmenter.segment(suggestion)) {
      if (part.isWordLike) {
        return suggestion.slice(0, part.index + part.segment.length);
      }
    }
    return suggestion;
  }
  const match = LEADING_WORD.exec(suggestion);
  return match ? match[0] : suggestion;
}

/**
 * Cut `suggestion` so that accepting it keeps the value within the
 * field's `maxLength`, without splitting a surrogate pair.
 *
 * @param {string} suggestion
 * @param {number} valueLength
 * @param {number} maxLength The field's `maxLength`, `-1` or less for none.
 * @returns {string}
 */
export function fitMaxLength(suggestion, valueLength, maxLength) {
  if (!(maxLength >= 0)) return suggestion;
  const room = Math.max(0, maxLength - valueLength);
  if (suggestion.length <= room) return suggestion;
  let end = room;
  const code = suggestion.charCodeAt(end - 1);
  if (end > 0 && code >= 0xd800 && code <= 0xdbff) end -= 1;
  return suggestion.slice(0, end);
}

/**
 * Whether ghost text may show: the caret is a single point at the end of
 * the text, the field takes input, and no IME composition is open.
 *
 * @param {{ value: string; selectionStart: number | null; selectionEnd: number | null; disabled?: boolean; readOnly?: boolean }} field
 * @param {{ composing?: boolean }} [state]
 */
export function canSuggest(field, state = {}) {
  return (
    !state.composing &&
    !field.disabled &&
    !field.readOnly &&
    field.selectionStart === field.value.length &&
    field.selectionEnd === field.value.length
  );
}

/**
 * What a key does while a suggestion shows. `Tab` accepts when it carries
 * no modifier. The arrow that points along the line (right in a left to
 * right field) accepts all of it; with Ctrl or Alt, one word. Escape
 * dismisses. Anything else, and every key with Shift or Meta, is left to
 * the field. A field is never trapped: with no suggestion this is never
 * asked, and after one Tab accepts, the next Tab moves on.
 *
 * @param {{ key: string; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean; shiftKey?: boolean }} event
 * @param {{ rtl?: boolean; acceptKeys?: ReadonlyArray<"Tab" | "ArrowRight">; acceptWord?: boolean }} [options]
 * @returns {"accept" | "word" | "dismiss" | null}
 */
export function keyAction(event, options = {}) {
  const {
    rtl = false,
    acceptKeys = ["Tab", "ArrowRight"],
    acceptWord = true,
  } = options;
  if (event.metaKey || event.shiftKey) return null;
  const modified = !!(event.ctrlKey || event.altKey);
  if (event.key === "Escape") return modified ? null : "dismiss";
  if (event.key === "Tab") {
    return !modified && acceptKeys.includes("Tab") ? "accept" : null;
  }
  const along = rtl ? "ArrowLeft" : "ArrowRight";
  if (event.key !== along) return null;
  if (event.ctrlKey && event.altKey) return null;
  if (modified) return acceptWord ? "word" : null;
  return acceptKeys.includes("ArrowRight") ? "accept" : null;
}
