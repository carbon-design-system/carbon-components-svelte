import { derived, get, writable } from "svelte/store";
import { encodeHash } from "./codec.js";
import {
  dropped as consoleDropped,
  ingest as consoleIngest,
  push as consolePush,
  runStarted as consoleRunStarted,
  system as consoleSystem,
} from "./console/store.js";

/** @type {any} */
let boot;

export const files = writable(
  /** @type {{ name: string; source: string }[]} */ ([]),
);
export const active = writable(0);
export const theme = writable("white");
/** Dev mode: compile REPL files with Svelte dev checks and element locations. */
export const devMode = writable(false);
export const status = writable(
  /** @type {"compiling" | "ready" | "error"} */ ("compiling"),
);
export const compileDiagnostics = writable(/** @type {any[]} */ ([]));
/** Uncaught runtime errors mapped to a source line; cleared on the next compile. */
export const runtimeDiagnostics = writable(/** @type {any[]} */ ([]));
export const diagnostics = derived(
  [compileDiagnostics, runtimeDiagnostics],
  ([$compile, $runtime]) => [...$compile, ...$runtime],
);
/** Compact component API (props, events, descriptions) for the event log. */
export const componentApi = writable(/** @type {any} */ (null));
/** Editor jump requests from the console: { file, line, column, seq }. */
export const jump = writable(/** @type {any} */ (null));
export const metrics = writable(/** @type {Record<string, number>} */ ({}));
export const href = writable("");

const FILE_NAME = /^[\w.-]+\.(svelte|js|json)$/;
let lastCompileMs = 10;
let compileTimer;
let hashTimer;

