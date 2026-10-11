// Performance channel for the preview: run summaries, slow interactions
// (Event Timing) with the DOM mutations they caused, and long animation
// frames with their scripts mapped back to REPL files and lines.
// Pure helpers are exported for tests; `createPerf` binds them to the page.

import { decodeMappings, originalPosition } from "./sourcemap.js";

const LIBRARY_FILE =
  /\/pkg\/(?:ccs|icons)@[^/]+\/svelte@[^/]+\/((?:src|lib)\/[^?#]+)/;

/** 1-based line and column for a 0-based character offset in `code`. */
export function positionAt(code, offset) {
  let line = 1;
  let lineStart = 0;
  for (
    let i = code.indexOf("\n");
    i !== -1 && i < offset;
    i = code.indexOf("\n", i + 1)
  ) {
    line++;
    lineStart = i + 1;
  }
  return { line, column: offset - lineStart + 1 };
}

/**
 * Where a stack frame (url, 1-based line/column) came from: a REPL file and
 * line (through the module's source map), a library file, the Svelte
 * runtime, or other.
 * @param {Map<string, { name: string; map?: { mappings: string; sources: string[] }; lines?: Int32Array[] }>} modules
 */
export function frameSource(url, line, column, modules) {
  const module = modules.get(url);
  if (module) {
    if (module.map && line) {
      module.lines ??= decodeMappings(module.map.mappings);
      const original = originalPosition(
        module.lines,
        module.map.sources,
        line,
        column,
      );
      if (original)
        return {
          kind: "user",
          file: module.name,
          line: original.line,
          column: original.column,
        };
      // Generated code with no mapping (template setup): the file is known,
      // the compiled line would only mislead.
      return { kind: "user", file: module.name };
    }
    return module.map
      ? { kind: "user", file: module.name }
      : { kind: "user", file: module.name, line, column };
  }
  const lib = LIBRARY_FILE.exec(url ?? "");
  if (lib) return { kind: "library", file: lib[1] };
  if (url?.includes("/pkg/svelte@"))
    return { kind: "svelte", file: "Svelte runtime" };
  return { kind: "other", file: url ? url.split("/").pop() : "(unknown)" };
}

/**
 * Attribute a time window from a JS Self-Profiling trace: for each sample in
 * [start, end], the innermost REPL frame (or, failing that, library frame).
 * @returns {{ source: ReturnType<typeof frameSource>; samples: number }[]}
 */
export function attributeSamples(trace, start, end, modules) {
  const counts = new Map();
  for (const sample of trace.samples) {
    if (
      sample.timestamp < start ||
      sample.timestamp > end ||
      sample.stackId === undefined
    )
      continue;
    let user;
    let library;
    for (
      let id = sample.stackId;
      id !== undefined && !user;
      id = trace.stacks[id].parentId
    ) {
      const frame = trace.frames[trace.stacks[id].frameId];
      const source = frameSource(
        trace.resources[frame.resourceId],
        frame.line,
        frame.column,
        modules,
      );
      if (source.kind === "user") user = { ...source, fn: frame.name };
      else if (source.kind === "library" && !library)
        library = { ...source, fn: frame.name };
    }
    const pick = user ?? library;
    if (!pick) continue;
    const key = `${pick.file}:${pick.line ?? ""}:${pick.fn}`;
    const entry = counts.get(key);
    if (entry) entry.samples++;
    else counts.set(key, { source: pick, samples: 1 });
  }
  return [...counts.values()].sort((a, b) => b.samples - a.samples).slice(0, 5);
}

/**
 * One row per interaction (Event Timing groups events by interactionId; keep
 * the longest), with its phases and the DOM mutations recorded during it.
 * @param {PerformanceEventTiming[]} entries
 * @param {[number, number][]} mutationLog [time, records] pairs
 */
export function summarizeInteractions(entries, mutationLog) {
  /** @type {Map<number, PerformanceEventTiming[]>} */
  const byId = new Map();
  for (const e of entries) {
    if (!e.interactionId) continue;
    const list = byId.get(e.interactionId);
    if (list) list.push(e);
    else byId.set(e.interactionId, [e]);
  }
  return [...byId.values()].map((list) => {
    // The event that did the work names the row (click over pointerdown).
    const main = list.reduce((a, b) =>
      b.processingEnd - b.processingStart > a.processingEnd - a.processingStart
        ? b
        : a,
    );
    const start = Math.min(...list.map((e) => e.startTime));
    const end = Math.max(...list.map((e) => e.startTime + e.duration));
    const firstProcessing = Math.min(...list.map((e) => e.processingStart));
    const lastProcessing = Math.max(...list.map((e) => e.processingEnd));
    const processing = list.reduce(
      (sum, e) => sum + Math.max(0, e.processingEnd - e.processingStart),
      0,
    );
    let mutations = 0;
    for (const [time, count] of mutationLog) {
      if (time >= start && time <= end) mutations += count;
    }
    return {
      type: main.name,
      target: main.target,
      start,
      duration: end - start,
      inputDelay: Math.max(0, firstProcessing - start),
      processing,
      presentation: Math.max(0, end - lastProcessing),
      mutations,
    };
  });
}

/**
 * @param {{
 *   post: (message: unknown) => void;
 *   modules: Map<string, any>;
 *   preview: (value: unknown) => unknown;
 *   locate: (el: Element) => unknown;
 *   setTimeout: typeof setTimeout;
 *   requestAnimationFrame: typeof requestAnimationFrame;
 * }} options
 */
export function createPerf({
  post,
  modules,
  preview,
  locate,
  setTimeout,
  requestAnimationFrame,
}) {
  /** @type {[number, number][]} */
  let mutationLog = [];
  let pendingEvents = [];
  let pendingFrames = [];
  let flushTimer;
  let run;

  function schedule() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, 300);
  }

  function flush() {
    flushTimer = undefined;
    if (pendingEvents.length) {
      const items = summarizeInteractions(pendingEvents, mutationLog).map(
        (i) => ({
          ...i,
          target: i.target ? preview(i.target) : undefined,
          source: i.target ? (locate(i.target) ?? undefined) : undefined,
        }),
      );
      pendingEvents = [];
      if (items.length) post({ type: "perf-interactions", items });
    }
    if (pendingFrames.length) {
      const frames = pendingFrames;
      pendingFrames = [];
      attributeFrames(frames).then((items) =>
        post({ type: "perf-frames", items }),
      );
    }
    const cutoff = performance.now() - 10_000;
    mutationLog = mutationLog.filter(([t]) => t > cutoff);
  }

  if (typeof PerformanceObserver !== "undefined") {
    const supported = PerformanceObserver.supportedEntryTypes ?? [];
    if (supported.includes("event")) {
      new PerformanceObserver((list) => {
        pendingEvents.push(...list.getEntries());
        schedule();
      }).observe({ type: "event", durationThreshold: 16, buffered: false });
    }
    if (supported.includes("longtask")) {
      new PerformanceObserver((list) => {
        for (const task of list.getEntries()) {
          pendingFrames.push({
            start: task.startTime,
            duration: task.duration,
          });
        }
        schedule();
      }).observe({ type: "longtask", buffered: false });
    }
  }

  // JS Self-Profiling (Chromium, Document-Policy: js-profiling) samples
  // stacks continuously; long tasks are attributed from the samples.
  let profiler;
  function startProfiler() {
    try {
      profiler =
        typeof Profiler === "function"
          ? new Profiler({ sampleInterval: 10, maxBufferSize: 10_000 })
          : undefined;
    } catch {
      profiler = undefined;
    }
  }
  startProfiler();

  // The sample buffer fills in ~100 s; recycle while idle.
  setTimeout(function recycle() {
    if (profiler && !pendingFrames.length) {
      profiler.stop().catch(() => {});
      startProfiler();
    }
    setTimeout(recycle, 30_000);
  }, 30_000);

  async function attributeFrames(frames) {
    if (!profiler || !frames.length) return frames;
    const current = profiler;
    const interval = current.sampleInterval || 10;
    startProfiler();
    try {
      const trace = await current.stop();
      return frames.map((f) => ({
        ...f,
        scripts: attributeSamples(
          trace,
          f.start,
          f.start + f.duration,
          modules,
        ).map((a) => ({
          source: a.source,
          fn: a.source.fn,
          // The browser picks the real interval; never claim more than the task.
          duration: Math.min(f.duration, a.samples * interval),
        })),
      }));
    } catch {
      return frames;
    }
  }

  return {
    /** Called from the shared MutationObserver. */
    mutations(count) {
      mutationLog.push([performance.now(), count]);
    },
    runStart(seq) {
      run = { seq, start: performance.now() };
    },
    imported() {
      if (run) run.imported = performance.now();
    },
    mounted(userModules) {
      if (!run) return;
      const r = run;
      r.mounted = performance.now();
      requestAnimationFrame(() =>
        setTimeout(() => {
          post({
            type: "perf-run",
            seq: r.seq,
            importMs: r.imported - r.start,
            mountMs: r.mounted - r.imported,
            paintMs: performance.now() - r.start,
            domNodes: document.body.getElementsByTagName("*").length,
            userModules,
            libraryModules: performance
              .getEntriesByType("resource")
              .filter((e) => LIBRARY_FILE.test(e.name)).length,
          });
        }, 0),
      );
    },
  };
}
