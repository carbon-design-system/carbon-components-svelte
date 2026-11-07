// @ts-check

/**
 * Pure text math for `CodeEditor`: edits for Tab, Enter and bracket pairing,
 * a line index, and the window of lines to paint. Nothing here reads the DOM,
 * so each piece is tested against plain strings.
 */

/**
 * Replace `text[from, to)` with `insert`, then select `[start, end]` of the
 * new text.
 * @typedef {{ from: number, to: number, insert: string, start: number, end: number }} CodeEdit
 */

/**
 * @typedef {{ indent: "spaces" | "tabs", tabSize: number }} IndentOptions
 */

/**
 * One segment is a `[type, text]` pair; a line is a flat run of them
 * (`[type, text, type, text, ...]`), so a line costs one array.
 * @typedef {(string | null)[]} LineSegments
 */

/**
 * Offsets at which each line starts. A text always has one line, so the
 * result is never empty.
 * @param {string} text
 * @returns {number[]}
 */
export function lineStarts(text) {
  const starts = [0];
  let at = text.indexOf("\n");
  while (at !== -1) {
    starts.push(at + 1);
    at = text.indexOf("\n", at + 1);
  }
  return starts;
}

/**
 * The index of the line that holds `offset`. The offset of a line break
 * belongs to the line it ends.
 * @param {number[]} starts
 * @param {number} offset
 * @returns {number}
 */
export function lineAt(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    if (starts[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}

/**
 * @param {string} text
 * @param {number} offset
 * @returns {number} the offset where the line holding `offset` starts
 */
function lineStartOf(text, offset) {
  return offset === 0 ? 0 : text.lastIndexOf("\n", offset - 1) + 1;
}

/**
 * @param {string} text
 * @param {number} offset
 * @returns {number} the offset where the line holding `offset` ends
 */
function lineEndOf(text, offset) {
  const at = text.indexOf("\n", offset);
  return at === -1 ? text.length : at;
}

/**
 * @param {IndentOptions} options
 * @returns {string}
 */
export function indentUnit({ indent, tabSize }) {
  return indent === "tabs" ? "\t" : " ".repeat(tabSize);
}

/**
 * The widest line in columns: a tab runs to the next tab stop and a
 * character beyond U+2E7F counts as two (CJK, and surrogate pairs such as
 * emoji, which are double-width). A textarea that cannot scroll is sized from
 * this, so it errs wide.
 * @param {string} text
 * @param {number} tabSize
 * @returns {number}
 */
export function maxColumns(text, tabSize) {
  let widest = 0;
  let column = 0;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code === 10) {
      if (column > widest) widest = column;
      column = 0;
    } else if (code === 9) {
      column += tabSize - (column % tabSize);
    } else {
      column += code > 0x2e7f ? 2 : 1;
    }
  }
  return Math.max(column, widest);
}

/**
 * Tab and Shift+Tab. With a caret, Tab inserts up to the next tab stop and
 * Shift+Tab outdents the line. A selection inside one line is replaced by
 * the indent, as in VS Code. A selection across lines indents or outdents
 * every line it touches, leaving a last line the selection only reaches the
 * start of. Returns `null` when there is nothing to outdent.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {IndentOptions} options
 * @param {boolean} [outdent]
 * @returns {CodeEdit | null}
 */
