// @ts-check
// The text edits behind `MarkdownEditor`'s toolbar, shortcuts, Enter and Tab.
// Every function is pure: it reads the text and the selection and returns the
// one replacement to make, never touches a DOM, and gives the same answer on
// the server and in the browser. The component applies the replacement
// through the browser's editing pipeline so the textarea's undo keeps it.

/**
 * One replacement: swap `text.slice(from, to)` for `insert`, then select
 * `start` to `end` in the new text.
 * @typedef {{ from: number, to: number, insert: string, start: number, end: number }} MarkdownEdit
 */

/** The toolbar actions the editor knows. */
export const MARKDOWN_ACTIONS = Object.freeze([
  "heading",
  "bold",
  "italic",
  "strikethrough",
  "quote",
  "code",
  "link",
  "ul",
  "ol",
  "task",
]);

/** The word to select in a new link, where the address goes. */
const URL_PLACEHOLDER = "url";

const WORD_CHAR = /[\p{L}\p{N}_]/u;
const WHITESPACE = /\s/;
const URL_LIKE = /^(?:https?:\/\/|mailto:|www\.)\S+$/i;
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})/;
// indent, then a bullet or number, then the gap, then an optional task box.
const LIST_LINE = /^( *)(?:([-*+])|(\d{1,9})([.)]))( +)(\[[ xX]\]( +|$))?/;
const LIST_EMPTY = /^( *)(?:([-*+])|(\d{1,9})([.)]))$/;
const QUOTE_LINE = /^( {0,3})((?:>[ \t]?)+)/;
const WRAPPED_LINK = /^\[([^\]\n]*)\]\(([^)\n]*)\)$/;
const TRAILING_SPACES = / +$/;
const LEADING_SPACES = /^ */;
const HEADING_LINE = /^( {0,3})(#{1,6})(?: +|$)/;

/**
 * @param {string} text
 * @param {number} pos
 * @returns {number} the offset where the line holding `pos` starts
 */
export function lineStart(text, pos) {
  return text.lastIndexOf("\n", pos - 1) + 1;
}

/**
 * @param {string} text
 * @param {number} pos
 * @returns {number} the offset where the line holding `pos` ends, before its newline
 */
export function lineEnd(text, pos) {
  const index = text.indexOf("\n", pos);
  return index === -1 ? text.length : index;
}

/**
 * Whether `pos` is inside a fenced code block, where Enter, Tab and the line
 * toolbar actions must leave lines alone.
 * @param {string} text
 * @param {number} pos
 * @returns {boolean}
 */
export function isInsideFence(text, pos) {
  const limit = lineStart(text, pos);
  /** @type {string | null} */
  let open = null;
  let at = 0;
  while (at < limit) {
    let end = text.indexOf("\n", at);
    if (end === -1 || end > limit) end = limit;
    const match = FENCE_LINE.exec(text.slice(at, end));
    if (match) {
      const fence = match[1];
      if (open === null) open = fence;
      else if (fence[0] === open[0] && fence.length >= open.length) open = null;
    }
    at = end + 1;
  }
  return open !== null;
}

/**
 * Select the word around `pos`, or return `null` between words.
 * @param {string} text
 * @param {number} pos
 * @returns {{ start: number, end: number } | null}
 */
function wordAt(text, pos) {
  let start = pos;
  let end = pos;
  while (start > 0 && WORD_CHAR.test(text[start - 1])) start--;
  while (end < text.length && WORD_CHAR.test(text[end])) end++;
  return start === end ? null : { start, end };
}

/**
 * @param {string} text
 * @param {number} from
 * @param {number} direction
 * @param {string} char
 * @returns {number} how many `char` repeat from `from` going `direction`
 */
function runLength(text, from, direction, char) {
  let count = 0;
  let at = direction > 0 ? from : from - 1;
  while (at >= 0 && at < text.length && text[at] === char) {
    count++;
    at += direction;
  }
  return count;
}

/**
 * Wrap the selection in `marker`, or take the marker off when it is already
 * there, around the selection or inside it. A caret in a word wraps the word.
 * Spaces at the selection's ends stay outside the markers, since a marker
 * next to a space does not format.
 *
 * `bold` (`**`) and `italic` (`*`) share a character: `***x***` is both, and
 * toggling one leaves the other.
 *
 * @param {string} text
 * @param {number} selStart
 * @param {number} selEnd
 * @param {string} marker
 * @returns {MarkdownEdit}
 */
export function toggleInline(text, selStart, selEnd, marker) {
  let start = selStart;
  let end = selEnd;
  const length = marker.length;
  const char = marker[0];
  const multiline = marker.length === 1 && char === "*";

  if (start === end) {
    const word = wordAt(text, start);
    if (word) {
      start = word.start;
      end = word.end;
    } else {
      const pair = marker + marker;
      return {
        from: start,
        to: end,
        insert: pair,
        start: start + length,
        end: start + length,
      };
    }
  }

  // Spaces and line breaks at the ends stay outside the markers.
  while (start < end && WHITESPACE.test(text[start])) start++;
  while (end > start && WHITESPACE.test(text[end - 1])) end--;
  if (start === end) {
    return {
      from: start,
      to: end,
      insert: marker + marker,
      start: start + length,
      end: start + length,
    };
  }

  // `*` and `**` count runs, so italic is not read out of bold.
  /**
   * @param {number} run
   * @returns {boolean}
   */
  const marks = (run) => {
    if (char !== "*") return run >= length;
    return length === 2 ? run >= 2 : run % 2 === 1;
  };

  // The markers sit just outside the selection.
  const before = runLength(text, start, -1, char);
  const after = runLength(text, end, 1, char);
  if (marks(Math.min(before, after))) {
    return {
      from: start - length,
      to: end + length,
      insert: text.slice(start, end),
      start: start - length,
      end: end - length,
    };
  }

  // The markers are in the selection.
  const lead = runLength(text, start, 1, char);
  const trail = runLength(text, end, -1, char);
  const inner = text.slice(start, end);
  if (
    inner.length > 2 * length &&
    lead + trail < inner.length &&
    marks(Math.min(lead, trail))
  ) {
    const unwrapped = inner.slice(length, inner.length - length);
    return {
      from: start,
      to: end,
      insert: unwrapped,
      start,
      end: start + unwrapped.length,
    };
  }

  // A line break inside breaks `**`/`*`/`~~` across paragraphs; wrap each
  // line so the formatting still renders.
  if (inner.includes("\n") && !multiline) {
    const wrapped = inner
      .split("\n")
      .map((line) => (line.trim() ? wrapLine(line, marker) : line))
      .join("\n");
    return {
      from: start,
      to: end,
      insert: wrapped,
      start,
      end: start + wrapped.length,
    };
  }

  return {
    from: start,
    to: end,
    insert: marker + inner + marker,
    start: start + length,
    end: end + length,
  };
}

/**
 * @param {string} line
 * @param {string} marker
 */
function wrapLine(line, marker) {
  const lead = line.length - line.trimStart().length;
  const body = line.trim();
  return line.slice(0, lead) + marker + body + marker;
}

/**
 * Turn the selection into inline code, or a fenced block when it spans
 * lines. Wrapping again takes the code back off. A backtick in the text gets
 * a longer fence.
 * @param {string} text
 * @param {number} selStart
 * @param {number} selEnd
 * @returns {MarkdownEdit}
 */
export function toggleCode(text, selStart, selEnd) {
  let start = selStart;
  let end = selEnd;
  const from = start;
  const to = end;
  if (start === end) {
    const word = wordAt(text, start);
    if (!word) {
      return { from, to, insert: "``", start: start + 1, end: start + 1 };
    }
    start = word.start;
    end = word.end;
  }

  const selected = text.slice(start, end);
  if (selected.includes("\n")) return toggleFence(text, start, end);

  // Already inline code, around or inside the selection.
  const before = runLength(text, start, -1, "`");
  const after = runLength(text, end, 1, "`");
  if (before > 0 && before === after) {
    return {
      from: start - before,
      to: end + after,
      insert: padless(selected),
      start: start - before,
      end: start - before + padless(selected).length,
    };
  }
  const lead = runLength(text, start, 1, "`");
  const trail = runLength(text, end, -1, "`");
  if (
    lead > 0 &&
    lead === trail &&
    selected.length > 2 * lead &&
    lead + trail < selected.length
  ) {
    const body = padless(selected.slice(lead, selected.length - trail));
    return {
      from: start,
      to: end,
      insert: body,
      start,
      end: start + body.length,
    };
  }

  // A fence one longer than any backtick run inside.
  let longest = 0;
  for (const run of selected.match(/`+/g) ?? []) {
    longest = Math.max(longest, run.length);
  }
  const fence = "`".repeat(longest + 1);
  const pad =
    longest > 0 && (selected.startsWith("`") || selected.endsWith("`"));
  const inner = pad ? ` ${selected} ` : selected;
  return {
    from: start,
    to: end,
    insert: fence + inner + fence,
    start: start + fence.length,
    end: start + fence.length + inner.length,
  };
}

/**
 * Inline code pads text that starts or ends with a backtick with one space.
 * @param {string} body
 */
function padless(body) {
  return body.length > 2 && body.startsWith(" ") && body.endsWith(" ")
    ? body.slice(1, -1)
    : body;
}

/**
 * Put the selected lines in a fenced block, or take the fence off when the
 * lines are already inside one.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {MarkdownEdit}
 */
function toggleFence(text, start, end) {
  const first = lineStart(text, start);
  const last = lineEnd(text, end);
  const above = first > 0 ? lineStart(text, first - 1) : -1;
  const below = last < text.length ? lineEnd(text, last + 1) : -1;
  if (
    above >= 0 &&
    below >= 0 &&
    FENCE_LINE.test(text.slice(above, first - 1)) &&
    FENCE_LINE.test(text.slice(last + 1, below))
  ) {
    const body = text.slice(first, last);
    return {
      from: above,
      to: below,
      insert: body,
      start: above,
      end: above + body.length,
    };
  }
  const body = text.slice(first, last);
  const longest = Math.max(
    0,
    ...(body.match(/^ *`{3,}/gm) ?? []).map((m) => m.trim().length),
  );
  const fence = "`".repeat(Math.max(3, longest + 1));
  const insert = `${fence}\n${body}\n${fence}`;
  return {
    from: first,
    to: last,
    insert,
    start: first + fence.length + 1,
    end: first + fence.length + 1 + body.length,
  };
}

/**
 * Escape the brackets in link text so they cannot close the link early. The
 * text is Markdown source, so a backslash already escapes the character after
 * it, and that pair is left as it is: `\]` stays one escaped bracket, and
 * `\\` stays one escaped backslash.
 * @param {string} text
 * @returns {string}
 */
function escapeBrackets(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\\" && i + 1 < text.length) {
      out += char + text[i + 1];
      i++;
    } else if (char === "[" || char === "]") {
      out += `\\${char}`;
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * Turn the selection into a link and select the address to type over. A
 * selected address becomes the link's target with the caret in its text. A
 * selected link turns back into its text.
 * @param {string} text
 * @param {number} selStart
 * @param {number} selEnd
 * @returns {MarkdownEdit}
 */
export function insertLink(text, selStart, selEnd) {
  let start = selStart;
  let end = selEnd;
  if (start === end) {
    const word = wordAt(text, start);
    if (word) {
      start = word.start;
      end = word.end;
    }
  }
  const selected = text.slice(start, end);

  const link = WRAPPED_LINK.exec(selected);
  if (link) {
    return {
      from: start,
      to: end,
      insert: link[1],
      start,
      end: start + link[1].length,
    };
  }

  if (URL_LIKE.test(selected.trim())) {
    const url = selected.trim();
    return {
      from: start,
      to: end,
      insert: `[](${url})`,
      start: start + 1,
      end: start + 1,
    };
  }

  const label = escapeBrackets(selected);
  const insert = `[${label}](${URL_PLACEHOLDER})`;
  if (!selected) {
    // Nothing to link: leave the caret where the text goes.
    return { from: start, to: end, insert, start: start + 1, end: start + 1 };
  }
  const urlStart = start + label.length + 3;
  return {
    from: start,
    to: end,
    insert,
    start: urlStart,
    end: urlStart + URL_PLACEHOLDER.length,
  };
}

/**
 * @typedef {{
 *   indent: number,
 *   kind: "ul" | "ol" | "task",
 *   number: number,
 *   marker: string,
 *   gap: number,
 *   box: string,
 *   prefix: number,
 *   column: number,
 * }} ListPrefix
 */

/**
 * Read the list marker that opens a line.
 * @param {string} line
 * @returns {ListPrefix | null}
 */
export function listPrefix(line) {
  const match = LIST_LINE.exec(line);
  if (!match) return null;
  const [all, indent, bullet, number, delimiter, gap, box] = match;
  const ordered = number !== undefined;
  const markerLength = ordered ? number.length + 1 : 1;
  return {
    column: indent.length + markerLength + gap.length,
    indent: indent.length,
    kind: box ? "task" : ordered ? "ol" : "ul",
    number: ordered ? Number.parseInt(number, 10) : 0,
    marker: ordered ? delimiter : bullet,
    gap: gap.length,
    box: box ? box.replace(TRAILING_SPACES, "") : "",
    prefix: all.length,
  };
}

/**
 * The list lines above a line, nearest first, as far as the list reaches: a
 * blank line or an indented line carries on, any other line ends it.
 * @param {string} text
 * @param {number} first where the line starts
 * @returns {Generator<ListPrefix>}
 */
function* listLinesAbove(text, first) {
  let at = first;
  while (at > 0) {
    const previous = lineStart(text, at - 1);
    const line = text.slice(previous, at - 1);
    const list = listPrefix(line);
    if (list) yield list;
    else if (line.trim() !== "" && !line.startsWith(" ")) return;
    at = previous;
  }
}

/**
 * Map a position through a change of line prefix.
 * @param {number} pos
 * @param {number} first where the line starts
 * @param {number} oldPrefix
 * @param {number} newPrefix
 */
function throughPrefix(pos, first, oldPrefix, newPrefix) {
  return first + newPrefix + Math.max(0, pos - first - oldPrefix);
}

/**
 * Add a prefix to every selected line, or take it off when every one has it.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {"quote" | "ul" | "ol" | "task"} kind
 * @returns {MarkdownEdit}
 */
export function toggleLines(text, start, end, kind) {
  const first = lineStart(text, start);
  // A selection that ends right after a line break leaves that line out.
  const stop = end > start && text[end - 1] === "\n" ? end - 1 : end;
  const last = lineEnd(text, stop);
  const lines = text.slice(first, last).split("\n");
  const content = lines.filter((line) => line.trim() !== "");
  const targets = content.length ? content : lines;

  /** @param {string} line */
  const has = (line) => {
    if (kind === "quote") return QUOTE_LINE.test(line);
    const list = listPrefix(line);
    if (!list) return false;
    return list.kind === kind;
  };
  const remove = targets.every(has);

  let number = 1;
  /** @type {string[]} */
  const next = lines.map((line) => {
    if (line.trim() === "" && content.length) return line;
    if (kind === "quote") {
      if (remove) return line.replace(QUOTE_LINE, (_, indent) => indent);
      return has(line) ? line : `> ${line}`;
    }
    const list = listPrefix(line);
    const indent = list
      ? " ".repeat(list.indent)
      : (LEADING_SPACES.exec(line)?.[0] ?? "");
    const body = list ? line.slice(list.prefix) : line.slice(indent.length);
    // A list item swaps its marker; the text after it stays.
    if (remove) return indent + body;
    if (kind === "ol") return `${indent}${number++}. ${body}`;
    if (kind === "task") return `${indent}- [ ] ${body}`;
    return `${indent}- ${body}`;
  });

  const insert = next.join("\n");
  if (start === end) {
    const oldPrefix = prefixLength(lines[0], kind);
    const newPrefix = prefixLength(next[0], kind);
    const caret = Math.min(
      first + next[0].length,
      throughPrefix(start, first, oldPrefix, newPrefix),
    );
    return { from: first, to: last, insert, start: caret, end: caret };
  }
  return {
    from: first,
    to: last,
    insert,
    start: first,
    end: first + insert.length,
  };
}

/**
 * @param {string} line
 * @param {"quote" | "ul" | "ol" | "task"} kind
 * @returns {number} how many characters of the line are its prefix
 */
function prefixLength(line, kind) {
  if (kind === "quote") return QUOTE_LINE.exec(line)?.[0].length ?? 0;
  return listPrefix(line)?.prefix ?? LEADING_SPACES.exec(line)?.[0].length ?? 0;
}

/**
 * Make the line a heading of `level`, or plain when it is one already. A
 * heading of another level changes level.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {number} [level]
 * @returns {MarkdownEdit}
 */
export function toggleHeading(text, start, end, level = 3) {
  const first = lineStart(text, start);
  const last = lineEnd(text, first);
  const line = text.slice(first, last);
  const heading = HEADING_LINE.exec(line);
  const hashes = "#".repeat(Math.min(6, Math.max(1, level)));
  const body = heading ? line.slice(heading[0].length) : line;
  const same = heading && heading[2].length === hashes.length;
  const prefix = same ? "" : `${hashes} `;
  const insert = prefix + body;
  const oldPrefix = heading ? heading[0].length : 0;
  const map = (/** @type {number} */ pos) =>
    Math.min(
      first + insert.length,
      throughPrefix(pos, first, oldPrefix, prefix.length),
    );
  return { from: first, to: last, insert, start: map(start), end: map(end) };
}

/**
 * The edit for a toolbar action or shortcut.
 * @param {typeof MARKDOWN_ACTIONS[number]} action
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {{ headingLevel?: number }} [options]
 * @returns {MarkdownEdit | null} `null` for an action it does not know, or one that has nothing to do inside a code block
 */
export function markdownEdit(action, text, start, end, options = {}) {
  const lineAction =
    action === "quote" ||
    action === "ul" ||
    action === "ol" ||
    action === "task" ||
    action === "heading";
  if (lineAction && isInsideFence(text, start)) return null;
  switch (action) {
    case "bold":
      return toggleInline(text, start, end, "**");
    case "italic":
      return toggleInline(text, start, end, "*");
    case "strikethrough":
      return toggleInline(text, start, end, "~~");
    case "code":
      return toggleCode(text, start, end);
    case "link":
      return insertLink(text, start, end);
    case "heading":
      return toggleHeading(text, start, end, options.headingLevel);
    case "quote":
    case "ul":
    case "ol":
    case "task":
      return toggleLines(text, start, end, action);
    default:
      return null;
  }
}

/**
 * The edit for Enter at a list item or quote line: start the next item with
 * the same marker (counting up in a numbered list, an empty box in a task
 * list), or end the list when the item is empty (a nested item moves out one
 * level first). Returns `null` for anything else, so Enter breaks the line
 * as usual.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {MarkdownEdit | null}
 */
export function continueList(text, start, end) {
  if (start !== end) return null;
  if (isInsideFence(text, start)) return null;
  const first = lineStart(text, start);
  const last = lineEnd(text, start);
  const line = text.slice(first, last);

  const quote = QUOTE_LINE.exec(line);
  const quoted = quote ? quote[0] : "";
  const rest = line.slice(quoted.length);
  const list = listPrefix(rest);
  const bare = !list && LIST_EMPTY.exec(rest);

  if (!list && !bare) {
    if (!quote) return null;
    // A quote line: carry the `>` on, or end the quote when it is empty.
    if (start - first < quoted.length) return null;
    if (rest.trim() === "" && start === last) {
      return { from: first, to: last, insert: "", start: first, end: first };
    }
    const insert = `\n${quoted}`;
    return {
      from: start,
      to: end,
      insert,
      start: start + insert.length,
      end: start + insert.length,
    };
  }

  const info = list ?? listPrefix(`${rest} `);
  if (!info) return null;
  const prefixEnd = first + quoted.length + info.prefix;
  const bareEnd = first + quoted.length + rest.length;
  // The caret has to be in the item's text, not in its marker.
  if (start < (list ? prefixEnd : bareEnd)) return null;

  const itemText = list ? rest.slice(info.prefix) : "";
  const empty = itemText.trim() === "";

  if (empty && start === last) {
    if (info.indent > 0) {
      // Move a nested item out one level instead of ending the list.
      const out = outdentTarget(text, first, info.indent);
      const trimmed = line.slice(Math.min(info.indent - out, info.indent));
      return {
        from: first,
        to: last,
        insert: trimmed,
        start: first + trimmed.length,
        end: first + trimmed.length,
      };
    }
    return {
      from: first,
      to: last,
      insert: quoted,
      start: first + quoted.length,
      end: first + quoted.length,
    };
  }

  const marker =
    info.kind === "ol" ? `${info.number + 1}${info.marker}` : info.marker;
  const box = info.box ? "[ ] " : "";
  const next = `${" ".repeat(info.indent)}${marker}${" ".repeat(Math.max(1, info.gap))}${box}`;
  const insert = `\n${quoted}${next}`;
  return {
    from: start,
    to: end,
    insert,
    start: start + insert.length,
    end: start + insert.length,
  };
}

/**
 * The indent an item takes when it moves out one level: the indent of the
 * nearest list line above it that sits further out, else 0.
 * @param {string} text
 * @param {number} first where the item's line starts
 * @param {number} indent the item's indent
 * @returns {number}
 */
function outdentTarget(text, first, indent) {
  for (const list of listLinesAbove(text, first)) {
    if (list.indent < indent) return list.indent;
  }
  return 0;
}

/**
 * The edit for Tab (`outdent` false) or Shift+Tab at a list item: nest the
 * selected items under the item above, or move them out a level. Returns
 * `null` when the first selected line is not a list item, so Tab keeps its
 * job of moving focus; an item that cannot move any further yields an edit
 * that changes nothing, so Tab stays in the field there.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {boolean} [outdent]
 * @returns {MarkdownEdit | null}
 */
export function indentList(text, start, end, outdent = false) {
  if (isInsideFence(text, start)) return null;
  const first = lineStart(text, start);
  const stop = end > start && text[end - 1] === "\n" ? end - 1 : end;
  const last = lineEnd(text, stop);
  const lines = text.slice(first, last).split("\n");
  const head = listPrefix(lines[0]);
  if (!head) return null;

  let delta = 0;
  if (outdent) {
    delta = outdentTarget(text, first, head.indent) - head.indent;
  } else {
    // Nest under the nearest item above that is no deeper than this one: its
    // text column is where its children start.
    for (const list of listLinesAbove(text, first)) {
      if (list.indent > head.indent) continue;
      if (list.column > head.indent) delta = list.column - head.indent;
      break;
    }
  }

  if (delta === 0) {
    return { from: start, to: end, insert: text.slice(start, end), start, end };
  }

  // Each non-blank line moves by `delta` (an outdent moves a line no further
  // than its own indent), so a position moves by the sum over the lines
  // before it and its own.
  /** @type {number[]} */
  const moves = lines.map((line) => {
    if (line.trim() === "") return 0;
    if (delta > 0) return delta;
    return -Math.min(-delta, line.length - line.trimStart().length);
  });
  const insert = lines
    .map((line, index) =>
      moves[index] > 0
        ? " ".repeat(moves[index]) + line
        : line.slice(-moves[index]),
    )
    .join("\n");
  /** @param {number} pos @param {boolean} atEdge */
  const map = (pos, atEdge) => {
    const index = text.slice(first, pos).split("\n").length - 1;
    let shift = 0;
    for (let i = 0; i < index; i++) shift += moves[i];
    // A selection that starts at a line's start keeps that line whole.
    if (atEdge && pos === lineStart(text, pos)) return pos + shift;
    return Math.max(lineStart(text, pos) + shift, pos + shift + moves[index]);
  };
  return {
    from: first,
    to: last,
    insert,
    start: map(start, true),
    end: map(end, false),
  };
}
