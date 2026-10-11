// Preview runtime. Runs in a sandboxed, opaque-origin iframe on a separate site.
// Receives compiled modules from the compiler worker (run port) and reports
// console output, errors, and paint timing to the shell (shell port).
// The document is kept alive between runs: library modules stay evaluated and
// all.css stays parsed; only the user's modules are re-imported.
import { mount, unmount } from "svelte";
import { STATE_SYMBOL, snapshot } from "svelte-repl-devtools";
import { audit } from "./inspect/a11y.js";
import { installConsole } from "./inspect/console.js";
import { classifyStack } from "./inspect/origin.js";
import { createPerf } from "./inspect/perf.js";
import { createRemote } from "./inspect/remote.js";
import { createTokenIndex } from "./inspect/tokens.js";

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
const remote = createRemote({ stateSymbol: STATE_SYMBOL, snapshot });
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
      scheduleAudit();
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

// ---------------------------------------------------------------------------
// Dev mode: element → source. Dev-compiled REPL code calls __replMeta around
// each `<Component>` render; DOM cloned meanwhile (including prod-compiled
// Carbon components) is tagged with that location. Alt+click jumps there.

const metaStack = [];

globalThis.__replMeta = (
  original,
  FILENAME,
  callback,
  type,
  component,
  line,
  column,
  extra,
) => {
  if (type !== "component")
    return original(callback, type, component, line, column, extra);
  metaStack.push({
    file: component[FILENAME],
    line,
    column: column + 1,
    name: extra?.componentTag,
  });
  try {
    return original(callback, type, component, line, column, extra);
  } finally {
    metaStack.pop();
  }
};

function tagClone(node) {
  const loc = metaStack.at(-1);
  if (!loc || !node) return node;
  if (node.nodeType === 11) {
    for (const child of node.children) child.__repl_loc ??= loc;
  } else if (node.nodeType === 1) {
    node.__repl_loc ??= loc;
  }
  return node;
}

const nativeCloneNode = Node.prototype.cloneNode;
Node.prototype.cloneNode = function (deep) {
  return tagClone(nativeCloneNode.call(this, deep));
};
const nativeImportNode = Document.prototype.importNode;
Document.prototype.importNode = function (node, deep) {
  return tagClone(nativeImportNode.call(this, node, deep));
};

/** Nearest source location for an element: own template, or the component call that rendered it. */
function locate(element) {
  for (let el = element; el && el !== document.body; el = el.parentElement) {
    const meta = el.__svelte_meta?.loc;
    if (meta)
      return {
        file: meta.file,
        line: meta.line,
        column: meta.column + 1,
        tag: el.tagName.toLowerCase(),
      };
    if (el.__repl_loc) return { ...el.__repl_loc, tag: el.__repl_loc.name };
  }
  return null;
}

let inspecting = false;

native.documentAdd(
  "keydown",
  (e) => {
    if (e.key === "Alt") inspecting = true;
  },
  true,
);
native.documentAdd(
  "keyup",
  (e) => {
    if (e.key === "Alt") {
      inspecting = false;
      highlightNode(null);
    }
  },
  true,
);
const tokens = createTokenIndex(document);

/** One-line inspector label: element, size, source, Carbon color tokens. */
function inspectLabel(el) {
  const rect = el.getBoundingClientRect();
  const cls = el.classList.length
    ? `.${[...el.classList].slice(0, 2).join(".")}`
    : "";
  const loc = locate(el);
  const t = tokens.tokensFor(el);
  const parts = [
    `${el.tagName.toLowerCase()}${cls}`,
    `${Math.round(rect.width)}×${Math.round(rect.height)}`,
    loc ? `${loc.file}:${loc.line}` : "",
    t.background ? `bg ${t.background.token}` : "",
    t.color ? `text ${t.color.token}` : "",
  ];
  return parts.filter(Boolean).join("  ·  ");
}