export function indentEdit(text, start, end, options, outdent = false) {
  const unit = indentUnit(options);
  const { tabSize } = options;
  const firstStart = lineStartOf(text, start);
  const lineBreak = text.indexOf("\n", start);
  const multiline = lineBreak !== -1 && lineBreak < end;

  if (!outdent && !multiline) {
    const column = start - firstStart;
    const insert =
      options.indent === "tabs"
        ? "\t"
        : " ".repeat(tabSize - (column % tabSize));
    const caret = start + insert.length;
    return { from: start, to: end, insert, start: caret, end: caret };
  }

  const lastEnd = lineEndOf(
    text,
    end > start && text[end - 1] === "\n" ? end - 1 : end,
  );
  const lines = text.slice(firstStart, lastEnd).split("\n");
  /** Characters added (indent) or removed (outdent, negative) per line. */
  const deltas = lines.map((line) => {
    if (!outdent) return line.length ? unit.length : 0;
    if (line[0] === "\t") return -1;
    let spaces = 0;
    while (spaces < tabSize && line[spaces] === " ") spaces++;
    return -spaces;
  });
  if (deltas.every((delta) => delta === 0)) return null;

  const insert = lines
    .map((line, index) =>
      outdent ? line.slice(-deltas[index]) : deltas[index] ? unit + line : line,
    )
    .join("\n");

  /**
   * Where an old offset lands. A caret in a line's indent column stays put
   * when indenting, so a selection that starts at a line start keeps it.
   * @param {number} offset
   */
  function mapOffset(offset) {
    let lineStart = firstStart;
    let shift = 0;
    for (let index = 0; index < lines.length; index++) {
      const lineEnd = lineStart + lines[index].length;
      if (offset <= lineEnd) {
        const column = offset - lineStart;
        const delta = deltas[index];
        return (
          offset +
          shift +
          (delta < 0 ? -Math.min(-delta, column) : column ? delta : 0)
        );
      }
      shift += deltas[index];
      lineStart = lineEnd + 1;
    }
    return offset + shift;
  }

  return {
    from: firstStart,
    to: lastEnd,
    insert,
    start: mapOffset(start),
    end: mapOffset(end),
  };
}

/** @type {Record<string, string>} */
const CLOSERS = { "{": "}", "[": "]", "(": ")" };
/** @type {Record<string, string>} */
const PAIRS = { ...CLOSERS, '"': '"', "'": "'", "`": "`" };
const CLOSING = new Set(Object.values(PAIRS));
const WORD = /\w/;
const LEADING_BLANK = /^[ \t]*/;
const PAIR_BOUNDARY = /[\s)\]}>,;.:]/;

/**
 * Enter keeps the line's indent. After an opening bracket it adds a level,
 * and between a bracket and its closer it opens the block:
 * `{|}` becomes the bracket, an indented empty line holding the caret, and
 * the closer on its own line.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {IndentOptions} options
 * @returns {CodeEdit}
 */
export function newlineEdit(text, start, end, options) {
  const lineStart = lineStartOf(text, start);
  const before = text.slice(lineStart, start);
  const lead = LEADING_BLANK.exec(before)?.[0] ?? "";
  const opener = before.trimEnd().slice(-1);
  const unit = indentUnit(options);

  if (CLOSERS[opener]) {
    const inner = `\n${lead}${unit}`;
    if (text[end] === CLOSERS[opener]) {
      const caret = start + inner.length;
      return {
        from: start,
        to: end,
        insert: `${inner}\n${lead}`,
        start: caret,
        end: caret,
      };
    }
    const caret = start + inner.length;
    return { from: start, to: end, insert: inner, start: caret, end: caret };
  }

  const insert = `\n${lead}`;
  const caret = start + insert.length;
  return { from: start, to: end, insert, start: caret, end: caret };
}

/**
 * Typing a bracket or quote. Over a selection it wraps it. Before a
 * boundary it adds the closer and leaves the caret between. On a closer it
 * already holds, it steps over it. Returns `null` when the character types
 * as it is, such as an apostrophe after a letter.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @param {string} char
 * @returns {CodeEdit | null}
 */
export function pairEdit(text, start, end, char) {
  const closer = PAIRS[char];
  if (start !== end) {
    if (!closer) return null;
    return {
      from: start,
      to: end,
      insert: char + text.slice(start, end) + closer,
      start: start + 1,
      end: end + 1,
    };
  }
  if (CLOSING.has(char) && text[start] === char) {
    return {
      from: start,
      to: start,
      insert: "",
      start: start + 1,
      end: start + 1,
    };
  }
  if (!closer) return null;
  const previous = text[start - 1];
  const next = text[start];
  const quote = closer === char;
  if (quote && previous && WORD.test(previous)) return null;
  if (next && !PAIR_BOUNDARY.test(next)) return null;
  return {
    from: start,
    to: start,
    insert: char + closer,
    start: start + 1,
    end: start + 1,
  };
}

/**
 * Backspace between an empty pair removes both characters.
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {CodeEdit | null}
 */
