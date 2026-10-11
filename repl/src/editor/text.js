// Pure text helpers and edit operations for the code editor. Each operation
// takes the current value and selection and returns an Edit: replace
// value[from, to) with `insert`, then select [selectionStart, selectionEnd).
// The component applies edits through the textarea so native undo keeps working.

/** @typedef {{ from: number; to: number; insert: string; selectionStart: number; selectionEnd: number }} Edit */

export const INDENT = "  ";

const LEADING_WHITESPACE = /^[ \t]*/;
const OPENERS = { "{": "}", "(": ")", "[": "]" };
const OPEN_TAG_END = /<[\w-][^<>]*[^/]>$/;
const CLOSE_TAG_START = /^<\//;
const LINE_COMMENT = /^([ \t]*)\/\/ ?/;

/** Offsets where each line starts. */
export function lineStarts(text) {
  const starts = [0];
  let i = text.indexOf("\n");
  while (i !== -1) {
    starts.push(i + 1);
    i = text.indexOf("\n", i + 1);
  }
  return starts;
}

/** Index of the line containing `offset` (binary search over `starts`). */
export function lineAt(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** [start, end) of the full lines touched by the selection. */
function lineBlock(value, selectionStart, selectionEnd) {
  const start = value.lastIndexOf("\n", selectionStart - 1) + 1;
  // A selection ending at column 0 doesn't include that line.
  const endAnchor =
    selectionEnd > selectionStart && value[selectionEnd - 1] === "\n"
      ? selectionEnd - 1
      : selectionEnd;
  let end = value.indexOf("\n", endAnchor);
  if (end === -1) end = value.length;
  return [start, end];
}

/** Tab: insert an indent, or indent every selected line. */
export function indent(value, selectionStart, selectionEnd) {
  const multiline = value.slice(selectionStart, selectionEnd).includes("\n");
  if (!multiline) {
    return {
      from: selectionStart,
      to: selectionEnd,
      insert: INDENT,
      selectionStart: selectionStart + INDENT.length,
      selectionEnd: selectionStart + INDENT.length,
    };
  }
  const [start, end] = lineBlock(value, selectionStart, selectionEnd);
  const lines = value.slice(start, end).split("\n");
  const insert = lines.map((l) => (l.length ? INDENT + l : l)).join("\n");
  return {
    from: start,
    to: end,
    insert,
    selectionStart: start,
    selectionEnd: start + insert.length,
  };
}

/** Shift+Tab: remove up to one indent from every selected line. */
export function outdent(value, selectionStart, selectionEnd) {
  const [start, end] = lineBlock(value, selectionStart, selectionEnd);
  const lines = value.slice(start, end).split("\n");
  let removedFirst = 0;
  const insert = lines
    .map((l, i) => {
      const n = Math.min(INDENT.length, l.match(LEADING_WHITESPACE)[0].length);
      if (i === 0) removedFirst = n;
      return l.slice(n);
    })
    .join("\n");
  const single = !value.slice(selectionStart, selectionEnd).includes("\n");
  return {
    from: start,
    to: end,
    insert,
    selectionStart: single
      ? Math.max(start, selectionStart - removedFirst)
      : start,
    selectionEnd: single
      ? Math.max(start, selectionEnd - removedFirst)
      : start + insert.length,
  };
}

/**
 * Enter: keep the line's indent, indent once more after an opener, and split
 * a bracket or tag pair onto three lines with the caret in the middle.
 */
export function newline(value, selectionStart, selectionEnd) {
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const before = value.slice(lineStart, selectionStart);
  const after = value.slice(selectionEnd);
  const base = before.match(LEADING_WHITESPACE)[0];
  const trimmed = before.trimEnd();
  const last = trimmed.at(-1);
  const opensBracket = last in OPENERS;
  const opensTag = OPEN_TAG_END.test(trimmed);
  const inner = opensBracket || opensTag ? base + INDENT : base;
  const closes =
    (opensBracket && after.trimStart().startsWith(OPENERS[last])) ||
    (opensTag && CLOSE_TAG_START.test(after.trimStart()));
  const insert = closes ? `\n${inner}\n${base}` : `\n${inner}`;
  const caret = selectionStart + 1 + inner.length;
  return {
    from: selectionStart,
    to: selectionEnd,
    insert,
    selectionStart: caret,
    selectionEnd: caret,
  };
}

/** Which comment syntax applies at `offset` ("js", "css" or "markup"). */
export function commentContext(value, offset, language) {
  if (language === "js" || language === "ts" || language === "json")
    return "js";
  if (language === "css") return "css";
  const before = value.slice(0, offset);
  if (before.lastIndexOf("<script") > before.lastIndexOf("</script"))
    return "js";
  if (before.lastIndexOf("<style") > before.lastIndexOf("</style"))
    return "css";
  return "markup";
}

const BLOCK_COMMENTS = { css: ["/* ", " */"], markup: ["<!-- ", " -->"] };

/** Cmd/Ctrl+/: toggle line comments (JS) or a block comment (CSS, markup). */
export function toggleComment(value, selectionStart, selectionEnd, language) {
  const [start, end] = lineBlock(value, selectionStart, selectionEnd);
  const block = value.slice(start, end);
  const context = commentContext(value, start, language);

  if (context === "js") {
    const lines = block.split("\n");
    const code = lines.filter((l) => l.trim());
    const commented =
      code.length > 0 && code.every((l) => l.trimStart().startsWith("//"));
    const minIndent = Math.min(
      ...code.map((l) => l.match(LEADING_WHITESPACE)[0].length),
    );
    const insert = lines
      .map((l) => {
        if (!l.trim()) return l;
        if (commented) return l.replace(LINE_COMMENT, "$1");
        return `${l.slice(0, minIndent)}// ${l.slice(minIndent)}`;
      })
      .join("\n");
    return selectAll(start, end, insert);
  }

  const [open, close] = BLOCK_COMMENTS[context];
  const indentText = block.match(LEADING_WHITESPACE)[0];
  const body = block.slice(indentText.length);
  const insert =
    body.startsWith(open.trim()) && body.endsWith(close.trim())
      ? indentText + body.slice(open.trim().length, -close.trim().length).trim()
      : indentText + open + body + close;
  return selectAll(start, end, insert);
}

function selectAll(from, to, insert) {
  return {
    from,
    to,
    insert,
    selectionStart: from,
    selectionEnd: from + insert.length,
  };
}
