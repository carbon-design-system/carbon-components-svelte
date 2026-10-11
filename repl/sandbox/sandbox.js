// Preview runtime. Runs in a sandboxed, opaque-origin iframe on a separate site.
// Receives compiled modules from the compiler worker (run port) and reports
// console output, errors, and paint timing to the shell (shell port).
// The document is kept alive between runs: library modules stay evaluated and
// all.css stays parsed; only the user's modules are re-imported.
import { mount, unmount } from "svelte";

const native = {
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  setInterval: window.setInterval.bind(window),
  clearInterval: window.clearInterval.bind(window),
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
  windowAdd: window.addEventListener.bind(window),
  windowRemove: window.removeEventListener.bind(window),
  documentAdd: document.addEventListener.bind(document),
  documentRemove: document.removeEventListener.bind(document),
};

/** @type {MessagePort | undefined} */
let shell;
/** @type {Record<string, any> | undefined} */
let current;
/** @type {string[]} */
let blobs = [];
let latestSeq = -1;
let runs = 0;
const preloaded = new Set();

native.windowAdd("message", (event) => {
  if (event.source !== window.parent || shell || event.data?.type !== "init")
    return;
  const [shellPort, runPort] = event.ports;
  shell = shellPort;
  shell.onmessage = onShellMessage;
  runPort.onmessage = onRun;
  post({ type: "ready", at: now() });
});

function now() {
  return performance.timeOrigin + performance.now();
}

function post(message) {
  shell?.postMessage(message);
}

function onShellMessage({ data }) {
  if (data.type === "theme")
    document.documentElement.setAttribute("theme", data.theme);
}

// ---------------------------------------------------------------------------
// Side-effect tracking so a run can be torn down without reloading the document.

const tracked = {
  timeouts: new Set(),
  intervals: new Set(),
  frames: new Set(),
  listeners: [],
};

window.setTimeout = (fn, ms, ...args) => {
  const id = native.setTimeout(() => {
    tracked.timeouts.delete(id);
    if (typeof fn === "function") fn(...args);
  }, ms);
  tracked.timeouts.add(id);
  return id;
};
window.clearTimeout = (id) => {
  tracked.timeouts.delete(id);
  native.clearTimeout(id);
};
window.setInterval = (fn, ms, ...args) => {
  const id = native.setInterval(fn, ms, ...args);
  tracked.intervals.add(id);
  return id;
};
window.clearInterval = (id) => {
  tracked.intervals.delete(id);
  native.clearInterval(id);
};
window.requestAnimationFrame = (fn) => {
  const id = native.requestAnimationFrame((t) => {
    tracked.frames.delete(id);
    fn(t);
  });
  tracked.frames.add(id);
  return id;
};
window.cancelAnimationFrame = (id) => {
  tracked.frames.delete(id);
  native.cancelAnimationFrame(id);
};
window.addEventListener = (type, listener, options) => {
  tracked.listeners.push([native.windowRemove, type, listener, options]);
  native.windowAdd(type, listener, options);
};
document.addEventListener = (type, listener, options) => {
  tracked.listeners.push([native.documentRemove, type, listener, options]);
  native.documentAdd(type, listener, options);
};

function teardown() {
  if (current) {
    try {
      unmount(current);
    } catch (error) {
      report(error);
    }
    current = undefined;
  }
  for (const id of tracked.timeouts) native.clearTimeout(id);
  for (const id of tracked.intervals) native.clearInterval(id);
  for (const id of tracked.frames) native.cancelAnimationFrame(id);
  for (const [remove, type, listener, options] of tracked.listeners)
    remove(type, listener, options);
  tracked.timeouts.clear();
  tracked.intervals.clear();
  tracked.frames.clear();
  tracked.listeners = [];
  document.body.replaceChildren();
  for (const url of blobs) URL.revokeObjectURL(url);
  blobs = [];
}

// ---------------------------------------------------------------------------
// Opaque origin: Web Storage throws. Provide in-memory shims so demos still work.

for (const key of ["localStorage", "sessionStorage"]) {
  try {
    void window[key];
  } catch {
    const data = new Map();
    const storage = {
      get length() {
        return data.size;
      },
      key: (i) => [...data.keys()][i] ?? null,
      getItem: (k) => (data.has(String(k)) ? data.get(String(k)) : null),
      setItem: (k, v) => void data.set(String(k), String(v)),
      removeItem: (k) => void data.delete(String(k)),
      clear: () => data.clear(),
    };
    Object.defineProperty(window, key, { value: storage, configurable: true });
  }
}

// ---------------------------------------------------------------------------
// Console + error relay (formatted here; the shell renders text only).

