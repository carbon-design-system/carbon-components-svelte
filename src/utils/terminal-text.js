// @ts-check
// Turn the output of a command into rows of styled text.
//
// This is not a terminal emulator. It reads a stream of text and understands:
//
//   - `\n` ends a row; `\r` returns to the start of the row, so the next text
//     overwrites it (a progress bar); `\b` steps back one column; `\t` pads to
//     the next multiple of `tabSize`.
//   - SGR (`ESC [ ... m`): 16, 256 and truecolor colors, bold, dim, italic,
//     underline, strike and reverse video. The style carries across rows, as
//     it does in a terminal, until a reset.
//   - `ESC [ K`, `ESC [ 1 K` and `ESC [ 2 K`: erase to the end of the row, to
//     the start, or the whole row.
//
// Everything else is read and dropped without effect: cursor movement, the
// alternate screen, scrolling regions, window titles, and OSC 8 hyperlinks
// (the link text shows, never as a link). Control characters and bidi
// formatting characters are removed, so the output is text and nothing else.
//
// A sequence can arrive in two chunks of a stream; the state is kept between
// calls to `write`. `write` accepts any string and never throws.

/**
 * A color: `0` to `15` is a position in the 16-color palette, which the
 * stylesheet themes. A `#rrggbb` string is a 256-color or truecolor value.
 * `"text"` and `"background"` are the page's own colors, which reverse video
 * swaps in for a color that was never set.
 * @typedef {number | string} AnsiColor
 */

/**
 * The SGR attributes in effect. An absent field is the terminal default.
 * @typedef {Object} AnsiStyle
 * @property {AnsiColor} [fg]
 * @property {AnsiColor} [bg]
 * @property {boolean} [bold]
 * @property {boolean} [dim]
 * @property {boolean} [italic]
 * @property {boolean} [underline]
 * @property {boolean} [strike]
 */

/**
 * @typedef {Object} TerminalRun
 * @property {string} text
 * @property {AnsiStyle} style Reverse video is already applied.
 */

/**
 * One row of the scrollback.
 * @typedef {Object} TerminalRow
 * @property {number} id A position in the stream. It counts up for the life
 * of the buffer, so it stays the same when older rows are dropped.
 * @property {"output" | "command"} kind
 * @property {string} text The row as plain text.
 * @property {TerminalRun[] | null} runs The styled runs, or `null` when the
 * whole row is in the default style.
 * @property {boolean} [truncated] Whether the row was cut at `maxLineLength`.
 * @property {string} [prompt] The prompt of a command row.
 * @property {string} [command] The command of a command row.
 */

/**
 * @typedef {Object} TerminalBuffer
 * @property {(chunk: string) => void} write Add text to the stream.
 * @property {(prompt: string, command: string) => void} echo Add a row for a
 * command that was run, starting a new row first if one is open.
 * @property {() => TerminalRow[]} view The rows, with the row still being
 * written last. A new array each call.
 * @property {() => number} trim Drop the oldest rows past `maxLines`.
 * @property {(id: number) => TerminalRow[]} since The rows from `id` on, with
 * the row still being written last.
 * @property {() => void} clear Remove every row.
 * @property {() => string} getText The scrollback as plain text.
 * @property {() => number} nextId The id the next row gets.
 * @property {() => number} size How many rows there are, including the open one.
 * @property {() => boolean} hasOpenRow Whether text has been written since the
 * last newline.
 * @property {number} maxLines
 */

const ESC = 0x1b;
const BEL = 0x07;

/**
 * Whether a character is a control character, a C1 control, or a bidi
 * formatting character, which can reorder the text that follows and so
 * disguise it. Written as ranges of code units rather than a pattern, so
 * that no invisible character appears in this source.
 * @param {number} code
 * @returns {boolean}
 */