export function pairBackspaceEdit(text, start, end) {
  if (start !== end || start === 0) return null;
  if (PAIRS[text[start - 1]] !== text[start]) return null;
  return {
    from: start - 1,
    to: start + 1,
    insert: "",
    start: start - 1,
    end: start - 1,
  };
}

/**
 * The lines to paint: those in view plus `overscan` either side, clamped to
 * the text.
 * @param {{
 *   scrollTop: number,
 *   viewport: number,
 *   lineHeight: number,
 *   paddingTop: number,
 *   total: number,
 *   overscan: number,
 * }} metrics
 * @returns {{ from: number, to: number, visibleFrom: number, visibleTo: number }}
 */
export function paintWindow({
  scrollTop,
  viewport,
  lineHeight,
  paddingTop,
  total,
  overscan,
}) {
  const visibleFrom = Math.max(
    0,
    Math.min(total - 1, Math.floor((scrollTop - paddingTop) / lineHeight)),
  );
  const visibleTo = Math.min(
    total,
    Math.max(
      visibleFrom + 1,
      Math.ceil((scrollTop + viewport - paddingTop) / lineHeight),
    ),
  );
  return {
    from: Math.max(0, visibleFrom - overscan),
    to: Math.min(total, visibleTo + overscan),
    visibleFrom,
    visibleTo,
  };
}

/**
 * Whether lines `[from, to)` painted earlier still cover the view with
 * `margin` lines to spare, so a scroll within the painted lines repaints
 * nothing.
 * @param {{ from: number, to: number }} painted
 * @param {{ visibleFrom: number, visibleTo: number }} view
 * @param {number} total
 * @param {number} margin
 * @returns {boolean}
 */
export function paintCovers(painted, view, total, margin) {
  return (
    (painted.from === 0 || view.visibleFrom - margin >= painted.from) &&
    (painted.to >= total || view.visibleTo + margin <= painted.to)
  );
}

/**
 * Token text for lines `[from, to)`. `tokens` must join back to `text`, as
 * `tokenize` from `carbon-components-svelte/syntax` returns them. Without
 * tokens every line is plain. A token that spans lines, such as a block
 * comment or a template string, is cut at each line break, and tokens
 * outside the window are skipped without being cut.
 * @param {string} text
 * @param {number[]} starts
 * @param {{ type: string | null; text: string }[] | undefined} tokens
 * @param {number} from
 * @param {number} to
 * @returns {LineSegments[]}
 */
export function lineSegments(text, starts, tokens, from, to) {
  /** @type {LineSegments[]} */
  const lines = [];
  for (let line = from; line < to; line++) lines.push([]);
  if (to <= from) return lines;

  if (!tokens) {
    for (let line = from; line < to; line++) {
      const lineEnd =
        line + 1 < starts.length ? starts[line + 1] - 1 : text.length;
      if (lineEnd > starts[line])
        lines[line - from].push(null, text.slice(starts[line], lineEnd));
    }
    return lines;
  }

  const windowStart = starts[from];
  const windowEnd = to < starts.length ? starts[to] : text.length + 1;
  let position = 0;
  let line = from;
  for (const token of tokens) {
    const length = token.text.length;
    const tokenEnd = position + length;
    if (tokenEnd <= windowStart) {
      position = tokenEnd;
      continue;
    }
    if (position >= windowEnd) break;

    const clipFrom = Math.max(0, windowStart - position);
    const clipTo = Math.min(length, windowEnd - position);
    const piece =
      clipFrom === 0 && clipTo === length
        ? token.text
        : token.text.slice(clipFrom, clipTo);
    const at = position + clipFrom;
    while (line + 1 < starts.length && starts[line + 1] <= at) line++;

    if (piece.indexOf("\n") === -1) {
      if (piece && line < to) lines[line - from].push(token.type, piece);
    } else {
      const parts = piece.split("\n");
      for (let index = 0; index < parts.length; index++) {
        const target = line + index;
        if (target >= to) break;
        if (parts[index]) lines[target - from].push(token.type, parts[index]);
      }
    }
    position = tokenEnd;
  }
  return lines;
}