native.documentAdd(
  "mousemove",
  (e) => {
    const active = inspecting || e.altKey;
    if (!active) return;
    const el = /** @type {Element} */ (e.target);
    if (el instanceof Element && el !== document.body)
      highlightNode(el, inspectLabel(el));
    else highlightNode(null);
  },
  true,
);
native.documentAdd(
  "click",
  (e) => {
    if (!e.altKey) return;
    if (e.shiftKey) {
      // Alt+Shift+click: log the element with its Carbon tokens and source.
      e.preventDefault();
      e.stopImmediatePropagation();
      const el = /** @type {Element} */ (e.target);
      const style = getComputedStyle(el);
      console.log("Inspect", el, {
        source: locate(el) ?? undefined,
        tokens: tokens.tokensFor(el),
        font: `${style.fontWeight} ${style.fontSize}/${style.lineHeight} ${style.fontFamily.split(",")[0]}`,
        size: `${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`,
      });
      return;
    }
    const loc = locate(/** @type {Element} */ (e.target));
    if (!loc) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    highlightNode(null);
    post({ type: "jump", ...loc });
  },
  true,
);

let overlay;

let overlayLabel;

/** Outline a DOM node in the preview (log hover, Alt inspect), with an optional label. */
function highlightNode(node, label = "") {
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.cssText =
      "position:fixed;z-index:2147483647;pointer-events:none;outline:2px solid #0f62fe;background:rgb(15 98 254 / 12%);display:none";
    overlayLabel = document.createElement("div");
    overlayLabel.style.cssText =
      "position:absolute;left:-2px;top:calc(100% + 4px);padding:2px 6px;white-space:nowrap;font:12px/16px 'IBM Plex Mono',monospace;color:#fff;background:#161616;";
    overlay.append(overlayLabel);
    document.documentElement.append(overlay);
  }
  overlayLabel.textContent = label;
  overlayLabel.style.display = label ? "block" : "none";
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

/**
 * Only side effects created by REPL code (blob: modules) are torn down
 * between runs. The Svelte runtime and library modules stay evaluated in this
 * kept-alive document and own singletons (Svelte's global form `reset`
 * listener, its animation loop, listener pools), so clearing those would
 * break later runs. Library listeners still registered after unmount are
 * reported as possible leaks instead.
 */
const tracked = {
  timeouts: new Set(),
  intervals: new Set(),
  frames: new Set(),
  /** @type {[Function, string, any, any, { kind: string; file?: string }][]} */
  listeners: [],
};

const PLURAL_NOUN = /(listener|frame|timeout|interval)/;

/** Who created a side effect (see ./inspect/origin.js). */
function origin() {
  return classifyStack(new Error().stack);
}

const fromUser = () => origin().kind === "user";

