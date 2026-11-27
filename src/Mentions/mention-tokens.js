// @ts-check
// The data model: how an accepted mention is written into the text, how the
// structured `mentions` list is read back from it, and how that list follows
// edits. Pure and DOM-free.

/**
 * A mention in the current value.
 * @typedef {Object} Mention
 * @property {string} trigger The trigger character that started it.
 * @property {string | number} id
 * @property {string} text The item's text, without the trigger.
 * @property {number} start Index of the trigger in the value.
 * @property {number} end Index after the last character of the mention.
 */

/**
 * @typedef {Object} Splice
 * @property {number} start
 * @property {number} removed Characters removed at `start`.
 * @property {number} inserted Characters inserted at `start`.
 */

/**
 * How a mention is written: as the item's text after the trigger (`@Alice`,
 * tracked in `mentions`), as a token that carries the id (`@[Alice](u1)`),
 * or as plain replacement text with no record (an emoji, a command).
 * @typedef {"text" | "token" | "plain"} MentionFormat
 */

/**
 * `@[Alice Smith](u_42)`. `]` and `\` in the text, and `)` and `\` in the
 * id, are backslash-escaped, so any name survives a round trip.
 *
 * @param {string} char
 * @param {string} text
 * @param {string | number} id
 * @returns {string}
 */
export function formatMentionToken(char, text, id) {
  const label = text.replace(/[\\\]]/g, "\\$&");
  const key = String(id).replace(/[\\)\r\n]/g, (c) =>
    c === "\r" || c === "\n" ? " " : `\\${c}`,
  );
  return `${char}[${label}](${key})`;
}

const ESCAPED = /\\(.)/g;
const LEADING_SPACE = /^\s/;

/** @param {string} source */
const unescapeToken = (source) => source.replace(ESCAPED, "$1");

/** @param {string} char */
const escapeForClass = (char) => char.replace(/[\\\]^-]/g, "\\$&");

/**
 * Read the tokens out of `value`, in order. Only the listed trigger
 * characters count, so a Markdown image (`![alt](url)`) is not a mention.
 * Ids come back as strings.
 *
 * @param {string} value
 * @param {ReadonlyArray<string>} chars
 * @returns {Mention[]}
 */
export function parseMentionTokens(value, chars) {
  if (!chars.length || value.length < 4) return [];
  const pattern = new RegExp(
    `([${chars.map(escapeForClass).join("")}])\\[((?:[^\\]\\\\]|\\\\.)*)\\]\\(((?:[^)\\\\\\r\\n]|\\\\.)*)\\)`,
    "g",
  );
  /** @type {Mention[]} */
  const found = [];
  for (const m of value.matchAll(pattern)) {
    found.push({
      trigger: m[1],
      text: unescapeToken(m[2]),
      id: unescapeToken(m[3]),
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
    });
  }
  return found;
}

/**
 * The text a reader sees: each token becomes its trigger and text
 * (`@[Alice](u1)` to `@Alice`). Use it to render or search a stored value.
 *
 * @param {string} value
 * @param {ReadonlyArray<string>} chars
 * @returns {string}
 */
export function mentionsToPlainText(value, chars) {
  let out = "";
  let at = 0;
  for (const m of parseMentionTokens(value, chars)) {
    out += value.slice(at, m.start) + m.trigger + m.text;
    at = m.end;
  }
  return out + value.slice(at);
}

/**
 * What changed between two values, as one splice. `caret` is the caret
 * after the edit. With it, a deletion among repeated characters ("aaa")
 * lands where the user made it, not at the first match.
 *
 * @param {string} previous
 * @param {string} next
 * @param {number} [caret]
 * @returns {Splice}
 */
export function spliceFromValues(previous, next, caret) {
  if (
    caret !== undefined &&
    caret >= 0 &&
    caret <= next.length &&
    previous.endsWith(next.slice(caret))
  ) {
    const kept = previous.length - (next.length - caret);
    let start = 0;
    const max = Math.min(kept, caret);
    while (start < max && previous[start] === next[start]) start++;
    return { start, removed: kept - start, inserted: caret - start };
  }

  const max = Math.min(previous.length, next.length);
  let start = 0;
  while (start < max && previous[start] === next[start]) start++;
  let tail = 0;
  while (
    tail < max - start &&
    previous[previous.length - 1 - tail] === next[next.length - 1 - tail]
  ) {
    tail++;
  }
  return {
    start,
    removed: previous.length - start - tail,
    inserted: next.length - start - tail,
  };
}

/**
 * Keep a mention list true to the text after an edit. A mention before the
 * edit stays, one after it moves, and one the edit touches is dropped:
 * once a character of `@Alice` changes, it no longer names the user.
 * Typing right after a mention, or right before it, leaves it intact.
 *
 * @param {ReadonlyArray<Mention>} mentions
 * @param {Splice} splice
 * @returns {Mention[]}
 */
export function reconcileMentions(mentions, splice) {
  const delta = splice.inserted - splice.removed;
  const editEnd = splice.start + splice.removed;
  /** @type {Mention[]} */
  const kept = [];
  for (const mention of mentions) {
    if (mention.end <= splice.start) {
      kept.push(mention);
    } else if (mention.start >= editEnd) {
      kept.push(
        delta === 0
          ? mention
          : {
              ...mention,
              start: mention.start + delta,
              end: mention.end + delta,
            },
      );
    }
  }
  return kept;
}

/**
 * @typedef {Object} Insertion
 * @property {string} insert The text that replaces `[start, end)`.
 * @property {Mention | null} mention The record to keep, or `null` for `"plain"`.
 * @property {number} caret Where the caret goes, in the new value.
 */

/**
 * What accepting an item writes. `following` is the text after the caret:
 * a space is not added when one is already there.
 *
 * @param {Object} options
 * @param {string} options.char The trigger character.
 * @param {MentionFormat} options.format
 * @param {{ id: string | number, text: string, insertText?: string }} options.item
 * @param {number} options.start Index of the trigger.
 * @param {string} [options.suffix=" "] Written after the mention.
 * @param {string} [options.following=""]
 * @returns {Insertion}
 */
export function buildInsertion({
  char,
  format,
  item,
  start,
  suffix = " ",
  following = "",
}) {
  const label = item.insertText ?? item.text;
  const body =
    format === "plain"
      ? label
      : format === "token"
        ? formatMentionToken(char, item.text, item.id)
        : char + label;
  const tail = suffix && !LEADING_SPACE.test(following) ? suffix : "";
  return {
    insert: body + tail,
    mention:
      format === "plain"
        ? null
        : {
            trigger: char,
            id: item.id,
            text: item.text,
            start,
            end: start + body.length,
          },
    caret: start + body.length + tail.length,
  };
}
