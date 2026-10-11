// Console patch for the preview: every console API becomes a structured entry
// (previews + handles, source location, group nesting), batched to the shell
// once per frame. Floods are rate limited so a runaway loop can't take the
// shell down.

import { formatArgs } from "./format.js";
import { decodeMappings, originalPosition, parseStack } from "./sourcemap.js";

const MAX_PER_SECOND = 2000;
const MAX_PER_FLUSH = 500;
const STACK_BUDGET_PER_FLUSH = 200;

/**
 * @param {{
 *   remote: ReturnType<import("./remote.js").createRemote>;
 *   post: (message: unknown) => void;
 *   schedule: (fn: () => void) => void;
 *   modules: Map<string, { name: string; map?: { mappings: string; sources: string[] }; lines?: Int32Array[] }>;
 * }} options
 */
export function installConsole({ remote, post, schedule, modules }) {
  const original = {};
  const queue = [];
  let scheduled = false;
  let seq = 0;
  let windowStart = 0;
  let windowCount = 0;
  let dropped = 0;
  let stacksThisFlush = 0;
  /** @type {number[]} */
  const groups = [];
  const timers = new Map();
  const counters = new Map();

  function flush() {
    scheduled = false;
    stacksThisFlush = 0;
    const batch = queue.splice(0, MAX_PER_FLUSH);
    if (batch.length) post({ type: "logs", entries: batch });
    if (queue.length) {
      scheduled = true;
      schedule(flush);
    } else if (dropped) {
      // After the admitted entries, so the notice sits where the drops began.
      post({ type: "logs-dropped", count: dropped });
      dropped = 0;
    }
  }

  function admit() {
    const now = performance.now();
    if (now - windowStart > 1000) {
      windowStart = now;
      windowCount = 0;
    }
    if (++windowCount > MAX_PER_SECOND) {
      dropped++;
      return false;
    }
    return true;
  }

  /** Map a stack frame in a REPL blob module to its source file and line. */
  function mapFrame(frame) {
    const module = modules.get(frame.url);
    if (!module) return null;
    if (!module.map)
      return {
        file: module.name,
        line: frame.line,
        column: frame.column,
        fn: frame.fn,
      };
    module.lines ??= decode(module.map.mappings);
    const pos =
      module.lines &&
      originalPosition(
        module.lines,
        module.map.sources,
        frame.line,
        frame.column,
      );
    return pos ? { ...pos, file: module.name, fn: frame.fn } : null;
  }

  function userFrames(stack) {
    const frames = [];
    for (const frame of parseStack(stack)) {
      const mapped = mapFrame(frame);
      if (mapped) frames.push(mapped);
    }
    return frames;
  }

  function source() {
    if (stacksThisFlush++ > STACK_BUDGET_PER_FLUSH) return undefined;
    return userFrames(new Error().stack)[0];
  }

  function emit(entry) {
    if (!admit()) return;
    queue.push({ id: ++seq, time: Date.now(), groups: [...groups], ...entry });
    if (!scheduled) {
      scheduled = true;
      schedule(flush);
    }
  }

  function message(level, args, extra = {}) {
    const { parts, rest } = formatArgs(args, remote.preview);
    emit({
      kind: "message",
      level,
      parts,
      args: rest.map((a) => remote.preview(a)),
      source: source(),
      ...extra,
    });
  }

  const api = {
    log: (...a) => message("log", a),
    info: (...a) => message("info", a),
    debug: (...a) => message("debug", a),
    warn: (...a) => message("warn", a),
    error: (...a) => message("error", a, errorExtra(a)),
    dir: (value) => message("log", [value], { expand: true }),
    dirxml: (...a) => message("log", a),
    trace: (...a) => {
      const frames = userFrames(new Error().stack);
      message("trace", a.length ? a : ["console.trace"], { frames });
    },
    assert: (condition, ...a) => {
      if (condition) return;
      message(
        "error",
        a.length
          ? [
              `Assertion failed: ${typeof a[0] === "string" ? a.shift() : ""}`.trim(),
              ...a,
            ]
          : ["Assertion failed"],
      );
    },
    group: (...a) => openGroup(a, false),
    groupCollapsed: (...a) => openGroup(a, true),
    groupEnd: () => {
      groups.pop();
    },
    table: (data, columns) => tableEntry(data, columns),
    time: (label = "default") => {
      if (timers.has(String(label)))
        return message("warn", [`Timer "${label}" already exists`]);
      timers.set(String(label), performance.now());
    },
    timeLog: (label = "default", ...a) => elapsed(label, a, false),
    timeEnd: (label = "default") => elapsed(label, [], true),
    count: (label = "default") => {
      const n = (counters.get(String(label)) ?? 0) + 1;
      counters.set(String(label), n);
      message("log", [`${label}: ${n}`]);
    },
    countReset: (label = "default") => counters.set(String(label), 0),
    clear: () => emit({ kind: "clear", level: "log", args: [] }),
  };

  function errorExtra(args) {
    const error = args.find((a) => a instanceof Error);
    return error ? { frames: userFrames(error.stack) } : {};
  }

  function openGroup(args, collapsed) {
    const id = ++seq;
    emit({
      kind: "group",
      level: "log",
      groupId: id,
      collapsed,
      args: (args.length ? args : ["console.group"]).map((a) =>
        remote.preview(a),
      ),
      source: source(),
    });
    groups.push(id);
  }

  function elapsed(label, extra, end) {
    const key = String(label);
    const start = timers.get(key);
    if (start === undefined)
      return message("warn", [`Timer "${key}" does not exist`]);
    if (end) timers.delete(key);
    message("log", [
      `${key}: ${(performance.now() - start).toFixed(3)} ms`,
      ...extra,
    ]);
  }

  function tableEntry(data, columns) {
    if (data === null || typeof data !== "object")
      return message("log", [data]);
    const rows = [];
    const keys = new Set();
    const entries = data instanceof Map ? [...data] : Object.entries(data);
    for (const [index, row] of entries.slice(0, 1000)) {
      const cells = {};
      if (row !== null && typeof row === "object") {
        for (const [k, v] of Object.entries(row)) {
          if (columns && !columns.includes(k)) continue;
          keys.add(k);
          cells[k] = remote.preview(v);
        }
      } else {
        keys.add("Value");
        cells.Value = remote.preview(row);
      }
      rows.push({ index: String(index), cells });
    }
    emit({
      kind: "table",
      level: "log",
      args: [remote.preview(data)],
      table: {
        columns: columns ?? [...keys],
        rows,
        truncated: entries.length > 1000,
      },
      source: source(),
    });
  }

  for (const [name, fn] of Object.entries(api)) {
    original[name] = console[name]?.bind(console);
    console[name] = (...args) => {
      original[name]?.(...args);
      try {
        fn(...args);
      } catch (error) {
        original.error?.("[repl console]", error);
      }
    };
  }

  return {
    /** Uncaught errors and rejections. */
    reportError(error) {
      const value = error instanceof Error ? error : new Error(String(error));
      emit({
        kind: "message",
        level: "error",
        uncaught: true,
        args: [remote.preview(value)],
        frames: userFrames(value.stack),
        source: userFrames(value.stack)[0],
      });
    },
    /** Evaluation results from the shell's input line. */
    result(value, threw = false, label = undefined) {
      emit({
        kind: "result",
        level: threw ? "error" : "result",
        label,
        args: [remote.preview(value)],
      });
    },
    /** A Carbon component dispatched an event (see scripts/lib/instrument.ts). */
    carbonEvent({ component, type, detail, cancelled }) {
      emit({
        kind: "event",
        level: "event",
        component,
        eventType: type,
        cancelled,
        args: [remote.preview(detail)],
      });
    },
    resetRun() {
      groups.length = 0;
      timers.clear();
      counters.clear();
    },
  };
}

function decode(mappings) {
  try {
    return decodeMappings(mappings);
  } catch {
    return undefined;
  }
}
