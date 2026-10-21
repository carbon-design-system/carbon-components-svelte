import { get, writable } from "svelte/store";
import { encodeHash } from "./codec.js";

/** @type {any} */
let boot;

export const files = writable(
  /** @type {{ name: string; source: string }[]} */ ([]),
);
export const active = writable(0);
export const theme = writable("white");
export const status = writable(
  /** @type {"compiling" | "ready" | "error"} */ ("compiling"),
);
export const diagnostics = writable(/** @type {any[]} */ ([]));
export const logs = writable(
  /** @type {{ level: string; text: string }[]} */ ([]),
);
export const metrics = writable(/** @type {Record<string, number>} */ ({}));
export const href = writable("");

const MAX_LOGS = 500;
const FILE_NAME = /^[\w.-]+\.(svelte|js|json)$/;
let lastCompileMs = 10;
let compileTimer;
let hashTimer;

export function init(repl) {
  boot = repl;
  files.set(repl.files.map((f) => ({ ...f })));
  theme.set(repl.options.theme);
  href.set(location.href);
  repl.subscribe(onEvent);
  window.addEventListener("hashchange", () => location.reload());
}

function pushLog(level, text) {
  logs.update((l) => {
    const next = [...l, { level, text }];
    return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
  });
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
      diagnostics.set(message.diagnostics);
      status.set(message.ok ? "compiling" : "error");
      break;
    case "run-start":
      logs.set([]);
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
    case "console":
      pushLog(message.level, message.text);
      break;
    case "error":
      pushLog("error", message.message);
      status.set("error");
      break;
    case "run-failed":
      status.set("error");
      break;
  }
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
        options: { theme: get(theme) },
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
