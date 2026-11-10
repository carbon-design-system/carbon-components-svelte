// @ts-check
// The lines of a log: parsing a raw line into text, level and time, and a
// bounded buffer that drops the oldest lines as new ones arrive.

import { hasAnsi, stripAnsi } from "./ansi.js";

/**
 * @typedef {"debug" | "info" | "warn" | "error"} LogLevel
 */

/**
 * A line as the consumer supplies it. A string is parsed for a leading
 * timestamp and level; an object states them. A `level` is `"debug"`,
 * `"info"`, `"warn"` or `"error"`, or a name for one, such as `"warning"`,
 * `"fatal"` or `"trace"`, in any case.
 * @typedef {string | { text: string, level?: string, time?: string | number | Date }} LogLine
 */

/**
 * A line as the viewer holds it.
 * @typedef {Object} LogRow
 * @property {number} id Position in the stream. Ids only grow, and a line
 * keeps its id when older lines are dropped.
 * @property {string} raw The line as it arrived, for copying.
 * @property {string} text What is drawn, with escape sequences. Without the
 * timestamp and level that moved to their own fields.
 * @property {string} plain `text` without escape sequences, which is what
 * search reads.
 * @property {LogLevel | undefined} level
 * @property {string | number | Date | undefined} time
 */

/** The levels, least to most severe. */
export const LOG_LEVELS = /** @type {const} */ ([
  "debug",
  "info",
  "warn",
  "error",
]);

/** @type {Record<string, LogLevel>} */
const LEVEL_ALIASES = {
  trace: "debug",
  debug: "debug",
  dbg: "debug",
  verbose: "debug",
  info: "info",
  notice: "info",
  log: "info",
  warn: "warn",
  warning: "warn",
  err: "error",
  error: "error",
  fatal: "error",
  crit: "error",
  critical: "error",
  panic: "error",
  severe: "error",
};

/**
 * The level a name stands for, or `undefined` for a name that is none.
 * @param {unknown} name
 * @returns {LogLevel | undefined}
 */
export function normalizeLevel(name) {
  return typeof name === "string"
    ? LEVEL_ALIASES[name.trim().toLowerCase()]
    : undefined;
}