function isSpecial(code) {
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x61c ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

/**
 * @param {string} text
 * @param {number} from
 * @returns {number} The index of the next special character, or `-1`.
 */
function indexOfSpecial(text, from) {
  for (let i = from; i < text.length; i++) {
    if (isSpecial(text.charCodeAt(i))) return i;
  }
  return -1;
}

/** Longest parameter string kept for one CSI sequence. */
const CSI_LIMIT = 64;
/** Most characters of an OSC or similar string that are skipped before giving up. */
const STRING_LIMIT = 4096;
/** The most distinct styles kept for sharing between runs. */
const STYLE_CACHE_LIMIT = 512;

// The parser is in one of these modes.
const TEXT = 0;
const AFTER_ESC = 1;
const AFTER_ESC_INTERMEDIATE = 2;
const CSI = 3;
const STRING = 4;
const STRING_AFTER_ESC = 5;

const COLON_TRUECOLOR = /(^|;)([34]8):2::/g;
const PARAMETER_SEPARATOR = /[;:]/;
const SGR_PARAMS = /^[0-9:;]*$/;
const NUMERIC = /^[0-9]*$/;

/**
 * Remove control characters, and the bidi formatting characters that can
 * disguise text, from a string. Escape sequences are not interpreted: their
 * bytes are removed one by one, so `ESC [ 3 1 m` leaves `[31m` behind.
 * @param {string} text
 * @returns {string}
 */
export function stripControls(text) {
  let out = "";
  let from = 0;
  for (
    let at = indexOfSpecial(text, 0);
    at !== -1;
    at = indexOfSpecial(text, from)
  ) {
    out += text.slice(from, at);
    from = at + 1;
  }
  return out + text.slice(from);
}

/**
 * @param {number} value
 * @returns {number}
 */
function clampChannel(value) {
  return Math.min(255, Math.max(0, Number.isFinite(value) ? value : 0));
}

/**
 * @param {number} value
 * @returns {string}
 */
function hex2(value) {
  return Math.round(value).toString(16).padStart(2, "0");
}

/**
 * The `#rrggbb` color of a position in the 256-color palette above the first
 * 16: the 6x6x6 cube from `16`, then 24 grays from `232`.
 * @param {number} index
 * @returns {string}
 */
function paletteToHex(index) {
  /** @param {number} level */
  const cube = (level) => (level === 0 ? 0 : 55 + 40 * level);
  if (index >= 232) {
    const gray = 8 + 10 * (index - 232);
    return `#${hex2(gray)}${hex2(gray)}${hex2(gray)}`;
  }
  const offset = index - 16;
  return `#${hex2(cube(Math.floor(offset / 36)))}${hex2(
    cube(Math.floor(offset / 6) % 6),
  )}${hex2(cube(offset % 6))}`;
}

/**
 * Read an extended color (`38` or `48`) from SGR parameters, whose first
 * entry follows the `38`/`48`.
 * @param {number[]} params
 * @param {number} start Where the sub-parameters begin.
 * @returns {{ color: AnsiColor | undefined, used: number }}
 */
function readExtendedColor(params, start) {
  const mode = params[start];
  if (mode === 5 && start + 1 < params.length) {
    const index = clampChannel(params[start + 1]);
    return { color: index < 16 ? index : paletteToHex(index), used: 2 };
  }
  if (mode === 2 && start + 3 < params.length) {
    return {
      color: `#${hex2(clampChannel(params[start + 1]))}${hex2(
        clampChannel(params[start + 2]),
      )}${hex2(clampChannel(params[start + 3]))}`,
      used: 4,
    };
  }
  return { color: undefined, used: Math.max(1, params.length - start) };
}

/**
 * The attributes SGR sets, before reverse video is applied.
 * @typedef {AnsiStyle & { inverse?: boolean }} SgrState
 */

/**
 * Apply one SGR sequence to a state.
 * @param {SgrState} state Not modified.
 * @param {string} raw The parameter string between `[` and `m`.
 * @returns {SgrState}
 */
function applySgr(state, raw) {
  /** @type {SgrState} */
  let next = { ...state };
  // `38:2::r:g:b` and `38;2;r;g;b` both occur; the colon form leaves an empty
  // colorspace slot. An empty parameter is 0.
  const params =
    raw === ""
      ? [0]
      : raw
          .replace(COLON_TRUECOLOR, "$1$2:2:")
          .split(PARAMETER_SEPARATOR)
          .map((p) => Number(p) || 0);

  for (let i = 0; i < params.length; i++) {
    const code = params[i];
    if (code === 0) next = {};
    else if (code === 1) next.bold = true;
    else if (code === 2) next.dim = true;
    else if (code === 3) next.italic = true;
    else if (code === 4 || code === 21) next.underline = true;
    else if (code === 7) next.inverse = true;
    else if (code === 9) next.strike = true;
    else if (code === 22) {
      next.bold = false;
      next.dim = false;
    } else if (code === 23) next.italic = false;
    else if (code === 24) next.underline = false;
    else if (code === 27) next.inverse = false;
    else if (code === 29) next.strike = false;
    else if (code >= 30 && code <= 37) next.fg = code - 30;
    else if (code >= 90 && code <= 97) next.fg = code - 90 + 8;
    else if (code >= 40 && code <= 47) next.bg = code - 40;
    else if (code >= 100 && code <= 107) next.bg = code - 100 + 8;
    else if (code === 39) next.fg = undefined;
    else if (code === 49) next.bg = undefined;
    else if (code === 38 || code === 48) {
      const { color, used } = readExtendedColor(params, i + 1);
      if (color !== undefined) {
        if (code === 38) next.fg = color;
        else next.bg = color;
      }
      i += used;
    }
  }

  return next;
}

/**
 * The style a run is drawn in: reverse video swaps the colors, and a color
 * that was never set becomes the page's own.
 * @param {SgrState} state
 * @returns {AnsiStyle | null} `null` when it equals the default.
 */
function resolveStyle(state) {
  /** @type {AnsiStyle} */
  const style = {};
  if (state.inverse) {
    style.fg = state.bg ?? "background";
    style.bg = state.fg ?? "text";
  } else {
    if (state.fg !== undefined) style.fg = state.fg;
    if (state.bg !== undefined) style.bg = state.bg;
  }
  if (state.bold) style.bold = true;
  if (state.dim) style.dim = true;
  if (state.italic) style.italic = true;
  if (state.underline) style.underline = true;
  if (state.strike) style.strike = true;
  return Object.keys(style).length > 0 ? style : null;
}

/**
 * @param {AnsiStyle} style
 * @returns {string}
 */
function styleKey(style) {
  return `${style.fg ?? ""}|${style.bg ?? ""}|${style.bold ? 1 : 0}${
    style.dim ? 1 : 0
  }${style.italic ? 1 : 0}${style.underline ? 1 : 0}${style.strike ? 1 : 0}`;
}

/**
 * Create a buffer that reads output into rows.
 *
 * @param {Object} [options]
 * @param {number} [options.maxLines=100000] Rows kept; `trim` drops the oldest.
 * It can be changed later on the buffer.
 * @param {number} [options.maxLineLength=16384] Columns kept in a row. Text
 * past it is dropped, and the row ends in an ellipsis.
 * @param {number} [options.tabSize=8]
 * @returns {TerminalBuffer}
 */
export function createTerminalBuffer({
  maxLines = 100000,
  maxLineLength = 16384,
  tabSize = 8,
} = {}) {
  /** @type {TerminalRow[]} */
  let rows = [];
  let nextId = 0;

  // The row being written: one character and one style per column.
  /** @type {string[]} */
  const cells = [];
  /** @type {Array<AnsiStyle | null>} */
  const styles = [];
  let col = 0;
  let truncated = false;
  // Columns before this are known to be blank, so repeated erases cost nothing.
  let blankUntil = 0;

  let mode = TEXT;
  let heldHigh = "";
  let csi = "";
  let skipped = 0;
  /** @type {SgrState} */
  let sgr = {};
  /** @type {AnsiStyle | null} */
  let style = null;
  /** @type {Map<string, AnsiStyle>} */
  const styleCache = new Map();

  /** @param {SgrState} state */
  function setState(state) {
    sgr = state;
    const resolved = resolveStyle(state);
    if (resolved === null) {
      style = null;
      return;
    }
    const key = styleKey(resolved);
    let shared = styleCache.get(key);
    if (shared === undefined) {
      if (styleCache.size >= STYLE_CACHE_LIMIT) styleCache.clear();
      shared = resolved;
      styleCache.set(key, shared);
    }
    style = shared;
  }

  /** @param {string} cell */
  function place(cell) {
    if (col >= maxLineLength) {
      truncated = true;
      return;
    }
    while (cells.length < col) {
      cells.push(" ");
      styles.push(null);
    }
    if (col === cells.length) {
      cells.push(cell);
      styles.push(style);
    } else {
      cells[col] = cell;
      styles[col] = style;
    }
    if (col < blankUntil) blankUntil = col;
    col++;
  }

  /** @param {string} text */
  function putText(text) {
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdfff) {
        // A pair is one cell. A half with no partner is not text.
        const low = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
        if (code <= 0xdbff && low >= 0xdc00 && low <= 0xdfff) {
          place(text.slice(i, i + 2));
          i++;
        } else {
          place("�");
        }
        continue;
      }
      place(text[i]);
    }
  }

  /**
   * The open row, as it reads now.
   * @returns {{ text: string, runs: TerminalRun[] | null }}
   */
  function readLine() {
    const length = cells.length;
    const last = truncated && length === maxLineLength ? length - 1 : -1;
    if (last >= 0) cells[last] = "…";
    const text = cells.join("");
    let runs = null;
    if (length > 0) {
      const first = styles[0];
      let uniform = true;
      for (let i = 1; i < length; i++) {
        if (styles[i] !== first) {
          uniform = false;
          break;
        }
      }
      if (uniform) {
        if (first) runs = [{ text, style: first }];
      } else {
        runs = [];
        let from = 0;
        for (let i = 1; i <= length; i++) {
          if (i === length || styles[i] !== styles[from]) {
            const runStyle = styles[from];
            runs.push({
              text: cells.slice(from, i).join(""),
              style: /** @type {AnsiStyle} */ (runStyle ?? {}),
            });
            from = i;
          }
        }
      }
    }
    return { text, runs };
  }

  function endRow() {
    const { text, runs } = readLine();
    /** @type {TerminalRow} */
    const row = { id: nextId++, kind: "output", text, runs };
    if (truncated) row.truncated = true;
    rows.push(row);
    cells.length = 0;
    styles.length = 0;
    col = 0;
    blankUntil = 0;
    truncated = false;
    if (rows.length > buffer.maxLines * 1.25 + 1000) trim();
  }

  /** @param {number} kind 0: to the end, 1: to the start, 2: all */
  function erase(kind) {
    if (kind === 0) {
      if (col < cells.length) {
        cells.length = col;
        styles.length = col;
      }
    } else if (kind === 1) {
      const end = Math.min(col, cells.length - 1);
      for (let i = blankUntil; i <= end; i++) {
        cells[i] = " ";
        styles[i] = null;
      }
      if (end + 1 > blankUntil) blankUntil = end + 1;
    } else {
      cells.length = 0;
      styles.length = 0;
    }
    if (blankUntil > cells.length) blankUntil = cells.length;
  }

  /** @param {string} final */
  function endCsi(final) {
    const params = csi;
    csi = "";
    if (final === "m") {
      if (SGR_PARAMS.test(params)) setState(applySgr(sgr, params));
    } else if (final === "K" && NUMERIC.test(params)) {
      const kind = params === "" ? 0 : Number(params);
      if (kind <= 2) erase(kind);
    }
  }

  /** @param {number} code */
  function control(code) {
    if (code === 0x0a) endRow();
    else if (code === 0x0d) col = 0;
    else if (code === 0x08) col = Math.max(0, col - 1);
    else if (code === 0x09) {
      const pad = tabSize - (col % tabSize);
      for (let i = 0; i < pad; i++) place(" ");
    } else if (code === ESC) mode = AFTER_ESC;
  }

  /**
   * Read one character while inside an escape sequence.
   * @param {number} code
   * @param {string} char
   * @returns {boolean} Whether the character was used. When `false`, it is
   * read again as text: it ended a sequence that was never finished.
   */
  function escapeChar(code, char) {
    switch (mode) {
      case AFTER_ESC:
        if (code === 0x5b) {
          mode = CSI;
          csi = "";
        } else if (
          code === 0x5d ||
          code === 0x50 ||
          code === 0x58 ||
          code === 0x5e ||
          code === 0x5f
        ) {
          mode = STRING;
          skipped = 0;
        } else if (code >= 0x20 && code <= 0x2f) {
          mode = AFTER_ESC_INTERMEDIATE;
        } else if (code >= 0x30 && code <= 0x7e) {
          mode = TEXT;
        } else {
          mode = TEXT;
          return false;
        }
        return true;
      case AFTER_ESC_INTERMEDIATE:
        if (code >= 0x30 && code <= 0x7e) mode = TEXT;
        else if (code < 0x20 || code > 0x2f) {
          mode = TEXT;
          return false;
        }
        return true;
      case CSI:
        if (code >= 0x40 && code <= 0x7e) {
          mode = TEXT;
          endCsi(char);
        } else if (code >= 0x20 && code <= 0x3f) {
          if (csi.length < CSI_LIMIT) csi += char;
          else {
            mode = TEXT;
            csi = "";
          }
        } else {
          mode = TEXT;
          csi = "";
          return false;
        }
        return true;
      case STRING:
        if (code === BEL) mode = TEXT;
        else if (code === ESC) mode = STRING_AFTER_ESC;
        else if (code === 0x0a || code === 0x0d) {
          mode = TEXT;
          return false;
        } else if (++skipped > STRING_LIMIT) mode = TEXT;
        return true;
      default:
        // An ESC inside a string ends it with `ESC \`; anything else starts a
        // new sequence.
        if (code === 0x5c) {
          mode = TEXT;
          return true;
        }
        mode = AFTER_ESC;
        return false;
    }
  }

  /** @param {string} chunk */
  function write(chunk) {
    const text = heldHigh + String(chunk);
    heldHigh = "";
    const end = text.length;
    let i = 0;
    while (i < end) {
      if (mode === TEXT) {
        const found = indexOfSpecial(text, i);
        let stop = found === -1 ? end : found;
        // The first half of a pair at the end of a chunk waits for the second.
        if (found === -1 && stop > i) {
          const last = text.charCodeAt(stop - 1);
          if (last >= 0xd800 && last <= 0xdbff) {
            heldHigh = text[stop - 1];
            stop--;
          }
        }
        if (stop > i) putText(text.slice(i, stop));
        if (found === -1) return;
        control(text.charCodeAt(stop));
        i = stop + 1;
      } else {
        // A character that ends an unfinished sequence is read again, as text
        // or as the start of a new sequence.
        if (escapeChar(text.charCodeAt(i), text[i])) i++;
      }
    }
  }

  /** @returns {number} */
  function trim() {
    const excess = rows.length - buffer.maxLines;
    if (excess <= 0) return 0;
    rows.splice(0, excess);
    return excess;
  }

  /** @type {TerminalBuffer} */
  const buffer = {
    maxLines,
    write,
    echo(prompt, command) {
      if (cells.length > 0 || col > 0) endRow();
      const safePrompt = stripControls(prompt);
      const safeCommand = stripControls(command);
      rows.push({
        id: nextId++,
        kind: "command",
        text: safePrompt + safeCommand,
        runs: null,
        prompt: safePrompt,
        command: safeCommand,
      });
    },
    view() {
      const all = rows.slice();
      if (cells.length > 0) {
        const { text, runs } = readLine();
        /** @type {TerminalRow} */
        const open = { id: nextId, kind: "output", text, runs };
        if (truncated) open.truncated = true;
        all.push(open);
      }
      return all;
    },
    since(id) {
      /** @type {TerminalRow[]} */
      const found = [];
      for (let i = rows.length - 1; i >= 0 && rows[i].id >= id; i--) {
        found.push(rows[i]);
      }
      found.reverse();
      if (cells.length > 0 && nextId >= id) {
        const { text, runs } = readLine();
        found.push(
          /** @type {TerminalRow} */ ({
            id: nextId,
            kind: "output",
            text,
            runs,
          }),
        );
      }
      return found;
    },
    trim,
    clear() {
      rows = [];
      cells.length = 0;
      styles.length = 0;
      col = 0;
      blankUntil = 0;
      truncated = false;
      heldHigh = "";
    },
    getText() {
      let out = rows.map((row) => row.text).join("\n");
      if (cells.length > 0)
        out += (rows.length > 0 ? "\n" : "") + readLine().text;
      return out;
    },
    nextId: () => nextId,
    size: () => rows.length + (cells.length > 0 ? 1 : 0),
    hasOpenRow: () => cells.length > 0,
  };
  return buffer;
}