export function init(repl) {
  boot = repl;
  files.set(repl.files.map((f) => ({ ...f })));
  theme.set(repl.options.theme);
  devMode.set(!!repl.options.dev);
  href.set(location.href);
  repl.subscribe(onEvent);
  const v = repl.versions;
  fetch(`${repl.sandboxOrigin}/pkg/ccs@${v.ccs}/svelte@${v.svelte}/api.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((api) => componentApi.set(api))
    .catch(() => {});
  window.addEventListener("hashchange", () => location.reload());
}

/** Request/response with the preview iframe (remote object protocol). */
export function request(message) {
  return boot.request(message);
}

export function postToPreview(message) {
  boot.post(message);
}

/** Move the editor to a source location (from a console link). */
export function jumpTo({ file, line, column }) {
  const index = get(files).findIndex((f) => f.name === file);
  if (index === -1) return;
  flushEdits();
  active.set(index);
  jump.set({ file, line, column, seq: Date.now() });
}

function offsetOf(file, line, column) {
  const source = get(files).find((f) => f.name === file)?.source;
  if (source === undefined) return undefined;
  let offset = 0;
  for (let l = 1; l < line; l++) {
    const next = source.indexOf("\n", offset);
    if (next === -1) return undefined;
    offset = next + 1;
  }
  return offset + Math.max(0, column - 1);
}

function runtimeErrors(entries) {
  for (const entry of entries) {
    if (entry.level !== "error" || !entry.uncaught || !entry.source) continue;
    const { file, line, column } = entry.source;
    const start = offsetOf(file, line, column);
    if (start === undefined) continue;
    const source = get(files).find((f) => f.name === file).source;
    const lineEnd = source.indexOf("\n", start);
    runtimeDiagnostics.update((list) => [
      ...list,
      {
        file,
        severity: "error",
        runtime: true,
        message: `Uncaught ${entry.args?.[0]?.desc ?? "error"}`,
        line,
        column: column - 1,
        start,
        end: lineEnd === -1 ? source.length : Math.max(lineEnd, start + 1),
      },
    ]);
  }
}

function setMetric(name, value) {
  metrics.update((m) => ({ ...m, [name]: value }));
}

function onEvent(message) {
  switch (message.type) {
    case "metric":
      setMetric(message.name, boot.metrics[message.name]);
      break;
    case "worker-ready":
      setMetric("compilerLoad", message.compilerMs);
      break;
    case "compiled":
      lastCompileMs = message.ms;
      setMetric("compile", message.ms);
      compileDiagnostics.set(message.diagnostics);
      runtimeDiagnostics.set([]);
      status.set(message.ok ? "compiling" : "error");
      break;
    case "run-start":
      runtimeDiagnostics.set([]);
      consoleRunStarted();
      break;
    case "logs":
      consoleIngest(message.entries);
      runtimeErrors(message.entries);
      break;
    case "logs-dropped":
      consoleDropped(message.count);
      break;
    case "jump":
      jumpTo(message);
      break;
    case "teardown-report":
      consolePush(consoleSystem(message.level ?? "info", message.text));
      break;
    case "painted":
      status.set(
        get(diagnostics).some((d) => d.severity === "error")
          ? "error"
          : "ready",
      );
      if (boot.metrics.previewPainted !== undefined)
        setMetric("previewPainted", boot.metrics.previewPainted);
      if (message.sinceCompile !== undefined)
        setMetric("update", message.sinceCompile);
      break;
    case "error":
      consolePush(consoleSystem("error", message.message));
      status.set("error");
      break;
    case "run-failed":
      status.set("error");
      break;
  }
}

/** Editor paint cost per edit (tokenize + highlight ranges), for the toolbar and perf runs. */
export function recordPaint(detail) {
  setMetric("paint", detail.ms);
  boot.metrics.paintSamples ??= [];
  boot.metrics.paintSamples.push(detail);
}

/** Adaptive debounce: max(50 ms, 2 × last compile). */
function scheduleCompile() {
  clearTimeout(compileTimer);
  if (get(status) !== "compiling") status.set("compiling");
  compileTimer = setTimeout(compileNow, Math.max(50, 2 * lastCompileMs));
}

/**
 * Keystrokes stay off the reactive path: the textarea is the source of truth
 * while typing, and edits land in the `files` store only when flushed
 * (compile, tab switch, file add/remove, example load).
 */
const pendingSources = new Map();

export function flushEdits() {
  if (!pendingSources.size) return;
  const edits = new Map(pendingSources);
  pendingSources.clear();
  files.update((list) =>
    list.map((f, i) => (edits.has(i) ? { ...f, source: edits.get(i) } : f)),
  );
}

export function compileNow() {
  clearTimeout(compileTimer);
  flushEdits();
  boot.compile(get(files));
  scheduleHash();
}

let hashSeq = 0;
let pendingPush = false;

/** Debounced + idle hash write. Encoding is async, so only the latest request may write. */
function scheduleHash(push = false) {
  pendingPush ||= push;
  clearTimeout(hashTimer);
  const seq = ++hashSeq;
  hashTimer = setTimeout(() => {
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 0));
    idle(async () => {
      const hash = await encodeHash(boot.hashPrefix, {
        files: get(files),
        versions: boot.versions,
        options: { theme: get(theme), ...(get(devMode) ? { dev: true } : {}) },
      });
      if (seq !== hashSeq) return;
      const url = `${location.pathname}${location.search}#${hash}`;
      if (pendingPush) history.pushState(null, "", url);
      else history.replaceState(null, "", url);
      pendingPush = false;
      href.set(location.href);
    });
  }, 100);
}

export function updateSource(index, source) {
  pendingSources.set(index, source);
  scheduleCompile();
}

export function addFile() {
  flushEdits();
  const name = prompt("File name (e.g. Child.svelte, utils.js)")?.trim();
  if (!name) return;
  if (!FILE_NAME.test(name)) {
    alert("Use a flat name ending in .svelte, .js or .json");
    return;
  }
  if (get(files).some((f) => f.name === name)) {
    alert(`${name} already exists`);
    return;
  }
  const source = name.endsWith(".svelte")
    ? "<p>New component</p>\n"
    : "export {};\n";
  files.update((list) => [...list, { name, source }]);
  active.set(get(files).length - 1);
  scheduleCompile();
}

export function removeFile(index) {
  flushEdits();
  const list = get(files);
  if (list[index].name === boot.entry) return;
  files.set(list.filter((_, i) => i !== index));
  active.set(0);
  scheduleCompile();
}

export function setDevMode(value) {
  if (value === get(devMode)) return;
  devMode.set(value);
  boot.options.dev = value;
  compileNow();
}

export function setTheme(value) {
  if (value === get(theme)) return;
  theme.set(value);
  boot.setTheme(value);
  scheduleHash();
}

export function loadExample(example) {
  pendingSources.clear();
  clearTimeout(compileTimer);
  files.set(example.files.map((f) => ({ ...f })));
  active.set(0);
  boot.compile(get(files));
  scheduleHash(true);
}

export function defaultFiles() {
  return boot.defaultFiles;
}