function format(value, depth = 0, seen = new Set()) {
  if (typeof value === "string")
    return depth === 0 ? value : JSON.stringify(value);
  if (value === null || typeof value !== "object") {
    if (typeof value === "function") return `ƒ ${value.name || "anonymous"}()`;
    if (typeof value === "symbol" || typeof value === "bigint")
      return value.toString();
    return String(value);
  }
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Node) {
    if (value instanceof Element) {
      const id = value.id ? `#${value.id}` : "";
      const cls = value.classList.length
        ? `.${[...value.classList].join(".")}`
        : "";
      return `<${value.tagName.toLowerCase()}${id}${cls}>`;
    }
    return value.nodeName;
  }
  if (seen.has(value)) return "[Circular]";
  if (depth > 3) return Array.isArray(value) ? "[…]" : "{…}";
  seen.add(value);
  let out;
  if (Array.isArray(value)) {
    const items = value.slice(0, 50).map((v) => format(v, depth + 1, seen));
    if (value.length > 50) items.push(`…${value.length - 50} more`);
    out = `[${items.join(", ")}]`;
  } else if (value instanceof Map) {
    out = `Map(${value.size}) {${[...value]
      .slice(0, 50)
      .map(
        ([k, v]) =>
          `${format(k, depth + 1, seen)} => ${format(v, depth + 1, seen)}`,
      )
      .join(", ")}}`;
  } else if (value instanceof Set) {
    out = `Set(${value.size}) {${[...value]
      .slice(0, 50)
      .map((v) => format(v, depth + 1, seen))
      .join(", ")}}`;
  } else {
    const keys = Object.keys(value);
    const items = keys
      .slice(0, 50)
      .map((k) => `${k}: ${format(value[k], depth + 1, seen)}`);
    if (keys.length > 50) items.push(`…${keys.length - 50} more`);
    const name =
      value.constructor && value.constructor !== Object
        ? `${value.constructor.name} `
        : "";
    out = `${name}{${items.join(", ")}}`;
  }
  seen.delete(value);
  return out;
}

for (const level of ["log", "info", "warn", "error", "debug"]) {
  const original = console[level].bind(console);
  console[level] = (...args) => {
    original(...args);
    post({
      type: "console",
      level,
      text: args.map((a) => format(a)).join(" "),
    });
  };
}

function report(error) {
  const e = error instanceof Error ? error : new Error(format(error));
  post({ type: "error", message: `${e.name}: ${e.message}`, stack: e.stack });
}

native.windowAdd("error", (event) => report(event.error ?? event.message));
native.windowAdd("unhandledrejection", (event) => report(event.reason));

// ---------------------------------------------------------------------------
// Runs

function preload(urls) {
  for (const href of urls) {
    if (preloaded.has(href)) continue;
    preloaded.add(href);
    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = href;
    document.head.append(link);
  }
}

/** Order user modules leaves-first so each blob can reference its deps' blob URLs. */
function order(modules) {
  const byName = new Map(modules.map((m) => [m.name, m]));
  const sorted = [];
  const state = new Map();
  const visit = (name, path) => {
    if (state.get(name) === "done") return;
    if (state.get(name) === "visiting") {
      throw new Error(
        `Circular import between REPL files: ${[...path, name].join(" → ")}`,
      );
    }
    state.set(name, "visiting");
    const module = byName.get(name);
    if (!module) throw new Error(`Missing REPL file: ${name}`);
    for (const dep of module.deps) visit(dep, [...path, name]);
    state.set(name, "done");
    sorted.push(module);
  };
  for (const m of modules) visit(m.name, []);
  return sorted;
}

async function onRun({ data }) {
  if (data.type !== "run") return;
  latestSeq = data.seq;
  preload(data.preload);

  const urls = {};
  const created = [];
  let Component;
  try {
    for (const module of order(data.modules)) {
      const code = module.code.replace(
        /(['"])repl:([^'"]+)\1/g,
        (_, q, name) => q + urls[name] + q,
      );
      const href = URL.createObjectURL(
        new Blob([code], { type: "text/javascript" }),
      );
      urls[module.name] = href;
      created.push(href);
    }
    Component = (await import(urls[data.entry])).default;
  } catch (error) {
    for (const href of created) URL.revokeObjectURL(href);
    report(error);
    post({ type: "run-failed", seq: data.seq });
    return;
  }
  if (data.seq !== latestSeq) {
    for (const href of created) URL.revokeObjectURL(href);
    return;
  }

  post({ type: "run-start", seq: data.seq });
  teardown();
  blobs = created;
  runs++;
  try {
    current = mount(Component, { target: document.body });
  } catch (error) {
    report(error);
  }
  native.requestAnimationFrame(() =>
    native.setTimeout(
      () => post({ type: "painted", seq: data.seq, at: now(), runs }),
      0,
    ),
  );
}
