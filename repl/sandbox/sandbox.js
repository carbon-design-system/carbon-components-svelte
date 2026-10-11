// Preview runtime. Runs in a sandboxed, opaque-origin iframe on a separate site.
// Receives compiled modules from the compiler worker (run port) and reports
// console output, errors, and paint timing to the shell (shell port).
// The document is kept alive between runs: library modules stay evaluated and
// all.css stays parsed; only the user's modules are re-imported.
import { mount, unmount } from "svelte";
import { installConsole } from "./inspect/console.js";
import { createRemote } from "./inspect/remote.js";

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
/** Blob URL → REPL module name + source map, for mapping stack frames. */
const modules = new Map();
const remote = createRemote();
/** Messages posted before the shell port arrives. */
let pending = [];

native.windowAdd("message", (event) => {
  if (event.source !== window.parent || shell || event.data?.type !== "init")
    return;
  const [shellPort, runPort] = event.ports;
  shell = shellPort;
  shell.onmessage = onShellMessage;
  runPort.onmessage = onRun;
  for (const message of pending) shell.postMessage(message);
  pending = [];
  post({ type: "ready", at: now() });
});

function now() {
  return performance.timeOrigin + performance.now();
}

function post(message) {
  if (shell) shell.postMessage(message);
  else pending.push(message);
}

function respond(data, payload) {
  post({ type: "response", reqId: data.reqId, ...payload });
}

async function onShellMessage({ data }) {
  switch (data.type) {
    case "theme":
      document.documentElement.setAttribute("theme", data.theme);
      break;
    case "props":
      respond(data, remote.properties(data.id, data.range));
      break;
    case "getter":
      respond(data, remote.invokeGetter(data.id, data.key));
      break;
    case "json":
      respond(data, remote.json(data.id));
      break;
    case "store-global": {
      const result = remote.storeGlobal(data.id, window);
      respond(data, result);
      if (result.name)
        consoleApi.result(remote.get(data.id), false, result.name);
      break;
    }
    case "highlight":
      highlightNode(remote.get(data.id));
      break;
    case "unhighlight":
      highlightNode(null);
      break;
    case "eval":
      respond(data, { done: true });
      await evaluate(data.code);
      break;
  }
}

/** Run an expression (or, failing that, statements) as a blob module. */
async function evaluate(code) {
  const run = async (source) => {
    const href = URL.createObjectURL(
      new Blob([source], { type: "text/javascript" }),
    );
    try {
      return await import(href);
    } finally {
      URL.revokeObjectURL(href);
    }
  };
  try {
    consoleApi.result((await run(`export default (\n${code}\n);`)).default);
  } catch (error) {
    if (!(error instanceof SyntaxError)) return consoleApi.result(error, true);
    try {
      await run(`${code}\nexport {};`);
      consoleApi.result(undefined);
    } catch (inner) {
      consoleApi.result(inner, true);
    }
  }
}

let overlay;

/** Outline a logged DOM node in the preview while its log entry is hovered. */
function highlightNode(node) {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "position:fixed;z-index:2147483647;pointer-events:none;outline:2px solid #0f62fe;background:rgb(15 98 254 / 12%);display:none";
    document.documentElement.append(overlay);
  }
  let rect;
  if (node instanceof Element) rect = node.getBoundingClientRect();
  else if (node instanceof Text) {
    const range = document.createRange();
    range.selectNodeContents(node);
    rect = range.getBoundingClientRect();
  }
  if (!rect || (!rect.width && !rect.height)) {
    overlay.style.display = "none";
    return;
  }
  if (node instanceof Element) node.scrollIntoView({ block: "nearest" });
  Object.assign(overlay.style, {
    display: "block",
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
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
const capture = (options) =>
  typeof options === "boolean" ? options : !!options?.capture;

/** Untrack a listener its owner removed itself, so teardown reports only real leftovers. */
function untrack(remove, type, listener, options) {
  const i = tracked.listeners.findIndex(
    ([r, t, l, o]) =>
      r === remove &&
      t === type &&
      l === listener &&
      capture(o) === capture(options),
  );
  if (i !== -1) tracked.listeners.splice(i, 1);
}

window.addEventListener = (type, listener, options) => {
  tracked.listeners.push([native.windowRemove, type, listener, options]);
  native.windowAdd(type, listener, options);
};
window.removeEventListener = (type, listener, options) => {
  untrack(native.windowRemove, type, listener, options);
  native.windowRemove(type, listener, options);
};
document.addEventListener = (type, listener, options) => {
  tracked.listeners.push([native.documentRemove, type, listener, options]);
  native.documentAdd(type, listener, options);
};
document.removeEventListener = (type, listener, options) => {
  untrack(native.documentRemove, type, listener, options);
  native.documentRemove(type, listener, options);
};

function teardown() {
  if (current) {
    try {
      unmount(current);
    } catch (error) {
      consoleApi.reportError(error);
    }
    current = undefined;
  }
  const leftovers = [
    [tracked.intervals.size, "interval"],
    [tracked.timeouts.size, "timeout"],
    [tracked.frames.size, "animation frame"],
    [tracked.listeners.length, "window/document listener"],
  ]
    .filter(([n]) => n > 0)
    .map(([n, what]) => `${n} ${what}${n === 1 ? "" : "s"}`);
  if (leftovers.length) {
    post({
      type: "teardown-report",
      text: `Cleared ${leftovers.join(", ")} left by the previous run.`,
    });
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
  for (const url of blobs) {
    URL.revokeObjectURL(url);
    modules.delete(url);
  }
  blobs = [];
  remote.clear();
  consoleApi.resetRun();
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
// Console: structured entries with remote handles (see ./inspect/).

const consoleApi = installConsole({
  remote,
  post,
  modules,
  schedule: (fn) => native.setTimeout(fn, 16),
});

// Hook for instrumented Carbon components (carbon-components-svelte/__devtools.js).
globalThis.__ccsDevtools = { event: (e) => consoleApi.carbonEvent(e) };

native.windowAdd("error", (event) =>
  consoleApi.reportError(event.error ?? event.message),
);
native.windowAdd("unhandledrejection", (event) =>
  consoleApi.reportError(event.reason),
);

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
      modules.set(href, { name: module.name, map: module.map });
    }
    Component = (await import(urls[data.entry])).default;
  } catch (error) {
    consoleApi.reportError(error);
    for (const href of created) {
      URL.revokeObjectURL(href);
      modules.delete(href);
    }
    post({ type: "run-failed", seq: data.seq });
    return;
  }
  if (data.seq !== latestSeq) {
    for (const href of created) {
      URL.revokeObjectURL(href);
      modules.delete(href);
    }
    return;
  }

  post({ type: "run-start", seq: data.seq });
  teardown();
  blobs = created;
  runs++;
  try {
    current = mount(Component, { target: document.body });
  } catch (error) {
    consoleApi.reportError(error);
  }
  native.requestAnimationFrame(() =>
    native.setTimeout(
      () => post({ type: "painted", seq: data.seq, at: now(), runs }),
      0,
    ),
  );
}