const TIMESTAMP =
  /^\[?(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\]?[ \t]*/;
const LEADING_LEVEL =
  /^(\[)?(trace|debug|dbg|verbose|info|notice|warn|warning|err|error|fatal|crit|critical|panic|severe)(\])?(:)?(?:[ \t]+|$)/i;
const LOGFMT_LEVEL = /\blevel=["']?([a-z]+)/i;
const CLOCK_TIME = /[T ](\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)/;

/**
 * Whether a leading level match is a level and not the first word of a
 * sentence ("Info about the build"): it needs brackets, a colon, capitals, or
 * a timestamp before it.
 * @param {RegExpExecArray | null} leading
 * @param {boolean} stamped
 * @returns {leading is RegExpExecArray}
 */
function isLevel(leading, stamped) {
  return (
    leading !== null &&
    (stamped ||
      Boolean(leading[1] || leading[4]) ||
      leading[2] === leading[2].toUpperCase())
  );
}

/**
 * Read a leading ISO-8601 timestamp and level, such as
 * `2026-10-27T09:41:07.123Z ERROR failed` or `[warn] slow`, and move them
 * out of the text. A level inside a color sequence, or in `level=info`
 * anywhere in the first 256 characters, is still found, but stays in the text.
 *
 * @param {string} line
 * @returns {{ text: string, level?: LogLevel, time?: string }}
 */
export function parseLogLine(line) {
  const stamp = TIMESTAMP.exec(line);
  let text = stamp ? line.slice(stamp[0].length) : line;

  const leading = LEADING_LEVEL.exec(text);
  /** @type {LogLevel | undefined} */
  let level;
  if (isLevel(leading, stamp !== null)) {
    level = normalizeLevel(leading[2]);
    text = text.slice(leading[0].length);
  } else {
    const plain = hasAnsi(text) ? stripAnsi(text) : text;
    const colored = LEADING_LEVEL.exec(plain);
    if (isLevel(colored, stamp !== null)) level = normalizeLevel(colored[2]);
    else {
      const logfmt = LOGFMT_LEVEL.exec(plain.slice(0, 256));
      if (logfmt) level = normalizeLevel(logfmt[1]);
    }
  }

  /** @type {{ text: string, level?: LogLevel, time?: string }} */
  const parsed = { text };
  if (level) parsed.level = level;
  if (stamp) parsed.time = stamp[1];
  return parsed;
}

/**
 * A timestamp as it is drawn: the time of day, with milliseconds when there
 * are any. A string keeps its own clock reading; a number or `Date` is read
 * in UTC, so server and client agree.
 *
 * @param {string | number | Date | undefined} time
 * @returns {string}
 */
export function formatLogTime(time) {
  if (time === undefined) return "";
  if (typeof time === "string") {
    return CLOCK_TIME.exec(time)?.[1] ?? time;
  }
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(11, 23);
}

/**
 * The text of a line for copying, without escape sequences: the line as it
 * arrived, or for a line given as an object its time and level in front of
 * the text.
 *
 * @param {LogRow} row
 * @returns {string}
 */
export function logRowText(row) {
  return stripAnsi(row.raw);
}

/**
 * Split a chunk into lines. A carriage return that is not part of the line
 * ending rewinds to the start of the line, as a progress bar redraws itself,
 * so only the last redraw is kept.
 *
 * @param {string} chunk
 * @returns {string[]}
 */
function splitLines(chunk) {
  if (!chunk.includes("\n") && !chunk.includes("\r")) return [chunk];
  const lines = chunk.split("\n");
  // A trailing newline ends the last line rather than starting another.
  if (lines.length > 1 && lines[lines.length - 1] === "") lines.pop();
  return lines.map((line) => {
    const end = line.endsWith("\r") ? line.slice(0, -1) : line;
    const rewind = end.lastIndexOf("\r");
    return rewind === -1 ? end : end.slice(rewind + 1);
  });
}

/**
 * @param {LogLine} line
 * @param {(line: string) => { text: string, level?: LogLevel, time?: string | number | Date }} parse
 * @returns {Array<{ raw: string, text: string, level?: LogLevel, time?: string | number | Date }>}
 */
function expandLine(line, parse) {
  if (typeof line === "string") {
    return splitLines(line).map((raw) => ({ raw, ...parse(raw) }));
  }
  const level = normalizeLevel(line.level);
  return splitLines(String(line.text ?? "")).map((text) => ({
    raw: [
      line.time === undefined
        ? ""
        : typeof line.time === "string"
          ? line.time
          : new Date(line.time).toISOString(),
      level ? level.toUpperCase() : "",
      text,
    ]
      .filter(Boolean)
      .join(" "),
    text,
    level,
    time: line.time,
  }));
}

/** @param {LogRow} row */
function effectiveLevel(row) {
  return row.level ?? "info";
}

/**
 * A bounded list of log lines, with the level filter applied as lines arrive.
 *
 * Lines are held oldest first. Past `maxLines` the oldest are dropped, and
 * the arrays handed out are replaced, not edited, so a consumer comparing
 * references sees the front move. A pure append edits the arrays in place,
 * which keeps a 100,000-line buffer from being copied for every batch.
 *
 * @param {Object} [options]
 * @param {number} [options.maxLines=Infinity]
 * @param {((line: string) => { text: string, level?: LogLevel, time?: string | number | Date }) | null} [options.parse]
 * How a string line is read. `null` keeps every string whole.
 * @returns {{
 *   readonly rows: LogRow[],
 *   readonly view: LogRow[],
 *   readonly counts: Record<LogLevel, number>,
 *   readonly nextId: number,
 *   readonly leveled: boolean,
 *   append: (lines: LogLine | ReadonlyArray<LogLine>) => { added: number, dropped: number },
 *   clear: () => void,
 *   setMaxLines: (maxLines: number) => number,
 *   setLevels: (levels: ReadonlySet<LogLevel> | null) => void,
 * }}
 */
export function createLogBuffer({
  maxLines = Number.POSITIVE_INFINITY,
  parse = parseLogLine,
} = {}) {
  /** @type {LogRow[]} */
  let rows = [];
  /** @type {LogRow[]} */
  let view = rows;
  /** @type {ReadonlySet<LogLevel> | null} */
  let levels = null;
  let nextId = 0;
  let leveled = false;
  let limit = maxLines;
  const counts = { debug: 0, info: 0, warn: 0, error: 0 };
  const read = parse ?? ((/** @type {string} */ line) => ({ text: line }));

  /** @param {LogRow} row */
  function shown(row) {
    return levels === null || levels.has(effectiveLevel(row));
  }

  /**
   * Drop lines from the front down to `keep`.
   * @param {number} keep
   * @returns {number} How many were dropped.
   */
  function trim(keep) {
    const dropped = rows.length - keep;
    if (dropped <= 0) return 0;
    for (let i = 0; i < dropped; i++) counts[effectiveLevel(rows[i])]--;
    rows = rows.slice(dropped);
    if (levels === null) {
      view = rows;
    } else {
      const firstId = rows.length > 0 ? rows[0].id : nextId;
      let drop = 0;
      while (drop < view.length && view[drop].id < firstId) drop++;
      view = view.slice(drop);
    }
    return dropped;
  }

  return {
    get rows() {
      return rows;
    },
    get view() {
      return view;
    },
    get counts() {
      return counts;
    },
    get nextId() {
      return nextId;
    },
    get leveled() {
      return leveled;
    },

    append(lines) {
      const batch = Array.isArray(lines) ? lines : [lines];
      let added = 0;
      for (const line of batch) {
        for (const parsed of expandLine(/** @type {LogLine} */ (line), read)) {
          /** @type {LogRow} */
          const row = {
            id: nextId++,
            raw: parsed.raw,
            text: parsed.text,
            plain: stripAnsi(parsed.text),
            level: parsed.level,
            time: parsed.time,
          };
          rows.push(row);
          if (row.level) leveled = true;
          counts[effectiveLevel(row)]++;
          if (levels !== null && shown(row)) view.push(row);
          added++;
        }
      }
      return { added, dropped: trim(limit) };
    },

    clear() {
      rows = [];
      view = levels === null ? rows : [];
      nextId = 0;
      leveled = false;
      counts.debug = counts.info = counts.warn = counts.error = 0;
    },

    setMaxLines(next) {
      limit = next;
      return trim(limit);
    },

    setLevels(next) {
      levels =
        next === null || LOG_LEVELS.every((level) => next.has(level))
          ? null
          : next;
      view = levels === null ? rows : rows.filter(shown);
    },
  };
}