window.setTimeout = (fn, ms, ...args) => {
  const user = fromUser();
  const id = native.setTimeout(() => {
    tracked.timeouts.delete(id);
    if (typeof fn === "function") fn(...args);
  }, ms);
  if (user) tracked.timeouts.add(id);
  return id;
};
window.clearTimeout = (id) => {
  tracked.timeouts.delete(id);
  native.clearTimeout(id);
};
window.setInterval = (fn, ms, ...args) => {
  const id = native.setInterval(fn, ms, ...args);
  if (fromUser()) tracked.intervals.add(id);
  return id;
};
window.clearInterval = (id) => {
  tracked.intervals.delete(id);
  native.clearInterval(id);
};
window.requestAnimationFrame = (fn) => {
  const user = fromUser();
  const id = native.requestAnimationFrame((t) => {
    tracked.frames.delete(id);
    fn(t);
  });
  if (user) tracked.frames.add(id);
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

function track(remove, type, listener, options) {
  const from = origin();
  if (from.kind === "user" || from.kind === "library") {
    tracked.listeners.push([remove, type, listener, options, from]);
  }
}

window.addEventListener = (type, listener, options) => {
  track(native.windowRemove, type, listener, options);
  native.windowAdd(type, listener, options);
};
window.removeEventListener = (type, listener, options) => {
  untrack(native.windowRemove, type, listener, options);
  native.windowRemove(type, listener, options);
};
document.addEventListener = (type, listener, options) => {
  track(native.documentRemove, type, listener, options);
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
  const userListeners = tracked.listeners.filter(
    ([, , , , o]) => o.kind === "user",
  );
  const libraryListeners = tracked.listeners.filter(
    ([, , , , o]) => o.kind === "library",
  );
  const types = (list) => [...new Set(list.map(([, type]) => type))].join(", ");
  const leftovers = [
    [tracked.intervals.size, "interval"],
    [tracked.timeouts.size, "timeout"],
    [tracked.frames.size, "animation frame"],
    [
      userListeners.length,
      `window/document listener (${types(userListeners)})`,
    ],
  ]
    .filter(([n]) => n > 0)
    .map(
      ([n, what]) =>
        `${n} ${n === 1 ? what : what.replace(PLURAL_NOUN, "$1s")}`,
    );
  if (leftovers.length) {
    post({
      type: "teardown-report",
      text: `Cleared ${leftovers.join(", ")} left by the previous run.`,
    });
  }
  for (const [, type, , , o] of libraryListeners) {
    if (o.reported) continue;
    o.reported = true;
    post({
      type: "teardown-report",
      level: "warn",
      text: `A "${type}" listener added by ${o.file} is still registered after unmount (possible leak in the library).`,
    });
  }
  for (const id of tracked.timeouts) native.clearTimeout(id);
  for (const id of tracked.intervals) native.clearInterval(id);
  for (const id of tracked.frames) native.cancelAnimationFrame(id);
  for (const [remove, type, listener, options] of userListeners) {
    remove(type, listener, options);
  }
  tracked.timeouts.clear();
  tracked.intervals.clear();
  tracked.frames.clear();
  tracked.listeners = libraryListeners;
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
// Accessibility channel: audit after each paint and after DOM changes.

let auditTimer;

function runAudit() {
  auditTimer = undefined;
  let findings;
  try {
    findings = audit(document, { tokens });
  } catch (error) {
    native.setTimeout(() => {
      throw error;
    });
    return;
  }
  post({
    type: "a11y",
    findings: findings.map((f) => ({
      rule: f.rule,
      severity: f.severity,
      message: f.message,
      node: remote.preview(f.element),
      source: locate(f.element) ?? undefined,
    })),
  });
}

function scheduleAudit() {
  native.clearTimeout(auditTimer);
  auditTimer = native.setTimeout(runAudit, 600);
}

const perf = createPerf({
  post,
  modules,
  preview: (value) => remote.preview(value),
  locate,
  setTimeout: native.setTimeout,
  requestAnimationFrame: native.requestAnimationFrame,
});

/** DOM nodes touched by a batch of mutation records (inserted subtrees count in full). */
function changedNodes(records) {
  let count = 0;
  for (const r of records) {
    if (r.type !== "childList") {
      count++;
      continue;
    }
    for (const nodes of [r.addedNodes, r.removedNodes]) {
      for (const node of nodes) {
        count +=
          1 + (node.nodeType === 1 ? node.getElementsByTagName("*").length : 0);
      }
    }
  }
  return count;
}

new MutationObserver((records) => {
  perf.mutations(changedNodes(records));
  scheduleAudit();
}).observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  characterData: true,
});

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
  perf.runStart(data.seq);

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
      modules.set(href, { name: module.name, map: module.map, code });
    }
    Component = (await import(urls[data.entry])).default;
    perf.imported();
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
  perf.mounted(data.modules.length);
  native.requestAnimationFrame(() =>
    native.setTimeout(
      () => post({ type: "painted", seq: data.seq, at: now(), runs }),
      0,
    ),
  );
}
